import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { eq, and, desc, type SQL } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { getEnv } from "../../config/env.js";
import {
  getGitHubAuthUrl,
  verifyGitHubOwnership,
  verifyGitHubFile,
} from "../../verification/github.js";
import {
  verifyDomainDns,
  verifyDomainFile,
  verifyDomainMeta,
} from "../../verification/domain.js";
import { createTweetChallenge, verifyTweetProof } from "../../verification/tweet.js";
import {
  getFacebookAuthUrl,
  verifyFacebookOwnership,
} from "../../verification/facebook.js";
import {
  getInstagramAuthUrl,
  verifyInstagramOwnership,
} from "../../verification/instagram.js";
import { createAttestation } from "../../attestation/eas.js";
import type { VerificationMethod } from "../../verification/types.js";
import { findIdentity, claimIdentity } from "../../services/identity.js";
import {
  verifyChallengeRateLimit,
  verifyCheckRateLimit,
  oauthCallbackRateLimit,
} from "../../middleware/rate-limit.js";

const verify = new Hono();

// Rate limit challenge creation (10 per hour per IP - prevents DB spam)
verify.use("/challenge", verifyChallengeRateLimit());

// Rate limit verification checks (30 per minute per IP - allows reasonable retries)
verify.use("/check", verifyCheckRateLimit());

// Rate limit OAuth callbacks (20 per minute per IP - prevents abuse)
verify.use("/github/callback", oauthCallbackRateLimit());
verify.use("/facebook/callback", oauthCallbackRateLimit());
verify.use("/instagram/callback", oauthCallbackRateLimit());

// ---------- Phantom identity claim helper ----------

/**
 * After any verification succeeds, check if a phantom identity exists
 * for the verified platform/project and claim it.
 *
 * Maps verification methods to identity platforms:
 *   github_oauth, github_oidc, github_file → "github"
 *   facebook_oauth                          → "facebook"
 *   instagram_graph                         → "instagram"
 *   tweet_zktls                             → "twitter"
 *   domain_dns, domain_file, domain_meta    → "domain"
 *
 * Uses walletAddress as the user identifier. When the dev later
 * links their Privy account, the merge logic in claimIdentity()
 * will consolidate identities under one user.
 */
function tryClaimPhantomIdentity(
  method: VerificationMethod,
  projectId: string,
  walletAddress: string,
): void {
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
  let identity = findIdentity(platform, platformId);

  // Fallback: try with github.com prefix
  if (!identity && platform === "github") {
    identity = findIdentity("github", `github.com/${platformId}`);
    if (identity) platformId = `github.com/${platformId}`;
  }

  if (!identity) return;

  const result = claimIdentity(platform, platformId, walletAddress);
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
 *
 * Body: { method, projectId, walletAddress }
 */
verify.post("/challenge", async (c) => {
  const { method, projectId, walletAddress } = await c.req.json<{
    method: VerificationMethod;
    projectId: string;
    walletAddress: string;
  }>();

  if (!method || !projectId || !walletAddress) {
    return c.json({ error: "Missing required fields: method, projectId, walletAddress" }, 400);
  }

  const challengeCode = `oc-${randomBytes(12).toString("hex")}`;
  const db = getDb();

  const [record] = await db
    .insert(schema.verifications)
    .values({
      method,
      projectId,
      walletAddress,
      challengeCode,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
    })
    .returning();

  // Build method-specific instructions
  let instructions = "";
  let authUrl = "";

  switch (method) {
    case "github_oauth": {
      authUrl = getGitHubAuthUrl(record.id);
      instructions = `Click the authorization URL to verify you have admin access to ${projectId}.`;
      break;
    }
    case "github_file": {
      instructions = [
        `Add a file at .well-known/pool-claim.txt in the ${projectId} repo with this content:`,
        ``,
        `verification-code=${challengeCode}`,
        `wallet-address=${walletAddress}`,
        ``,
        `Then call POST /api/verify/check with your verification ID.`,
      ].join("\n");
      break;
    }
    case "domain_dns": {
      instructions = [
        `Add this DNS TXT record:`,
        ``,
        `  _poolclaim.${projectId} TXT "pool-claim-verify=${walletAddress}:${challengeCode}"`,
        ``,
        `DNS propagation can take 15 minutes to 72 hours.`,
        `Then call POST /api/verify/check with your verification ID.`,
      ].join("\n");
      break;
    }
    case "domain_file": {
      instructions = [
        `Place a file at: https://${projectId}/.well-known/pool-claim.txt`,
        ``,
        `Content:`,
        `verification-token=${challengeCode}`,
        `wallet-address=${walletAddress}`,
        ``,
        `Then call POST /api/verify/check with your verification ID.`,
      ].join("\n");
      break;
    }
    case "domain_meta": {
      instructions = [
        `Add this meta tag to the <head> of https://${projectId}:`,
        ``,
        `<meta name="pool-claim-verification" content="${walletAddress}:${challengeCode}" />`,
        ``,
        `Then call POST /api/verify/check with your verification ID.`,
      ].join("\n");
      break;
    }
    case "tweet_zktls": {
      const tweetChallenge = createTweetChallenge(projectId, walletAddress);
      instructions = tweetChallenge.instructions;
      break;
    }
    case "facebook_oauth": {
      authUrl = getFacebookAuthUrl(record.id);
      instructions = `Click the authorization URL to verify you admin the Facebook page "${projectId}".`;
      break;
    }
    case "instagram_graph": {
      authUrl = getInstagramAuthUrl(record.id);
      instructions = `Click the authorization URL to verify you own the Instagram account @${projectId}.`;
      break;
    }
    default:
      return c.json({ error: `Unsupported verification method: ${method}` }, 400);
  }

  return c.json({
    verificationId: record.id,
    challengeCode,
    method,
    projectId,
    walletAddress,
    instructions,
    authUrl: authUrl || undefined,
    expiresAt: record.expiresAt,
  });
});

// ---------- OAuth callbacks ----------

/**
 * GET /api/verify/github/callback
 * GitHub OAuth callback — completes GitHub verification.
 */
verify.get("/github/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state"); // state = verification ID
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
    tryClaimPhantomIdentity("github_oauth", record.projectId, record.walletAddress);

    return c.redirect(
      `${env.FRONTEND_URL}/verify?status=success&id=${state}&platform=github`,
    );
  }

  await db
    .update(schema.verifications)
    .set({ status: "failed", proof: { error: result.error } })
    .where(eq(schema.verifications.id, state));

  return c.redirect(
    `${env.FRONTEND_URL}/verify?status=failed&error=${encodeURIComponent(result.error || "Unknown")}`,
  );
});

/**
 * GET /api/verify/facebook/callback
 */
verify.get("/facebook/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
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
    tryClaimPhantomIdentity("facebook_oauth", record.projectId, record.walletAddress);

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
});

/**
 * GET /api/verify/instagram/callback
 */
verify.get("/instagram/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
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
    tryClaimPhantomIdentity("instagram_graph", record.projectId, record.walletAddress);

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
});

// ---------- Manual check (file/DNS/meta/tweet) ----------

/**
 * POST /api/verify/check
 * Check a pending verification (for non-OAuth methods).
 *
 * Body: { verificationId, tweetProof? }
 */
verify.post("/check", async (c) => {
  const { verificationId, tweetProof } = await c.req.json<{
    verificationId: string;
    tweetProof?: {
      proofData: string;
      provider: "reclaim" | "opacity" | "vlayer";
      challengeCode: string;
    };
  }>();

  const db = getDb();
  const [record] = await db
    .select()
    .from(schema.verifications)
    .where(eq(schema.verifications.id, verificationId))
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
      .where(eq(schema.verifications.id, verificationId));
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
      if (!tweetProof) {
        return c.json({ error: "Missing tweetProof for tweet_zktls verification" }, 400);
      }
      result = await verifyTweetProof(tweetProof, record.projectId, record.challengeCode);
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
      .where(eq(schema.verifications.id, verificationId));

    // Claim any phantom identity tied to this verified project
    tryClaimPhantomIdentity(
      record.method as VerificationMethod,
      record.projectId,
      record.walletAddress,
    );
  } else {
    // Keep as pending so they can retry (don't mark failed yet)
  }

  return c.json({
    verificationId,
    status: result.success ? "verified" : "pending",
    success: result.success,
    error: result.error,
    method: record.method,
    projectId: record.projectId,
  });
});

// ---------- List & Status ----------

/**
 * GET /api/verify
 * List verifications with optional filtering.
 *
 * Query params:
 *   - status: "pending" | "verified" | "failed" | "expired"
 *   - method: verification method (e.g., "github_oauth", "domain_dns")
 *   - wallet: wallet address to filter by
 *   - projectId: project identifier to filter by
 *   - limit: max results (default 20, max 100)
 *   - offset: pagination offset (default 0)
 */
verify.get("/", async (c) => {
  const status = c.req.query("status");
  const method = c.req.query("method");
  const wallet = c.req.query("wallet");
  const projectId = c.req.query("projectId");
  const limitParam = c.req.query("limit");
  const offsetParam = c.req.query("offset");

  // Parse pagination params with sane defaults
  const limit = Math.min(Math.max(1, Number(limitParam) || 20), 100);
  const offset = Math.max(0, Number(offsetParam) || 0);

  const db = getDb();

  // Build conditional where clauses
  const conditions: SQL[] = [];

  if (status) {
    conditions.push(eq(schema.verifications.status, status));
  }
  if (method) {
    conditions.push(eq(schema.verifications.method, method));
  }
  if (wallet) {
    conditions.push(eq(schema.verifications.walletAddress, wallet));
  }
  if (projectId) {
    conditions.push(eq(schema.verifications.projectId, projectId));
  }

  // Execute query with optional filters
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.verifications.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    verifications: records,
    pagination: {
      limit,
      offset,
      count: records.length,
      hasMore: records.length === limit,
    },
  });
});

/**
 * GET /api/verify/:id
 * Get verification status.
 */
verify.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const [record] = await db
    .select()
    .from(schema.verifications)
    .where(eq(schema.verifications.id, id))
    .limit(1);

  if (!record) {
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
    createdAt: record.createdAt,
    verifiedAt: record.verifiedAt,
  });
});

export { verify };
