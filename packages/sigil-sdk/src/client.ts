import type { SigilClientConfig } from "./types.js";
import { SigilHttpClient } from "./http.js";
import { createVerifyModule } from "./modules/verify.js";
import { createLaunchModule } from "./modules/launch.js";
import { createWalletModule } from "./modules/wallet.js";
import { createFeesModule } from "./modules/fees.js";
import { createClaimModule } from "./modules/claim.js";
import { createChatModule } from "./modules/chat.js";
import { createDashboardModule } from "./modules/dashboard.js";
import { createDevelopersModule } from "./modules/developers.js";
import { createGovernanceModule } from "./modules/governance.js";
import { createMcpModule } from "./modules/mcp.js";

export function createSigilClient(config: SigilClientConfig) {
    const http = new SigilHttpClient(config);

    return {
        verify: createVerifyModule(http),
        launch: createLaunchModule(http),
        wallet: createWalletModule(http),
        fees: createFeesModule(http),
        claim: createClaimModule(http),
        chat: createChatModule(http),
        dashboard: createDashboardModule(http),
        developers: createDevelopersModule(http),
        governance: createGovernanceModule(http),
        mcp: createMcpModule(http),
    };
}

export type SigilClient = ReturnType<typeof createSigilClient>;
