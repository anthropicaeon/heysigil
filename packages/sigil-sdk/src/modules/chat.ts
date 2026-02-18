import type { ChatMessageRequest, ChatMessageResponse } from "../types.js";
import type { SigilHttpClient } from "../http.js";

export function createChatModule(http: SigilHttpClient) {
    return {
        send(input: ChatMessageRequest) {
            return http.post<ChatMessageResponse>("/api/chat", input);
        },
        session(sessionId: string) {
            return http.get<Record<string, unknown>>(`/api/chat/${sessionId}`);
        },
    };
}
