import { loadSigilBotConfig } from "./config.js";
import { Logger } from "./logger.js";
import { McpSidecar } from "./mcp-sidecar.js";
import { SigilBotRuntime } from "./runtime.js";
import { startSigilBotServer } from "./server.js";
import type { SigilBotConfig } from "./types.js";

interface StartedSigilBotStack {
    stop: () => Promise<void>;
}

export async function startSigilBotStack(config = loadSigilBotConfig()): Promise<StartedSigilBotStack> {
    const logger = new Logger(config.logLevel);
    const runtime = new SigilBotRuntime(config, logger);
    const mcpSidecar = new McpSidecar(config, logger);

    await runtime.bootstrap();
    mcpSidecar.start();

    const server = startSigilBotServer({ config, runtime, logger });

    return {
        stop: async () => {
            await server.close();
            mcpSidecar.stop();
        },
    };
}

export { loadSigilBotConfig, Logger, McpSidecar, SigilBotRuntime };
export type { SigilBotConfig };
export type * from "./types.js";
