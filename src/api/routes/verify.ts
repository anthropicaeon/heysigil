/**
 * Verification API Routes
 *
 * Developer identity verification endpoints supporting multiple methods:
 * - OAuth: GitHub, Facebook, Instagram
 * - File-based: GitHub file, domain file, domain meta tag
 * - DNS: Domain TXT record
 * - zkTLS: Tweet verification
 */

import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";
import { randomBytes } from "node:crypto";
import { eq, and, desc, inArray, type SQL } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { getEnv } from "../../config/env.js";
import {
    getGitHubAuthUrl,
    verifyGitHubOwnership,
    verifyGitHubFile,
} from "../../verification/github.js";
import { verifyDomainDns, verifyDomainFile, verifyDomainMeta } from "../../verification/domain.js";
import { createTweetChallenge, verifyTweetProof } from "../../verification/tweet.js";
import { getFacebookAuthUrl, verifyFacebookOwnership } from "../../verification/facebook.js";
import { getInstagramAuthUrl, verifyInstagramOwnership } from "../../verification/instagram.js";
import type { VerificationMethod } from "../../verification/types.js";
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
import { privyAuth, getUserId } from "../../middleware/auth.js";
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
    OAuthCallbackQuerySchema,
} from "../schemas/verify.js";
import type { AnyHandler } from "../types.js";

const verify = new OpenAPIHono();

// Rate limit challenge creation (10 per hour per IP - prevents DB spam)
verify.use("/challenge", verifyChallengeRateLimit());

// Rate limit verification checks (30 per minute per IP - allows reasonable retries)
verify.use("/check", verifyCheckRateLimit());

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
    let platform: string;
    let platformId: string = projectId;

    if (method.startsWith("github")) {
        platform = "github";
        platformId = projectId.replace(/^github\.com\//, "");
    } else if (method.startsWith("facebook")) {
        platform = "facebook";
    } else if (method.startsWith("instagram")) {
        platform = "instagram";
    } else if (method.startsWith("tweet")) {
        platform = "twitter";
    } else if (method.startsWith("domain")) {
        platform = "domain";
    } else {
        return;
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
        console.log(
            `[verify] Phantom identity claimed: ${platform}/${platformId} → ${walletAddress}` +
                (result.merged ? " (MERGED)" : ""),
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

verify.openapi(challengeRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const body = (c.req as any).valid("json") as z.infer<typeof ChallengeRequestSchema>;

    if (!body.method || !body.projectId || !body.walletAddress) {
        return c.json({ error: "Missing required fields: method, projectId, walletAddress" }, 400);
    }

    const challengeCode = `oc-${randomBytes(12).toString("hex")}`;
    const db = getDb();

    const [record] = await db
        .insert(schema.verifications)
        .values({
            method: body.method,
            projectId: body.projectId,
            walletAddress: body.walletAddress,
            challengeCode,
            status: "pending",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
        })
        .returning();

    // Build method-specific instructions
    let instructions = "";
    let authUrl = "";

    switch (body.method) {
        case "github_oauth": {
            authUrl = getGitHubAuthUrl(record.id);
            instructions = `Click the authorization URL to verify you have admin access to ${body.projectId}.`;
            break;
        }
        case "github_file": {
            instructions = [
                `Add a file at .well-known/pool-claim.txt in the ${body.projectId} repo with this content:`,
                ``,
                `verification-code=${challengeCode}`,
                `wallet-address=${body.walletAddress}`,
                ``,
                `Then call POST /api/verify/check with your verification ID.`,
            ].join("\n");
            break;
        }
        case "domain_dns": {
            instructions = [
                `Add this DNS TXT record:`,
                ``,
                `  _poolclaim.${body.projectId} TXT "pool-claim-verify=${body.walletAddress}:${challengeCode}"`,
                ``,
                `DNS propagation can take 15 minutes to 72 hours.`,
                `Then call POST /api/verify/check with your verification ID.`,
            ].join("\n");
            break;
        }
        case "domain_file": {
            instructions = [
                `Place a file at: https://${body.projectId}/.well-known/pool-claim.txt`,
                ``,
                `Content:`,
                `verification-token=${challengeCode}`,
                `wallet-address=${body.walletAddress}`,
                ``,
                `Then call POST /api/verify/check with your verification ID.`,
            ].join("\n");
            break;
        }
        case "domain_meta": {
            instructions = [
                `Add this meta tag to the <head> of https://${body.projectId}:`,
                ``,
                `<meta name="pool-claim-verification" content="${body.walletAddress}:${challengeCode}" />`,
                ``,
                `Then call POST /api/verify/check with your verification ID.`,
            ].join("\n");
            break;
        }
        case "tweet_zktls": {
            const tweetChallenge = createTweetChallenge(body.projectId, body.walletAddress);
            instructions = tweetChallenge.instructions;
            break;
        }
        case "facebook_oauth": {
            authUrl = getFacebookAuthUrl(record.id);
            instructions = `Click the authorization URL to verify you admin the Facebook page "${body.projectId}".`;
            break;
        }
        case "instagram_graph": {
            authUrl = getInstagramAuthUrl(record.id);
            instructions = `Click the authorization URL to verify you own the Instagram account @${body.projectId}.`;
            break;
        }
        default:
            return c.json({ error: `Unsupported verification method: ${body.method}` }, 400);
    }

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
}) as AnyHandler);

// ---------- OAuth callbacks ----------

/**
 * GET /api/verify/github/callback
 * GitHub OAuth callback — completes GitHub verification.
 */
const githubCallbackRoute = createRoute({
    method: "get",
    path: "/github/callback",
    tags: ["Verify"],
    summary: "GitHub OAuth callback",
    description:
        "OAuth callback endpoint for GitHub verification. Redirects to frontend with status.",
    request: {
        query: OAuthCallbackQuerySchema,
    },
    responses: {
        302: {
            description: "Redirect to frontend with verification status",
            headers: {
                Location: {
                    schema: { type: "string" },
                    description: "Frontend URL with status parameters",
                },
            },
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (20 requests per minute)",
        },
    },
});

verify.openapi(githubCallbackRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { code, state } = (c.req as any).valid("query") as z.infer<
        typeof OAuthCallbackQuerySchema
    >;
    const env = getEnv();

    if (!code || !state) {
        return c.redirect(`${env.FRONTEND_URL}/verify?error=missing_params`);
    }

    const db = getDb();
    const [record] = await db
        .select()
        .from(schema.verifications)
        .where(eq(schema.verifications.id, state))
        .limit(1);

    if (!record || record.status !== "pending") {
        return c.redirect(`${env.FRONTEND_URL}/verify?error=invalid_state`);
    }

    const result = await verifyGitHubOwnership(code, record.projectId);

    if (result.success) {
        await db
            .update(schema.verifications)
            .set({
                status: "verified",
                platformUsername: result.platformUsername,
                proof: result.proof,
                verifiedAt: new Date(),
            })
            .where(eq(schema.verifications.id, state));

        // Claim any phantom identity tied to this GitHub repo
        await tryClaimPhantomIdentity("github_oauth", record.projectId, record.walletAddress);

        return c.redirect(`${env.FRONTEND_URL}/verify?status=success&id=${state}&platform=github`);
    }

    await db
        .update(schema.verifications)
        .set({ status: "failed", proof: { error: result.error } })
        .where(eq(schema.verifications.id, state));

    return c.redirect(
        `${env.FRONTEND_URL}/verify?status=failed&error=${encodeURIComponent(result.error || "Unknown")}`,
    );
}) as AnyHandler);

/**
 * GET /api/verify/facebook/callback
 */
const facebookCallbackRoute = createRoute({
    method: "get",
    path: "/facebook/callback",
    tags: ["Verify"],
    summary: "Facebook OAuth callback",
    description:
        "OAuth callback endpoint for Facebook verification. Redirects to frontend with status.",
    request: {
        query: OAuthCallbackQuerySchema,
    },
    responses: {
        302: {
            description: "Redirect to frontend with verification status",
            headers: {
                Location: {
                    schema: { type: "string" },
                },
            },
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (20 requests per minute)",
        },
    },
});

verify.openapi(facebookCallbackRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { code, state } = (c.req as any).valid("query") as z.infer<
        typeof OAuthCallbackQuerySchema
    >;
    const env = getEnv();

    if (!code || !state) {
        return c.redirect(`${env.FRONTEND_URL}/verify?error=missing_params`);
    }

    const db = getDb();
    const [record] = await db
        .select()
        .from(schema.verifications)
        .where(eq(schema.verifications.id, state))
        .limit(1);

    if (!record || record.status !== "pending") {
        return c.redirect(`${env.FRONTEND_URL}/verify?error=invalid_state`);
    }

    const result = await verifyFacebookOwnership(code, record.projectId);

    if (result.success) {
        await db
            .update(schema.verifications)
            .set({
                status: "verified",
                platformUsername: result.platformUsername,
                proof: result.proof,
                verifiedAt: new Date(),
            })
            .where(eq(schema.verifications.id, state));

        // Claim any phantom identity tied to this Facebook account
        await tryClaimPhantomIdentity("facebook_oauth", record.projectId, record.walletAddress);

        return c.redirect(
            `${env.FRONTEND_URL}/verify?status=success&id=${state}&platform=facebook`,
        );
    }

    await db
        .update(schema.verifications)
        .set({ status: "failed", proof: { error: result.error } })
        .where(eq(schema.verifications.id, state));

    return c.redirect(
        `${env.FRONTEND_URL}/verify?status=failed&error=${encodeURIComponent(result.error || "Unknown")}`,
    );
}) as AnyHandler);

/**
 * GET /api/verify/instagram/callback
 */
const instagramCallbackRoute = createRoute({
    method: "get",
    path: "/instagram/callback",
    tags: ["Verify"],
    summary: "Instagram OAuth callback",
    description:
        "OAuth callback endpoint for Instagram verification. Redirects to frontend with status.",
    request: {
        query: OAuthCallbackQuerySchema,
    },
    responses: {
        302: {
            description: "Redirect to frontend with verification status",
            headers: {
                Location: {
                    schema: { type: "string" },
                },
            },
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (20 requests per minute)",
        },
    },
});

verify.openapi(instagramCallbackRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { code, state } = (c.req as any).valid("query") as z.infer<
        typeof OAuthCallbackQuerySchema
    >;
    const env = getEnv();

    if (!code || !state) {
        return c.redirect(`${env.FRONTEND_URL}/verify?error=missing_params`);
    }

    const db = getDb();
    const [record] = await db
        .select()
        .from(schema.verifications)
        .where(eq(schema.verifications.id, state))
        .limit(1);

    if (!record || record.status !== "pending") {
        return c.redirect(`${env.FRONTEND_URL}/verify?error=invalid_state`);
    }

    const result = await verifyInstagramOwnership(code, record.projectId);

    if (result.success) {
        await db
            .update(schema.verifications)
            .set({
                status: "verified",
                platformUsername: result.platformUsername,
                proof: result.proof,
                verifiedAt: new Date(),
            })
            .where(eq(schema.verifications.id, state));

        // Claim any phantom identity tied to this Instagram account
        await tryClaimPhantomIdentity("instagram_graph", record.projectId, record.walletAddress);

        return c.redirect(
            `${env.FRONTEND_URL}/verify?status=success&id=${state}&platform=instagram`,
        );
    }

    await db
        .update(schema.verifications)
        .set({ status: "failed", proof: { error: result.error } })
        .where(eq(schema.verifications.id, state));

    return c.redirect(
        `${env.FRONTEND_URL}/verify?status=failed&error=${encodeURIComponent(result.error || "Unknown")}`,
    );
}) as AnyHandler);

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

verify.openapi(checkRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const body = (c.req as any).valid("json") as z.infer<typeof CheckRequestSchema>;

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

    let result;

    switch (record.method) {
        case "github_file":
            result = await verifyGitHubFile(
                record.projectId,
                record.challengeCode,
                record.walletAddress,
            );
            break;
        case "domain_dns":
            result = await verifyDomainDns(
                record.projectId,
                record.challengeCode,
                record.walletAddress,
            );
            break;
        case "domain_file":
            result = await verifyDomainFile(
                record.projectId,
                record.challengeCode,
                record.walletAddress,
            );
            break;
        case "domain_meta":
            result = await verifyDomainMeta(
                record.projectId,
                record.challengeCode,
                record.walletAddress,
            );
            break;
        case "tweet_zktls":
            if (!body.tweetProof) {
                return c.json({ error: "Missing tweetProof for tweet_zktls verification" }, 400);
            }
            result = await verifyTweetProof(
                body.tweetProof,
                record.projectId,
                record.challengeCode,
            );
            break;
        default:
            return c.json(
                { error: `Method ${record.method} uses OAuth — check the callback instead` },
                400,
            );
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
}) as AnyHandler);

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

verify.openapi(statusRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { id } = (c.req as any).valid("param") as z.infer<typeof VerificationIdParamSchema>;
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
}) as AnyHandler);

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

verify.openapi(listRoute, (async (c) => {
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
        return c.json({
            verifications: [],
            pagination: { limit: 20, offset: 0, count: 0, hasMore: false },
        });
    }

    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const query = (c.req as any).valid("query") as z.infer<typeof VerificationListQuerySchema>;

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

    return c.json({
        verifications: records,
        pagination: {
            limit: query.limit,
            offset: query.offset,
            count: records.length,
            hasMore: records.length === query.limit,
        },
    });
}) as AnyHandler);

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

verify.openapi(detailRoute, (async (c) => {
    // Apply auth inline since openapi() middleware typing is strict
    const authResult = await privyAuth()(c, async () => {});
    if (authResult) return authResult;
    const userId = getUserId(c);
    if (!userId) {
        return c.json({ error: "Authentication required" }, 401);
    }

    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { id } = (c.req as any).valid("param") as z.infer<typeof VerificationIdParamSchema>;
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
}) as AnyHandler);

export { verify };
