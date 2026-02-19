import { createSigilClient, type SigilClient, type SigilClientConfig } from "@heysigil/sigil-sdk";
import { SigilMcpServer } from "./server.js";
import { createTools } from "./tools.js";

interface CreateSigilMcpServerOptions
    extends Pick<SigilClientConfig, "baseUrl" | "token" | "tokenProvider" | "fetch" | "timeoutMs"> {
    allowedScopes?: string[];
}

export function createSigilMcpServer(options: CreateSigilMcpServerOptions): {
    client: SigilClient;
    server: SigilMcpServer;
} {
    const client = createSigilClient({
        baseUrl: options.baseUrl,
        token: options.token,
        tokenProvider: options.tokenProvider,
        fetch: options.fetch,
        timeoutMs: options.timeoutMs,
    });

    const server = new SigilMcpServer(createTools(client), options.allowedScopes);
    return { client, server };
}

export async function resolveAllowedScopes(
    client: SigilClient,
    tokenPresent: boolean,
): Promise<string[] | undefined> {
    if (!tokenPresent) return undefined;

    try {
        const tokenInfo = await client.mcp.tokenInfo();
        if (tokenInfo.authType === "mcp") {
            return tokenInfo.scopes;
        }
    } catch {
        // Intentionally swallow introspection errors: callers should decide fallback behavior.
    }

    return undefined;
}

export { SigilMcpServer } from "./server.js";
export { createTools } from "./tools.js";
export { startHttpTransport } from "./transports/http.js";
export { startStdioTransport } from "./transports/stdio.js";
export type { JsonRpcRequest, JsonRpcResponse, ToolDescriptor } from "./types.js";
