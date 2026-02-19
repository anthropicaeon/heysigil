/**
 * Launch Service
 *
 * Business logic for token launching, extracted from route handler.
 * Handles link parsing, project registration, and token deployment.
 */

import { randomUUID } from "node:crypto";
import { getDb, schema } from "../db/client.js";
import { parseLink } from "../utils/link-parser.js";
import type { ParsedLink } from "../utils/link-parser.js";
import { deployToken, isDeployerConfigured, generateName, generateSymbol } from "./deployer.js";
import { getErrorMessage } from "../utils/errors.js";
import { eq } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────

export interface DevLink {
    platform: string;
    url: string;
    projectId: string;
}

export interface LaunchInput {
    devLinks: string[];
    name?: string;
    symbol?: string;
    description?: string;
    sessionId?: string;
    devAddress?: string;
    isSelfLaunch?: boolean;
}

export interface ParsedLinksResult {
    success: true;
    parsedLinks: ParsedLink[];
    primaryLink: ParsedLink;
    projectId: string;
    tokenName: string;
    tokenSymbol: string;
    devLinksData: DevLink[];
}

export interface ParsedLinksError {
    success: false;
    error: string;
    invalidLinks?: string[];
    hint?: string;
    examples?: string[];
}

export interface RegisteredProject {
    id: string;
    projectId: string;
    name: string;
}

export interface DeployedToken {
    address: string;
    poolId: string;
    txHash: string;
    explorerUrl: string;
    dexUrl: string;
}

export interface RegisterResult {
    type: "registered";
    project: RegisteredProject;
    message: string;
}

export interface DeployResult {
    type: "deployed";
    project: RegisteredProject & { symbol: string };
    token: DeployedToken;
    claimInstructions: Array<{
        platform: string;
        projectId: string;
        displayUrl: string;
        verifyMethods: string[];
    }>;
}

export interface AlreadyLaunchedResult {
    type: "already_launched";
    project: RegisteredProject;
    token: {
        address: string;
        poolId: string;
        txHash: string | null;
        explorerUrl: string;
        dexUrl: string;
    };
}

export type LaunchResult = RegisterResult | DeployResult | AlreadyLaunchedResult;

interface DeployRoutingInput {
    devAddress?: string;
    isSelfLaunch?: boolean;
    devLinks?: string[];
}

export const QUICK_LAUNCH_DEFAULT_REPO = {
    platform: "github",
    projectId: "heysigil/heysigil",
    displayUrl: "https://github.com/heysigil/heysigil",
    verifyMethods: ["github_oauth", "github_file"],
} as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ─── Link Parsing ───────────────────────────────────────

/**
 * Parse and validate developer links.
 */
export function parseDevLinks(input: LaunchInput): ParsedLinksResult | ParsedLinksError {
    if (!input.devLinks || input.devLinks.length === 0) {
        return {
            success: false,
            error: "At least one developer link is required",
            hint: "Provide GitHub repos, Instagram handles, Twitter handles, or website URLs",
            examples: [
                "https://github.com/org/repo",
                "https://instagram.com/handle",
                "https://x.com/handle",
                "https://mysite.dev",
            ],
        };
    }

    const parsedLinks: ParsedLink[] = [];
    const errors: string[] = [];

    for (const raw of input.devLinks) {
        const parsed = parseLink(raw);
        if (parsed) {
            parsedLinks.push(parsed);
        } else {
            errors.push(`Could not parse: "${raw}"`);
        }
    }

    if (parsedLinks.length === 0) {
        return {
            success: false,
            error: "None of the provided links could be recognized",
            invalidLinks: errors,
            hint: "Try full URLs like https://github.com/org/repo",
        };
    }

    const primaryLink = parsedLinks[0];
    const projectId = `${primaryLink.platform}:${primaryLink.projectId}`;
    const tokenName = input.name || generateName(primaryLink.projectId);
    const tokenSymbol = input.symbol || generateSymbol(primaryLink.projectId);

    const devLinksData = parsedLinks.map((l) => ({
        platform: l.platform,
        url: l.displayUrl,
        projectId: l.projectId,
    }));

    return {
        success: true,
        parsedLinks,
        primaryLink,
        projectId,
        tokenName,
        tokenSymbol,
        devLinksData,
    };
}

// ─── Project Registration ───────────────────────────────

/**
 * Register a project without on-chain deployment.
 * Used when deployer is not configured.
 */
export async function registerProject(
    parsed: ParsedLinksResult,
    description?: string,
): Promise<RegisteredProject> {
    const db = getDb();

    const [project] = await db
        .insert(schema.projects)
        .values({
            projectId: parsed.projectId,
            name: parsed.tokenName,
            description: description || `${parsed.tokenName} ($${parsed.tokenSymbol})`,
            devLinks: parsed.devLinksData,
            deployedBy: "api",
        })
        .onConflictDoUpdate({
            target: schema.projects.projectId,
            set: {
                name: parsed.tokenName,
                description: description || `${parsed.tokenName} ($${parsed.tokenSymbol})`,
                devLinks: parsed.devLinksData,
            },
        })
        .returning();

    return {
        id: project.id,
        projectId: project.projectId,
        name: project.name ?? parsed.tokenName,
    };
}

// ─── Token Deployment ───────────────────────────────────

/**
 * Deploy a token on-chain and register the project.
 */
export async function deployAndRegister(
    parsed: ParsedLinksResult,
    description?: string,
    identifiers?: { privyUserId?: string; sessionId?: string },
    routing?: DeployRoutingInput,
): Promise<{
    project: RegisteredProject & { symbol: string };
    token: DeployedToken;
}> {
    const deployParams = buildDeployParams(parsed, routing);
    const deployResult = await deployToken(
        deployParams,
        {
            privyUserId: identifiers?.privyUserId,
            sessionId: identifiers?.sessionId,
        },
    );

    const db = getDb();

    const [project] = await db
        .insert(schema.projects)
        .values({
            projectId: parsed.projectId,
            name: parsed.tokenName,
            description: description || `${parsed.tokenName} ($${parsed.tokenSymbol})`,
            devLinks: parsed.devLinksData,
            poolTokenAddress: deployResult.tokenAddress,
            poolId: deployResult.poolId,
            deployTxHash: deployResult.txHash,
            deployedBy: "api",
        })
        .onConflictDoUpdate({
            target: schema.projects.projectId,
            set: {
                name: parsed.tokenName,
                description: description || `${parsed.tokenName} ($${parsed.tokenSymbol})`,
                devLinks: parsed.devLinksData,
                poolTokenAddress: deployResult.tokenAddress,
                poolId: deployResult.poolId,
                deployTxHash: deployResult.txHash,
            },
        })
        .returning();

    return {
        project: {
            id: project.id,
            projectId: project.projectId,
            name: parsed.tokenName,
            symbol: parsed.tokenSymbol,
        },
        token: {
            address: deployResult.tokenAddress,
            poolId: deployResult.poolId,
            txHash: deployResult.txHash,
            explorerUrl: deployResult.explorerUrl,
            dexUrl: deployResult.dexUrl,
        },
    };
}

/**
 * Build deployer routing params so launch mode is explicit and testable.
 */
export function buildDeployParams(
    parsed: ParsedLinksResult,
    routing?: DeployRoutingInput,
): {
    name: string;
    symbol: string;
    projectId: string;
    devAddress?: string;
    isSelfLaunch: boolean;
    devLinks: string[];
} {
    return {
        name: parsed.tokenName,
        symbol: parsed.tokenSymbol,
        projectId: parsed.projectId,
        devAddress: routing?.devAddress,
        isSelfLaunch: routing?.isSelfLaunch ?? false,
        devLinks: routing?.devLinks ?? parsed.devLinksData.map((link) => link.url),
    };
}

export function buildQuickLaunchParsedData(input?: {
    repoUrl?: string;
    name?: string;
    symbol?: string;
}): ParsedLinksResult | ParsedLinksError {
    const quickProjectId = `quick:${randomUUID()}`;
    const seed = quickProjectId.slice(-6).toUpperCase();
    const tokenName = input?.name?.trim() || `Sigil Quick ${seed}`;
    const tokenSymbol = input?.symbol?.trim() || `sQ${seed.slice(0, 5)}`;
    const repoUrl = input?.repoUrl?.trim();
    const customRepo = repoUrl ? parseLink(repoUrl) : null;
    if (repoUrl && (!customRepo || customRepo.platform !== "github")) {
        return {
            success: false,
            error: "Quick launch repo must be a valid GitHub repository URL",
            hint: "Use full GitHub repo URLs such as https://github.com/owner/repo",
        };
    }

    const parsedLink: ParsedLink = customRepo
        ? {
              ...customRepo,
              rawInput: repoUrl!,
          }
        : {
              platform: QUICK_LAUNCH_DEFAULT_REPO.platform,
              projectId: QUICK_LAUNCH_DEFAULT_REPO.projectId,
              displayUrl: QUICK_LAUNCH_DEFAULT_REPO.displayUrl,
              verifyMethods: [...QUICK_LAUNCH_DEFAULT_REPO.verifyMethods],
              rawInput: QUICK_LAUNCH_DEFAULT_REPO.displayUrl,
          };

    return {
        success: true,
        parsedLinks: [parsedLink],
        primaryLink: parsedLink,
        projectId: quickProjectId,
        tokenName,
        tokenSymbol,
        devLinksData: [
            {
                platform: QUICK_LAUNCH_DEFAULT_REPO.platform,
                url: QUICK_LAUNCH_DEFAULT_REPO.displayUrl,
                projectId: QUICK_LAUNCH_DEFAULT_REPO.projectId,
            },
        ],
    };
}

// ─── Main Entry Point ───────────────────────────────────

/**
 * Launch a token (register + optionally deploy on-chain).
 */
export async function launchToken(
    input: LaunchInput,
    identifiers?: { privyUserId?: string },
): Promise<LaunchResult | { error: string }> {
    // Parse links
    const parseResult = parseDevLinks(input);
    if (!parseResult.success) {
        return { error: parseResult.error };
    }

    const db = getDb();
    const [existingProject] = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.projectId, parseResult.projectId))
        .limit(1);

    // Prevent duplicate on-chain launches for the same canonical project.
    if (existingProject?.poolTokenAddress && existingProject.poolId) {
        return {
            type: "already_launched",
            project: {
                id: existingProject.id,
                projectId: existingProject.projectId,
                name: existingProject.name ?? parseResult.tokenName,
            },
            token: {
                address: existingProject.poolTokenAddress,
                poolId: existingProject.poolId,
                txHash: existingProject.deployTxHash,
                explorerUrl: existingProject.deployTxHash
                    ? `https://basescan.org/tx/${existingProject.deployTxHash}`
                    : `https://basescan.org/address/${existingProject.poolTokenAddress}`,
                dexUrl: `https://dexscreener.com/base/${existingProject.poolTokenAddress}`,
            },
        };
    }

    // Check if deployer is configured
    if (!isDeployerConfigured()) {
        try {
            const project = await registerProject(parseResult, input.description);
            return {
                type: "registered",
                project,
                message:
                    "Project registered but on-chain deployment not configured. Set DEPLOYER_PRIVATE_KEY and SIGIL_FACTORY_ADDRESS.",
            };
        } catch (err) {
            return { error: getErrorMessage(err, "Failed to register project") };
        }
    }

    // Deploy on-chain
    try {
        const { project, token } = await deployAndRegister(parseResult, input.description, {
            privyUserId: identifiers?.privyUserId,
            sessionId: input.sessionId,
        }, {
            devAddress: input.devAddress,
            isSelfLaunch: input.isSelfLaunch,
            devLinks: input.devLinks,
        });

        return {
            type: "deployed",
            project,
            token,
            claimInstructions: parseResult.parsedLinks.map((l) => ({
                platform: l.platform,
                projectId: l.projectId,
                displayUrl: l.displayUrl,
                verifyMethods: l.verifyMethods,
            })),
        };
    } catch (err) {
        return { error: getErrorMessage(err, "Failed to deploy token") };
    }
}

export async function launchQuickToken(input?: {
    repoUrl?: string;
    description?: string;
    sessionId?: string;
    privyUserId?: string;
    name?: string;
    symbol?: string;
}): Promise<LaunchResult | { error: string }> {
    const parsedResult = buildQuickLaunchParsedData({
        repoUrl: input?.repoUrl,
        name: input?.name,
        symbol: input?.symbol,
    });
    if (!parsedResult.success) {
        return { error: parsedResult.error };
    }
    const parsed = parsedResult;

    const description =
        input?.description ||
        "Quick launch bootstrapped from default Sigil repo metadata. Claim later with one-time token.";

    if (!isDeployerConfigured()) {
        try {
            const project = await registerProject(parsed, description);
            return {
                type: "registered",
                project,
                message:
                    "Quick launch registered but on-chain deployment not configured. Set DEPLOYER_PRIVATE_KEY and SIGIL_FACTORY_ADDRESS.",
            };
        } catch (err) {
            return { error: getErrorMessage(err, "Failed to register quick launch project") };
        }
    }

    try {
        const { project, token } = await deployAndRegister(
            parsed,
            description,
            {
                privyUserId: input?.privyUserId,
                sessionId: input?.sessionId,
            },
            {
                devAddress: ZERO_ADDRESS,
                isSelfLaunch: true,
                devLinks: [],
            },
        );

        return {
            type: "deployed",
            project,
            token,
            claimInstructions: [
                {
                    platform: parsed.primaryLink.platform,
                    projectId: parsed.primaryLink.projectId,
                    displayUrl: parsed.primaryLink.displayUrl,
                    verifyMethods: [...parsed.primaryLink.verifyMethods],
                },
            ],
        };
    } catch (err) {
        return { error: getErrorMessage(err, "Failed to deploy quick-launch token") };
    }
}

// Re-export for convenience
export { isDeployerConfigured, generateName, generateSymbol } from "./deployer.js";
