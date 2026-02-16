import type { ActionResult } from "../types.js";

/**
 * Handler function signature for all action handlers.
 */
export type ActionHandler = (
    params: Record<string, unknown>,
    sessionId?: string
) => Promise<ActionResult>;
