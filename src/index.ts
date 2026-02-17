import { serve } from "@hono/node-server";
import { createApp } from "./api/server.js";
import { getEnv } from "./config/env.js";
import { runStartupChecks } from "./config/startup-checks.js";
import { getFeeIndexer, isFeeIndexerConfigured } from "./services/fee-indexer.js";
import { loggers } from "./utils/logger.js";

const log = loggers.server;

// Run security checks before accepting requests
runStartupChecks();

const env = getEnv();
const app = createApp();

log.info(
    { port: env.PORT, frontendUrl: env.FRONTEND_URL, baseUrl: env.BASE_URL },
    "Sigil starting",
);

serve({
    fetch: app.fetch,
    port: env.PORT,
});

log.info({ url: env.BASE_URL }, "Server running");

// Start fee indexer if configured
if (isFeeIndexerConfigured()) {
    const feeIndexer = getFeeIndexer();
    feeIndexer.start().catch((err) => {
        loggers.feeIndexer.error({ err }, "Failed to start fee indexer");
    });
    loggers.feeIndexer.info("Fee indexer started");

    // Graceful shutdown
    process.on("SIGINT", () => {
        log.info("Shutting down (SIGINT)...");
        feeIndexer.stop();
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        log.info("Shutting down (SIGTERM)...");
        feeIndexer.stop();
        process.exit(0);
    });
} else {
    loggers.feeIndexer.info("Fee indexer disabled (SIGIL_FEE_VAULT_ADDRESS not set)");
}
