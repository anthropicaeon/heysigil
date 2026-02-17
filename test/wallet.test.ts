import { describe, expect, test, beforeEach } from "bun:test";
import {
    createWallet,
    hasWallet,
    getAddress,
    requestExport,
    confirmExport,
    hasPendingExport,
} from "../src/services/wallet";
import { resolveToken } from "../src/services/trading";

// ─── Wallet Creation ────────────────────────────────────

describe("Wallet: Creation", () => {
    test("creates a wallet for a new session", async () => {
        const sessionId = `test-create-${Date.now()}`;
        const wallet = await createWallet(sessionId);

        expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(wallet.sessionId).toBe(sessionId);
        expect(wallet.createdAt).toBeInstanceOf(Date);
    });

    test("returns same wallet on second call for same session", async () => {
        const sessionId = `test-idempotent-${Date.now()}`;
        const w1 = await createWallet(sessionId);
        const w2 = await createWallet(sessionId);

        expect(w1.address).toBe(w2.address);
    });

    test("creates different wallets for different sessions", async () => {
        const w1 = await createWallet(`test-diff-1-${Date.now()}`);
        const w2 = await createWallet(`test-diff-2-${Date.now()}`);

        expect(w1.address).not.toBe(w2.address);
    });

    test("hasWallet returns true after creation", async () => {
        const sessionId = `test-has-${Date.now()}`;
        expect(await hasWallet(sessionId)).toBe(false);
        await createWallet(sessionId);
        expect(await hasWallet(sessionId)).toBe(true);
    });

    test("getAddress returns correct address", async () => {
        const sessionId = `test-addr-${Date.now()}`;
        const wallet = await createWallet(sessionId);
        expect(await getAddress(sessionId)).toBe(wallet.address);
    });
});

// ─── Private Key Export ─────────────────────────────────

describe("Wallet: Key Export", () => {
    test("requestExport returns pending state with warning", async () => {
        const sessionId = `test-export-${Date.now()}`;
        await createWallet(sessionId);
        const result = await requestExport(sessionId);

        expect(result.pending).toBe(true);
        expect(result.message).toContain("Warning");
        expect(result.message).toContain("yes, export my key");
    });

    test("hasPendingExport returns true after request", async () => {
        const sessionId = `test-pending-${Date.now()}`;
        await createWallet(sessionId);
        await requestExport(sessionId);

        expect(hasPendingExport(sessionId)).toBe(true);
    });

    test("confirmExport returns private key", async () => {
        const sessionId = `test-confirm-${Date.now()}`;
        await createWallet(sessionId);
        await requestExport(sessionId);

        const result = await confirmExport(sessionId);
        expect(result.success).toBe(true);
        expect(result.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
        expect(result.message).toContain("Private Key");
    });

    test("confirmExport fails without prior request", async () => {
        const sessionId = `test-no-req-${Date.now()}`;
        await createWallet(sessionId);

        const result = await confirmExport(sessionId);
        expect(result.success).toBe(false);
    });

    test("confirmExport clears pending state", async () => {
        const sessionId = `test-clear-${Date.now()}`;
        await createWallet(sessionId);
        await requestExport(sessionId);
        await confirmExport(sessionId);

        expect(hasPendingExport(sessionId)).toBe(false);
    });

    test("requestExport fails for non-existent session", async () => {
        const result = await requestExport("non-existent-session");
        expect(result.pending).toBe(false);
    });
});

// ─── Token Resolution ───────────────────────────────────

describe("Trading: Token Resolution", () => {
    test("resolves ETH", () => {
        const token = resolveToken("ETH");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("ETH");
        expect(token!.decimals).toBe(18);
    });

    test("resolves USDC (case insensitive)", () => {
        const token = resolveToken("usdc");
        expect(token).toBeDefined();
        expect(token!.symbol).toBe("USDC");
        expect(token!.decimals).toBe(6);
    });

    test("resolves WETH", () => {
        const token = resolveToken("WETH");
        expect(token).toBeDefined();
        expect(token!.address).toBe("0x4200000000000000000000000000000000000006");
    });

    test("rejects unknown contract addresses to prevent decimal assumptions", () => {
        const addr = "0x1234567890abcdef1234567890abcdef12345678";
        const token = resolveToken(addr);
        // Unknown addresses now return undefined to prevent fund loss from wrong decimal assumptions
        expect(token).toBeUndefined();
    });

    test("returns undefined for unknown symbol", () => {
        const token = resolveToken("FAKECOIN");
        expect(token).toBeUndefined();
    });
});
