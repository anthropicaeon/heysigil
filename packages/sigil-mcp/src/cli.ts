#!/usr/bin/env node

import {
    createSigilMcpServer,
    resolveAllowedScopes,
    startHttpTransport,
    startStdioTransport,
} from "./lib.js";

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

    const { client, server } = createSigilMcpServer({
        baseUrl,
        token,
    });

    const allowedScopes = await resolveAllowedScopes(client, Boolean(token));
    const requestScopedServer = allowedScopes
        ? createSigilMcpServer({
            baseUrl,
            token,
            allowedScopes,
        }).server
        : server;

    if (transport === "http") {
        startHttpTransport(requestScopedServer, { host, port });
        return;
    }

    // eslint-disable-next-line no-console
    console.error("[sigil-mcp] stdio transport started");
    startStdioTransport(requestScopedServer);
}

void main();
