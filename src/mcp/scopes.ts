export const MCP_SCOPES = [
    "verify:read",
    "verify:write",
    "dashboard:read",
    "chat:write",
    "governance:read",
    "governance:write",
    "developers:read",
    "launch:read",
    "launch:write",
    "wallet:read",
    "fees:read",
    "claim:write",
    "tokens:manage",
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

export const DEFAULT_MCP_SCOPES: McpScope[] = [
    "verify:read",
    "verify:write",
    "dashboard:read",
    "chat:write",
    "developers:read",
    "launch:read",
    "launch:write",
    "wallet:read",
    "fees:read",
];
