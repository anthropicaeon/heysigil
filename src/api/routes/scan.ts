/**
 * Scan API Routes
 *
 * POST /api/attest/scan — Scan a GitHub repo for a .sigil file and create an EAS attestation.
 *
 * Public endpoint — anyone can trigger a scan. The .sigil file on the
 * default branch IS the proof of ownership (only repo admins can push there).
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { find } from "../../db/helpers.js";
import { createAttestation } from "../../attestation/eas.js";
import { handler } from "../helpers/route.js";
import { getErrorMessage } from "../../utils/errors.js";
import { loggers } from "../../utils/logger.js";
import { rateLimit } from "../../middleware/rate-limit.js";

const log = loggers.server;

const scan = new OpenAPIHono();

// ─── Rate Limiting ──────────────────────────────────────

scan.use(
    "/scan",
    rateLimit("attest-scan", {
        limit: 10,
        windowMs: 60 * 1000, // 1 minute
        message: "Too many scan requests. Please try again later.",
    }),
);

// ─── Schemas ────────────────────────────────────────────

const ScanRequestSchema = z
    .object({
        repo: z
            .string()
            .regex(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/, "Must be in owner/repo format")
            .openapi({ example: "anthropicaeon/heysigil" }),
    })
    .openapi("ScanRequest");

const ScanSuccessResponseSchema = z
    .object({
        success: z.literal(true),
        attestationUid: z.string(),
        txHash: z.string(),
        projectId: z.string(),
        walletAddress: z.string(),
        alreadyAttested: z.boolean().optional(),
    })
    .openapi("ScanSuccessResponse");

const ScanErrorResponseSchema = z
    .object({
        error: z.string(),
        hint: z.string().optional(),
    })
    .openapi("ScanErrorResponse");

// ─── Helpers ────────────────────────────────────────────

const WALLET_RE = /^0x[0-9a-fA-F]{40}$/;

/**
 * Fetch the .sigil file from a GitHub repo's default branch.
 * Uses raw.githubusercontent.com/HEAD which resolves to the default branch.
 */
async function fetchSigilFile(owner: string, repo: string): Promise<string | null> {
    // Try common default branches in order: HEAD (auto-resolve), main, master
    const branches = ["HEAD", "main", "master"];

    for (const branch of branches) {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/.sigil`;
        try {
            const res = await fetch(url, {
                headers: { "User-Agent": "SigilBot/1.0" },
                signal: AbortSignal.timeout(10_000),
            });
            if (res.ok) {
                return await res.text();
            }
        } catch {
            // Network error or timeout — try next branch
        }
    }

    return null;
}

/**
 * Parse wallet address from .sigil file content.
 *
 * Supported formats:
 *   wallet: 0x1234...
 *   wallet:0x1234...
 *   0x1234...  (bare address on first line)
 */
function parseSigilFile(content: string): string | null {
    const lines = content.trim().split("\n");

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith("#")) continue;

        // "wallet: 0x..." or "wallet:0x..."
        const walletMatch = trimmed.match(/^wallet\s*:\s*(0x[0-9a-fA-F]{40})/i);
        if (walletMatch) return walletMatch[1];

        // Bare address
        if (WALLET_RE.test(trimmed)) return trimmed;
    }

    return null;
}

// ─── POST /scan ─────────────────────────────────────────

scan.post(
    "/scan",
    handler(async (c) => {
        let body: z.infer<typeof ScanRequestSchema>;
        try {
            body = ScanRequestSchema.parse(await c.req.json());
        } catch {
            return c.json({ error: 'Invalid request body. Expected { repo: "owner/repo" }' }, 400);
        }

        const [owner, repo] = body.repo.split("/");
        const projectId = `github:${owner}/${repo}`;

        log.info({ repo: body.repo, projectId }, "Scan: checking for .sigil file");

        // 1. Check if already attested
        const existingProject = await find.projectByProjectId(projectId);
        if (existingProject?.attestationUid && existingProject?.ownerWallet) {
            log.info({ projectId }, "Scan: already attested");
            return c.json({
                success: true as const,
                attestationUid: existingProject.attestationUid,
                txHash: "",
                projectId,
                walletAddress: existingProject.ownerWallet,
                alreadyAttested: true,
            });
        }

        // Also check without prefix (legacy format)
        const existingLegacy = await find.projectByProjectId(`${owner}/${repo}`);
        if (existingLegacy?.attestationUid && existingLegacy?.ownerWallet) {
            log.info({ projectId: `${owner}/${repo}` }, "Scan: already attested (legacy)");
            return c.json({
                success: true as const,
                attestationUid: existingLegacy.attestationUid,
                txHash: "",
                projectId: `${owner}/${repo}`,
                walletAddress: existingLegacy.ownerWallet,
                alreadyAttested: true,
            });
        }

        // 2. Fetch .sigil file from GitHub
        const content = await fetchSigilFile(owner, repo);
        if (!content) {
            return c.json(
                {
                    error: "No .sigil file found in repository",
                    hint: `Add a .sigil file to ${body.repo}: echo "wallet: 0xYOUR_ADDRESS" > .sigil && git add .sigil && git commit -m "add sigil" && git push`,
                },
                404,
            );
        }

        // 3. Parse wallet from file
        const walletAddress = parseSigilFile(content);
        if (!walletAddress) {
            return c.json(
                {
                    error: "Could not parse wallet address from .sigil file",
                    hint: "File should contain: wallet: 0xYOUR_ADDRESS",
                },
                400,
            );
        }

        if (!WALLET_RE.test(walletAddress)) {
            return c.json(
                {
                    error: `Invalid wallet address format: ${walletAddress}`,
                    hint: "Wallet address must be 0x followed by 40 hex characters",
                },
                400,
            );
        }

        log.info(
            { repo: body.repo, walletAddress },
            "Scan: .sigil file found, creating attestation",
        );

        try {
            const db = getDb();
            const chainRpcUrl = "https://mainnet.base.org";

            // 4. Create EAS attestation
            const attestation = await createAttestation(
                {
                    platform: "github",
                    projectId,
                    wallet: walletAddress,
                    verifiedAt: Math.floor(Date.now() / 1000),
                    isOwner: true,
                },
                chainRpcUrl,
            );

            // 5. Create verification record + update/create project in a transaction
            await db.transaction(async (tx) => {
                // Create a verification record for audit trail
                await tx.insert(schema.verifications).values({
                    method: "sigil_file",
                    projectId: `${owner}/${repo}`,
                    walletAddress,
                    challengeCode: `sigil-scan-${Date.now()}`,
                    status: "verified",
                    verifiedAt: new Date(),
                    attestationUid: attestation.uid,
                });

                // Find existing project (could be prefixed or unprefixed)
                const [existing] = await tx
                    .select()
                    .from(schema.projects)
                    .where(
                        or(
                            eq(schema.projects.projectId, projectId),
                            eq(schema.projects.projectId, `${owner}/${repo}`),
                        ),
                    )
                    .limit(1);

                if (existing) {
                    // Update existing project with attestation + owner
                    await tx
                        .update(schema.projects)
                        .set({
                            ownerWallet: walletAddress,
                            verificationMethod: "sigil_file",
                            attestationUid: attestation.uid,
                            verifiedAt: new Date(),
                        })
                        .where(eq(schema.projects.id, existing.id));
                } else {
                    // Create new project record
                    await tx.insert(schema.projects).values({
                        projectId,
                        ownerWallet: walletAddress,
                        verificationMethod: "sigil_file",
                        attestationUid: attestation.uid,
                        verifiedAt: new Date(),
                    });
                }
            });

            // 6. Trigger assignDev if project has a poolId (async, best-effort)
            tryAssignDev(projectId, `${owner}/${repo}`, walletAddress).catch((err) => {
                log.warn(
                    { err: getErrorMessage(err), projectId },
                    "Scan: assignDev failed (non-blocking)",
                );
            });

            log.info(
                { projectId, walletAddress, attestationUid: attestation.uid },
                "Scan: attestation created successfully",
            );

            return c.json({
                success: true as const,
                attestationUid: attestation.uid,
                txHash: attestation.txHash,
                projectId,
                walletAddress,
            });
        } catch (err) {
            log.error({ err: getErrorMessage(err), repo: body.repo }, "Scan: attestation failed");
            return c.json({ error: getErrorMessage(err, "Failed to create attestation") }, 500);
        }
    }),
);

// ─── assignDev Helper ───────────────────────────────────

/**
 * After a successful scan, try to call assignDev() on the FeeVault
 * to move escrowed fees to the dev's claimable balance.
 */
async function tryAssignDev(
    prefixedId: string,
    unprefixedId: string,
    walletAddress: string,
): Promise<void> {
    const db = getDb();

    // Find the project with a poolId
    const [project] = await db
        .select({ poolId: schema.projects.poolId })
        .from(schema.projects)
        .where(
            or(
                eq(schema.projects.projectId, prefixedId),
                eq(schema.projects.projectId, unprefixedId),
            ),
        )
        .limit(1);

    if (!project?.poolId) {
        log.info({ prefixedId }, "Scan: no poolId found, skipping assignDev");
        return;
    }

    // Dynamically import ethers and use the deployer wallet
    const { getEnv } = await import("../../config/env.js");
    const env = getEnv();

    if (!env.DEPLOYER_PRIVATE_KEY || !env.SIGIL_FEE_VAULT_ADDRESS) {
        log.warn(
            "Scan: cannot assignDev — DEPLOYER_PRIVATE_KEY or SIGIL_FEE_VAULT_ADDRESS not set",
        );
        return;
    }

    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL || "https://mainnet.base.org");
    const wallet = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, provider);
    const vault = new ethers.Contract(
        env.SIGIL_FEE_VAULT_ADDRESS,
        ["function assignDev(bytes32 poolId, address dev) external"],
        wallet,
    );

    try {
        const tx = await vault.assignDev(project.poolId, walletAddress);
        await tx.wait(1);
        log.info(
            { poolId: project.poolId.slice(0, 18) + "...", dev: walletAddress },
            "Scan: assignDev succeeded",
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("PoolAlreadyAssigned") || msg.includes("NoUnclaimedFees")) {
            log.info({ prefixedId }, "Scan: pool already assigned or no unclaimed fees");
        } else {
            throw err;
        }
    }
}

export { scan };
