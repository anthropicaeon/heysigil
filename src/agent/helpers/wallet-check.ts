/**
 * Wallet Check Helper
 *
 * Common pattern for checking wallet existence before operations.
 */

import type { ActionResult } from "../types.js";
import { hasWallet } from "../../services/wallet.js";

export interface WalletCheckOptions {
    /** Action description for error message (e.g., "swap tokens") */
    action?: string;
    /** Custom prompt for wallet creation */
    createPrompt?: string;
}

export type WalletCheckResult =
    | { ok: true; sessionId: string }
    | { ok: false; result: ActionResult };

/**
 * Check if user has a wallet, returning early-return result if not.
 * On success, returns the verified sessionId for type narrowing.
 *
 * @example
 * const check = await requireWallet(sessionId, { action: "swap tokens" });
 * if (!check.ok) return check.result;
 * // check.sessionId is now guaranteed to be defined
 */
export async function requireWallet(
    sessionId: string | undefined,
    options: WalletCheckOptions = {},
): Promise<WalletCheckResult> {
    if (!sessionId || !(await hasWallet(sessionId))) {
        const action = options.action || "do this";
        const prompt =
            options.createPrompt ||
            'Say **"show my wallet"** to create one and get your deposit address.';

        return {
            ok: false,
            result: {
                success: false,
                message: `To ${action}, you need a wallet first.\n\n${prompt}`,
                data: { status: "no_wallet" },
            },
        };
    }
    return { ok: true, sessionId };
}
