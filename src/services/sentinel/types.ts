/**
 * Sentinel Types
 *
 * Shared type definitions for security screening components.
 */

export interface ScreenResult {
    allowed: boolean;
    risk: "safe" | "warning" | "blocked";
    reasons: string[];
}

export interface TokenSafety {
    isHoneypot: boolean;
    isMalicious: boolean;
    hasProxyContract: boolean;
    canTakeOwnership: boolean;
    hiddenOwner: boolean;
    selfDestruct: boolean;
    externalCall: boolean;
    buyTax: number;
    sellTax: number;
    holderCount: number;
    lpLocked: boolean;
    riskLevel: "safe" | "warning" | "danger";
    reasons: string[];
}

export interface ActionScreenParams {
    userMessage: string;
    intent: string;
    addresses?: string[]; // Any addresses involved (to, from, token contracts)
    tokenAddress?: string; // Token contract to screen
    chain?: string;
}
