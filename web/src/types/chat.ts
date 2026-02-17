/**
 * Chat API Response Types
 *
 * Discriminated union for type-safe chat API response handling.
 */

/**
 * Message sent to chat API.
 */
export interface ChatRequest {
    message: string;
    sessionId?: string;
    walletAddress?: string;
}

/**
 * Chat API response (discriminated union).
 */
export type ChatApiResponse = ChatSuccess | ChatError;

export interface ChatSuccess {
    sessionId: string;
    response: string;
}

export interface ChatError {
    error: string;
}

/**
 * Type guard for successful chat response.
 */
export function isChatSuccess(data: ChatApiResponse): data is ChatSuccess {
    return "response" in data && typeof data.response === "string";
}

/**
 * Type guard for error response.
 */
export function isChatError(data: ChatApiResponse): data is ChatError {
    return "error" in data && typeof data.error === "string";
}
