/**
 * Token Colors
 *
 * Visual color mapping for token symbols.
 */

export const TOKEN_COLORS: Record<string, string> = {
    ETH: "#627EEA",
    USDC: "#2775CA",
    WETH: "#EC627A",
    DAI: "#F4B731",
    DEGEN: "#A36EFD",
    AERO: "#0052FF",
    BRETT: "#46C6B1",
    TOSHI: "#4E8EE9",
    cbBTC: "#F7931A",
};

/** Default color for unknown tokens */
export const DEFAULT_TOKEN_COLOR = "#86868b";

/**
 * Get the color for a token symbol.
 */
export function getTokenColor(symbol: string): string {
    return TOKEN_COLORS[symbol] || DEFAULT_TOKEN_COLOR;
}
