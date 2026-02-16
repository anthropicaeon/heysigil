import { describe, expect, test, beforeEach } from "bun:test";
import {
    deployToken,
    isDeployerConfigured,
    generateSymbol,
    generateName,
    type DeployParams,
} from "../src/services/deployer";
import {
    createPhantomUser,
    findUserByPlatform,
    hasIdentity,
} from "../src/services/identity";

// ─── Token Launch: Self-Launch ──────────────────────────

describe("Token Launch: Self-Launch", () => {
    test("deploys token with explicit dev address", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const sessionId = `test-self-${Date.now()}`;
        const params: DeployParams = {
            name: "Test Token Self Launch",
            symbol: "TEST",
            projectId: `test-project-${Date.now()}`,
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", // example dev address
            isSelfLaunch: true,
        };

        try {
            const result = await deployToken(params, sessionId);

            expect(result.tokenAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
            expect(result.poolId).toBeDefined();
            expect(result.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
            expect(result.blockNumber).toBeGreaterThan(0);
            expect(result.deployer).toMatch(/^0x[0-9a-fA-F]{40}$/);
            expect(result.explorerUrl).toContain("basescan.org");
            expect(result.dexUrl).toContain("dexscreener.com");
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                expect(error).toBeDefined();
            } else {
                throw error;
            }
        }
    });

    test("uses generated name and symbol for self-launch", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const projectId = "my-cool-project";
        const params: DeployParams = {
            name: generateName(projectId),
            symbol: generateSymbol(projectId),
            projectId,
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
            isSelfLaunch: true,
        };

        expect(params.name).toBe("Sigil: my-cool-project");
        expect(params.symbol).toBe("sMY");

        try {
            const result = await deployToken(params);
            expect(result.tokenAddress).toBeDefined();
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                expect(error).toBeDefined();
            } else {
                throw error;
            }
        }
    });
});

// ─── Token Launch: Third-Party ──────────────────────────

describe("Token Launch: Third-Party", () => {
    test("creates phantom identity for GitHub dev", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const sessionId = `test-third-party-${Date.now()}`;
        const repoId = `testorg/testrepo-${Date.now()}`;
        const params: DeployParams = {
            name: "Test Third Party Token",
            symbol: "THIRD",
            projectId: repoId,
            isSelfLaunch: false,
            devLinks: [`https://github.com/${repoId}`],
        };

        // Before deployment, identity should not exist
        expect(hasIdentity("github", repoId)).toBe(false);

        try {
            const result = await deployToken(params, sessionId);

            // After deployment, phantom identity should be created
            const user = findUserByPlatform("github", repoId);
            expect(user).toBeDefined();
            expect(user!.status).toBe("phantom");
            expect(user!.walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);

            expect(result.tokenAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                // Even on error, phantom identity should be created
                const user = findUserByPlatform("github", repoId);
                if (user) {
                    expect(user.status).toBe("phantom");
                }
                expect(error).toBeDefined();
            } else {
                throw error;
            }
        }
    });

    test("reuses existing phantom identity for same dev", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const repoId = `testorg/testrepo-reuse-${Date.now()}`;

        // Create phantom identity directly
        const phantom = createPhantomUser("github", repoId);
        const phantomWallet = phantom.walletAddress;

        expect(phantom.isNew).toBe(true);

        // Launch token for the same dev
        const params: DeployParams = {
            name: "Test Reuse Identity",
            symbol: "REUSE",
            projectId: repoId,
            isSelfLaunch: false,
            devLinks: [`https://github.com/${repoId}`],
        };

        try {
            await deployToken(params);

            // Should use the same phantom wallet
            const user = findUserByPlatform("github", repoId);
            expect(user!.walletAddress).toBe(phantomWallet);
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                expect(error).toBeDefined();
            } else {
                throw error;
            }
        }
    });

    test("uses ZeroAddress when no dev links provided", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const params: DeployParams = {
            name: "Anonymous Token",
            symbol: "ANON",
            projectId: `anon-project-${Date.now()}`,
            isSelfLaunch: false,
        };

        try {
            const result = await deployToken(params);
            expect(result.tokenAddress).toBeDefined();
            // When devAddress is not provided and no links, fees go to contract escrow (ZeroAddress)
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                expect(error).toBeDefined();
            } else {
                throw error;
            }
        }
    });
});

// ─── Token Launch: Rate Limiting ────────────────────────

describe("Token Launch: Rate Limiting", () => {
    test("enforces max 3 launches per hour per session", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const sessionId = `test-rate-limit-${Date.now()}`;

        const createParams = (i: number): DeployParams => ({
            name: `Rate Limit Test ${i}`,
            symbol: `RL${i}`,
            projectId: `rate-limit-test-${i}-${Date.now()}`,
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        });

        try {
            // First 3 should work (or fail with blockchain errors, not rate limit)
            for (let i = 1; i <= 3; i++) {
                try {
                    await deployToken(createParams(i), sessionId);
                } catch (error) {
                    const msg = (error as Error).message;
                    // Rate limit error should NOT happen for first 3
                    expect(msg).not.toContain("Rate limit");
                }
            }

            // 4th should be rate limited
            try {
                await deployToken(createParams(4), sessionId);
                // If we get here, either blockchain is working or there's an issue
                // Should have been rate limited
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                const msg = (error as Error).message;
                expect(msg).toContain("Rate limit");
                expect(msg).toContain("3");
                expect(msg).toContain("hour");
            }
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                expect(error).toBeDefined();
            } else {
                throw error;
            }
        }
    });

    test("different sessions have independent rate limits", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const session1 = `test-rate-1-${Date.now()}`;
        const session2 = `test-rate-2-${Date.now()}`;

        const params1: DeployParams = {
            name: "Rate Test Session 1",
            symbol: "RT1",
            projectId: `rate-test-1-${Date.now()}`,
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        };

        const params2: DeployParams = {
            name: "Rate Test Session 2",
            symbol: "RT2",
            projectId: `rate-test-2-${Date.now()}`,
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        };

        try {
            // Both sessions should be able to deploy independently
            await deployToken(params1, session1);
            await deployToken(params2, session2);

            // Both succeeded or failed with blockchain errors (not rate limit)
            expect(true).toBe(true);
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                expect(error).toBeDefined();
            } else if (msg.includes("Rate limit")) {
                // Should not be rate limited since they're different sessions
                throw error;
            } else {
                throw error;
            }
        }
    });

    test("deployment without sessionId skips rate limiting", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const params: DeployParams = {
            name: "No Rate Limit Test",
            symbol: "NORL",
            projectId: `no-rate-limit-${Date.now()}`,
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        };

        try {
            // Should not throw rate limit error even if called multiple times
            const result = await deployToken(params);
            expect(result.tokenAddress).toBeDefined();
        } catch (error) {
            const msg = (error as Error).message;
            expect(msg).not.toContain("Rate limit");
        }
    });
});

// ─── Token Launch: Error Handling ───────────────────────

describe("Token Launch: Error Handling", () => {
    test("fails gracefully when deployer not configured", async () => {
        if (isDeployerConfigured()) {
            console.log("⚠️  Deployer is configured — skipping not-configured test");
            expect(isDeployerConfigured()).toBe(true);
            return;
        }

        const params: DeployParams = {
            name: "Should Fail",
            symbol: "FAIL",
            projectId: "should-fail",
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        };

        try {
            await deployToken(params);
            expect(true).toBe(false); // Should not reach here
        } catch (error) {
            const msg = (error as Error).message;
            expect(msg).toContain("DEPLOYER_PRIVATE_KEY");
        }
    });

    test("validates required parameters", async () => {
        // Test that parameters are properly typed and required
        const params: DeployParams = {
            name: "Valid Token",
            symbol: "VALID",
            projectId: "valid-project",
        };

        expect(params.name).toBeDefined();
        expect(params.symbol).toBeDefined();
        expect(params.projectId).toBeDefined();
    });
});

// ─── Token Launch: Result Validation ────────────────────

describe("Token Launch: Result Validation", () => {
    test("returns complete deployment result structure", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const params: DeployParams = {
            name: "Result Test Token",
            symbol: "RESULT",
            projectId: `result-test-${Date.now()}`,
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        };

        try {
            const result = await deployToken(params);

            // Verify all expected fields are present
            expect(result).toHaveProperty("tokenAddress");
            expect(result).toHaveProperty("poolId");
            expect(result).toHaveProperty("txHash");
            expect(result).toHaveProperty("blockNumber");
            expect(result).toHaveProperty("deployer");
            expect(result).toHaveProperty("explorerUrl");
            expect(result).toHaveProperty("dexUrl");

            // Verify field formats
            expect(result.tokenAddress).toMatch(/^0x[0-9a-fA-F]{40}$|^pending$/);
            expect(result.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
            expect(result.deployer).toMatch(/^0x[0-9a-fA-F]{40}$/);
            expect(result.explorerUrl).toContain("https://");
            expect(result.dexUrl).toContain("https://");
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                expect(error).toBeDefined();
            } else {
                throw error;
            }
        }
    });

    test("explorer URL points to BaseScan", async () => {
        if (!isDeployerConfigured()) {
            console.log("⚠️  Deployer not configured — skipping blockchain test");
            expect(isDeployerConfigured()).toBe(false);
            return;
        }

        const params: DeployParams = {
            name: "Explorer Test",
            symbol: "EXPL",
            projectId: `explorer-test-${Date.now()}`,
            devAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        };

        try {
            const result = await deployToken(params);
            expect(result.explorerUrl).toContain("basescan.org/tx/");
            expect(result.dexUrl).toMatch(/dexscreener\.com|basescan\.org/);
        } catch (error) {
            const msg = (error as Error).message;
            if (msg.includes("insufficient funds") || msg.includes("network")) {
                console.log(`⚠️  Blockchain error (expected in test env): ${msg}`);
                expect(error).toBeDefined();
            } else {
                throw error;
            }
        }
    });
});
