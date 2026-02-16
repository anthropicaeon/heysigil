import { describe, test, expect, mock, beforeEach } from "bun:test";
import { createTweetChallenge, verifyTweetProof } from "../src/verification/tweet.js";

// Mock the Reclaim SDK
const mockVerifyProof = mock(() => Promise.resolve(true));
mock.module("@reclaimprotocol/js-sdk", () => ({
  verifyProof: mockVerifyProof,
}));

// ─── createTweetChallenge ───────────────────────────────

describe("createTweetChallenge", () => {
  test("generates a challenge with correct structure", () => {
    const result = createTweetChallenge("testproject", "0x1234");

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("challengeCode");
    expect(result).toHaveProperty("method");
    expect(result).toHaveProperty("projectId");
    expect(result).toHaveProperty("instructions");

    expect(result.method).toBe("tweet_zktls");
    expect(result.projectId).toBe("testproject");
  });

  test("generates challenge code with correct format", () => {
    const result = createTweetChallenge("myproject", "0xabcd");

    expect(result.challengeCode).toMatch(/^claim-[0-9a-f]{12}$/);
  });

  test("generates unique IDs", () => {
    const result1 = createTweetChallenge("proj1", "0x1");
    const result2 = createTweetChallenge("proj1", "0x1");

    expect(result1.id).not.toBe(result2.id);
    expect(result1.challengeCode).not.toBe(result2.challengeCode);
  });

  test("includes project ID in instructions", () => {
    const result = createTweetChallenge("coolproject", "0x5678");

    expect(result.instructions).toContain("@coolproject");
  });

  test("includes wallet address in instructions", () => {
    const walletAddr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    const result = createTweetChallenge("myproject", walletAddr);

    expect(result.instructions).toContain(walletAddr);
  });

  test("includes challenge code in instructions", () => {
    const result = createTweetChallenge("proj", "0x1234");

    expect(result.instructions).toContain(result.challengeCode);
  });

  test("includes Reclaim Protocol in instructions", () => {
    const result = createTweetChallenge("proj", "0x1234");

    expect(result.instructions).toContain("Reclaim Protocol");
  });
});

// ─── verifyTweetProof - Basic Validation ────────────────

describe("verifyTweetProof — basic validation", () => {
  beforeEach(() => {
    mockVerifyProof.mockClear();
    mockVerifyProof.mockResolvedValue(true);
  });

  test("rejects mismatched challenge code", async () => {
    const result = await verifyTweetProof(
      {
        proofData: "{}",
        provider: "reclaim",
        challengeCode: "claim-wrong",
      },
      "testproject",
      "claim-expected",
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Challenge code mismatch");
  });

  test("rejects unsupported provider", async () => {
    const result = await verifyTweetProof(
      {
        proofData: "{}",
        provider: "unknown" as any,
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsupported zkTLS provider");
  });
});

// ─── verifyTweetProof - Reclaim Provider ────────────────

describe("verifyTweetProof — Reclaim provider", () => {
  beforeEach(() => {
    mockVerifyProof.mockClear();
    mockVerifyProof.mockResolvedValue(true);
  });

  test("rejects invalid JSON proof data", async () => {
    const result = await verifyTweetProof(
      {
        proofData: "not valid json{",
        provider: "reclaim",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid proof data");
  });

  test("rejects proof when SDK verification fails", async () => {
    mockVerifyProof.mockResolvedValueOnce(false);

    const validProof = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "Test tweet claim-123",
        },
        timestampS: Math.floor(Date.now() / 1000),
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("signature verification failed");
  });

  test("rejects proof when SDK throws error", async () => {
    mockVerifyProof.mockRejectedValueOnce(new Error("SDK error"));

    const validProof = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "Test tweet claim-123",
        },
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("SDK error");
  });

  test("rejects proof without tweet text", async () => {
    const proofWithoutText = {
      claimData: {
        extractedParameterValues: {},
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(proofWithoutText),
        provider: "reclaim",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Could not extract tweet text");
  });

  test("rejects proof when tweet doesn't contain challenge code", async () => {
    const proofWithWrongCode = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "This is a tweet but without the code",
        },
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(proofWithWrongCode),
        provider: "reclaim",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("does not contain the expected challenge code");
  });

  test("rejects expired proof (older than 1 hour)", async () => {
    const twoHoursAgo = Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000);

    const expiredProof = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "Test tweet claim-123",
        },
        timestampS: twoHoursAgo,
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(expiredProof),
        provider: "reclaim",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Proof is too old");
  });

  test("accepts valid proof with tweet_text in extractedParameterValues", async () => {
    const validProof = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "Verifying ownership. Code: claim-abc123 Wallet: 0x1234",
        },
        timestampS: Math.floor(Date.now() / 1000),
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-abc123",
      },
      "testproject",
      "claim-abc123",
    );

    expect(result.success).toBe(true);
    expect(result.method).toBe("tweet_zktls");
    expect(result.projectId).toBe("testproject");
    expect(result.proof?.provider).toBe("reclaim");
    expect(result.proof?.verified).toBe(true);
  });

  test("accepts valid proof with text field (alternative field name)", async () => {
    const validProof = {
      claimData: {
        extractedParameterValues: {
          text: "Tweet with code: claim-xyz789",
        },
        timestampS: Math.floor(Date.now() / 1000),
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-xyz789",
      },
      "myproject",
      "claim-xyz789",
    );

    expect(result.success).toBe(true);
  });

  test("extracts username from extractedParameterValues", async () => {
    const validProof = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "Code: claim-user123",
          username: "testuser",
        },
        timestampS: Math.floor(Date.now() / 1000),
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-user123",
      },
      "testproject",
      "claim-user123",
    );

    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("testuser");
  });

  test("extracts username from author field (alternative field name)", async () => {
    const validProof = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "Code: claim-auth456",
          author: "authorname",
        },
        timestampS: Math.floor(Date.now() / 1000),
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-auth456",
      },
      "testproject",
      "claim-auth456",
    );

    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("authorname");
  });

  test("handles proof with context as JSON string", async () => {
    const validProof = {
      claimData: {
        context: JSON.stringify({
          extractedParameters: {
            tweet_text: "Context tweet claim-ctx789",
          },
        }),
        extractedParameterValues: {},
        timestampS: Math.floor(Date.now() / 1000),
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-ctx789",
      },
      "testproject",
      "claim-ctx789",
    );

    expect(result.success).toBe(true);
  });

  test("handles proof with claim instead of claimData", async () => {
    const validProof = {
      claim: {
        extractedParameterValues: {
          tweet_text: "Alternative structure claim-alt999",
        },
        timestampS: Math.floor(Date.now() / 1000),
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-alt999",
      },
      "testproject",
      "claim-alt999",
    );

    expect(result.success).toBe(true);
  });

  test("accepts proof without timestamp (for backwards compatibility)", async () => {
    const validProof = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "No timestamp claim-notime",
        },
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-notime",
      },
      "testproject",
      "claim-notime",
    );

    expect(result.success).toBe(true);
    expect(result.proof?.proofTimestamp).toBeUndefined();
  });

  test("includes timestamp in successful result", async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const validProof = {
      claimData: {
        extractedParameterValues: {
          tweet_text: "Timestamped claim-time123",
        },
        timestampS: timestamp,
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(validProof),
        provider: "reclaim",
        challengeCode: "claim-time123",
      },
      "testproject",
      "claim-time123",
    );

    expect(result.success).toBe(true);
    expect(result.proof?.proofTimestamp).toBe(timestamp * 1000);
  });
});

// ─── verifyTweetProof - Opacity Provider ────────────────

describe("verifyTweetProof — Opacity provider", () => {
  test("returns not implemented error", async () => {
    const result = await verifyTweetProof(
      {
        proofData: "{}",
        provider: "opacity",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("not yet implemented");
    expect(result.error).toContain("Opacity");
  });
});

// ─── verifyTweetProof - vlayer Provider ─────────────────

describe("verifyTweetProof — vlayer provider", () => {
  test("returns not implemented error", async () => {
    const result = await verifyTweetProof(
      {
        proofData: "{}",
        provider: "vlayer",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("not yet implemented");
    expect(result.error).toContain("vlayer");
  });
});

// ─── Edge Cases ─────────────────────────────────────────

describe("verifyTweetProof — edge cases", () => {
  beforeEach(() => {
    mockVerifyProof.mockClear();
    mockVerifyProof.mockResolvedValue(true);
  });

  test("handles malformed context JSON gracefully", async () => {
    const proofWithBadContext = {
      claimData: {
        context: "not valid json{",
        extractedParameterValues: {
          tweet_text: "Fallback to extracted params claim-fallback",
        },
        timestampS: Math.floor(Date.now() / 1000),
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(proofWithBadContext),
        provider: "reclaim",
        challengeCode: "claim-fallback",
      },
      "testproject",
      "claim-fallback",
    );

    expect(result.success).toBe(true);
  });

  test("preserves projectId in all results", async () => {
    const result = await verifyTweetProof(
      {
        proofData: "invalid",
        provider: "reclaim",
        challengeCode: "claim-123",
      },
      "my-special-project",
      "claim-123",
    );

    expect(result.projectId).toBe("my-special-project");
  });

  test("handles empty extractedParameterValues", async () => {
    const emptyProof = {
      claimData: {
        extractedParameterValues: {},
        context: "{}",
      },
    };

    const result = await verifyTweetProof(
      {
        proofData: JSON.stringify(emptyProof),
        provider: "reclaim",
        challengeCode: "claim-123",
      },
      "testproject",
      "claim-123",
    );

    expect(result.success).toBe(false);
  });
});
