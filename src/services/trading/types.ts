/**
 * Trading Types
 *
 * Shared type definitions for trading service components.
 */

export interface SwapQuote {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    toAmountFormatted: string;
    price: string;
    estimatedGas: string;
    sources: string[];
}

export interface SwapResult {
    success: boolean;
    txHash?: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount?: string;
    explorerUrl?: string;
    error?: string;
}

export interface QuoteResponse {
    buyAmount: string;
    price: string;
    estimatedGas: string;
    sources: { name: string; proportion: string }[];
}

export interface SwapTransaction {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
    buyAmount: string;
    allowanceTarget?: string;
}
