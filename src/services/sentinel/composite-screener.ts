/**
 * Composite Screener
 *
 * Orchestrates all security checks for an action.
 * This is the main entry point — call this before executing any agent action.
 */

import type { ScreenResult, ActionScreenParams } from "./types.js";
import { screenToken } from "./token-screener.js";
import { screenPrompt } from "./prompt-injection-detector.js";
import { screenAddress } from "./address-blocklist.js";

/**
 * Run all security checks for an action.
 */
export async function screenAction(params: ActionScreenParams): Promise<ScreenResult> {
    const allReasons: string[] = [];
    let worstRisk: "safe" | "warning" | "blocked" = "safe";

    // 1. Prompt injection check
    const promptResult = screenPrompt(params.userMessage);
    if (promptResult.risk !== "safe") {
        allReasons.push(...promptResult.reasons);
        if (promptResult.risk === "blocked") worstRisk = "blocked";
        else if (worstRisk === "safe") worstRisk = "warning";
    }

    // 2. Address blocklist check
    if (params.addresses) {
        for (const addr of params.addresses) {
            const addrResult = screenAddress(addr);
            if (addrResult.risk !== "safe") {
                allReasons.push(...addrResult.reasons);
                if (addrResult.risk === "blocked") worstRisk = "blocked";
                else if (worstRisk === "safe") worstRisk = "warning";
            }
        }
    }

    // 3. Token screening (only for swap/trade actions with a token address)
    if (params.tokenAddress && ["swap", "bridge", "send"].includes(params.intent)) {
        const tokenResult = await screenToken(params.tokenAddress, params.chain);
        if (tokenResult.riskLevel === "danger") {
            allReasons.push(...tokenResult.reasons);
            worstRisk = "blocked";
        } else if (tokenResult.riskLevel === "warning") {
            allReasons.push(...tokenResult.reasons);
            if (worstRisk === "safe") worstRisk = "warning";
        }
    }

    return {
        allowed: worstRisk !== "blocked",
        risk: worstRisk,
        reasons: allReasons,
    };
}

/**
 * Format a screen result into a user-friendly message.
 */
export function formatScreenMessage(result: ScreenResult): string {
    if (result.risk === "safe") return "";

    if (result.risk === "blocked") {
        return [
            "🛡️ **Sentinel: Action Blocked**",
            "",
            ...result.reasons.map((r) => `• ${r}`),
            "",
            "This action was blocked for your protection. If you believe this is an error, try rephrasing your request.",
        ].join("\n");
    }

    // Warning
    return [
        "⚠️ **Sentinel Warning**",
        "",
        ...result.reasons.map((r) => `• ${r}`),
        "",
        "Proceeding with caution. Review the details above before confirming.",
    ].join("\n");
}
