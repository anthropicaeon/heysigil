/**
 * Reply Formatter
 *
 * Formats token launch results into tweet-length replies.
 * Keeps replies under 280 chars by truncating addresses.
 */

// ─── Types ──────────────────────────────────────────────

export interface LaunchResult {
    success: boolean;
    tokenName: string;
    tokenSymbol: string;
    tokenAddress?: string;
    poolId?: string;
    txHash?: string;
    explorerUrl?: string;
    dexUrl?: string;
    devLinks?: Array<{ platform: string; projectId: string; displayUrl: string }>;
    error?: string;
    status: "deployed" | "already_launched" | "registered" | "preview_only" | "failed";
}

// ─── Formatters ─────────────────────────────────────────

const MAIN_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://heysigil.fund";

/**
 * Format a successful launch result into a tweet reply.
 */
export function formatLaunchReply(result: LaunchResult, authorHandle: string): string {
    if (!result.success || result.status === "failed") {
        return formatErrorReply(result.error || "Unknown error", authorHandle);
    }

    if (result.status === "already_launched") {
        return [
            `@${authorHandle} $${result.tokenSymbol} already exists!`,
            "",
            `📊 ${MAIN_APP_URL}/token/${result.tokenAddress || ""}`,
            result.dexUrl ? `🔗 ${result.dexUrl}` : "",
        ]
            .filter(Boolean)
            .join("\n");
    }

    if (result.status === "preview_only" || result.status === "registered") {
        return [
            `@${authorHandle} 📋 $${result.tokenSymbol} registered!`,
            "",
            "Deployer not configured — token will launch when the backend is ready.",
        ].join("\n");
    }

    // ── Deployed ────────────────────────────────────────
    const fullAddr = result.tokenAddress || "";
    const devLine = formatDevLine(result.devLinks);

    const lines = [
        `@${authorHandle} 🚀 $${result.tokenSymbol} launched on Base!`,
        "",
        `📊 ${MAIN_APP_URL}/token/${fullAddr}`,
    ];

    if (result.dexUrl) {
        lines.push(`📈 ${result.dexUrl}`);
    }

    if (result.explorerUrl) {
        lines.push(`🔗 ${result.explorerUrl}`);
    }

    if (devLine) {
        lines.push("", devLine);
    }

    lines.push("", `Claim fees → ${MAIN_APP_URL}/developers`);

    return lines.join("\n");
}

/**
 * Format an error reply.
 */
export function formatErrorReply(error: string, authorHandle: string): string {
    const shortError = error.length > 120 ? error.slice(0, 117) + "..." : error;
    return `@${authorHandle} ❌ Launch failed: ${shortError}\n\nTry again or visit ${MAIN_APP_URL}/developers`;
}

/**
 * Format a "needs more info" reply when the tweet is missing details.
 */
export function formatNeedsInfoReply(authorHandle: string, missing: string[]): string {
    const missingList = missing.join(", ");
    return [
        `@${authorHandle} I need a bit more to launch:`,
        `Missing: ${missingList}`,
        "",
        `Example: @HeySigil launch $COOL for github.com/you/your-repo`,
    ].join("\n");
}

/**
 * Format a dry-run preview reply.
 */
export function formatDryRunReply(
    authorHandle: string,
    tokenName: string | null,
    tokenSymbol: string | null,
    devLinks: Array<{ platform: string; projectId: string }>,
): string {
    const symbol = tokenSymbol ? `$${tokenSymbol}` : "token";
    const name = tokenName || symbol;
    const links = devLinks.map((l) => `• ${l.platform}: ${l.projectId}`).join("\n");

    return [
        `@${authorHandle} 🧪 Dry run — would launch ${name} (${symbol})`,
        "",
        links || "No dev links detected",
        "",
        "[DRY_RUN mode — no on-chain deployment]",
    ].join("\n");
}

// ─── Helpers ────────────────────────────────────────────

function truncateAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDevLine(
    devLinks?: Array<{ platform: string; projectId: string; displayUrl: string }>,
): string {
    if (!devLinks || devLinks.length === 0) return "";
    const primary = devLinks[0];
    return `Dev fees → ${primary.displayUrl}`;
}
