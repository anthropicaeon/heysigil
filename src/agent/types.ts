/** Supported actions the agent can take */
export type ActionIntent =
    | "swap"
    | "bridge"
    | "send"
    | "balance"
    | "history"
    | "price"
    | "launch_token"
    | "verify_project"
    | "claim_reward"
    | "pool_status"
    | "export_key"
    | "deposit"
    | "help"
    | "unknown";

/** Structured action parsed from natural language */
export interface ParsedAction {
    intent: ActionIntent;
    params: Record<string, unknown>;
    confidence: number;
    rawText: string;
}

/** Result of executing an action */
export interface ActionResult {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
}

/** Chat message in a conversation */
export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    action?: ParsedAction;
}

/** A chat session / conversation */
export interface ChatSession {
    id: string;
    walletAddress?: string;
    platform: "web" | "telegram" | "discord";
    messages: ChatMessage[];
    createdAt: Date;
}
