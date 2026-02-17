/**
 * Launch API Routes
 *
 * POST /api/launch              — Deploy a new token
 * GET  /api/launch/deployer     — Check deployer wallet status
 * GET  /api/launch/:projectId   — Get project details
 */

import { createRoute, OpenAPIHono, z, type RouteHandler } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { parseLink } from "../../utils/link-parser.js";
import type { ParsedLink } from "../../utils/link-parser.js";
import {
    deployToken,
    isDeployerConfigured,
    generateName,
    generateSymbol,
    getDeployerBalance,
} from "../../services/deployer.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import {
    ErrorResponseSchema,
    NotFoundResponseSchema,
    RateLimitResponseSchema,
} from "../schemas/common.js";
import {
    LaunchRequestSchema,
    LaunchDeployedResponseSchema,
    LaunchRegisteredResponseSchema,
    LaunchErrorResponseSchema,
    DeployerConfiguredResponseSchema,
    DeployerNotConfiguredResponseSchema,
    LaunchProjectIdParamSchema,
    ProjectDetailsResponseSchema,
} from "../schemas/launch.js";

const launch = new OpenAPIHono();

// Type helper to relax strict type checking for handlers
// biome-ignore lint/suspicious/noExplicitAny: OpenAPI handler type relaxation
type AnyHandler = RouteHandler<any, any>;

// IP-based rate limit for token launches (defense in depth)
// Application-level rate limiting is also applied in deployer.ts
launch.use(
    "/",
    rateLimit("launch", {
        limit: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
        message: "Too many launch attempts from this IP. Please try again later.",
    }),
);

/**
 * POST /api/launch
 * Launch a new token — deploys on-chain via the server-side deployer wallet.
 */
const launchTokenRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Launch"],
    summary: "Launch a new token",
    description: `
Deploy a new token on-chain via the server-side deployer wallet.
No wallet connection required from the user.

Token name and symbol can be auto-generated from the project identifier.
Developer links are parsed to identify platforms (GitHub, Twitter, Instagram, domains).
    `.trim(),
    request: {
        body: {
            content: {
                "application/json": {
                    schema: LaunchRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.union([LaunchDeployedResponseSchema, LaunchRegisteredResponseSchema]),
                },
            },
            description: "Token deployed or registered (if deployer not configured)",
        },
        400: {
            content: {
                "application/json": {
                    schema: LaunchErrorResponseSchema,
                },
            },
            description: "Invalid request (missing/invalid links)",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (10 requests per hour)",
        },
        500: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Deployment failed",
        },
    },
});

launch.openapi(launchTokenRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const body = (c.req as any).valid("json") as z.infer<typeof LaunchRequestSchema>;

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
                success: true as const,
                deployed: false as const,
                message:
                    "Project registered but on-chain deployment not configured. Set DEPLOYER_PRIVATE_KEY and SIGIL_FACTORY_ADDRESS.",
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
            success: true as const,
            deployed: true as const,
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
}) as AnyHandler);

/**
 * GET /api/launch/deployer
 * Check deployer wallet status (balance, gas availability).
 */
const deployerStatusRoute = createRoute({
    method: "get",
    path: "/deployer",
    tags: ["Launch"],
    summary: "Check deployer wallet status",
    description: "Check the deployer wallet balance and gas availability for token deployments.",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.union([
                        DeployerConfiguredResponseSchema,
                        DeployerNotConfiguredResponseSchema,
                    ]),
                },
            },
            description: "Deployer wallet status (configured with balance or not configured)",
        },
        500: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Failed to check balance",
        },
    },
});

launch.openapi(deployerStatusRoute, (async (c) => {
    if (!isDeployerConfigured()) {
        return c.json({ configured: false as const, message: "Deployer not configured" });
    }

    try {
        const balance = await getDeployerBalance();
        return c.json({ configured: true as const, ...balance });
    } catch (err) {
        return c.json(
            {
                configured: true as const,
                error: err instanceof Error ? err.message : "Failed to check balance",
            },
            500,
        );
    }
}) as AnyHandler);

/**
 * GET /api/launch/:projectId
 * Get project details including dev links and deployment info.
 */
const getProjectRoute = createRoute({
    method: "get",
    path: "/{projectId}",
    tags: ["Launch"],
    summary: "Get project details",
    description:
        "Get project details including developer links, deployment info, and attestation status.",
    request: {
        params: LaunchProjectIdParamSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ProjectDetailsResponseSchema,
                },
            },
            description: "Project details",
        },
        404: {
            content: {
                "application/json": {
                    schema: NotFoundResponseSchema,
                },
            },
            description: "Project not found",
        },
    },
});

launch.openapi(getProjectRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { projectId } = (c.req as any).valid("param") as z.infer<
        typeof LaunchProjectIdParamSchema
    >;
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
        createdAt: project.createdAt?.toISOString() ?? null,
        verifiedAt: project.verifiedAt?.toISOString() ?? null,
    });
}) as AnyHandler);

export { launch };
