#!/usr/bin/env node

import { createSigilClient } from "@heysigil/sigil-sdk";
import { createTools } from "./tools.js";
import { SigilMcpServer } from "./server.js";
import { startStdioTransport } from "./transports/stdio.js";
import { startHttpTransport } from "./transports/http.js";

function getArg(name: string): string | undefined {
    const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
    return match ? match.split("=", 2)[1] : undefined;
}

async function main() {
    const transport = getArg("transport") || process.env.SIGIL_MCP_TRANSPORT || "stdio";
    const baseUrl = process.env.SIGIL_API_URL || "http://localhost:3001";
    const token = process.env.SIGIL_MCP_TOKEN;
    const host = process.env.SIGIL_MCP_HOST || "127.0.0.1";
    const port = Number(process.env.SIGIL_MCP_PORT || 8788);

    const client = createSigilClient({
        baseUrl,
        token,
    });

    let allowedScopes: string[] | undefined;
    if (token) {
        try {
            const tokenInfo = await client.mcp.tokenInfo();
            if (tokenInfo.authType === "mcp") {
                allowedScopes = tokenInfo.scopes;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "unknown token info error";
            // eslint-disable-next-line no-console
            console.error(`[sigil-mcp] token introspection failed: ${message}`);
        }
    }

    const server = new SigilMcpServer(createTools(client), allowedScopes);

    if (transport === "http") {
        startHttpTransport(server, { host, port });
        return;
    }

    // eslint-disable-next-line no-console
    console.error("[sigil-mcp] stdio transport started");
    startStdioTransport(server);
}

void main();
