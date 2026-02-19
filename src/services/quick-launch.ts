import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getEnv } from "../config/env.js";
import { getDb, schema } from "../db/client.js";

const CLAIM_TOKEN_PREFIX_BASE = "sigil_claim";

export class QuickLaunchIpLimitError extends Error {
    constructor() {
        super("Quick launch limit reached for this IP");
        this.name = "QuickLaunchIpLimitError";
    }
}

export class LaunchClaimTokenError extends Error {
    readonly code: "invalid" | "expired" | "consumed" | "claimed";

    constructor(code: "invalid" | "expired" | "consumed" | "claimed", message: string) {
        super(message);
        this.name = "LaunchClaimTokenError";
        this.code = code;
    }
}

function hashValue(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

function hashIp(ip: string): string {
    const salt = getEnv().QUICK_LAUNCH_IP_SALT;
    return hashValue(`${salt}:${ip}`);
}

function parseClaimTokenPrefix(token: string): string | null {
    const parts = token.split("_");
    if (parts.length < 4) return null;
    if (parts[0] !== "sigil" || parts[1] !== "claim") return null;
    return `${parts[0]}_${parts[1]}_${parts[2]}`;
}

function constantTimeHashEquals(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
}

function buildClaimToken(): { tokenPrefix: string; token: string } {
    const tokenId = randomBytes(8).toString("hex");
    const secret = randomBytes(24).toString("base64url");
    const tokenPrefix = `${CLAIM_TOKEN_PREFIX_BASE}_${tokenId}`;
    return {
        tokenPrefix,
        token: `${tokenPrefix}_${secret}`,
    };
}

function isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" && code === "23505";
}

export async function enforceQuickLaunchIpGuardrail(ip: string, projectId?: string): Promise<void> {
    const db = getDb();
    const ipHash = hashIp(ip);

    try {
        await db.insert(schema.quickLaunchIpGuardrails).values({
            ipHash,
            lastProjectId: projectId ?? "pending",
            launchCount: 1,
        });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            throw new QuickLaunchIpLimitError();
        }
        throw error;
    }
}

export async function annotateQuickLaunchIpProject(ip: string, projectId: string): Promise<void> {
    const db = getDb();
    const ipHash = hashIp(ip);
    await db
        .update(schema.quickLaunchIpGuardrails)
        .set({ lastProjectId: projectId })
        .where(eq(schema.quickLaunchIpGuardrails.ipHash, ipHash));
}

export async function releaseQuickLaunchIpGuardrail(ip: string): Promise<void> {
    const db = getDb();
    const ipHash = hashIp(ip);
    await db
        .delete(schema.quickLaunchIpGuardrails)
        .where(eq(schema.quickLaunchIpGuardrails.ipHash, ipHash));
}

export async function createLaunchClaimToken(input: {
    projectId: string;
    projectRefId: string;
    ip: string;
}): Promise<{ token: string; expiresAt: Date; tokenPrefix: string }> {
    const db = getDb();
    const { tokenPrefix, token } = buildClaimToken();
    const tokenHash = hashValue(token);
    const createdIpHash = hashIp(input.ip);
    const expiresAt = new Date(
        Date.now() + getEnv().QUICK_LAUNCH_CLAIM_TOKEN_TTL_MINUTES * 60 * 1000,
    );

    await db.insert(schema.launchClaimTokens).values({
        projectId: input.projectId,
        projectRefId: input.projectRefId,
        tokenPrefix,
        tokenHash,
        createdIpHash,
        expiresAt,
    });

    return {
        token,
        tokenPrefix,
        expiresAt,
    };
}

export async function consumeLaunchClaimToken(input: {
    token: string;
    claimedByUserId: string;
    ip: string;
    ownerWallet: string;
    userId?: string | null;
}): Promise<{
    projectId: string;
    projectRefId: string;
    poolId: string | null;
    poolTokenAddress: string | null;
}> {
    const db = getDb();
    const tokenPrefix = parseClaimTokenPrefix(input.token);
    if (!tokenPrefix) {
        throw new LaunchClaimTokenError("invalid", "Invalid claim token format");
    }

    return db.transaction(async (tx) => {
        const [stored] = await tx
            .select()
            .from(schema.launchClaimTokens)
            .where(eq(schema.launchClaimTokens.tokenPrefix, tokenPrefix))
            .limit(1);

        if (!stored) {
            throw new LaunchClaimTokenError("invalid", "Claim token not found");
        }
        if (stored.consumedAt) {
            throw new LaunchClaimTokenError("consumed", "Claim token already used");
        }
        if (stored.expiresAt.getTime() <= Date.now()) {
            throw new LaunchClaimTokenError("expired", "Claim token expired");
        }

        const presentedHash = hashValue(input.token);
        if (!constantTimeHashEquals(presentedHash, stored.tokenHash)) {
            throw new LaunchClaimTokenError("invalid", "Claim token is invalid");
        }

        const consumedIpHash = hashIp(input.ip);
        const [consumed] = await tx
            .update(schema.launchClaimTokens)
            .set({
                consumedAt: new Date(),
                consumedByUserId: input.claimedByUserId,
                consumedIpHash,
            })
            .where(
                and(
                    eq(schema.launchClaimTokens.id, stored.id),
                    isNull(schema.launchClaimTokens.consumedAt),
                    sql`${schema.launchClaimTokens.expiresAt} > now()`,
                ),
            )
            .returning({
                projectId: schema.launchClaimTokens.projectId,
                projectRefId: schema.launchClaimTokens.projectRefId,
            });

        if (!consumed) {
            throw new LaunchClaimTokenError("consumed", "Claim token already consumed");
        }

        const [project] = await tx
            .update(schema.projects)
            .set({
                ownerWallet: input.ownerWallet,
                userId: input.userId ?? null,
                verifiedAt: new Date(),
            })
            .where(
                and(
                    eq(schema.projects.id, consumed.projectRefId),
                    isNull(schema.projects.ownerWallet),
                ),
            )
            .returning({
                projectId: schema.projects.projectId,
                id: schema.projects.id,
                poolId: schema.projects.poolId,
                poolTokenAddress: schema.projects.poolTokenAddress,
            });

        if (!project) {
            throw new LaunchClaimTokenError("claimed", "Project is already claimed");
        }

        return {
            projectId: project.projectId,
            projectRefId: project.id,
            poolId: project.poolId,
            poolTokenAddress: project.poolTokenAddress,
        };
    });
}
