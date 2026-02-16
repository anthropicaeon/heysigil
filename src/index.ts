import { serve } from "@hono/node-server";
import { createApp } from "./api/server.js";
import { getEnv } from "./config/env.js";
import { runStartupChecks } from "./config/startup-checks.js";
import { getFeeIndexer, isFeeIndexerConfigured } from "./services/fee-indexer.js";

// Run security checks before accepting requests
runStartupChecks();

const env = getEnv();
const app = createApp();

console.log(`Sigil starting on port ${env.PORT}`);
console.log(`Frontend URL: ${env.FRONTEND_URL}`);
console.log(`Base URL: ${env.BASE_URL}`);

serve({
    fetch: app.fetch,
    port: env.PORT,
});

console.log(`Server running at ${env.BASE_URL}`);

// Start fee indexer if configured
if (isFeeIndexerConfigured()) {
    const feeIndexer = getFeeIndexer();
    feeIndexer.start().catch((err) => {
        console.error("[fee-indexer] Failed to start:", err);
    });
    console.log("[fee-indexer] Started");

    // Graceful shutdown
    process.on("SIGINT", () => {
        console.log("\nShutting down...");
        feeIndexer.stop();
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        console.log("\nShutting down...");
        feeIndexer.stop();
        process.exit(0);
    });
} else {
    console.log("[fee-indexer] Disabled (SIGIL_FEE_VAULT_ADDRESS not set)");
}
