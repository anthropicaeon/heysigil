/**
 * Price Lookup Configuration
 *
 * Maps token symbols to CoinGecko IDs for price queries.
 * This includes tokens on all chains, not just Base.
 */

/**
 * Token symbol to CoinGecko ID mapping.
 * Used by priceHandler for fetching prices.
 */
export const COINGECKO_ID_MAP: Record<string, string> = {
    // Ethereum / ETH variants
    eth: "ethereum",
    ethereum: "ethereum",
    weth: "ethereum",

    // Bitcoin
    btc: "bitcoin",
    bitcoin: "bitcoin",

    // Stablecoins
    usdc: "usd-coin",
    usdt: "tether",
    dai: "dai",

    // L1 chains
    sol: "solana",
    solana: "solana",
    avax: "avalanche-2",
    matic: "matic-network",
    polygon: "matic-network",

    // L2 chains
    base: "ethereum", // Base uses ETH
    arb: "arbitrum",
    arbitrum: "arbitrum",
    op: "optimism",
    optimism: "optimism",

    // DeFi tokens
    link: "chainlink",
    uni: "uniswap",
    aave: "aave",

    // Base-native tokens
    degen: "degen-base",
    aero: "aerodrome-finance",
    brett: "brett",
    toshi: "toshi",
};

/**
 * Get CoinGecko ID for a token symbol.
 * Falls back to the symbol itself for unknown tokens.
 */
export function getCoinGeckoId(symbol: string): string {
    return COINGECKO_ID_MAP[symbol.toLowerCase()] ?? symbol.toLowerCase();
}
