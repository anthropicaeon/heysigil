import type {
    CreateMcpTokenRequest,
    CreateMcpTokenResponse,
    McpTokenMetadata,
    TokenInfoResponse,
} from "../types.js";
import type { SigilHttpClient } from "../http.js";

export function createMcpModule(http: SigilHttpClient) {
    return {
        createToken(input?: CreateMcpTokenRequest) {
            return http.post<CreateMcpTokenResponse>("/api/mcp/tokens", input || {});
        },
        listTokens() {
            return http.get<{ tokens: McpTokenMetadata[] }>("/api/mcp/tokens");
        },
        revokeToken(id: string) {
            return http.del<{ success: boolean }>(`/api/mcp/tokens/${id}`);
        },
        rotateToken(id: string, input?: CreateMcpTokenRequest) {
            return http.post<CreateMcpTokenResponse>(`/api/mcp/tokens/${id}/rotate`, input || {});
        },
        tokenInfo() {
            return http.get<TokenInfoResponse>("/api/mcp/token-info");
        },
    };
}
