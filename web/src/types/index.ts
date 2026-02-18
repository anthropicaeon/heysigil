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

// Token / Project
export type {
    TokenBalance,
    ProjectInfo,
} from "./token";

// Wallet
export type {
    WalletInfo,
    FeeInfo,
} from "./wallet";

// Chat
export type {
    ChatRequest,
    ChatApiResponse,
    ChatSuccess,
    ChatError,
} from "./chat";
export { isChatSuccess, isChatError } from "./chat";
