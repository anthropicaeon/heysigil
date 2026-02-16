import { describe, expect, test } from "bun:test";
import {
    resolveToken,
    getQuote,
    executeSwap,
} from "../src/services/trading";
import { createWallet } from "../src/services/wallet";

// ─── Token Resolution ───────────────────────────────────

describe("Trading: Token Resolution", () => {
    test("resolves ETH", () => {
        const token = resolveToken("ETH");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("ETH");
        expect(token!.decimals).toBe(18);
        expect(token!.address).toBe("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
    });

    test("resolves USDC (case insensitive)", () => {
        const token = resolveToken("usdc");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("USDC");
        expect(token!.decimals).toBe(6);
        expect(token!.address).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
    });

    test("resolves WETH", () => {
        const token = resolveToken("WETH");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("WETH");
        expect(token!.address).toBe("0x4200000000000000000000000000000000000006");
        expect(token!.decimals).toBe(18);
    });

    test("resolves USDT", () => {
        const token = resolveToken("USDT");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("USDT");
        expect(token!.decimals).toBe(6);
    });

    test("resolves DAI", () => {
        const token = resolveToken("DAI");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("DAI");
        expect(token!.decimals).toBe(18);
    });

    test("resolves DEGEN", () => {
        const token = resolveToken("DEGEN");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("DEGEN");
        expect(token!.decimals).toBe(18);
    });

    test("resolves AERO", () => {
        const token = resolveToken("AERO");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("AERO");
    });

    test("resolves BRETT", () => {
        const token = resolveToken("BRETT");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("BRETT");
    });

    test("resolves TOSHI", () => {
        const token = resolveToken("TOSHI");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("TOSHI");
    });

    test("resolves contract address", () => {
        const addr = "0x1234567890abcdef1234567890abcdef12345678";
        const token = resolveToken(addr);
        expect(token).toBeDefined();
        expect(token!.address).toBe(addr);
        expect(token!.decimals).toBe(18);
        expect(token!.symbol).toContain("0x123456");
    });

    test("handles lowercase symbols", () => {
        const token = resolveToken("eth");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("ETH");
    });

    test("handles whitespace in symbols", () => {
        const token = resolveToken("  ETH  ");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("ETH");
    });

    test("returns undefined for unknown symbol", () => {
        const token = resolveToken("FAKECOIN");
        expect(token).toBeUndefined();
    });

    test("returns undefined for invalid address", () => {
        const token = resolveToken("0xinvalid");
        expect(token).toBeUndefined();
    });

    test("returns undefined for empty string", () => {
        const token = resolveToken("");
        expect(token).toBeUndefined();
    });
});

// ─── Quote Validation ───────────────────────────────────

describe("Trading: Quote Validation", () => {
    test("returns error for unknown fromToken", async () => {
        const result = await getQuote("FAKECOIN", "USDC", "1");
        expect(result).toHaveProperty("error");
        expect((result as { error: string }).error).toContain("Unknown token: FAKECOIN");
    });

    test("returns error for unknown toToken", async () => {
        const result = await getQuote("ETH", "FAKECOIN", "1");
        expect(result).toHaveProperty("error");
        expect((result as { error: string }).error).toContain("Unknown token: FAKECOIN");
    });

    test("returns error for invalid amount", async () => {
        const result = await getQuote("ETH", "USDC", "invalid");
        expect(result).toHaveProperty("error");
        expect((result as { error: string }).error).toContain("Invalid amount");
    });

    test("accepts valid decimal amounts", async () => {
        const result = await getQuote("ETH", "USDC", "0.01");
        // This will either return a quote or an API error, but not a validation error
        expect(result).toBeDefined();
    });

    test("returns error for empty amount", async () => {
        const result = await getQuote("ETH", "USDC", "");
        expect(result).toHaveProperty("error");
        expect((result as { error: string }).error).toContain("Invalid amount");
    });
});

// ─── Swap Validation ────────────────────────────────────

describe("Trading: Swap Validation", () => {
    test("returns error for non-existent wallet", async () => {
        const sessionId = `test-no-wallet-${Date.now()}`;
        const result = await executeSwap(sessionId, "ETH", "USDC", "0.01");

        expect(result.success).toBe(false);
        expect(result.error).toContain("No wallet found");
        expect(result.fromToken).toBe("ETH");
        expect(result.toToken).toBe("USDC");
        expect(result.fromAmount).toBe("0.01");
    });

    test("returns error for unknown fromToken", async () => {
        const sessionId = `test-unknown-from-${Date.now()}`;
        createWallet(sessionId);
        const result = await executeSwap(sessionId, "FAKECOIN", "USDC", "1");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Unknown token: FAKECOIN");
        expect(result.fromToken).toBe("FAKECOIN");
        expect(result.toToken).toBe("USDC");
    });

    test("returns error for unknown toToken", async () => {
        const sessionId = `test-unknown-to-${Date.now()}`;
        createWallet(sessionId);
        const result = await executeSwap(sessionId, "ETH", "FAKECOIN", "1");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Unknown token: FAKECOIN");
        expect(result.fromToken).toBe("ETH");
        expect(result.toToken).toBe("FAKECOIN");
    });

    test("returns error for invalid amount", async () => {
        const sessionId = `test-invalid-amt-${Date.now()}`;
        createWallet(sessionId);
        const result = await executeSwap(sessionId, "ETH", "USDC", "invalid");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid amount");
        expect(result.fromAmount).toBe("invalid");
    });

    test("handles valid decimal amounts", async () => {
        const sessionId = `test-decimal-${Date.now()}`;
        createWallet(sessionId);
        const result = await executeSwap(sessionId, "ETH", "USDC", "0.001");

        // Will fail with API error or insufficient funds, not validation error
        expect(result).toBeDefined();
        expect(result.fromToken).toBe("ETH");
        expect(result.toToken).toBe("USDC");
    });

    test("returns error for empty amount", async () => {
        const sessionId = `test-empty-amt-${Date.now()}`;
        createWallet(sessionId);
        const result = await executeSwap(sessionId, "ETH", "USDC", "");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid amount");
    });

    test("preserves input tokens in error response", async () => {
        const sessionId = `test-preserve-${Date.now()}`;
        const result = await executeSwap(sessionId, "eth", "usdc", "1");

        expect(result.fromToken).toBe("eth");
        expect(result.toToken).toBe("usdc");
    });
});
