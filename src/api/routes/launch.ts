/**
 * Launch API Routes
 *
 * POST /api/launch              — Deploy a new token
 * GET  /api/launch/deployer     — Check deployer wallet status
 * GET  /api/launch/:projectId   — Get project details
 */

import { z } from "zod";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq, sql, isNull, and, inArray, desc, asc, type SQL } from "drizzle-orm";
import { getBody, getParams, getQuery } from "../helpers/request.js";
import { getDb, schema } from "../../db/client.js";
import { getClientIp, rateLimit } from "../../middleware/rate-limit.js";
import {
    getUserId,
    privyAuth,
    getPrivyGithubUsername,
    getPrivyWalletAddress,
} from "../../middleware/auth.js";
import { loggers } from "../../utils/logger.js";
import { handler } from "../helpers/route.js";
import { getErrorMessage } from "../../utils/errors.js";
import {
    QUICK_LAUNCH_DEFAULT_REPO,
    isDeployerConfigured,
    launchQuickToken,
    launchToken,
    parseDevLinks,
} from "../../services/launch.js";
import { getDeployerBalance } from "../../services/deployer.js";
import { getUserAddress } from "../../services/wallet.js";
import {
    QuickLaunchIpLimitError,
    annotateQuickLaunchIpProject,
    createLaunchClaimToken,
    enforceQuickLaunchIpGuardrail,
    releaseQuickLaunchIpGuardrail,
} from "../../services/quick-launch.js";
import { createMcpToken, revokeMcpToken } from "../../services/mcp-token.js";
import {
    isRailwayProvisionerConfigured,
    provisionSigilBotRuntime,
    type RailwayProvisionResult,
} from "../../services/infra/railway-provisioner.js";
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
    LaunchAlreadyLaunchedResponseSchema,
    LaunchListQuerySchema,
    LaunchListResponseSchema,
    QuickLaunchResponseSchema,
    QuickLaunchRequestSchema,
} from "../schemas/launch.js";

const launch = new OpenAPIHono();
const QUICK_LAUNCH_RUNTIME_SCOPES = [
    "chat:write",
    "launch:read",
    "launch:write",
    "dashboard:read",
    "verify:write",
    "developers:read",
    "governance:read",
    "claim:write",
];

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

// Strict one-click limit for quick-launch route (secondary to DB guardrail)
launch.use(
    "/quick",
    rateLimit("launch-quick-ip", {
        limit: 1,
        windowMs: 24 * 60 * 60 * 1000,
        message: "Quick launch already used for this IP. Claim your launch with your one-time token.",
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
        409: {
            content: {
                "application/json": {
                    schema: LaunchAlreadyLaunchedResponseSchema,
                },
            },
            description: "Project already has a launched token",
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
        if (result.type === "already_launched") {
            return c.json(
                {
                    success: false as const,
                    deployed: true as const,
                    error: "Token already launched for this project",
                    project: result.project,
                    token: result.token,
                },
                409,
            );
        }

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

const quickLaunchRoute = createRoute({
    method: "post",
    path: "/quick",
    tags: ["Launch"],
    summary: "One-click quick launch",
    description:
        "Launch a default unclaimed token with no inputs. Returns a one-time claim token shown once.",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: QuickLaunchRequestSchema,
                },
            },
            required: false,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: QuickLaunchResponseSchema,
                },
            },
            description: "Quick launch created",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Quick-launch per-IP limit reached",
        },
        500: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Quick launch failed",
        },
    },
});

launch.openapi(
    quickLaunchRoute,
    handler(async (c) => {
        const ip = getClientIp(c);
        if (!ip || ip === "unknown") {
            return c.json(
                {
                    error: "Could not determine client IP for quick-launch guardrail",
                },
                400,
            );
        }

        try {
            await enforceQuickLaunchIpGuardrail(ip);
        } catch (err) {
            if (err instanceof QuickLaunchIpLimitError) {
                return c.json(
                    {
                        error: "Quick launch limit reached for this IP",
                        retryAfter: 24 * 60 * 60,
                    },
                    429,
                );
            }
            return c.json({ error: getErrorMessage(err, "Failed quick-launch guardrail check") }, 500);
        }

        const privyUserId = getUserId(c);
        const quickResult = await launchQuickToken({ privyUserId });

        if ("error" in quickResult) {
            await releaseQuickLaunchIpGuardrail(ip).catch(() => undefined);
            return c.json({ error: quickResult.error }, 500);
        }

        await annotateQuickLaunchIpProject(ip, quickResult.project.projectId).catch(() => undefined);
        const claimToken = await createLaunchClaimToken({
            projectId: quickResult.project.projectId,
            projectRefId: quickResult.project.id,
            ip,
        });

        let runtimeProvision: {
            provider: "railway";
            stack: "sigilbot";
            provisioned: boolean;
            endpoint?: string;
            deployment?: {
                projectId: string;
                serviceId: string;
                deploymentId: string;
                minimumResources: RailwayProvisionResult["minimumResources"];
            };
            error?: string;
        } = {
            provider: "railway",
            stack: "sigilbot",
            provisioned: false,
            error: "Railway provisioner is not configured on backend",
        };

        if (isRailwayProvisionerConfigured()) {
            const runtimeOwnerUserId = `quicklaunch:${quickResult.project.id}`;
            let runtimeToken: Awaited<ReturnType<typeof createMcpToken>> | null = null;
            try {
                runtimeToken = await createMcpToken({
                    userId: runtimeOwnerUserId,
                    name: `Hero quick launch runtime ${quickResult.project.projectId}`,
                    scopes: QUICK_LAUNCH_RUNTIME_SCOPES,
                    expiresInDays: 30,
                });
                const provisioned = await provisionSigilBotRuntime({
                    userId: runtimeOwnerUserId,
                    stack: "sigilbot",
                    mcpToken: runtimeToken.token,
                });
                runtimeProvision = {
                    provider: "railway",
                    stack: "sigilbot",
                    provisioned: true,
                    endpoint: provisioned.endpoint,
                    deployment: {
                        projectId: provisioned.projectId,
                        serviceId: provisioned.serviceId,
                        deploymentId: provisioned.deploymentId,
                        minimumResources: provisioned.minimumResources,
                    },
                };
            } catch (err) {
                if (runtimeToken) {
                    await revokeMcpToken(runtimeOwnerUserId, runtimeToken.metadata.id).catch(() => undefined);
                }
                runtimeProvision = {
                    provider: "railway",
                    stack: "sigilbot",
                    provisioned: false,
                    error: getErrorMessage(err, "Sigilbot runtime provisioning failed"),
                };
                loggers.server.warn(
                    {
                        projectId: quickResult.project.projectId,
                        projectRefId: quickResult.project.id,
                        error: runtimeProvision.error,
                    },
                    "Quick-launch runtime provisioning failed",
                );
            }
        }

        return c.json({
            success: true as const,
            deployed: quickResult.type === "deployed",
            project:
                quickResult.type === "deployed"
                    ? quickResult.project
                    : {
                          id: quickResult.project.id,
                          projectId: quickResult.project.projectId,
                          name: quickResult.project.name,
                      },
            token: quickResult.type === "deployed" ? quickResult.token : undefined,
            claimToken: claimToken.token,
            claimTokenExpiresAt: claimToken.expiresAt.toISOString(),
            launchDefaults: {
                repo: `${QUICK_LAUNCH_DEFAULT_REPO.platform}:${QUICK_LAUNCH_DEFAULT_REPO.projectId}`,
                repoUrl: QUICK_LAUNCH_DEFAULT_REPO.displayUrl,
                claimLaterSupported: true as const,
            },
            runtime: runtimeProvision,
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

        // Find user by Privy user ID to get their wallet address.
        // Collect ALL possible wallet addresses: users table, custodial
        // wallet service, and Privy embedded wallet.
        const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.privyUserId, privyUserId))
            .limit(1);

        const walletAddresses: string[] = [];
        if (user?.walletAddress) walletAddresses.push(user.walletAddress);

        // Custodial wallet from our wallet service
        try {
            const custodialAddr = await getUserAddress(privyUserId);
            if (custodialAddr && !walletAddresses.includes(custodialAddr)) {
                walletAddresses.push(custodialAddr);
            }
        } catch {
            // No custodial wallet — that's fine
        }

        // Privy embedded wallet (this is what the user verified with)
        const privyWallet = await getPrivyWalletAddress(privyUserId);
        if (privyWallet && !walletAddresses.includes(privyWallet)) {
            walletAddresses.push(privyWallet);
        }

        // ── Claimed projects (ownerWallet matches any of user's wallets) ──
        let claimedProjects: (typeof schema.projects.$inferSelect)[] = [];
        if (walletAddresses.length > 0) {
            claimedProjects = await db
                .select()
                .from(schema.projects)
                .where(inArray(schema.projects.ownerWallet, walletAddresses));
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
                // Sum fees from deposit events (devAmount) and escrow events (amount)
                const feeRows = await db
                    .select({
                        projectId: schema.feeDistributions.projectId,
                        totalDevFees: sql<string>`COALESCE(SUM(
                            CASE
                                WHEN ${schema.feeDistributions.eventType} = 'deposit'
                                    THEN CAST(${schema.feeDistributions.devAmount} AS NUMERIC)
                                WHEN ${schema.feeDistributions.eventType} = 'escrow'
                                    THEN CAST(${schema.feeDistributions.amount} AS NUMERIC)
                                ELSE 0
                            END
                        ), 0)`,
                    })
                    .from(schema.feeDistributions)
                    .where(
                        and(
                            sql`${schema.feeDistributions.eventType} IN ('deposit', 'escrow')`,
                            inArray(schema.feeDistributions.projectId, allProjectIds),
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

const launchPlatforms = new Set(["github", "twitter", "facebook", "instagram", "domain"]);

function getLaunchPlatform(
    projectId: string,
    devLinks: { platform: string; url: string; projectId: string }[] | null,
): "github" | "twitter" | "facebook" | "instagram" | "domain" | "unknown" {
    const prefix = projectId.split(":")[0]?.toLowerCase() ?? "";
    if (launchPlatforms.has(prefix)) {
        return prefix as "github" | "twitter" | "facebook" | "instagram" | "domain";
    }

    const fallback = devLinks?.[0]?.platform?.toLowerCase() ?? "";
    if (launchPlatforms.has(fallback)) {
        return fallback as "github" | "twitter" | "facebook" | "instagram" | "domain";
    }

    return "unknown";
}

/**
 * GET /api/launch/list
 * Public listing of all on-chain launched tokens.
 */
const listLaunchesRoute = createRoute({
    method: "get",
    path: "/list",
    tags: ["Launch"],
    summary: "List launched tokens",
    description:
        "List all projects with on-chain token launches created through Sigil. Supports search, filtering, sorting, and pagination.",
    request: {
        query: LaunchListQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: LaunchListResponseSchema,
                },
            },
            description: "List of launched tokens",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid query parameters",
        },
    },
});

launch.openapi(
    listLaunchesRoute,
    handler(async (c) => {
        const query = getQuery(c, LaunchListQuerySchema);
        const db = getDb();

        const conditions: SQL[] = [
            sql`${schema.projects.poolTokenAddress} IS NOT NULL`,
            sql`${schema.projects.poolId} IS NOT NULL`,
        ];

        if (query.q) {
            const term = `%${query.q.toLowerCase()}%`;
            conditions.push(
                sql`(
                    LOWER(${schema.projects.projectId}) LIKE ${term}
                    OR LOWER(COALESCE(${schema.projects.name}, '')) LIKE ${term}
                    OR LOWER(COALESCE(${schema.projects.poolTokenAddress}, '')) LIKE ${term}
                )`,
            );
        }

        if (query.platform) {
            const platformPrefix = `${query.platform.toLowerCase()}:%`;
            conditions.push(sql`LOWER(${schema.projects.projectId}) LIKE ${platformPrefix}`);
        }

        const orderBy =
            query.sort === "oldest"
                ? asc(schema.projects.createdAt)
                : desc(schema.projects.createdAt);

        const rows = await db
            .select()
            .from(schema.projects)
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(query.limit)
            .offset(query.offset);

        const launches = rows.flatMap((project) => {
            if (!project.poolTokenAddress || !project.poolId) {
                return [];
            }

            return [
                {
                    projectId: project.projectId,
                    name: project.name,
                    description: project.description,
                    platform: getLaunchPlatform(project.projectId, project.devLinks),
                    poolTokenAddress: project.poolTokenAddress,
                    poolId: project.poolId,
                    deployTxHash: project.deployTxHash,
                    deployedBy: project.deployedBy,
                    attestationUid: project.attestationUid,
                    ownerWallet: project.ownerWallet,
                    createdAt: project.createdAt?.toISOString() ?? null,
                    verifiedAt: project.verifiedAt?.toISOString() ?? null,
                    explorerUrl: `https://basescan.org/address/${project.poolTokenAddress}`,
                    dexUrl: `https://dexscreener.com/base/${project.poolTokenAddress}`,
                },
            ];
        });

        return c.json({
            launches,
            pagination: {
                limit: query.limit,
                offset: query.offset,
                count: launches.length,
                hasMore: launches.length === query.limit,
            },
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
