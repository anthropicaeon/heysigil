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
    ClaimLaunchTokenRequestSchema,
    ClaimLaunchTokenResponseSchema,
    UpdateClaimedProjectRequestSchema,
    UpdateClaimedProjectResponseSchema,
} from "../schemas/claim.js";
import { handler } from "../helpers/route.js";
import { getErrorMessage } from "../../utils/errors.js";
import { getClientIp } from "../../middleware/rate-limit.js";
import { getUserId, privyAuth } from "../../middleware/auth.js";
import { createWalletForUser } from "../../services/wallet.js";
import { consumeLaunchClaimToken, LaunchClaimTokenError } from "../../services/quick-launch.js";
import { autoStarSigilRepoForClaimant } from "../../services/github-growth.js";
import { ensureDevFeeRoutingAndEscrowRelease } from "../../services/fee-routing.js";
import { parseLink } from "../../utils/link-parser.js";
import { loggers } from "../../utils/logger.js";

const claim = new OpenAPIHono();
const log = loggers.server;

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
            let projectPoolId: string | null = null;
            let projectPoolTokenAddress: string | null = null;

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
                    projectPoolId = existingProject.poolId;
                    projectPoolTokenAddress = existingProject.poolTokenAddress;
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

            // After DB commit: call setDevForPool on FeeVault to unlock escrowed fees
            if (projectPoolId) {
                tryAssignDev(
                    projectPoolId,
                    verification.walletAddress,
                    verification.projectId,
                    projectPoolTokenAddress,
                ).catch((err) => {
                    // Non-blocking — fees can still be assigned via backfill service
                    console.warn(
                        `setDevForPool failed for ${verification.projectId}: ${getErrorMessage(err)}`,
                    );
                });
            }

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

const claimLaunchTokenRoute = createRoute({
    method: "post",
    path: "/launch-token",
    tags: ["Claim"],
    summary: "Claim an unclaimed quick-launch with one-time token",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: ClaimLaunchTokenRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ClaimLaunchTokenResponseSchema,
                },
            },
            description: "Quick-launch token redeemed and project claimed",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid/expired token or wallet unavailable",
        },
        409: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Token already consumed",
        },
    },
});

claim.openapi(
    claimLaunchTokenRoute,
    handler(async (c) => {
        const authResult = await privyAuth()(c, async () => { });
        if (authResult) return authResult;

        const privyUserId = getUserId(c);
        if (!privyUserId) {
            return c.json({ error: "Authentication required" }, 401);
        }

        const body = getBody(c, ClaimLaunchTokenRequestSchema);
        const ip = getClientIp(c) || "unknown";

        try {
            const db = getDb();

            const [user] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.privyUserId, privyUserId))
                .limit(1);

            // Auto-create a deterministic server-side wallet for this user.
            // This is the canonical address for fee routing + claims.
            const { address: ownerWallet } = await createWalletForUser(privyUserId);

            const consumed = await consumeLaunchClaimToken({
                token: body.claimToken,
                claimedByUserId: privyUserId,
                ip,
                ownerWallet,
                userId: user?.id ?? null,
            });

            if (ownerWallet && consumed.poolId) {
                tryAssignDev(
                    consumed.poolId,
                    ownerWallet,
                    consumed.projectId,
                    consumed.poolTokenAddress,
                ).catch((err) => {
                    log.warn(
                        { err, projectId: consumed.projectId },
                        "setDevForPool after launch-token claim failed",
                    );
                });
            }

            autoStarSigilRepoForClaimant(privyUserId).catch((err) => {
                log.warn({ err, privyUserId }, "best-effort post-claim star failed");
            });

            return c.json({
                success: true as const,
                projectId: consumed.projectId,
                ownerWallet,
                message: "Quick-launch claim token redeemed",
            });
        } catch (err) {
            if (err instanceof LaunchClaimTokenError) {
                const status = err.code === "consumed" || err.code === "claimed" ? 409 : 400;
                log.info({ code: err.code, ip, privyUserId }, "Launch-token claim rejected");
                return c.json({ error: err.message }, status);
            }
            return c.json({ error: getErrorMessage(err, "Failed to redeem launch token") }, 500);
        }
    }),
);

const updateClaimedProjectRoute = createRoute({
    method: "patch",
    path: "/projects/{projectId}",
    tags: ["Claim"],
    summary: "Update claimed quick-launch metadata",
    request: {
        params: ClaimProjectIdParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: UpdateClaimedProjectRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: UpdateClaimedProjectResponseSchema,
                },
            },
            description: "Claimed project metadata updated",
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

claim.openapi(
    updateClaimedProjectRoute,
    handler(async (c) => {
        const authResult = await privyAuth()(c, async () => { });
        if (authResult) return authResult;

        const privyUserId = getUserId(c);
        if (!privyUserId) {
            return c.json({ error: "Authentication required" }, 401);
        }

        const { projectId } = getParams(c, ClaimProjectIdParamSchema);
        const body = getBody(c, UpdateClaimedProjectRequestSchema);
        const db = getDb();

        const [project] = await db
            .select()
            .from(schema.projects)
            .where(eq(schema.projects.projectId, projectId))
            .limit(1);

        if (!project) {
            return c.json({ error: "Project not found" }, 404);
        }

        const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.privyUserId, privyUserId))
            .limit(1);

        const walletAddresses: string[] = [];
        if (user?.walletAddress) walletAddresses.push(user.walletAddress.toLowerCase());
        // Use the canonical server-side wallet for ownership check
        const serverWallet = await createWalletForUser(privyUserId);
        walletAddresses.push(serverWallet.address.toLowerCase());

        const projectOwner = project.ownerWallet?.toLowerCase();
        if (!projectOwner || !walletAddresses.includes(projectOwner)) {
            return c.json({ error: "Forbidden: project is not owned by this account" }, 403);
        }

        let nextDevLinks = project.devLinks;
        if (body.repoUrl) {
            const parsedRepo = parseLink(body.repoUrl);
            if (!parsedRepo) {
                return c.json({ error: "repoUrl could not be parsed" }, 400);
            }
            nextDevLinks = [
                {
                    platform: parsedRepo.platform,
                    url: parsedRepo.displayUrl,
                    projectId: parsedRepo.projectId,
                },
            ];
        }

        const [updated] = await db
            .update(schema.projects)
            .set({
                name: body.name ?? project.name,
                description: body.description ?? project.description,
                devLinks: nextDevLinks,
            })
            .where(eq(schema.projects.id, project.id))
            .returning({
                projectId: schema.projects.projectId,
                name: schema.projects.name,
                description: schema.projects.description,
                devLinks: schema.projects.devLinks,
            });

        return c.json({
            success: true as const,
            projectId: updated.projectId,
            name: updated.name,
            description: updated.description,
            devLinks: updated.devLinks,
        });
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

// ─── Fee Routing Helper ─────────────────────────────────

/**
 * After a successful claim, try to call setDevForPool() on the FeeVault
 * to move escrowed fees into the dev's claimable balance.
 *
 * This is non-blocking — if it fails, the startup backfill service
 * will retry on next deploy.
 */
async function tryAssignDev(
    poolId: string,
    walletAddress: string,
    projectId: string,
    poolTokenAddress?: string | null,
): Promise<void> {
    const routing = await ensureDevFeeRoutingAndEscrowRelease({
        poolId,
        walletAddress,
        projectId,
        poolTokenAddress,
    });
    log.info(
        {
            projectId,
            poolId: `${poolId.slice(0, 18)}...`,
            walletAddress,
            lockerRoutingUpdated: routing.lockerRoutingUpdated,
            escrowAction: routing.escrowAction,
        },
        "Completed on-chain dev routing + escrow recovery",
    );
}
