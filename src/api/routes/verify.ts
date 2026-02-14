import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
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

const verify = new Hono();

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

// ---------- Status ----------

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
