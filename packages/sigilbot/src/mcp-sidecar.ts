import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { Logger } from "./logger.js";
import type { SigilBotConfig } from "./types.js";

export class McpSidecar {
    private child: ChildProcessWithoutNullStreams | null = null;

    constructor(
        private readonly config: SigilBotConfig,
        private readonly logger: Logger,
    ) {}

    start(): void {
        if (!this.config.mcpSidecarEnabled) return;
        if (this.child) return;

        const executable = process.platform === "win32" ? "sigil-mcp.cmd" : "sigil-mcp";
        const args = ["--transport=http"];

        this.child = spawn(executable, args, {
            env: {
                ...process.env,
                SIGIL_API_URL: this.config.sigilApiUrl,
                SIGIL_MCP_TOKEN: this.config.sigilMcpToken,
                SIGIL_MCP_TRANSPORT: "http",
                SIGIL_MCP_HOST: this.config.mcpSidecarHost,
                SIGIL_MCP_PORT: String(this.config.mcpSidecarPort),
            },
            stdio: "pipe",
        });

        this.child.stdout.on("data", (chunk: Buffer) => {
            this.logger.info("mcp-sidecar stdout", { output: chunk.toString("utf8").trim() });
        });

        this.child.stderr.on("data", (chunk: Buffer) => {
            this.logger.info("mcp-sidecar stderr", { output: chunk.toString("utf8").trim() });
        });

        this.child.on("exit", (code, signal) => {
            this.logger.warn("mcp-sidecar exited", { code, signal });
            this.child = null;
        });

        this.logger.info("mcp-sidecar started", {
            host: this.config.mcpSidecarHost,
            port: this.config.mcpSidecarPort,
        });
    }

    stop(): void {
        if (!this.child) return;
        this.child.kill("SIGTERM");
        this.child = null;
        this.logger.info("mcp-sidecar stopped");
    }
}
