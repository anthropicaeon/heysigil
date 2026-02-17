/**
 * Token Registry for Base Chain
 *
 * Single source of truth for token addresses and decimals.
 * Used by trading.ts (swaps) and wallet.ts (balance checks).
 *
 * Adding a new token:
 * 1. Add entry to BASE_TOKEN_LIST
 * 2. Token is automatically available for trading
 * 3. Add to BALANCE_CHECK_SYMBOLS if it should appear in balance checks
 */

// ─── Token Definition ────────────────────────────────────

export interface TokenInfo {
    symbol: string;
    address: string;
    decimals: number;
    /** Human-readable name (optional) */
    name?: string;
}

// ─── Master Token List ───────────────────────────────────

/**
 * All supported tokens on Base.
 * This is the canonical source - all other exports derive from this.
 */
export const BASE_TOKEN_LIST: readonly TokenInfo[] = [
    // Native
    {
        symbol: "ETH",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        decimals: 18,
        name: "Ether",
    },
    {
        symbol: "WETH",
        address: "0x4200000000000000000000000000000000000006",
        decimals: 18,
        name: "Wrapped Ether",
    },

    // Stablecoins
    {
        symbol: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
        name: "USD Coin",
    },
    {
        symbol: "USDT",
        address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
        decimals: 6,
        name: "Tether USD",
    },
    {
        symbol: "DAI",
        address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
        decimals: 18,
        name: "Dai Stablecoin",
    },

    // Popular Base tokens
    {
        symbol: "DEGEN",
        address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
        decimals: 18,
        name: "Degen",
    },
    {
        symbol: "AERO",
        address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
        decimals: 18,
        name: "Aerodrome",
    },
    {
        symbol: "cbBTC",
        address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        decimals: 8,
        name: "Coinbase BTC",
    },
    {
        symbol: "BRETT",
        address: "0x532f27101965dd16442E59d40670FaF5eBB142E4",
        decimals: 18,
        name: "Brett",
    },
    {
        symbol: "TOSHI",
        address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4",
        decimals: 18,
        name: "Toshi",
    },
] as const;

// ─── Derived Exports ─────────────────────────────────────

/**
 * Token registry keyed by symbol (uppercase).
 * Used for quick lookups in trading operations.
 *
 * @example
 * const usdc = BASE_TOKENS["USDC"];
 * // { address: "0x833...", decimals: 6 }
 */
export const BASE_TOKENS: Record<string, { address: string; decimals: number }> =
    Object.fromEntries(
        BASE_TOKEN_LIST.map((t) => [t.symbol, { address: t.address, decimals: t.decimals }]),
    );

/**
 * Tokens to check in wallet balance queries.
 * Subset of commonly held tokens to minimize RPC calls.
 */
export const BALANCE_CHECK_SYMBOLS = ["USDC", "WETH", "DAI"] as const;

/**
 * Token info for balance checking (pre-resolved for performance).
 */
export const BALANCE_CHECK_TOKENS: readonly TokenInfo[] = BALANCE_CHECK_SYMBOLS.map((symbol) => {
    const token = BASE_TOKEN_LIST.find((t) => t.symbol === symbol);
    if (!token) throw new Error(`Balance check token not found: ${symbol}`);
    return token;
});

// ─── Lookup Utilities ────────────────────────────────────

/**
 * Resolve a token by symbol or address.
 *
 * @param symbolOrAddress - Token symbol (e.g., "ETH") or address (0x...)
 * @returns Token info or undefined if not found
 */
export function resolveToken(
    symbolOrAddress: string,
): (TokenInfo & { symbol: string }) | undefined {
    const upper = symbolOrAddress.toUpperCase().trim();

    // Direct symbol match
    const bySymbol = BASE_TOKEN_LIST.find((t) => t.symbol === upper);
    if (bySymbol) return bySymbol;

    // Address match (case-insensitive)
    const lower = symbolOrAddress.toLowerCase();
    const byAddress = BASE_TOKEN_LIST.find((t) => t.address.toLowerCase() === lower);
    if (byAddress) return byAddress;

    // Unknown token addresses are rejected to prevent wrong decimal assumptions.
    // Adding tokens: see BASE_TOKEN_LIST at the top of this file.
    // Users with custom tokens must add them to the registry first.
    return undefined;
}

/**
 * Check if a token symbol is known.
 */
export function isKnownToken(symbol: string): boolean {
    return symbol.toUpperCase() in BASE_TOKENS;
}

/**
 * Get all known token symbols.
 */
export function getTokenSymbols(): string[] {
    return BASE_TOKEN_LIST.map((t) => t.symbol);
}

// ─── Constants ───────────────────────────────────────────

/** Native ETH sentinel address (used by 0x API) */
export const NATIVE_ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/** Base chain ID */
export const BASE_CHAIN_ID = 8453;
