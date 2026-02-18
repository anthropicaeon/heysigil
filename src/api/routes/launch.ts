/**
 * Launch API Routes
 *
 * POST /api/launch              — Deploy a new token
 * GET  /api/launch/deployer     — Check deployer wallet status
 * GET  /api/launch/:projectId   — Get project details
 */

import { z } from "zod";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq, sql, isNull, and } from "drizzle-orm";
import { getBody, getParams } from "../helpers/request.js";
import { getDb, schema } from "../../db/client.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { getUserId, privyAuth, getPrivyGithubUsername } from "../../middleware/auth.js";
import { loggers } from "../../utils/logger.js";
import { handler } from "../helpers/route.js";
import { getErrorMessage } from "../../utils/errors.js";
import { parseDevLinks, launchToken, isDeployerConfigured } from "../../services/launch.js";
import { getDeployerBalance } from "../../services/deployer.js";
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

launch.openapi(
    launchTokenRoute,
    handler(async (c) => {
        const body = getBody(c, LaunchRequestSchema);

        // Parse and validate links
        const parseResult = parseDevLinks(body);
        if (!parseResult.success) {
            return c.json(
                {
                    error: parseResult.error,
                    invalidLinks: parseResult.invalidLinks,
                    hint: parseResult.hint,
                    examples: parseResult.examples,
                },
                400,
            );
        }

        // Launch token (register + optionally deploy)
        const privyUserId = getUserId(c);
        const result = await launchToken(body, { privyUserId });

        // Handle errors
        if ("error" in result) {
            return c.json({ error: result.error }, 500);
        }

        // Return appropriate response based on result type
        if (result.type === "registered") {
            return c.json({
                success: true as const,
                deployed: false as const,
                message: result.message,
                project: result.project,
            });
        }

        return c.json({
            success: true as const,
            deployed: true as const,
            project: result.project,
            token: result.token,
            claimInstructions: result.claimInstructions,
        });
    }),
);

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

launch.openapi(
    deployerStatusRoute,
    handler(async (c) => {
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
                    error: getErrorMessage(err, "Failed to check balance"),
                },
                500,
            );
        }
    }),
);

/**
 * GET /api/launch/my-projects
 * List projects owned by the authenticated user + claimable projects.
 *
 * "Claimed" = ownerWallet matches the user's wallet.
 * "Claimable" = ownerWallet IS NULL and devLinks contains a GitHub
 *               repo owned by the user's Privy GitHub username.
 *
 * Each project is enriched with aggregated fee data from feeDistributions.
 */
launch.get(
    "/my-projects",
    privyAuth(),
    handler(async (c) => {
        const privyUserId = getUserId(c);
        if (!privyUserId) {
            return c.json({ error: "Not authenticated" }, 401);
        }

        const db = getDb();

        // Find user by Privy user ID to get their wallet address
        const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.privyUserId, privyUserId))
            .limit(1);

        // ── Claimed projects (ownerWallet matches user's wallet) ──
        let claimedProjects: (typeof schema.projects.$inferSelect)[] = [];
        if (user) {
            claimedProjects = await db
                .select()
                .from(schema.projects)
                .where(eq(schema.projects.ownerWallet, user.walletAddress));
        }

        // ── Claimable projects (unclaimed, GitHub username matches devLinks) ──
        let claimableProjects: (typeof schema.projects.$inferSelect)[] = [];

        const githubUsername = await getPrivyGithubUsername(privyUserId);
        if (githubUsername) {
            // Load all unclaimed projects — filter in TS for reliability
            const unclaimed = await db
                .select()
                .from(schema.projects)
                .where(isNull(schema.projects.ownerWallet));

            // Match: devLinks has a GitHub entry with projectId containing the user's username
            // OR project ID starts with "github:username/"
            const userLower = githubUsername.toLowerCase();
            claimableProjects = unclaimed.filter((p) => {
                // Match by projectId prefix: "github:username/repo"
                if (p.projectId.toLowerCase().startsWith(`github:${userLower}/`)) {
                    return true;
                }
                // Match by devLinks containing the username
                if (p.devLinks && Array.isArray(p.devLinks)) {
                    return p.devLinks.some(
                        (link) =>
                            link.platform === "github" &&
                            link.projectId.toLowerCase().startsWith(`${userLower}/`),
                    );
                }
                return false;
            });

            loggers.server.info(
                {
                    githubUsername,
                    unclaimedCount: unclaimed.length,
                    matchedCount: claimableProjects.length,
                },
                "Claimable project scan",
            );
        }

        // ── Aggregate fees per project ──
        const allProjectIds = [
            ...claimedProjects.map((p) => p.projectId),
            ...claimableProjects.map((p) => p.projectId),
        ];

        const feesByProject = new Map<string, string>();

        if (allProjectIds.length > 0) {
            try {
                // Sum devAmount from deposit events grouped by projectId
                const feeRows = await db
                    .select({
                        projectId: schema.feeDistributions.projectId,
                        totalDevFees: sql<string>`COALESCE(SUM(CAST(${schema.feeDistributions.devAmount} AS NUMERIC)), 0)`,
                    })
                    .from(schema.feeDistributions)
                    .where(
                        and(
                            eq(schema.feeDistributions.eventType, "deposit"),
                            sql`${schema.feeDistributions.projectId} = ANY(${allProjectIds})`,
                        ),
                    )
                    .groupBy(schema.feeDistributions.projectId);

                for (const row of feeRows) {
                    if (row.projectId) {
                        feesByProject.set(row.projectId, row.totalDevFees);
                    }
                }
            } catch (err) {
                loggers.server.warn({ error: err }, "Failed to aggregate fees, returning 0s");
            }
        }

        // ── Format helper ──
        function formatProject(p: typeof schema.projects.$inferSelect) {
            const feesWei = feesByProject.get(p.projectId) ?? "0";
            // USDC has 6 decimals
            const feesNum = Number(feesWei) / 1e6;
            const feesUsdc =
                feesNum > 0
                    ? `$${feesNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "$0.00";

            return {
                projectId: p.projectId,
                name: p.name,
                description: p.description,
                poolTokenAddress: p.poolTokenAddress,
                poolId: p.poolId,
                ownerWallet: p.ownerWallet,
                attestationUid: p.attestationUid,
                devLinks: p.devLinks,
                deployedBy: p.deployedBy,
                feesAccruedWei: feesWei,
                feesAccruedUsdc: feesUsdc,
                createdAt: p.createdAt?.toISOString() ?? null,
                verifiedAt: p.verifiedAt?.toISOString() ?? null,
            };
        }

        return c.json({
            projects: claimedProjects.map(formatProject),
            claimableProjects: claimableProjects.map(formatProject),
        });
    }),
);

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

launch.openapi(
    getProjectRoute,
    handler(async (c) => {
        const { projectId } = getParams(c, LaunchProjectIdParamSchema);
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
    }),
);

export { launch };
