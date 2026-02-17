/**
 * OAuth Callback Helper
 *
 * Shared logic for OAuth verification callbacks (GitHub, Facebook, Instagram).
 */

import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/client.js";
import { getEnv } from "../../config/env.js";
import type { VerificationMethod, VerificationResult } from "../../verification/types.js";

export interface OAuthCallbackConfig {
    /** Platform name for redirect URL (github, facebook, instagram) */
    platform: string;
    /** Verification method for phantom identity claim */
    method: VerificationMethod;
    /** Platform-specific verification function */
    verifyFn: (code: string, projectId: string) => Promise<VerificationResult>;
    /** Function to claim phantom identity after verification */
    claimPhantomFn: (
        method: VerificationMethod,
        projectId: string,
        walletAddress: string,
    ) => Promise<void>;
}

/**
 * Handle OAuth callback with common logic.
 * Returns redirect Response for success/failure.
 */
export async function handleOAuthCallback(
    c: Context,
    code: string | undefined,
    state: string | undefined,
    config: OAuthCallbackConfig,
): Promise<Response> {
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

    const result = await config.verifyFn(code, record.projectId);

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

        await config.claimPhantomFn(config.method, record.projectId, record.walletAddress);

        return c.redirect(
            `${env.FRONTEND_URL}/verify?status=success&id=${state}&platform=${config.platform}`,
        );
    }

    await db
        .update(schema.verifications)
        .set({ status: "failed", proof: { error: result.error } })
        .where(eq(schema.verifications.id, state));

    return c.redirect(
        `${env.FRONTEND_URL}/verify?status=failed&error=${encodeURIComponent(result.error || "Unknown")}`,
    );
}
