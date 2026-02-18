/**
 * Claim API Routes
 *
 * POST /api/claim              — Issue EAS attestation for verified project
 * GET  /api/claim/status/:id   — Check if project has been claimed
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { getBody, getParams } from "../helpers/request.js";
import { eq, or } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { find } from "../../db/helpers.js";
import { createAttestation } from "../../attestation/eas.js";
import { getPlatformFromMethod, type VerificationMethod } from "../../verification/types.js";
import { ErrorResponseSchema, NotFoundResponseSchema } from "../schemas/common.js";
import {
    ClaimRequestSchema,
    ClaimSuccessResponseSchema,
    ClaimAlreadyIssuedResponseSchema,
    ClaimProjectIdParamSchema,
    ClaimStatusResponseSchema,
} from "../schemas/claim.js";
import { handler } from "../helpers/route.js";
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

claim.openapi(
    createClaimRoute,
    handler(async (c) => {
        const body = getBody(c, ClaimRequestSchema);

        if (!body.verificationId) {
            return c.json({ error: "Missing verificationId" }, 400);
        }

        const chainRpcUrl = body.rpcUrl || "https://mainnet.base.org";
        const db = getDb();

        // Get the verification record
        const verification = await find.verification(body.verificationId);

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

        try {
            const attestation = await createAttestation(
                {
                    platform: getPlatformFromMethod(verification.method as VerificationMethod),
                    projectId: verification.projectId,
                    wallet: verification.walletAddress,
                    verifiedAt: Math.floor(
                        (verification.verifiedAt?.getTime() || Date.now()) / 1000,
                    ),
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

                // The deploy flow stores projectId as "platform:org/repo"
                // (e.g. "github:anthropicaeon/vibecodooor") but the
                // verification flow stores it as "org/repo". Try to find
                // the existing deployed project first, then update it.
                const platform = getPlatformFromMethod(verification.method as VerificationMethod);
                const prefixedId = `${platform}:${verification.projectId}`;

                const [existingProject] = await tx
                    .select()
                    .from(schema.projects)
                    .where(
                        or(
                            eq(schema.projects.projectId, verification.projectId),
                            eq(schema.projects.projectId, prefixedId),
                        ),
                    )
                    .limit(1);

                if (existingProject) {
                    // Update the existing deployed project with attestation data
                    await tx
                        .update(schema.projects)
                        .set({
                            ownerWallet: verification.walletAddress,
                            verificationMethod: verification.method,
                            attestationUid: attestation.uid,
                            verifiedAt: verification.verifiedAt || new Date(),
                        })
                        .where(eq(schema.projects.id, existingProject.id));
                } else {
                    // No deployed project yet — create a new record
                    await tx.insert(schema.projects).values({
                        projectId: verification.projectId,
                        ownerWallet: verification.walletAddress,
                        verificationMethod: verification.method,
                        attestationUid: attestation.uid,
                        verifiedAt: verification.verifiedAt || new Date(),
                    });
                }
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
    }),
);

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

claim.openapi(
    getClaimStatusRoute,
    handler(async (c) => {
        const { projectId } = getParams(c, ClaimProjectIdParamSchema);

        const project = await find.projectByProjectId(projectId);

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
    }),
);

export { claim };
