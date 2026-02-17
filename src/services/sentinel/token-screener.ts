/**
 * Token Screener
 *
 * Token safety screening using GoPlus Security API.
 * Free, no API key required. Checks for honeypots, scams, tax issues, etc.
 */

import type { TokenSafety } from "./types.js";
import { getErrorMessage } from "../../utils/errors.js";

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
 * Create a default TokenSafety result for error/fallback cases.
 */
function createFallbackSafety(reasons: string[]): TokenSafety {
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
        reasons,
    };
}

/**
 * Screen a token contract using GoPlus Security API.
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
            return createFallbackSafety(["GoPlus API unavailable — proceed with caution"]);
        }

        const data = await response.json();
        const tokenData = data?.result?.[addr];

        if (!tokenData) {
            return createFallbackSafety([
                "Token not found in GoPlus database — newly deployed or unverified",
            ]);
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
        const lpLocked =
            tokenData.lp_holders?.some((lp: { is_locked: number }) => lp.is_locked === 1) ?? false;

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
        } else if (hiddenOwner || selfDestruct || buyTax > 10 || sellTax > 10 || holderCount < 10) {
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
        return createFallbackSafety([
            `GoPlus check failed: ${getErrorMessage(err, "unknown error")}`,
        ]);
    }
}
