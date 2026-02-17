/**
 * Claim API Routes
 *
 * POST /api/claim              — Issue EAS attestation for verified project
 * GET  /api/claim/status/:id   — Check if project has been claimed
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { createAttestation } from "../../attestation/eas.js";
import { ErrorResponseSchema, NotFoundResponseSchema } from "../schemas/common.js";
import {
    ClaimRequestSchema,
    ClaimSuccessResponseSchema,
    ClaimAlreadyIssuedResponseSchema,
    ClaimProjectIdParamSchema,
    ClaimStatusResponseSchema,
} from "../schemas/claim.js";
import type { AnyHandler } from "../types.js";
import { getErrorMessage } from "../../utils/errors.js";

const claim = new OpenAPIHono();

/**
 * POST /api/claim
 * Issue an EAS attestation for a verified project and register the claim.
 */
const createClaimRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Claim"],
    summary: "Claim project with EAS attestation",
    description: `
Issue an EAS attestation for a verified project. This endpoint:
1. Checks the verification is valid and verified
2. Creates an EAS attestation on-chain
3. Updates the verification record with the attestation UID
4. Registers the project in the projects table
    `.trim(),
    request: {
        body: {
            content: {
                "application/json": {
                    schema: ClaimRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.union([ClaimSuccessResponseSchema, ClaimAlreadyIssuedResponseSchema]),
                },
            },
            description: "Attestation created or already exists",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid request or verification not ready",
        },
        404: {
            content: {
                "application/json": {
                    schema: NotFoundResponseSchema,
                },
            },
            description: "Verification not found",
        },
        500: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Failed to create attestation",
        },
    },
});

claim.openapi(createClaimRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const body = (c.req as any).valid("json") as z.infer<typeof ClaimRequestSchema>;

    if (!body.verificationId) {
        return c.json({ error: "Missing verificationId" }, 400);
    }

    const chainRpcUrl = body.rpcUrl || "https://mainnet.base.org";
    const db = getDb();

    // Get the verification record
    const [verification] = await db
        .select()
        .from(schema.verifications)
        .where(eq(schema.verifications.id, body.verificationId))
        .limit(1);

    if (!verification) {
        return c.json({ error: "Verification not found" }, 404);
    }

    if (verification.status !== "verified") {
        return c.json(
            {
                error: `Cannot claim — verification status is "${verification.status}", needs "verified"`,
            },
            400,
        );
    }

    if (verification.attestationUid) {
        return c.json(
            {
                message: "Attestation already issued" as const,
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

        // Wrap DB updates in transaction for atomicity
        await db.transaction(async (tx) => {
            // Update verification with attestation UID
            await tx
                .update(schema.verifications)
                .set({ attestationUid: attestation.uid })
                .where(eq(schema.verifications.id, body.verificationId));

            // Upsert project record
            await tx
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
        });

        return c.json({
            success: true as const,
            attestationUid: attestation.uid,
            txHash: attestation.txHash,
            projectId: verification.projectId,
            walletAddress: verification.walletAddress,
        });
    } catch (err) {
        return c.json({ error: getErrorMessage(err, "Failed to create attestation") }, 500);
    }
}) as AnyHandler);

/**
 * GET /api/claim/status/:projectId
 * Check if a project has been claimed and get its attestation info.
 */
const getClaimStatusRoute = createRoute({
    method: "get",
    path: "/status/{projectId}",
    tags: ["Claim"],
    summary: "Check project claim status",
    description: "Check if a project has been claimed and get its attestation information.",
    request: {
        params: ClaimProjectIdParamSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ClaimStatusResponseSchema,
                },
            },
            description: "Project claim status (claimed or unclaimed)",
        },
    },
});

claim.openapi(getClaimStatusRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { projectId } = (c.req as any).valid("param") as z.infer<
        typeof ClaimProjectIdParamSchema
    >;
    const db = getDb();

    const [project] = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.projectId, projectId))
        .limit(1);

    if (!project) {
        return c.json({
            claimed: false as const,
            projectId,
        });
    }

    return c.json({
        claimed: true as const,
        projectId: project.projectId,
        verificationMethod: project.verificationMethod,
        attestationUid: project.attestationUid,
        verifiedAt: project.verifiedAt?.toISOString() ?? null,
    });
}) as AnyHandler);

export { claim };
