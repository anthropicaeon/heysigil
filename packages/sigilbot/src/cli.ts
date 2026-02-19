#!/usr/bin/env node

import { loadSigilBotConfig, startSigilBotStack } from "./index.js";

async function main() {
    const config = loadSigilBotConfig();
    const app = await startSigilBotStack(config);

    const shutdown = async () => {
        await app.stop();
        process.exit(0);
    };

    process.on("SIGINT", () => {
        void shutdown();
    });
    process.on("SIGTERM", () => {
        void shutdown();
    });
}

void main();
