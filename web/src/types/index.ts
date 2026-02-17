/**
 * Types Barrel Export
 *
 * Centralized types for the web application.
 */

// Governance
export type {
    Proposal,
    ProposalStatus,
    TabFilter,
    Vote,
} from "./governance";

// Verification
export type {
    Method,
    Step,
    ChallengeResponse,
    CheckResult,
    ClaimResult,
} from "./verification";

// Token
export type {
    TokenBalance,
    TokenInfo,
} from "./token";

// Wallet
export type {
    WalletInfo,
    FeeInfo,
} from "./wallet";
