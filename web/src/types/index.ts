/**
 * Types Barrel Export
 *
 * Centralized types for the web application.
 */

// Governance
export type { Proposal, ProposalStatus, TabFilter, Vote } from "./governance";

// Verification
export type { ChallengeResponse, CheckResult, ClaimResult, Method, Step } from "./verification";

// Token
export type { TokenBalance, TokenInfo } from "./token";

// Wallet
export type { FeeInfo, WalletInfo } from "./wallet";

// Chat
export type { ChatApiResponse, ChatError, ChatRequest, ChatSuccess } from "./chat";
export { isChatError, isChatSuccess } from "./chat";
