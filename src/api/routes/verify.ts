/**
 * Verification API Routes
 *
 * Developer identity verification endpoints supporting multiple methods:
 * - OAuth: GitHub, Facebook, Instagram
 * - File-based: GitHub file, domain file, domain meta tag
 * - DNS: Domain TXT record
 * - zkTLS: Tweet verification
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getBody, getParams, getQuery } from "../helpers/request.js";
import { randomBytes } from "node:crypto";
import { eq, and, desc, inArray, type SQL } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { verifyGitHubOwnership, verifyGitHubViaPrivy } from "../../verification/github.js";
import { verifyFacebookOwnership } from "../../verification/facebook.js";
import { verifyInstagramOwnership } from "../../verification/instagram.js";
import {
    buildVerificationInstructions,
    executeVerificationCheck,
} from "../../services/verification.js";
import { type VerificationMethod, getPlatformFromMethod } from "../../verification/types.js";
import {
    findIdentity,
    claimIdentity,
    getWalletAddressesByPrivyId,
} from "../../services/identity.js";
import {
    verifyChallengeRateLimit,
    verifyCheckRateLimit,
    oauthCallbackRateLimit,
    verifyStatusRateLimit,
} from "../../middleware/rate-limit.js";
import {
    privyAuth,
    privyAuthOptional,
    getUserId,
    getPrivyGithubUsername,
} from "../../middleware/auth.js";
import {
    ErrorResponseSchema,
    NotFoundResponseSchema,
    RateLimitResponseSchema,
} from "../schemas/common.js";
import { securityRequired } from "../openapi.js";
import {
    ChallengeRequestSchema,
    ChallengeResponseSchema,
    CheckRequestSchema,
    CheckResponseSchema,
    VerificationIdParamSchema,
    VerificationStatusResponseSchema,
    VerificationListQuerySchema,
    VerificationListResponseSchema,
    VerificationDetailResponseSchema,
} from "../schemas/verify.js";
import { handler } from "../helpers/route.js";
import { paginatedResponse } from "../helpers/responses.js";
import { registerOAuthCallbackRoute } from "../helpers/oauth-route-factory.js";
import { loggers } from "../../utils/logger.js";

const verify = new OpenAPIHono();

// Rate limit challenge creation (10 per hour per IP - prevents DB spam)
verify.use("/challenge", verifyChallengeRateLimit());

// Rate limit verification checks (30 per minute per IP - allows reasonable retries)
verify.use("/check", verifyCheckRateLimit());
verify.use("/check", privyAuthOptional());

// Rate limit OAuth callbacks (20 per minute per IP - prevents abuse)
verify.use("/github/callback", oauthCallbackRateLimit());
verify.use("/facebook/callback", oauthCallbackRateLimit());
verify.use("/instagram/callback", oauthCallbackRateLimit());

// Rate limit public status endpoint (30 per minute per IP - enumeration protection)
verify.use("/status/:id", verifyStatusRateLimit());

// ---------- Phantom identity claim helper ----------

/**
 * After any verification succeeds, check if a phantom identity exists
 * for the verified platform/project and claim it.
 */
async function tryClaimPhantomIdentity(
    method: VerificationMethod,
    projectId: string,
    walletAddress: string,
): Promise<void> {
    // Map verification method → identity platform
    const platform = getPlatformFromMethod(method);
    let platformId: string = projectId;

    if (platform === "github") {
        platformId = projectId.replace(/^github\.com\//, "");
    }

    // Try claiming — walletAddress acts as user ID until Privy is linked
    let identity = await findIdentity(platform, platformId);

    // Fallback: try with github.com prefix
    if (!identity && platform === "github") {
        identity = await findIdentity("github", `github.com/${platformId}`);
        if (identity) platformId = `github.com/${platformId}`;
    }

    if (!identity) return;

    const result = await claimIdentity(platform, platformId, walletAddress);
    if (result.success) {
        loggers.verify.info(
            {
                platform,
                platformId,
                walletAddress,
                merged: result.merged ?? false,
            },
            "Phantom identity claimed after verification",
        );
    }
}

// ---------- Challenge creation ----------

/**
 * POST /api/verify/challenge
 * Create a new verification challenge for any method.
 */
const challengeRoute = createRoute({
    method: "post",
    path: "/challenge",
    tags: ["Verify"],
    summary: "Create verification challenge",
    description: `
Create a new verification challenge for any supported method.
Returns instructions and (for OAuth methods) an authorization URL.
Challenge expires in 24 hours.
    `.trim(),
    request: {
        body: {
            content: {
                "application/json": {
                    schema: ChallengeRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ChallengeResponseSchema,
                },
            },
            description: "Challenge created successfully",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid request (missing fields or unsupported method)",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (10 requests per hour)",
        },
    },
});

verify.openapi(
    challengeRoute,
    handler(async (c) => {
        const body = getBody(c, ChallengeRequestSchema);

        if (!body.method || !body.projectId || !body.walletAddress) {
            return c.json(
                { error: "Missing required fields: method, projectId, walletAddress" },
                400,
            );
        }

        const challengeCode = `oc-${randomBytes(12).toString("hex")}`;
        const db = getDb();

        // Normalize projectId — strip GitHub URLs to owner/repo format
        let projectId = body.projectId.trim();
        if (body.method.startsWith("github")) {
            projectId = projectId
                .replace(/^https?:\/\/(www\.)?github\.com\//, "")
                .replace(/\.git$/, "")
                .replace(/\/+$/, "");
        }

        const [record] = await db
            .insert(schema.verifications)
            .values({
                method: body.method,
                projectId,
                walletAddress: body.walletAddress,
                challengeCode,
                status: "pending",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
            })
            .returning();

        // Build method-specific instructions using service layer
        const instructionResult = buildVerificationInstructions(
            {
                method: body.method,
                projectId: body.projectId,
                walletAddress: body.walletAddress,
                challengeCode,
            },
            record.id,
        );

        if ("error" in instructionResult) {
            return c.json({ error: instructionResult.error }, 400);
        }

        const { instructions, authUrl } = instructionResult;

        return c.json({
            verificationId: record.id,
            challengeCode,
            method: body.method,
            projectId: body.projectId,
            walletAddress: body.walletAddress,
            instructions,
            authUrl: authUrl || undefined,
            expiresAt: record.expiresAt?.toISOString(),
        });
    }),
);

// ---------- OAuth callbacks (factory-generated) ----------

registerOAuthCallbackRoute(verify, {
    platform: "github",
    displayName: "GitHub",
    method: "github_oauth",
    verifyFn: verifyGitHubOwnership,
    claimPhantomFn: tryClaimPhantomIdentity,
});

registerOAuthCallbackRoute(verify, {
    platform: "facebook",
    displayName: "Facebook",
    method: "facebook_oauth",
    verifyFn: verifyFacebookOwnership,
    claimPhantomFn: tryClaimPhantomIdentity,
});

registerOAuthCallbackRoute(verify, {
    platform: "instagram",
    displayName: "Instagram",
    method: "instagram_graph",
    verifyFn: verifyInstagramOwnership,
    claimPhantomFn: tryClaimPhantomIdentity,
});

// ---------- Manual check (file/DNS/meta/tweet) ----------

/**
 * POST /api/verify/check
 * Check a pending verification (for non-OAuth methods).
 */
const checkRoute = createRoute({
    method: "post",
    path: "/check",
    tags: ["Verify"],
    summary: "Check verification status",
    description: `
Check a pending verification for non-OAuth methods (file, DNS, meta tag, tweet).
For tweet_zktls, include the tweetProof object with zkTLS proof data.
    `.trim(),
    request: {
        body: {
            content: {
                "application/json": {
                    schema: CheckRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: CheckResponseSchema,
                },
            },
            description: "Verification check result",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid request or verification expired",
        },
        404: {
            content: {
                "application/json": {
                    schema: NotFoundResponseSchema,
                },
            },
            description: "Verification not found",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (30 requests per minute)",
        },
    },
});

verify.openapi(
    checkRoute,
    handler(async (c) => {
        const body = getBody(c, CheckRequestSchema);

        const db = getDb();
        const [record] = await db
            .select()
            .from(schema.verifications)
            .where(eq(schema.verifications.id, body.verificationId))
            .limit(1);

        if (!record) {
            return c.json({ error: "Verification not found" }, 404);
        }
        if (record.status !== "pending") {
            return c.json({ error: `Verification already ${record.status}` }, 400);
        }
        if (record.expiresAt && record.expiresAt < new Date()) {
            await db
                .update(schema.verifications)
                .set({ status: "expired" })
                .where(eq(schema.verifications.id, body.verificationId));
            return c.json({ error: "Verification expired" }, 400);
        }

        // For github_oauth: try Privy-based verification if user has a linked GitHub account
        if (record.method === "github_oauth") {
            const userId = getUserId(c);
            if (userId) {
                const githubUsername = await getPrivyGithubUsername(userId);
                if (githubUsername) {
                    const privyResult = await verifyGitHubViaPrivy(
                        githubUsername,
                        record.projectId,
                    );

                    if (privyResult.success) {
                        await db
                            .update(schema.verifications)
                            .set({
                                status: "verified",
                                platformUsername: privyResult.platformUsername,
                                proof: privyResult.proof,
                                verifiedAt: new Date(),
                            })
                            .where(eq(schema.verifications.id, body.verificationId));

                        await tryClaimPhantomIdentity(
                            record.method as VerificationMethod,
                            record.projectId,
                            record.walletAddress,
                        );

                        return c.json({
                            verificationId: body.verificationId,
                            status: "verified" as const,
                            success: true,
                            method: record.method,
                            projectId: record.projectId,
                        });
                    }
                    // Privy check failed (e.g. GitHub API 401 for unauthenticated calls)
                    // Fall through to standard file-based verification below
                }
            }
        }

        // Execute verification using service layer
        const result = await executeVerificationCheck({
            method: record.method as VerificationMethod,
            projectId: record.projectId,
            walletAddress: record.walletAddress,
            challengeCode: record.challengeCode,
            tweetProof: body.tweetProof,
        });

        if ("error" in result && !("success" in result)) {
            return c.json({ error: result.error }, 400);
        }

        if (result.success) {
            await db
                .update(schema.verifications)
                .set({
                    status: "verified",
                    platformUsername: result.platformUsername,
                    proof: result.proof,
                    verifiedAt: new Date(),
                })
                .where(eq(schema.verifications.id, body.verificationId));

            // Claim any phantom identity tied to this verified project
            await tryClaimPhantomIdentity(
                record.method as VerificationMethod,
                record.projectId,
                record.walletAddress,
            );
        }
        // Keep as pending so they can retry (don't mark failed yet)

        return c.json({
            verificationId: body.verificationId,
            status: result.success ? ("verified" as const) : ("pending" as const),
            success: result.success,
            error: result.error,
            method: record.method,
            projectId: record.projectId,
        });
    }),
);

// ---------- List & Status ----------

/**
 * GET /api/verify/status/:id
 * Public endpoint returning minimal verification status.
 */
const statusRoute = createRoute({
    method: "get",
    path: "/status/{id}",
    tags: ["Verify"],
    summary: "Get verification status (public)",
    description: `
Public endpoint returning minimal verification status.
Does NOT expose wallet addresses or platform usernames.
Use case: Frontend polling verification status after OAuth callback.
    `.trim(),
    request: {
        params: VerificationIdParamSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: VerificationStatusResponseSchema,
                },
            },
            description: "Verification status",
        },
        404: {
            content: {
                "application/json": {
                    schema: NotFoundResponseSchema,
                },
            },
            description: "Verification not found",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (30 requests per minute)",
        },
    },
});

verify.openapi(
    statusRoute,
    handler(async (c) => {
        const { id } = getParams(c, VerificationIdParamSchema);
        const db = getDb();

        const [record] = await db
            .select({
                id: schema.verifications.id,
                status: schema.verifications.status,
                method: schema.verifications.method,
                createdAt: schema.verifications.createdAt,
                verifiedAt: schema.verifications.verifiedAt,
            })
            .from(schema.verifications)
            .where(eq(schema.verifications.id, id))
            .limit(1);

        if (!record) {
            return c.json({ error: "Verification not found" }, 404);
        }

        // Note: projectId intentionally omitted to prevent enumeration
        return c.json({
            id: record.id,
            status: record.status,
            method: record.method,
            createdAt: record.createdAt?.toISOString(),
            verifiedAt: record.verifiedAt?.toISOString() ?? null,
        });
    }),
);

/**
 * GET /api/verify
 * List verifications owned by the authenticated user.
 */
const listRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Verify"],
    summary: "List user's verifications",
    description: `
List verifications owned by the authenticated user.
Requires authentication - returns only verifications for user's wallet addresses.
Supports filtering by status, method, and projectId.
    `.trim(),
    security: securityRequired,
    request: {
        query: VerificationListQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: VerificationListResponseSchema,
                },
            },
            description: "List of user's verifications",
        },
        401: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Authentication required",
        },
    },
});

verify.openapi(
    listRoute,
    handler(async (c) => {
        // Apply auth inline since openapi() middleware typing is strict
        const authResult = await privyAuth()(c, async () => {});
        if (authResult) return authResult;
        const userId = getUserId(c);
        if (!userId) {
            return c.json({ error: "Authentication required" }, 401);
        }

        // Get all wallet addresses owned by this user (includes merged wallets)
        const userWallets = await getWalletAddressesByPrivyId(userId);
        if (userWallets.length === 0) {
            // User has no linked wallets yet - return empty list
            return c.json(paginatedResponse("verifications", [], 20, 0));
        }

        const query = getQuery(c, VerificationListQuerySchema);

        const db = getDb();

        // Build conditional where clauses
        const conditions: SQL[] = [];

        // SECURITY: Always filter to user's wallet addresses
        conditions.push(inArray(schema.verifications.walletAddress, userWallets));

        if (query.status) {
            conditions.push(eq(schema.verifications.status, query.status));
        }
        if (query.method) {
            conditions.push(eq(schema.verifications.method, query.method));
        }
        if (query.projectId) {
            conditions.push(eq(schema.verifications.projectId, query.projectId));
        }

        // Execute query with ownership filter
        const records = await db
            .select({
                id: schema.verifications.id,
                method: schema.verifications.method,
                projectId: schema.verifications.projectId,
                walletAddress: schema.verifications.walletAddress,
                status: schema.verifications.status,
                platformUsername: schema.verifications.platformUsername,
                attestationUid: schema.verifications.attestationUid,
                createdAt: schema.verifications.createdAt,
                verifiedAt: schema.verifications.verifiedAt,
            })
            .from(schema.verifications)
            .where(and(...conditions))
            .orderBy(desc(schema.verifications.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return c.json(paginatedResponse("verifications", records, query.limit, query.offset));
    }),
);

/**
 * GET /api/verify/:id
 * Get full verification details. Requires authentication and ownership.
 */
const detailRoute = createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Verify"],
    summary: "Get verification details",
    description: `
Get full verification details. Requires authentication and ownership.
Returns 404 (not 403) for unauthorized access to prevent enumeration.
    `.trim(),
    security: securityRequired,
    request: {
        params: VerificationIdParamSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: VerificationDetailResponseSchema,
                },
            },
            description: "Verification details",
        },
        401: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Authentication required",
        },
        404: {
            content: {
                "application/json": {
                    schema: NotFoundResponseSchema,
                },
            },
            description: "Verification not found (or not owned by user)",
        },
    },
});

verify.openapi(
    detailRoute,
    handler(async (c) => {
        // Apply auth inline since openapi() middleware typing is strict
        const authResult = await privyAuth()(c, async () => {});
        if (authResult) return authResult;
        const userId = getUserId(c);
        if (!userId) {
            return c.json({ error: "Authentication required" }, 401);
        }

        const { id } = getParams(c, VerificationIdParamSchema);
        const db = getDb();

        const [record] = await db
            .select()
            .from(schema.verifications)
            .where(eq(schema.verifications.id, id))
            .limit(1);

        if (!record) {
            return c.json({ error: "Verification not found" }, 404);
        }

        // SECURITY: Verify ownership - user must own the wallet that created this verification
        const userWallets = await getWalletAddressesByPrivyId(userId);
        if (!userWallets.includes(record.walletAddress)) {
            // Return 404 instead of 403 to prevent enumeration attacks
            return c.json({ error: "Verification not found" }, 404);
        }

        return c.json({
            id: record.id,
            method: record.method,
            projectId: record.projectId,
            walletAddress: record.walletAddress,
            status: record.status,
            platformUsername: record.platformUsername,
            attestationUid: record.attestationUid,
            createdAt: record.createdAt?.toISOString(),
            verifiedAt: record.verifiedAt?.toISOString() ?? null,
        });
    }),
);

export { verify };
