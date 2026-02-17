/**
 * Trading Service
 *
 * Executes token swaps on Base via 0x Swap API.
 * Uses the custodial wallet from wallet.ts to sign and broadcast.
 *
 * Flow:
 * 1. User: "swap 0.01 ETH to USDC"
 * 2. Get quote from 0x API
 * 3. Sign and broadcast via session wallet
 * 4. Return tx hash + result
 */

// Types
export type { SwapQuote, SwapResult, QuoteResponse, SwapTransaction } from "./types.js";

// Quote service (with caching)
export { getQuote } from "./quote-service.js";

// Swap execution
export { executeSwap } from "./swap-executor.js";

// ERC-20 approval (for advanced use)
export { ensureApproval } from "./erc20-approval.js";

// Re-export resolveToken for backwards compatibility
export { resolveToken } from "../../config/tokens.js";
