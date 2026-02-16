import { describe, test, expect, mock, beforeEach } from "bun:test";
import { parseUserMessage } from "../src/agent/parser.js";
import type { ParsedAction } from "../src/agent/types.js";

// Mock the Anthropic SDK
const mockMessagesCreate = mock(() => Promise.resolve({
  content: [{ type: "text", text: "" }],
}));

mock.module("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: mockMessagesCreate,
    };
  },
}));

// Helper to set mock response
function mockClaudeResponse(response: Partial<ParsedAction>) {
  const mockResponse = {
    intent: response.intent || "unknown",
    params: response.params || {},
    confidence: response.confidence || 0.5,
  };

  mockMessagesCreate.mockResolvedValueOnce({
    content: [{ type: "text", text: JSON.stringify(mockResponse) }],
  });
}

// ─── Swap Intent ────────────────────────────────────────

describe("parseUserMessage — swap", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("basic swap command", async () => {
    mockClaudeResponse({
      intent: "swap",
      params: { fromToken: "ETH", toToken: "USDC", amount: "0.1", chain: "base" },
      confidence: 0.95,
    });

    const result = await parseUserMessage("swap 0.1 ETH to USDC");

    expect(result.intent).toBe("swap");
    expect(result.params.fromToken).toBe("ETH");
    expect(result.params.toToken).toBe("USDC");
    expect(result.params.amount).toBe("0.1");
    expect(result.params.chain).toBe("base");
    expect(result.confidence).toBe(0.95);
    expect(result.rawText).toBe("swap 0.1 ETH to USDC");
  });

  test("swap with explicit chain", async () => {
    mockClaudeResponse({
      intent: "swap",
      params: { fromToken: "USDC", toToken: "DAI", amount: "100", chain: "ethereum" },
      confidence: 0.9,
    });

    const result = await parseUserMessage("swap 100 USDC to DAI on ethereum");

    expect(result.params.chain).toBe("ethereum");
  });

  test("natural language swap", async () => {
    mockClaudeResponse({
      intent: "swap",
      params: { fromToken: "ETH", toToken: "WBTC", amount: "1", chain: "base" },
      confidence: 0.85,
    });

    const result = await parseUserMessage("I want to exchange 1 ETH for WBTC");

    expect(result.intent).toBe("swap");
  });
});

// ─── Bridge Intent ──────────────────────────────────────

describe("parseUserMessage — bridge", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("basic bridge command", async () => {
    mockClaudeResponse({
      intent: "bridge",
      params: { token: "USDC", amount: "100", fromChain: "base", toChain: "ethereum" },
      confidence: 0.92,
    });

    const result = await parseUserMessage("bridge 100 USDC from base to ethereum");

    expect(result.intent).toBe("bridge");
    expect(result.params.token).toBe("USDC");
    expect(result.params.fromChain).toBe("base");
    expect(result.params.toChain).toBe("ethereum");
  });
});

// ─── Send Intent ────────────────────────────────────────

describe("parseUserMessage — send", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("send to address", async () => {
    mockClaudeResponse({
      intent: "send",
      params: {
        token: "ETH",
        amount: "0.5",
        toAddress: "0x1234567890abcdef1234567890abcdef12345678",
        chain: "base"
      },
      confidence: 0.9,
    });

    const result = await parseUserMessage("send 0.5 ETH to 0x1234567890abcdef1234567890abcdef12345678");

    expect(result.intent).toBe("send");
    expect(result.params.toAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
  });
});

// ─── Balance Intent ─────────────────────────────────────

describe("parseUserMessage — balance", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("check balance without params", async () => {
    mockClaudeResponse({
      intent: "balance",
      params: {},
      confidence: 0.95,
    });

    const result = await parseUserMessage("what's my balance?");

    expect(result.intent).toBe("balance");
  });

  test("check balance with chain", async () => {
    mockClaudeResponse({
      intent: "balance",
      params: { chain: "base" },
      confidence: 0.9,
    });

    const result = await parseUserMessage("check my balance on base");

    expect(result.params.chain).toBe("base");
  });

  test("check balance with token", async () => {
    mockClaudeResponse({
      intent: "balance",
      params: { token: "USDC", chain: "base" },
      confidence: 0.9,
    });

    const result = await parseUserMessage("how much USDC do I have?");

    expect(result.params.token).toBe("USDC");
  });
});

// ─── Price Intent ───────────────────────────────────────

describe("parseUserMessage — price", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("get token price", async () => {
    mockClaudeResponse({
      intent: "price",
      params: { token: "ETH" },
      confidence: 0.95,
    });

    const result = await parseUserMessage("what's the price of ETH?");

    expect(result.intent).toBe("price");
    expect(result.params.token).toBe("ETH");
  });
});

// ─── Launch Token Intent ────────────────────────────────

describe("parseUserMessage — launch_token", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("launch token with GitHub link", async () => {
    mockClaudeResponse({
      intent: "launch_token",
      params: {
        name: "MyToken",
        symbol: "MTK",
        description: "A cool token",
        devLinks: ["https://github.com/org/repo"]
      },
      confidence: 0.88,
    });

    const result = await parseUserMessage(
      "launch a token called MyToken (MTK) for https://github.com/org/repo"
    );

    expect(result.intent).toBe("launch_token");
    expect(result.params.devLinks).toContain("https://github.com/org/repo");
  });

  test("launch token with multiple links", async () => {
    mockClaudeResponse({
      intent: "launch_token",
      params: {
        name: "DevToken",
        symbol: "DEV",
        description: "Developer token",
        devLinks: [
          "https://github.com/dev/project",
          "https://instagram.com/dev_handle",
          "https://mysite.dev"
        ]
      },
      confidence: 0.85,
    });

    const result = await parseUserMessage(
      "create token DevToken (DEV) for https://github.com/dev/project @dev_handle and mysite.dev"
    );

    expect(result.params.devLinks).toHaveLength(3);
  });
});

// ─── Verify Project Intent ──────────────────────────────

describe("parseUserMessage — verify_project", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("verify GitHub project", async () => {
    mockClaudeResponse({
      intent: "verify_project",
      params: { link: "https://github.com/org/repo" },
      confidence: 0.92,
    });

    const result = await parseUserMessage("verify https://github.com/org/repo");

    expect(result.intent).toBe("verify_project");
    expect(result.params.link).toBe("https://github.com/org/repo");
  });

  test("verify Instagram handle", async () => {
    mockClaudeResponse({
      intent: "verify_project",
      params: { link: "@dev_handle" },
      confidence: 0.9,
    });

    const result = await parseUserMessage("verify my instagram @dev_handle");

    expect(result.params.link).toBe("@dev_handle");
  });

  test("verify domain", async () => {
    mockClaudeResponse({
      intent: "verify_project",
      params: { link: "mysite.dev" },
      confidence: 0.88,
    });

    const result = await parseUserMessage("verify ownership of mysite.dev");

    expect(result.params.link).toBe("mysite.dev");
  });
});

// ─── Claim Reward Intent ────────────────────────────────

describe("parseUserMessage — claim_reward", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("claim project rewards", async () => {
    mockClaudeResponse({
      intent: "claim_reward",
      params: { projectId: "proj_abc123" },
      confidence: 0.9,
    });

    const result = await parseUserMessage("claim rewards for proj_abc123");

    expect(result.intent).toBe("claim_reward");
    expect(result.params.projectId).toBe("proj_abc123");
  });
});

// ─── Pool Status Intent ─────────────────────────────────

describe("parseUserMessage — pool_status", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("check pool status", async () => {
    mockClaudeResponse({
      intent: "pool_status",
      params: { projectId: "proj_xyz789" },
      confidence: 0.92,
    });

    const result = await parseUserMessage("check pool status for proj_xyz789");

    expect(result.intent).toBe("pool_status");
    expect(result.params.projectId).toBe("proj_xyz789");
  });
});

// ─── Help Intent ────────────────────────────────────────

describe("parseUserMessage — help", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("general help", async () => {
    mockClaudeResponse({
      intent: "help",
      params: {},
      confidence: 0.95,
    });

    const result = await parseUserMessage("help");

    expect(result.intent).toBe("help");
  });

  test("greeting message", async () => {
    mockClaudeResponse({
      intent: "help",
      params: {},
      confidence: 0.9,
    });

    const result = await parseUserMessage("hello!");

    expect(result.intent).toBe("help");
  });

  test("help with topic", async () => {
    mockClaudeResponse({
      intent: "help",
      params: { topic: "swapping" },
      confidence: 0.88,
    });

    const result = await parseUserMessage("how do I swap tokens?");

    expect(result.intent).toBe("help");
    expect(result.params.topic).toBe("swapping");
  });
});

// ─── Unknown Intent ─────────────────────────────────────

describe("parseUserMessage — unknown", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("unclear message", async () => {
    mockClaudeResponse({
      intent: "unknown",
      params: {},
      confidence: 0.3,
    });

    const result = await parseUserMessage("asdfghjkl");

    expect(result.intent).toBe("unknown");
    expect(result.confidence).toBeLessThan(0.5);
  });
});

// ─── Conversation Context ───────────────────────────────

describe("parseUserMessage — with context", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("uses conversation context", async () => {
    mockClaudeResponse({
      intent: "swap",
      params: { fromToken: "ETH", toToken: "USDC", amount: "1", chain: "base" },
      confidence: 0.92,
    });

    const context = "User previously asked about token prices.";
    const result = await parseUserMessage("swap 1 ETH for USDC", context);

    expect(result.intent).toBe("swap");
    expect(mockMessagesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining(context),
          }),
        ]),
      })
    );
  });

  test("follow-up message benefits from context", async () => {
    mockClaudeResponse({
      intent: "balance",
      params: { token: "USDC" },
      confidence: 0.85,
    });

    const context = "User just swapped ETH to USDC.";
    const result = await parseUserMessage("how much do I have now?", context);

    expect(result.intent).toBe("balance");
  });
});

// ─── Error Handling ─────────────────────────────────────

describe("parseUserMessage — error handling", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("handles API error gracefully", async () => {
    mockMessagesCreate.mockRejectedValueOnce(new Error("API Error"));

    const result = await parseUserMessage("swap ETH to USDC");

    expect(result.intent).toBe("unknown");
    expect(result.confidence).toBe(0);
    expect(result.rawText).toBe("swap ETH to USDC");
  });

  test("handles invalid JSON response", async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "not valid json{" }],
    });

    const result = await parseUserMessage("swap ETH to USDC");

    expect(result.intent).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  test("handles non-text response", async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: "image" }],
    });

    const result = await parseUserMessage("swap ETH to USDC");

    expect(result.intent).toBe("unknown");
  });

  test("handles missing confidence in response", async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{
        type: "text",
        text: JSON.stringify({ intent: "balance", params: {} })
      }],
    });

    const result = await parseUserMessage("check balance");

    expect(result.confidence).toBe(0.5); // default
  });

  test("handles missing params in response", async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{
        type: "text",
        text: JSON.stringify({ intent: "help", confidence: 0.9 })
      }],
    });

    const result = await parseUserMessage("help");

    expect(result.params).toEqual({}); // default empty object
  });
});

// ─── Edge Cases ─────────────────────────────────────────

describe("parseUserMessage — edge cases", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("empty message", async () => {
    mockClaudeResponse({
      intent: "unknown",
      params: {},
      confidence: 0,
    });

    const result = await parseUserMessage("");

    expect(result.rawText).toBe("");
  });

  test("whitespace-only message", async () => {
    mockClaudeResponse({
      intent: "unknown",
      params: {},
      confidence: 0,
    });

    const result = await parseUserMessage("   ");

    expect(result.rawText).toBe("   ");
  });

  test("very long message", async () => {
    const longMessage = "swap ".repeat(100) + "ETH to USDC";

    mockClaudeResponse({
      intent: "swap",
      params: { fromToken: "ETH", toToken: "USDC", amount: "1", chain: "base" },
      confidence: 0.8,
    });

    const result = await parseUserMessage(longMessage);

    expect(result.intent).toBe("swap");
    expect(result.rawText).toBe(longMessage);
  });

  test("preserves original message text", async () => {
    const originalMessage = "SwAp 0.1 eth TO usdc";

    mockClaudeResponse({
      intent: "swap",
      params: { fromToken: "ETH", toToken: "USDC", amount: "0.1", chain: "base" },
      confidence: 0.9,
    });

    const result = await parseUserMessage(originalMessage);

    expect(result.rawText).toBe(originalMessage);
  });
});

// ─── Confidence Scores ──────────────────────────────────

describe("parseUserMessage — confidence scores", () => {
  beforeEach(() => {
    mockMessagesCreate.mockClear();
  });

  test("high confidence for clear commands", async () => {
    mockClaudeResponse({
      intent: "swap",
      params: { fromToken: "ETH", toToken: "USDC", amount: "1", chain: "base" },
      confidence: 0.98,
    });

    const result = await parseUserMessage("swap 1 ETH to USDC");

    expect(result.confidence).toBeGreaterThan(0.9);
  });

  test("low confidence for ambiguous commands", async () => {
    mockClaudeResponse({
      intent: "unknown",
      params: {},
      confidence: 0.2,
    });

    const result = await parseUserMessage("maybe do something");

    expect(result.confidence).toBeLessThan(0.5);
  });

  test("medium confidence for partial information", async () => {
    mockClaudeResponse({
      intent: "swap",
      params: { fromToken: "ETH", chain: "base" },
      confidence: 0.6,
    });

    const result = await parseUserMessage("swap ETH");

    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.confidence).toBeLessThan(0.9);
  });
});
