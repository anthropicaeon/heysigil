/**
 * Wallet Types
 *
 * Types for wallet data and balances.
 */

import type { TokenBalance } from "./token";

export interface WalletInfo {
    exists: boolean;
    address: string | null;
    balance: {
        eth: string;
        tokens: TokenBalance[];
    } | null;
}

export interface FeeInfo {
    claimable: string;
    lifetime: string;
}
