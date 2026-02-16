/**
 * Sentinel — Security screening layer for Sigil.
 *
 * Three layers of protection:
 * 1. GoPlus API — Token safety screening (honeypots, scams, malicious contracts)
 * 2. Prompt injection guard — Detect & block AI manipulation attempts
 * 3. Address blocklist — Known scam/phishing addresses
 *
 * Every action passes through Sentinel before execution.
 */

// ─── Types ──────────────────────────────────────────────

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

// ─── 1. GoPlus Token Screening ──────────────────────────

const GOPLUS_BASE_URL = "https://api.gopluslabs.io/api/v1";

// Chain IDs that GoPlus understands
const CHAIN_IDS: Record<string, string> = {
    base: "8453",
    ethereum: "1",
    polygon: "137",
    bsc: "56",
    arbitrum: "42161",
    optimism: "10",
};

/**
 * Screen a token contract using GoPlus Security API.
 * Free, no API key required. Checks for honeypots, scams, tax issues, etc.
 */
export async function screenToken(
    tokenAddress: string,
    chain: string = "base",
): Promise<TokenSafety> {
    const chainId = CHAIN_IDS[chain.toLowerCase()] || CHAIN_IDS.base;
    const addr = tokenAddress.toLowerCase();

    try {
        const response = await fetch(
            `${GOPLUS_BASE_URL}/token_security/${chainId}?contract_addresses=${addr}`,
        );

        if (!response.ok) {
            // GoPlus API failure — don't block, just warn
            return {
                isHoneypot: false,
                isMalicious: false,
                hasProxyContract: false,
                canTakeOwnership: false,
                hiddenOwner: false,
                selfDestruct: false,
                externalCall: false,
                buyTax: 0,
                sellTax: 0,
                holderCount: 0,
                lpLocked: false,
                riskLevel: "warning",
                reasons: ["GoPlus API unavailable — proceed with caution"],
            };
        }

        const data = await response.json();
        const tokenData = data?.result?.[addr];

        if (!tokenData) {
            return {
                isHoneypot: false,
                isMalicious: false,
                hasProxyContract: false,
                canTakeOwnership: false,
                hiddenOwner: false,
                selfDestruct: false,
                externalCall: false,
                buyTax: 0,
                sellTax: 0,
                holderCount: 0,
                lpLocked: false,
                riskLevel: "warning",
                reasons: ["Token not found in GoPlus database — newly deployed or unverified"],
            };
        }

        const isHoneypot = tokenData.is_honeypot === "1";
        const isMalicious = tokenData.is_blacklisted === "1" || tokenData.is_airdrop_scam === "1";
        const hasProxyContract = tokenData.is_proxy === "1";
        const canTakeOwnership = tokenData.can_take_back_ownership === "1";
        const hiddenOwner = tokenData.hidden_owner === "1";
        const selfDestruct = tokenData.selfdestruct === "1";
        const externalCall = tokenData.external_call === "1";
        const buyTax = parseFloat(tokenData.buy_tax || "0") * 100;
        const sellTax = parseFloat(tokenData.sell_tax || "0") * 100;
        const holderCount = parseInt(tokenData.holder_count || "0", 10);
        const lpLocked = tokenData.lp_holders?.some(
            (lp: { is_locked: number }) => lp.is_locked === 1,
        ) ?? false;

        // Build reasons
        const reasons: string[] = [];

        if (isHoneypot) reasons.push("🚨 HONEYPOT — cannot sell this token");
        if (isMalicious) reasons.push("🚨 Token flagged as malicious/scam");
        if (canTakeOwnership) reasons.push("⚠️ Owner can reclaim ownership");
        if (hiddenOwner) reasons.push("⚠️ Hidden owner detected");
        if (selfDestruct) reasons.push("⚠️ Contract has selfdestruct");
        if (externalCall) reasons.push("⚠️ Contract makes external calls");
        if (buyTax > 10) reasons.push(`⚠️ High buy tax: ${buyTax.toFixed(1)}%`);
        if (sellTax > 10) reasons.push(`⚠️ High sell tax: ${sellTax.toFixed(1)}%`);
        if (holderCount < 10) reasons.push("⚠️ Very few holders — high rug risk");
        if (hasProxyContract) reasons.push("ℹ️ Proxy contract — logic can be changed");

        // Determine risk level
        let riskLevel: "safe" | "warning" | "danger" = "safe";
        if (isHoneypot || isMalicious || canTakeOwnership) {
            riskLevel = "danger";
        } else if (
            hiddenOwner || selfDestruct || buyTax > 10 || sellTax > 10 || holderCount < 10
        ) {
            riskLevel = "warning";
        }

        if (reasons.length === 0) reasons.push("✅ No issues detected");

        return {
            isHoneypot,
            isMalicious,
            hasProxyContract,
            canTakeOwnership,
            hiddenOwner,
            selfDestruct,
            externalCall,
            buyTax,
            sellTax,
            holderCount,
            lpLocked,
            riskLevel,
            reasons,
        };
    } catch (err) {
        return {
            isHoneypot: false,
            isMalicious: false,
            hasProxyContract: false,
            canTakeOwnership: false,
            hiddenOwner: false,
            selfDestruct: false,
            externalCall: false,
            buyTax: 0,
            sellTax: 0,
            holderCount: 0,
            lpLocked: false,
            riskLevel: "warning",
            reasons: [`GoPlus check failed: ${err instanceof Error ? err.message : "unknown error"}`],
        };
    }
}

// ─── 2. Prompt Injection Guard ──────────────────────────

/**
 * Patterns that indicate prompt injection / jailbreak attempts.
 * These try to override the AI's behavior or extract internal instructions.
 */
const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
    // Direct instruction override
    { pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|prompts?)/i, label: "instruction override" },
    { pattern: /forget\s+(everything|all|your)\s+(you|instructions?|rules?)/i, label: "memory wipe" },
    { pattern: /you\s+are\s+now\s+/i, label: "persona hijack" },
    { pattern: /act\s+as\s+(if|though)\s+you\s+(are|were)\s+/i, label: "persona override" },
    { pattern: /pretend\s+(you('re|\s+are)\s+|to\s+be\s+)/i, label: "persona pretend" },
    { pattern: /new\s+(system\s+)?instructions?:/i, label: "system prompt injection" },
    { pattern: /\bsystem\s*:\s*/i, label: "system role injection" },

    // Extraction attempts
    { pattern: /what\s+(are|is)\s+your\s+(system|initial|original)\s+(prompt|instructions?|rules?)/i, label: "prompt extraction" },
    { pattern: /reveal\s+your\s+(prompt|instructions?|rules?|system)/i, label: "prompt extraction" },
    { pattern: /show\s+me\s+your\s+(prompt|instructions?|config)/i, label: "prompt extraction" },
    { pattern: /repeat\s+(the|your)\s+(system|above|initial)\s+(prompt|message|instructions?)/i, label: "prompt extraction" },

    // Fund diversion
    { pattern: /send\s+(all|everything|my\s+entire)\s+(balance|funds|tokens?|eth|crypto)/i, label: "fund drain attempt" },
    { pattern: /transfer\s+(all|everything)\s+to\s+/i, label: "fund drain attempt" },
    { pattern: /send\s+all\s+my\s+/i, label: "fund drain attempt" },
    { pattern: /drain/i, label: "drain keyword" },

    // Encoded payloads
    { pattern: /eval\s*\(/i, label: "code injection" },
    { pattern: /<script/i, label: "XSS attempt" },
    { pattern: /\{\{.*\}\}/i, label: "template injection" },
];

/**
 * Screen user input for prompt injection attempts.
 */
export function screenPrompt(userMessage: string): ScreenResult {
    const reasons: string[] = [];

    for (const { pattern, label } of INJECTION_PATTERNS) {
        if (pattern.test(userMessage)) {
            reasons.push(label);
        }
    }

    if (reasons.length === 0) {
        return { allowed: true, risk: "safe", reasons: [] };
    }

    // Single match on something minor = warning, multiple or critical = blocked
    const isCritical = reasons.some((r) =>
        ["instruction override", "memory wipe", "persona hijack", "system prompt injection", "system role injection", "fund drain attempt", "code injection", "XSS attempt"].includes(r),
    );

    return {
        allowed: !isCritical,
        risk: isCritical ? "blocked" : "warning",
        reasons: reasons.map((r) => `Prompt injection detected: ${r}`),
    };
}

// ─── 3. Address Blocklist ───────────────────────────────

/**
 * Known scam, phishing, and exploit addresses.
 * Sources: Etherscan labels, community reports, past exploits.
 * All lowercase for comparison.
 */
const BLOCKED_ADDRESSES = new Set([
    // Known phishing contracts (examples — extend as needed)
    "0x0000000000000000000000000000000000000000", // Zero address
    "0x000000000000000000000000000000000000dead", // Dead address (not necessarily scam but flag)

    // Known Base scam deployers (add real ones as you encounter them)
    // "0x...",
]);

/**
 * High-risk patterns in addresses (not exact matches, but suspicious patterns).
 */
const SUSPICIOUS_ADDRESS_PATTERNS = [
    /^0x0{30,}/i, // Too many leading zeros (vanity scam)
    /^0xdead/i,   // Dead address prefix
];

/**
 * Screen an address against the blocklist.
 */
export function screenAddress(address: string): ScreenResult {
    const addr = address.toLowerCase().trim();
    const reasons: string[] = [];

    // Exact blocklist match
    if (BLOCKED_ADDRESSES.has(addr)) {
        reasons.push(`Address ${addr.slice(0, 10)}... is on the blocklist`);
    }

    // Suspicious patterns
    for (const pattern of SUSPICIOUS_ADDRESS_PATTERNS) {
        if (pattern.test(addr)) {
            reasons.push(`Address matches suspicious pattern`);
            break;
        }
    }

    // Basic format validation
    if (!/^0x[0-9a-f]{40}$/i.test(address)) {
        reasons.push("Invalid Ethereum address format");
    }

    if (reasons.length === 0) {
        return { allowed: true, risk: "safe", reasons: [] };
    }

    return {
        allowed: reasons.some((r) => r.includes("blocklist")) ? false : true,
        risk: reasons.some((r) => r.includes("blocklist")) ? "blocked" : "warning",
        reasons,
    };
}

/**
 * Add an address to the blocklist at runtime.
 */
export function blockAddress(address: string): void {
    BLOCKED_ADDRESSES.add(address.toLowerCase().trim());
}

// ─── Composite Screening ────────────────────────────────

export interface ActionScreenParams {
    userMessage: string;
    intent: string;
    addresses?: string[];     // Any addresses involved (to, from, token contracts)
    tokenAddress?: string;    // Token contract to screen
    chain?: string;
}

/**
 * Run all security checks for an action.
 * This is the main entry point — call this before executing any agent action.
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
