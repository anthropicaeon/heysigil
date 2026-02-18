import type { ToolDescriptor, JsonRpcRequest, JsonRpcResponse } from "./types.js";

const JSON_RPC_VERSION = "2.0";

export class SigilMcpServer {
    private readonly tools = new Map<string, ToolDescriptor>();
    private readonly allowedScopes: Set<string> | null;

    constructor(tools: ToolDescriptor[], allowedScopes?: string[]) {
        for (const tool of tools) {
            this.tools.set(tool.name, tool);
        }
        this.allowedScopes = allowedScopes ? new Set(allowedScopes) : null;
    }

    async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
        const id = request.id ?? null;

        try {
            switch (request.method) {
                case "initialize":
                    return {
                        jsonrpc: JSON_RPC_VERSION,
                        id,
                        result: {
                            protocolVersion: "2025-06-18",
                            serverInfo: {
                                name: "sigil-mcp",
                                version: "0.1.0",
                            },
                            capabilities: {
                                tools: {},
                            },
                        },
                    };
                case "notifications/initialized":
                    return null;
                case "ping":
                    return {
                        jsonrpc: JSON_RPC_VERSION,
                        id,
                        result: { ok: true },
                    };
                case "tools/list":
                    return {
                        jsonrpc: JSON_RPC_VERSION,
                        id,
                        result: {
                            tools: Array.from(this.tools.values()).map((tool) => ({
                                name: tool.name,
                                description: tool.description,
                                inputSchema: tool.inputSchema,
                            })),
                        },
                    };
                case "tools/call":
                    return this.handleToolCall(request, id);
                default:
                    return this.error(id, -32601, `Method not found: ${request.method}`);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown server error";
            return this.error(id, -32000, message);
        }
    }

    private async handleToolCall(
        request: JsonRpcRequest,
        id: string | number | null,
    ): Promise<JsonRpcResponse> {
        const params = (request.params || {}) as { name?: string; arguments?: unknown };
        const toolName = params.name;
        if (!toolName) {
            return this.error(id, -32602, "Missing tool name");
        }

        const tool = this.tools.get(toolName);
        if (!tool) {
            return this.error(id, -32602, `Unknown tool: ${toolName}`);
        }

        if (this.allowedScopes) {
            const missing = tool.requiredScopes.filter((scope) => !this.allowedScopes?.has(scope));
            if (missing.length > 0) {
                return this.error(
                    id,
                    -32001,
                    `Missing required scopes for ${toolName}: ${missing.join(", ")}`,
                );
            }
        }

        const result = await tool.handler(params.arguments || {});
        return {
            jsonrpc: JSON_RPC_VERSION,
            id,
            result: {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            },
        };
    }

    error(id: string | number | null, code: number, message: string): JsonRpcResponse {
        return {
            jsonrpc: JSON_RPC_VERSION,
            id,
            error: { code, message },
        };
    }
}
