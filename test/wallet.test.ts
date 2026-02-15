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
    test("creates a wallet for a new session", () => {
        const sessionId = `test-create-${Date.now()}`;
        const wallet = createWallet(sessionId);

        expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(wallet.sessionId).toBe(sessionId);
        expect(wallet.createdAt).toBeInstanceOf(Date);
    });

    test("returns same wallet on second call for same session", () => {
        const sessionId = `test-idempotent-${Date.now()}`;
        const w1 = createWallet(sessionId);
        const w2 = createWallet(sessionId);

        expect(w1.address).toBe(w2.address);
    });

    test("creates different wallets for different sessions", () => {
        const w1 = createWallet(`test-diff-1-${Date.now()}`);
        const w2 = createWallet(`test-diff-2-${Date.now()}`);

        expect(w1.address).not.toBe(w2.address);
    });

    test("hasWallet returns true after creation", () => {
        const sessionId = `test-has-${Date.now()}`;
        expect(hasWallet(sessionId)).toBe(false);
        createWallet(sessionId);
        expect(hasWallet(sessionId)).toBe(true);
    });

    test("getAddress returns correct address", () => {
        const sessionId = `test-addr-${Date.now()}`;
        const wallet = createWallet(sessionId);
        expect(getAddress(sessionId)).toBe(wallet.address);
    });
});

// ─── Private Key Export ─────────────────────────────────

describe("Wallet: Key Export", () => {
    test("requestExport returns pending state with warning", () => {
        const sessionId = `test-export-${Date.now()}`;
        createWallet(sessionId);
        const result = requestExport(sessionId);

        expect(result.pending).toBe(true);
        expect(result.message).toContain("Warning");
        expect(result.message).toContain("yes, export my key");
    });

    test("hasPendingExport returns true after request", () => {
        const sessionId = `test-pending-${Date.now()}`;
        createWallet(sessionId);
        requestExport(sessionId);

        expect(hasPendingExport(sessionId)).toBe(true);
    });

    test("confirmExport returns private key", () => {
        const sessionId = `test-confirm-${Date.now()}`;
        createWallet(sessionId);
        requestExport(sessionId);

        const result = confirmExport(sessionId);
        expect(result.success).toBe(true);
        expect(result.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
        expect(result.message).toContain("Private Key");
    });

    test("confirmExport fails without prior request", () => {
        const sessionId = `test-no-req-${Date.now()}`;
        createWallet(sessionId);

        const result = confirmExport(sessionId);
        expect(result.success).toBe(false);
    });

    test("confirmExport clears pending state", () => {
        const sessionId = `test-clear-${Date.now()}`;
        createWallet(sessionId);
        requestExport(sessionId);
        confirmExport(sessionId);

        expect(hasPendingExport(sessionId)).toBe(false);
    });

    test("requestExport fails for non-existent session", () => {
        const result = requestExport("non-existent-session");
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

    test("resolves contract address", () => {
        const addr = "0x1234567890abcdef1234567890abcdef12345678";
        const token = resolveToken(addr);
        expect(token).toBeDefined();
        expect(token!.address).toBe(addr);
    });

    test("returns undefined for unknown symbol", () => {
        const token = resolveToken("FAKECOIN");
        expect(token).toBeUndefined();
    });
});
