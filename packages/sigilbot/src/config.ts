import type { SigilScope } from "@heysigil/sigil-core";
import { z } from "zod";
import type { SigilBotConfig } from "./types.js";

const DEFAULT_REQUIRED_SCOPES: SigilScope[] = [
    "verify:write",
    "dashboard:read",
    "chat:write",
    "launch:read",
    "developers:read",
    "governance:read",
];

const envSchema = z.object({
    SIGILBOT_PORT: z.coerce.number().int().min(1).max(65535).default(8789),
    SIGILBOT_HOST: z.string().min(1).default("0.0.0.0"),
    SIGIL_BOT_ID: z.string().min(3).default("sigilbot-local"),
    SIGIL_BOT_STACK: z.enum(["sigilbot", "openclaw"]).default("sigilbot"),
    SIGIL_API_URL: z.string().url().default("http://localhost:3001"),
    SIGIL_MCP_TOKEN: z.string().min(1, "SIGIL_MCP_TOKEN is required"),
    SIGIL_MAIN_APP_URL: z.string().url().default("http://localhost:3000"),
    SIGIL_CONNECT_SHARED_SECRET: z.string().min(8).optional(),
    SIGILBOT_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    SIGILBOT_MCP_SIDECAR_ENABLED: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .default("false"),
    SIGILBOT_MCP_SIDECAR_HOST: z.string().min(1).default("127.0.0.1"),
    SIGILBOT_MCP_SIDECAR_PORT: z.coerce.number().int().min(1).max(65535).default(8790),
    SIGILBOT_REQUIRED_SCOPES: z.string().optional(),
});

function parseRequiredScopes(value?: string): SigilScope[] {
    if (!value) return DEFAULT_REQUIRED_SCOPES;

    const scopes = value
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean) as SigilScope[];

    return scopes.length > 0 ? scopes : DEFAULT_REQUIRED_SCOPES;
}

export function loadSigilBotConfig(env: NodeJS.ProcessEnv = process.env): SigilBotConfig {
    const parsed = envSchema.parse(env);

    return {
        port: parsed.SIGILBOT_PORT,
        host: parsed.SIGILBOT_HOST,
        botId: parsed.SIGIL_BOT_ID,
        botStack: parsed.SIGIL_BOT_STACK,
        sigilApiUrl: parsed.SIGIL_API_URL,
        sigilMcpToken: parsed.SIGIL_MCP_TOKEN,
        mainAppUrl: parsed.SIGIL_MAIN_APP_URL,
        connectSharedSecret: parsed.SIGIL_CONNECT_SHARED_SECRET ?? null,
        logLevel: parsed.SIGILBOT_LOG_LEVEL,
        mcpSidecarEnabled: parsed.SIGILBOT_MCP_SIDECAR_ENABLED,
        mcpSidecarHost: parsed.SIGILBOT_MCP_SIDECAR_HOST,
        mcpSidecarPort: parsed.SIGILBOT_MCP_SIDECAR_PORT,
        requiredScopes: parseRequiredScopes(parsed.SIGILBOT_REQUIRED_SCOPES),
    };
}
