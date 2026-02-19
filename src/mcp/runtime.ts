import { createSigilMcpServer, type SigilMcpServer } from "@heysigil/sigil-mcp";
import { getEnv } from "../config/env.js";
import { loggers } from "../utils/logger.js";

let runtimeInitialized = false;

export function initializeMcpRuntime(): void {
    if (runtimeInitialized) return;

    const env = getEnv();
    createSigilMcpServer({
        baseUrl: env.BASE_URL,
    });

    runtimeInitialized = true;
    loggers.server.info(
        {
            mcp: {
                endpoint: "/mcp",
            },
        },
        "MCP runtime initialized",
    );
}

export function createRequestScopedMcpServer(
    token: string,
    allowedScopes: string[],
): SigilMcpServer {
    const env = getEnv();
    const { server } = createSigilMcpServer({
        baseUrl: env.BASE_URL,
        token,
        allowedScopes,
    });
    return server;
}
