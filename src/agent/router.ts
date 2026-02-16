/**
 * Action Router
 *
 * Thin orchestration layer that routes parsed actions to domain-specific handlers.
 * Handles Sentinel security screening before execution.
 */

import type { ParsedAction, ActionResult } from "./types.js";
import {
    screenAction,
    screenPrompt,
    formatScreenMessage,
} from "../services/sentinel.js";
import { createWallet, hasWallet } from "../services/wallet.js";

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
 * All actions pass through Sentinel security screening first.
 */
export async function executeAction(
    action: ParsedAction,
    userMessage?: string,
    sessionId?: string,
): Promise<ActionResult> {
    // ── Sentinel: Screen before execution ──────────────────

    // 1. Prompt injection check (if we have the original message)
    if (userMessage) {
        const promptCheck = screenPrompt(userMessage);
        if (!promptCheck.allowed) {
            return {
                success: false,
                message: formatScreenMessage(promptCheck),
                data: { blocked: true, reason: "prompt_injection", details: promptCheck.reasons },
            };
        }
    }

    // 2. Full action screening (addresses + tokens)
    const addresses: string[] = [];
    const params = action.params;

    // Collect any addresses from params
    for (const [key, val] of Object.entries(params)) {
        if (
            typeof val === "string" &&
            /^0x[0-9a-fA-F]{40}$/.test(val) &&
            ["to", "from", "address", "wallet", "devAddress", "recipient", "tokenAddress"].includes(key)
        ) {
            addresses.push(val);
        }
    }

    if (addresses.length > 0 || (params.tokenAddress && typeof params.tokenAddress === "string")) {
        const screenResult = await screenAction({
            userMessage: userMessage || "",
            intent: action.intent,
            addresses,
            tokenAddress: params.tokenAddress as string | undefined,
            chain: (params.chain as string) || "base",
        });

        if (!screenResult.allowed) {
            return {
                success: false,
                message: formatScreenMessage(screenResult),
                data: { blocked: true, reason: "sentinel_screen", details: screenResult.reasons },
            };
        }

        // Attach warning to result if there are warnings
        if (screenResult.risk === "warning") {
            const handler = handlers[action.intent] || handlers.unknown;
            const result = await handler(action.params, sessionId);
            result.message = formatScreenMessage(screenResult) + "\n\n" + result.message;
            return result;
        }
    }

    // ── Auto-create wallet for session if needed ───────────
    if (sessionId && !hasWallet(sessionId)) {
        createWallet(sessionId);
    }

    // ── Execute the action ─────────────────────────────────
    const handler = handlers[action.intent] || handlers.unknown;
    return handler(action.params, sessionId);
}
