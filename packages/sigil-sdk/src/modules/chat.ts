import type {
    ChatAgentFeedResponse,
    ChatDeleteRequest,
    ChatDeleteResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatSessionQuery,
    ChatSessionResponse,
    ChatVoteRequest,
    ChatVoteResponse,
} from "../types.js";
import type { SigilHttpClient } from "../http.js";

export function createChatModule(http: SigilHttpClient) {
    const getQuerySuffix = (query?: ChatSessionQuery) => {
        if (!query) return "";
        const params = new URLSearchParams();
        if (typeof query.limit === "number") params.set("limit", String(query.limit));
        if (typeof query.offset === "number") params.set("offset", String(query.offset));
        if (typeof query.includeDeleted === "boolean") {
            params.set("includeDeleted", String(query.includeDeleted));
        }
        const raw = params.toString();
        return raw ? `?${raw}` : "";
    };

    return {
        send(input: ChatMessageRequest) {
            return http.post<ChatMessageResponse>("/api/chat", input);
        },
        session(sessionId: string, query?: ChatSessionQuery) {
            return http.get<ChatSessionResponse>(`/api/chat/${sessionId}${getQuerySuffix(query)}`);
        },
        vote(input: ChatVoteRequest) {
            return http.post<ChatVoteResponse>(
                `/api/chat/${input.sessionId}/messages/${input.messageId}/vote`,
                { vote: input.vote },
            );
        },
        upvote(sessionId: string, messageId: string) {
            return http.post<ChatVoteResponse>(`/api/chat/${sessionId}/messages/${messageId}/vote`, {
                vote: "up",
            });
        },
        downvote(sessionId: string, messageId: string) {
            return http.post<ChatVoteResponse>(`/api/chat/${sessionId}/messages/${messageId}/vote`, {
                vote: "down",
            });
        },
        deleteMessage(input: ChatDeleteRequest) {
            return http.post<ChatDeleteResponse>(
                `/api/chat/${input.sessionId}/messages/${input.messageId}/delete`,
                { reason: input.reason },
            );
        },
        agentFeed(limit?: number) {
            const suffix = typeof limit === "number" ? `?limit=${limit}` : "";
            return http.get<ChatAgentFeedResponse>(`/api/chat/agents/feed${suffix}`);
        },
    };
}
