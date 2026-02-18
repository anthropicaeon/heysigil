/**
 * Launch Service
 *
 * Business logic for token launching, extracted from route handler.
 * Handles link parsing, project registration, and token deployment.
 */

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
): Promise<{
    project: RegisteredProject & { symbol: string };
    token: DeployedToken;
}> {
    const deployResult = await deployToken(
        {
            name: parsed.tokenName,
            symbol: parsed.tokenSymbol,
            projectId: parsed.projectId,
        },
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

// Re-export for convenience
export { isDeployerConfigured, generateName, generateSymbol } from "./deployer.js";
