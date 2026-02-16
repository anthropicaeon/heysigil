import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { parseLink, parseLinks } from "../../utils/link-parser.js";
import type { ParsedLink } from "../../utils/link-parser.js";
import {
    deployToken,
    isDeployerConfigured,
    generateName,
    generateSymbol,
    getDeployerBalance,
} from "../../services/deployer.js";
import { rateLimit } from "../../middleware/rate-limit.js";

const launch = new Hono();

// IP-based rate limit for token launches (defense in depth)
// Application-level rate limiting is also applied in deployer.ts
launch.use("/", rateLimit("launch", {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many launch attempts from this IP. Please try again later.",
}));

/**
 * POST /api/launch
 * Launch a new token — deploys on-chain via the server-side deployer wallet.
 * No wallet connection required from the user.
 *
 * Body: {
 *   name?: string,           // Token name (auto-generated if omitted)
 *   symbol?: string,         // Token symbol (auto-generated if omitted)
 *   description?: string,    // Short description
 *   devLinks: string[],      // Raw URLs, handles, or identifiers
 *   sessionId?: string,      // For rate limiting
 * }
 */
launch.post("/", async (c) => {
    const body = await c.req.json<{
        name?: string;
        symbol?: string;
        description?: string;
        devLinks: string[];
        sessionId?: string;
    }>();

    if (!body.devLinks || body.devLinks.length === 0) {
        return c.json(
            {
                error: "At least one developer link is required",
                hint: "Provide GitHub repos, Instagram handles, Twitter handles, or website URLs",
                examples: [
                    "https://github.com/org/repo",
                    "https://instagram.com/handle",
                    "https://x.com/handle",
                    "https://mysite.dev",
                ],
            },
            400,
        );
    }

    // Parse all provided links
    const parsedLinks: ParsedLink[] = [];
    const errors: string[] = [];

    for (const raw of body.devLinks) {
        const parsed = parseLink(raw);
        if (parsed) {
            parsedLinks.push(parsed);
        } else {
            errors.push(`Could not parse: "${raw}"`);
        }
    }

    if (parsedLinks.length === 0) {
        return c.json(
            {
                error: "None of the provided links could be recognized",
                invalidLinks: errors,
                hint: "Try full URLs like https://github.com/org/repo",
            },
            400,
        );
    }

    // Use the primary link's projectId as the canonical project ID
    const primaryLink = parsedLinks[0];
    const projectId = `${primaryLink.platform}:${primaryLink.projectId}`;

    // Auto-generate name/symbol if not provided
    const tokenName = body.name || generateName(primaryLink.projectId);
    const tokenSymbol = body.symbol || generateSymbol(primaryLink.projectId);

    const db = getDb();
    const devLinksData = parsedLinks.map((l) => ({
        platform: l.platform,
        url: l.displayUrl,
        projectId: l.projectId,
    }));

    // Check if deployer is configured for on-chain deployment
    if (!isDeployerConfigured()) {
        // Fallback: store project without deploying on-chain
        try {
            const [project] = await db
                .insert(schema.projects)
                .values({
                    projectId,
                    name: tokenName,
                    description: body.description || `${tokenName} ($${tokenSymbol})`,
                    devLinks: devLinksData,
                    deployedBy: "api",
                })
                .onConflictDoUpdate({
                    target: schema.projects.projectId,
                    set: {
                        name: tokenName,
                        description: body.description || `${tokenName} ($${tokenSymbol})`,
                        devLinks: devLinksData,
                    },
                })
                .returning();

            return c.json({
                success: true,
                deployed: false,
                message: "Project registered but on-chain deployment not configured. Set DEPLOYER_PRIVATE_KEY and SIGIL_FACTORY_ADDRESS.",
                project: {
                    id: project.id,
                    projectId: project.projectId,
                    name: project.name,
                },
            });
        } catch (err) {
            return c.json(
                { error: err instanceof Error ? err.message : "Failed to register project" },
                500,
            );
        }
    }

    // Deploy on-chain!
    try {
        const deployResult = await deployToken(
            {
                name: tokenName,
                symbol: tokenSymbol,
                projectId,
            },
            body.sessionId,
        );

        // Store in DB
        const [project] = await db
            .insert(schema.projects)
            .values({
                projectId,
                name: tokenName,
                description: body.description || `${tokenName} ($${tokenSymbol})`,
                devLinks: devLinksData,
                poolTokenAddress: deployResult.tokenAddress,
                poolId: deployResult.poolId,
                deployTxHash: deployResult.txHash,
                deployedBy: "api",
            })
            .onConflictDoUpdate({
                target: schema.projects.projectId,
                set: {
                    name: tokenName,
                    description: body.description || `${tokenName} ($${tokenSymbol})`,
                    devLinks: devLinksData,
                    poolTokenAddress: deployResult.tokenAddress,
                    poolId: deployResult.poolId,
                    deployTxHash: deployResult.txHash,
                },
            })
            .returning();

        return c.json({
            success: true,
            deployed: true,
            project: {
                id: project.id,
                projectId: project.projectId,
                name: tokenName,
                symbol: tokenSymbol,
            },
            token: {
                address: deployResult.tokenAddress,
                poolId: deployResult.poolId,
                txHash: deployResult.txHash,
                explorerUrl: deployResult.explorerUrl,
                dexUrl: deployResult.dexUrl,
            },
            claimInstructions: parsedLinks.map((l) => ({
                platform: l.platform,
                projectId: l.projectId,
                displayUrl: l.displayUrl,
                verifyMethods: l.verifyMethods,
            })),
        });
    } catch (err) {
        return c.json(
            { error: err instanceof Error ? err.message : "Failed to deploy token" },
            500,
        );
    }
});

/**
 * GET /api/launch/deployer
 * Check deployer wallet status (balance, gas availability).
 */
launch.get("/deployer", async (c) => {
    if (!isDeployerConfigured()) {
        return c.json({ configured: false, message: "Deployer not configured" });
    }

    try {
        const balance = await getDeployerBalance();
        return c.json({ configured: true, ...balance });
    } catch (err) {
        return c.json(
            { configured: true, error: err instanceof Error ? err.message : "Failed to check balance" },
            500,
        );
    }
});

/**
 * GET /api/launch/:projectId
 * Get project details including dev links and deployment info.
 */
launch.get("/:projectId{.+}", async (c) => {
    const projectId = c.req.param("projectId");
    const db = getDb();

    const [project] = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.projectId, projectId))
        .limit(1);

    if (!project) {
        return c.json({ error: "Project not found" }, 404);
    }

    return c.json({
        id: project.id,
        projectId: project.projectId,
        name: project.name,
        description: project.description,
        devLinks: project.devLinks,
        ownerWallet: project.ownerWallet,
        token: {
            address: project.poolTokenAddress,
            poolId: project.poolId,
            deployTxHash: project.deployTxHash,
        },
        attestationUid: project.attestationUid,
        deployedBy: project.deployedBy,
        createdAt: project.createdAt,
        verifiedAt: project.verifiedAt,
    });
});

export { launch };
