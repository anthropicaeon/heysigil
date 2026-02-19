import type { SigilScope } from "@heysigil/sigil-core";

export type BotStack = "sigilbot" | "openclaw";

export interface SigilBotConfig {
    port: number;
    host: string;
    botId: string;
    botStack: BotStack;
    sigilApiUrl: string;
    sigilMcpToken: string;
    mainAppUrl: string;
    connectSharedSecret: string | null;
    logLevel: "debug" | "info" | "warn" | "error";
    mcpSidecarEnabled: boolean;
    mcpSidecarHost: string;
    mcpSidecarPort: number;
    requiredScopes: SigilScope[];
}

export interface BotHandshakeRequest {
    nonce: string;
    timestamp: string;
    userId: string;
    walletAddress?: string;
    pluginId?: string;
}

export interface BotRecord {
    id: string;
    stack: BotStack;
    pluginId: string;
    userId: string;
    walletAddress: string | null;
    connectedAt: string;
    lastSeenAt: string;
    status: "connected";
}

export interface BotHandshakeResponse {
    ok: true;
    connectionId: string;
    bot: BotRecord;
    scopes: SigilScope[];
    nextActions: string[];
}

export interface BotChatRequest {
    message: string;
    sessionId?: string | null;
    walletAddress?: string;
}
