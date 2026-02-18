/**
 * Launch API Routes
 *
 * POST /api/launch              — Deploy a new token
 * GET  /api/launch/deployer     — Check deployer wallet status
 * GET  /api/launch/:projectId   — Get project details
 */

import { z } from "zod";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { getBody, getParams } from "../helpers/request.js";
import { getDb, schema } from "../../db/client.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { getUserId, privyAuth } from "../../middleware/auth.js";
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
 * List projects owned by the authenticated user.
 * Matches by ownerWallet (from Privy user → users table → walletAddress).
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

        if (!user) {
            // No user record yet — return empty
            return c.json({ projects: [] });
        }

        // Query projects where ownerWallet matches the user's wallet
        const projects = await db
            .select()
            .from(schema.projects)
            .where(eq(schema.projects.ownerWallet, user.walletAddress));

        return c.json({
            projects: projects.map((p) => ({
                projectId: p.projectId,
                name: p.name,
                description: p.description,
                poolTokenAddress: p.poolTokenAddress,
                poolId: p.poolId,
                ownerWallet: p.ownerWallet,
                attestationUid: p.attestationUid,
                devLinks: p.devLinks,
                deployedBy: p.deployedBy,
                createdAt: p.createdAt?.toISOString() ?? null,
                verifiedAt: p.verifiedAt?.toISOString() ?? null,
            })),
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
