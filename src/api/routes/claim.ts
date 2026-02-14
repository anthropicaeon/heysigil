import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { createAttestation } from "../../attestation/eas.js";

const claim = new Hono();

/**
 * POST /api/claim
 * Issue an EAS attestation for a verified project and register the claim.
 *
 * Body: { verificationId, rpcUrl? }
 *
 * This is called after verification succeeds. It:
 * 1. Checks the verification is valid and verified
 * 2. Creates an EAS attestation on-chain
 * 3. Updates the verification record with the attestation UID
 * 4. Registers the project in the projects table
 */
claim.post("/", async (c) => {
  const { verificationId, rpcUrl } = await c.req.json<{
    verificationId: string;
    rpcUrl?: string;
  }>();

  if (!verificationId) {
    return c.json({ error: "Missing verificationId" }, 400);
  }

  const chainRpcUrl = rpcUrl || "https://mainnet.base.org";
  const db = getDb();

  // Get the verification record
  const [verification] = await db
    .select()
    .from(schema.verifications)
    .where(eq(schema.verifications.id, verificationId))
    .limit(1);

  if (!verification) {
    return c.json({ error: "Verification not found" }, 404);
  }

  if (verification.status !== "verified") {
    return c.json(
      { error: `Cannot claim — verification status is "${verification.status}", needs "verified"` },
      400,
    );
  }

  if (verification.attestationUid) {
    return c.json(
      {
        message: "Attestation already issued",
        attestationUid: verification.attestationUid,
      },
      200,
    );
  }

  // Determine platform from method
  const platformMap: Record<string, string> = {
    github_oauth: "github",
    github_oidc: "github",
    github_file: "github",
    facebook_oauth: "facebook",
    instagram_graph: "instagram",
    tweet_zktls: "twitter",
    domain_dns: "domain",
    domain_file: "domain",
    domain_meta: "domain",
  };

  try {
    const attestation = await createAttestation(
      {
        platform: platformMap[verification.method] || verification.method,
        projectId: verification.projectId,
        wallet: verification.walletAddress,
        verifiedAt: Math.floor((verification.verifiedAt?.getTime() || Date.now()) / 1000),
        isOwner: true,
      },
      chainRpcUrl,
    );

    // Update verification with attestation UID
    await db
      .update(schema.verifications)
      .set({ attestationUid: attestation.uid })
      .where(eq(schema.verifications.id, verificationId));

    // Upsert project record
    await db
      .insert(schema.projects)
      .values({
        projectId: verification.projectId,
        ownerWallet: verification.walletAddress,
        verificationMethod: verification.method,
        attestationUid: attestation.uid,
        verifiedAt: verification.verifiedAt || new Date(),
      })
      .onConflictDoUpdate({
        target: schema.projects.projectId,
        set: {
          ownerWallet: verification.walletAddress,
          verificationMethod: verification.method,
          attestationUid: attestation.uid,
          verifiedAt: verification.verifiedAt || new Date(),
        },
      });

    return c.json({
      success: true,
      attestationUid: attestation.uid,
      txHash: attestation.txHash,
      projectId: verification.projectId,
      walletAddress: verification.walletAddress,
    });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "Failed to create attestation" },
      500,
    );
  }
});

/**
 * GET /api/claim/status/:projectId
 * Check if a project has been claimed and get its attestation info.
 */
claim.get("/status/:projectId{.+}", async (c) => {
  const projectId = c.req.param("projectId");
  const db = getDb();

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.projectId, projectId))
    .limit(1);

  if (!project) {
    return c.json({
      claimed: false,
      projectId,
    });
  }

  return c.json({
    claimed: true,
    projectId: project.projectId,
    ownerWallet: project.ownerWallet,
    verificationMethod: project.verificationMethod,
    attestationUid: project.attestationUid,
    verifiedAt: project.verifiedAt,
  });
});

export { claim };
