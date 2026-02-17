/**
 * Action Router
 *
 * Thin orchestration layer that routes parsed actions to domain-specific handlers.
 * Uses composable security pipeline before execution.
 */

import type { ParsedAction, ActionResult } from "./types.js";
import { formatScreenMessage } from "../services/sentinel.js";
import { createWallet, hasWallet } from "../services/wallet.js";
import { getDefaultPipeline } from "./security/index.js";

// Import domain-specific handlers
import {
    type ActionHandler,
    // Trading
    swapHandler,
    bridgeHandler,
    priceHandler,
    // Wallet
    balanceHandler,
    depositHandler,
    exportKeyHandler,
    sendHandler,
    historyHandler,
    // Launch
    launchTokenHandler,
    // Verify
    verifyProjectHandler,
    claimRewardHandler,
    poolStatusHandler,
    // General
    helpHandler,
    unknownHandler,
} from "./handlers/index.js";

/**
 * Handler registry - maps intent names to handler functions.
 */
const handlers: Record<string, ActionHandler> = {
    // Trading
    swap: swapHandler,
    bridge: bridgeHandler,
    price: priceHandler,

    // Wallet
    balance: balanceHandler,
    deposit: depositHandler,
    export_key: exportKeyHandler,
    send: sendHandler,
    history: historyHandler,

    // Token Launch
    launch_token: launchTokenHandler,

    // Verification
    verify_project: verifyProjectHandler,
    claim_reward: claimRewardHandler,
    pool_status: poolStatusHandler,

    // General
    help: helpHandler,
    unknown: unknownHandler,
};

/**
 * Route a parsed action to the appropriate handler and execute it.
 * All actions pass through the security pipeline first.
 */
export async function executeAction(
    action: ParsedAction,
    userMessage?: string,
    sessionId?: string,
): Promise<ActionResult> {
    // ── Security Pipeline ─────────────────────────────────
    const pipeline = getDefaultPipeline();
    const securityResult = await pipeline.run(action, {
        userMessage,
        sessionId,
    });

    if (!securityResult.pass) {
        const screenResult = {
            allowed: false,
            risk: "blocked" as const,
            reasons: securityResult.details,
        };
        return {
            success: false,
            message: formatScreenMessage(screenResult),
            data: {
                blocked: true,
                reason: securityResult.failedCheck,
                details: securityResult.details,
            },
        };
    }

    // Handle warnings by prepending to result message
    const hasWarnings = securityResult.warnings.length > 0;
    let warningMessage = "";
    if (hasWarnings) {
        const screenResult = {
            allowed: true,
            risk: "warning" as const,
            reasons: securityResult.warnings,
        };
        warningMessage = formatScreenMessage(screenResult);
    }

    // ── Auto-create wallet for session if needed ───────────
    if (sessionId && !(await hasWallet(sessionId))) {
        await createWallet(sessionId);
    }

    // ── Execute the action ─────────────────────────────────
    const handler = handlers[action.intent] || handlers.unknown;
    const result = await handler(action.params, sessionId);

    // Prepend warning to result message
    if (warningMessage) {
        result.message = warningMessage + "\n\n" + result.message;
    }

    return result;
}
