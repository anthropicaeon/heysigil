import { randomUUID } from "node:crypto";
import { AuthError, ValidationError } from "@heysigil/sigil-core";
import { createSigilClient, type SigilScope } from "@heysigil/sigil-sdk";
import { z } from "zod";
import type { Logger } from "./logger.js";
import type {
    BotChatRequest,
    BotHandshakeRequest,
    BotHandshakeResponse,
    BotRecord,
    SigilBotConfig,
} from "./types.js";

const handshakeSchema = z.object({
    nonce: z.string().min(8),
    timestamp: z.string().datetime(),
    userId: z.string().min(1),
    walletAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
    pluginId: z.string().min(1).default("sigilbot"),
});

const chatSchema = z.object({
    message: z.string().min(1),
    sessionId: z.string().nullable().optional(),
    walletAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
});

export class SigilBotRuntime {
    private readonly client;
    private readonly records = new Map<string, BotRecord>();

    constructor(
        private readonly config: SigilBotConfig,
        private readonly logger: Logger,
    ) {
        this.client = createSigilClient({
            baseUrl: config.sigilApiUrl,
            token: config.sigilMcpToken,
        });
    }

    async bootstrap(): Promise<void> {
        const tokenInfo = await this.client.mcp.tokenInfo();
        const missingScopes = this.getMissingScopes(tokenInfo.scopes as SigilScope[]);
        if (missingScopes.length > 0) {
            throw new AuthError(`SIGIL_MCP_TOKEN missing required scopes: ${missingScopes.join(", ")}`);
        }

        this.logger.info("sigilbot bootstrap complete", {
            authType: tokenInfo.authType,
            userId: tokenInfo.userId,
            scopes: tokenInfo.scopes,
        });
    }

    async capabilities(): Promise<Record<string, unknown>> {
        const tokenInfo = await this.client.mcp.tokenInfo();
        const developersInfo = this.client.developers.info();

        return {
            botId: this.config.botId,
            stack: this.config.botStack,
            mainAppUrl: this.config.mainAppUrl,
            requiredScopes: this.config.requiredScopes,
            grantedScopes: tokenInfo.scopes,
            handshakePath: "/v1/handshake",
            chatPath: "/v1/chat",
            managedBots: this.records.size,
            developersInfo,
        };
    }

    health(): Record<string, unknown> {
        return {
            ok: true,
            botId: this.config.botId,
            stack: this.config.botStack,
            managedBots: this.records.size,
            mcpSidecarEnabled: this.config.mcpSidecarEnabled,
            timestamp: new Date().toISOString(),
        };
    }

    async handshake(
        payload: BotHandshakeRequest,
        sharedSecretHeader: string | null,
    ): Promise<BotHandshakeResponse> {
        if (this.config.connectSharedSecret && sharedSecretHeader !== this.config.connectSharedSecret) {
            throw new AuthError("Invalid connect secret");
        }

        const input = handshakeSchema.parse(payload);
        const tokenInfo = await this.client.mcp.tokenInfo();
        const missingScopes = this.getMissingScopes(tokenInfo.scopes as SigilScope[]);
        if (missingScopes.length > 0) {
            throw new AuthError(`Token missing required scopes: ${missingScopes.join(", ")}`);
        }

        const connectionId = randomUUID();
        const now = new Date().toISOString();
        const record: BotRecord = {
            id: connectionId,
            stack: this.config.botStack,
            pluginId: input.pluginId,
            userId: input.userId,
            walletAddress: input.walletAddress ?? null,
            connectedAt: now,
            lastSeenAt: now,
            status: "connected",
        };

        this.records.set(connectionId, record);

        this.logger.info("handshake connected", {
            connectionId,
            userId: input.userId,
            pluginId: input.pluginId,
        });

        return {
            ok: true,
            connectionId,
            bot: record,
            scopes: tokenInfo.scopes as SigilScope[],
            nextActions: [
                "Open /connect in the main Sigil app to configure tasks and schedules.",
                "Use /v1/chat to route prompts through existing Sigil chat orchestration.",
            ],
        };
    }

    listBots(): BotRecord[] {
        return Array.from(this.records.values());
    }

    async chat(payload: BotChatRequest): Promise<Record<string, unknown>> {
        const input = chatSchema.parse(payload);
        const response = await this.client.chat.send({
            message: input.message,
            sessionId: input.sessionId,
            walletAddress: input.walletAddress,
        });

        return {
            ok: true,
            botId: this.config.botId,
            ...response,
        };
    }

    toHttpError(error: unknown): { status: number; message: string } {
        if (error instanceof AuthError) {
            return { status: 401, message: error.message };
        }
        if (error instanceof ValidationError || error instanceof z.ZodError) {
            return { status: 400, message: error instanceof z.ZodError ? error.message : error.message };
        }
        if (error instanceof Error) {
            return { status: 500, message: error.message };
        }
        return { status: 500, message: "Unknown sigilbot runtime error" };
    }

    private getMissingScopes(actualScopes: SigilScope[]): SigilScope[] {
        const scopeSet = new Set(actualScopes);
        return this.config.requiredScopes.filter((scope) => !scopeSet.has(scope));
    }
}
