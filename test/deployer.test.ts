import { describe, expect, test } from "bun:test";
import {
    isDeployerConfigured,
    generateSymbol,
    generateName,
    getDeployerBalance,
} from "../src/services/deployer";

// ─── Configuration Checks ───────────────────────────────

describe("Deployer: Configuration", () => {
    test("isDeployerConfigured returns boolean", () => {
        const configured = isDeployerConfigured();
        expect(typeof configured).toBe("boolean");
    });

    test("isDeployerConfigured checks for required env vars", () => {
        // This will return true if both DEPLOYER_PRIVATE_KEY and SIGIL_FACTORY_ADDRESS are set
        // or false if either is missing. We just verify it doesn't throw.
        const configured = isDeployerConfigured();
        expect(configured).toBeDefined();
    });
});

// ─── Symbol Generation ──────────────────────────────────

describe("Deployer: Symbol Generation", () => {
    test("generates symbol from simple name", () => {
        const symbol = generateSymbol("react");
        expect(symbol).toBe("sREACT");
    });

    test("generates symbol from name with dots", () => {
        const symbol = generateSymbol("next.js");
        expect(symbol).toBe("sNEXT");
    });

    test("generates symbol from hyphenated name", () => {
        const symbol = generateSymbol("cool-project");
        expect(symbol).toBe("sCOOL");
    });

    test("generates symbol from name with spaces", () => {
        const symbol = generateSymbol("my awesome token");
        expect(symbol).toBe("sMY");
    });

    test("truncates long names to 6 chars + s prefix", () => {
        const symbol = generateSymbol("verylongprojectname");
        expect(symbol).toBe("sVERYLO");
        expect(symbol.length).toBe(7); // 's' + 6 chars
    });

    test("handles empty string", () => {
        const symbol = generateSymbol("");
        expect(symbol).toBe("sTOKEN");
    });

    test("handles special characters", () => {
        const symbol = generateSymbol("@my/project#123");
        expect(symbol).toBe("sMY");
    });

    test("handles numbers", () => {
        const symbol = generateSymbol("web3-token");
        expect(symbol).toBe("sWEB3");
    });

    test("uppercase conversion", () => {
        const symbol = generateSymbol("lowercase");
        expect(symbol).toBe("sLOWERC");
    });

    test("handles underscores", () => {
        const symbol = generateSymbol("my_project_name");
        expect(symbol).toBe("sMY");
    });
});

// ─── Name Generation ────────────────────────────────────

describe("Deployer: Name Generation", () => {
    test("generates name from simple project ID", () => {
        const name = generateName("react");
        expect(name).toBe("Sigil: react");
    });

    test("extracts repo from org/repo format", () => {
        const name = generateName("vercel/next.js");
        expect(name).toBe("Sigil: next.js");
    });

    test("extracts last part from GitHub URL format", () => {
        const name = generateName("facebook/react");
        expect(name).toBe("Sigil: react");
    });

    test("handles multi-level paths", () => {
        const name = generateName("org/team/project");
        expect(name).toBe("Sigil: project");
    });

    test("handles single name", () => {
        const name = generateName("mytoken");
        expect(name).toBe("Sigil: mytoken");
    });

    test("handles empty string", () => {
        const name = generateName("");
        expect(name).toBe("Sigil: ");
    });

    test("preserves case and special chars", () => {
        const name = generateName("org/My-Cool.Project");
        expect(name).toBe("Sigil: My-Cool.Project");
    });
});

// ─── Balance Check ──────────────────────────────────────

describe("Deployer: Balance Check", () => {
    test("getDeployerBalance returns expected structure (if configured)", async () => {
        // This test will only pass if deployer is properly configured
        // If not configured, it will throw an error which we catch
        try {
            const balance = await getDeployerBalance();
            expect(balance).toBeDefined();
            expect(balance.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
            expect(typeof balance.balanceEth).toBe("string");
            expect(typeof balance.hasEnoughGas).toBe("boolean");
        } catch (error) {
            // Expected if DEPLOYER_PRIVATE_KEY is not configured
            expect(error).toBeDefined();
            expect((error as Error).message).toContain("DEPLOYER_PRIVATE_KEY");
        }
    });
});

// ─── Deployment Tests ───────────────────────────────────
// Note: deployToken() requires actual blockchain interaction and is not tested here.
// Testing would require either:
// 1. A local test network (Anvil/Hardhat)
// 2. Mocking ethers.js calls
// 3. Integration tests against a testnet
//
// Rate limiting is tested implicitly through the deployToken function,
// which would need blockchain mocking to test properly.

describe("Deployer: Deployment", () => {
    test("deployment function exists and is callable", () => {
        // We just verify the function is exported and has the right signature
        // Actual deployment tests would require blockchain mocking or test network
        const { deployToken } = require("../src/services/deployer");
        expect(typeof deployToken).toBe("function");
    });
});
