/**
 * Sentinel — Security screening layer for Sigil.
 *
 * Three layers of protection:
 * 1. GoPlus API — Token safety screening (honeypots, scams, malicious contracts)
 * 2. Prompt injection guard — Detect & block AI manipulation attempts
 * 3. Address blocklist — Known scam/phishing addresses
 *
 * Every action passes through Sentinel before execution.
 */

// Types
export type { ScreenResult, TokenSafety, ActionScreenParams } from "./types.js";

// Individual screeners (for targeted use)
export { screenToken } from "./token-screener.js";
export { screenPrompt } from "./prompt-injection-detector.js";
export { screenAddress } from "./address-blocklist.js";

// Composite screening (main entry point)
export { screenAction, formatScreenMessage } from "./composite-screener.js";
