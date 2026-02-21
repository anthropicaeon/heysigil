import { serve } from "@hono/node-server";
import { createApp } from "./api/server.js";
import { getEnv } from "./config/env.js";
import { runStartupChecks } from "./config/startup-checks.js";
import { getFeeIndexer, isFeeIndexerConfigured } from "./services/fee-indexer.js";
import { getFeeCollector, isFeeCollectorConfigured } from "./services/fee-collector.js";
import { loggers } from "./utils/logger.js";
import { initializeMcpRuntime } from "./mcp/runtime.js";
import { getMigrationRelayer, isMigrationRelayerConfigured } from "./services/migration-relayer.js";

const log = loggers.server;

// Run security checks before accepting requests
runStartupChecks();
initializeMcpRuntime();

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

// Start fee collector if configured (harvests V3 LP fees into the vault)
if (isFeeCollectorConfigured()) {
    const feeCollector = getFeeCollector();
    feeCollector.start().catch((err) => {
        log.error({ err }, "Failed to start fee collector");
    });
    log.info("Fee collector started (collects V3 LP fees every 24h)");

    // Graceful shutdown
    const stopCollector = () => feeCollector.stop();
    process.on("SIGINT", stopCollector);
    process.on("SIGTERM", stopCollector);
} else {
    log.info("Fee collector disabled (SIGIL_LP_LOCKER_ADDRESS not set)");
}

// Start migration relayer if configured (watches for V1 token deposits)
if (isMigrationRelayerConfigured()) {
    const migrationRelayer = getMigrationRelayer();
    migrationRelayer.start().catch((err) => {
        log.error({ err }, "Failed to start migration relayer");
    });
    log.info("Migration relayer started (watches for V1 deposits)");

    // Graceful shutdown
    const stopRelayer = () => migrationRelayer.stop();
    process.on("SIGINT", stopRelayer);
    process.on("SIGTERM", stopRelayer);
} else {
    log.info("Migration relayer disabled (MIGRATION_RELAYER_ADDRESS not set)");
}
