/**
 * Offline Executor
 *
 * Fallback mode using regex parser for offline/no-API scenarios.
 */

import type { ParsedAction } from "../types.js";
import { parseLocalMessage } from "../local-parser.js";
import { executeAction } from "../router.js";

/**
 * Execute offline mode with regex parser fallback.
 */
export async function executeOfflineMode(
    userMessage: string,
    sessionId: string,
): Promise<{ message: string; action: ParsedAction }> {
    const action = parseLocalMessage(userMessage);

    if (action.intent !== "unknown" && action.confidence >= 0.3) {
        const result = await executeAction(action, userMessage, sessionId);
        return { message: result.message, action };
    }

    const message = [
        "👋 Hey! I'm Sigil — funding for builders, without the weight of running a community.",
        "",
        "Try something like:",
        '• **"price ETH"** — check token prices',
        '• **"swap 0.1 ETH to USDC"** — swap tokens',
        '• **"verify github.com/org/repo"** — prove you own a project',
        '• **"launch token for github.com/org/repo"** — deploy a token',
        '• **"help"** — see all commands',
    ].join("\n");

    return { message, action };
}
