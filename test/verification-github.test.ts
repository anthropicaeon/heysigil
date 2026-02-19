import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
  getGitHubAuthUrl,
  exchangeGitHubCode,
  getGitHubUser,
  checkRepoPermission,
  verifyGitHubOwnership,
  verifyGitHubFile,
} from "../src/verification/github.js";
import { resetEnv } from "../src/config/env.js";

// Mock environment variables
const mockEnv = {
  GITHUB_CLIENT_ID: "test-client-id",
  GITHUB_CLIENT_SECRET: "test-client-secret",
  BASE_URL: "https://test.example.com",
};

// Mock getEnv before importing
beforeEach(() => {
  // Reset environment cache
  resetEnv();
  // Set mock environment variables
  process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
  process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;
  process.env.BASE_URL = mockEnv.BASE_URL;
  // Reset fetch mock
  globalThis.fetch = mock(() => Promise.resolve(new Response()));
});

// ─── getGitHubAuthUrl ───────────────────────────────────

describe("getGitHubAuthUrl", () => {
  test("generates correct OAuth URL with state", () => {
    // Mock getEnv
    const getEnv = mock(() => mockEnv);
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const state = "test-state-123";
    const url = getGitHubAuthUrl(state);

    expect(url).toContain("https://github.com/login/oauth/authorize");
    expect(url).toContain(`client_id=${mockEnv.GITHUB_CLIENT_ID}`);
    expect(url).toContain(`state=${state}`);
    expect(url).toContain("scope=repo+read%3Aorg");
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent(`${mockEnv.BASE_URL}/api/verify/github/callback`)}`,
    );
  });

  test("includes correct redirect URI", () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const url = getGitHubAuthUrl("state");
    const urlObj = new URL(url);
    const redirectUri = urlObj.searchParams.get("redirect_uri");

    expect(redirectUri).toBe(`${mockEnv.BASE_URL}/api/verify/github/callback`);
  });

  test("includes repo and org scopes", () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const url = getGitHubAuthUrl("state");
    const urlObj = new URL(url);
    const scope = urlObj.searchParams.get("scope");

    expect(scope).toBe("repo read:org");
  });

  test("normalizes redirect URI when BASE_URL contains trailing whitespace/newline", () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.BASE_URL = " https://test.example.com/ \n";

    const url = getGitHubAuthUrl("state");
    const urlObj = new URL(url);
    const redirectUri = urlObj.searchParams.get("redirect_uri");

    expect(redirectUri).toBe("https://test.example.com/api/verify/github/callback");
  });
});

// ─── exchangeGitHubCode ─────────────────────────────────

describe("exchangeGitHubCode", () => {
  test("exchanges code for access token", async () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;

    const mockToken = "gho_test_token_123";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: mockToken,
            token_type: "bearer",
            scope: "repo",
          }),
          { status: 200 },
        ),
      ),
    );

    const token = await exchangeGitHubCode("test-code");
    expect(token).toBe(mockToken);
  });

  test("throws error when access token is missing", async () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: "bad_verification_code",
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(exchangeGitHubCode("invalid-code")).rejects.toThrow(
      "Failed to exchange GitHub OAuth code",
    );
  });

  test("sends correct request to GitHub", async () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;

    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: "token",
            token_type: "bearer",
            scope: "repo",
          }),
        ),
      ),
    );
    globalThis.fetch = fetchMock;

    await exchangeGitHubCode("test-code");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://github.com/login/oauth/access_token",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
    );
  });
});

// ─── getGitHubUser ──────────────────────────────────────

describe("getGitHubUser", () => {
  test("fetches user info with access token", async () => {
    const mockUser = {
      login: "testuser",
      id: 12345,
      name: "Test User",
    };

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockUser), { status: 200 }),
      ),
    );

    const user = await getGitHubUser("test-token");
    expect(user.login).toBe("testuser");
    expect(user.id).toBe(12345);
  });

  test("throws error on API failure", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Unauthorized", { status: 401 }),
      ),
    );

    await expect(getGitHubUser("invalid-token")).rejects.toThrow(
      "GitHub API error: 401",
    );
  });

  test("sends correct authorization header", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ login: "user", id: 1 }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock;

    await getGitHubUser("test-token-123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/user",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer test-token-123",
          Accept: "application/vnd.github+json",
        },
      }),
    );
  });
});

// ─── checkRepoPermission ────────────────────────────────

describe("checkRepoPermission", () => {
  test("returns admin permission", async () => {
    const mockPermission = {
      permission: "admin",
      role_name: "admin",
    };

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockPermission), { status: 200 }),
      ),
    );

    const result = await checkRepoPermission(
      "token",
      "owner",
      "repo",
      "username",
    );
    expect(result.permission).toBe("admin");
    expect(result.role_name).toBe("admin");
  });

  test("returns write permission", async () => {
    const mockPermission = {
      permission: "write",
      role_name: "contributor",
    };

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockPermission), { status: 200 }),
      ),
    );

    const result = await checkRepoPermission(
      "token",
      "owner",
      "repo",
      "username",
    );
    expect(result.permission).toBe("write");
  });

  test("throws error on API failure", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Not Found", { status: 404 }),
      ),
    );

    await expect(
      checkRepoPermission("token", "owner", "repo", "username"),
    ).rejects.toThrow("GitHub API error: 404");
  });

  test("constructs correct API URL", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ permission: "admin", role_name: "admin" }),
          { status: 200 },
        ),
      ),
    );
    globalThis.fetch = fetchMock;

    await checkRepoPermission("token", "testowner", "testrepo", "testuser");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/testowner/testrepo/collaborators/testuser/permission",
      expect.any(Object),
    );
  });
});

// ─── verifyGitHubOwnership ──────────────────────────────

describe("verifyGitHubOwnership", () => {
  test("returns error for invalid project ID format", async () => {
    const result = await verifyGitHubOwnership("code", "invalid");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid project ID");
    expect(result.method).toBe("github_oauth");
  });

  test("returns error for project ID with too many parts", async () => {
    const result = await verifyGitHubOwnership("code", "owner/repo/extra");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid project ID");
  });

  test("successfully verifies admin ownership", async () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      // First call: exchange code
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              scope: "repo",
            }),
          ),
        );
      }
      // Second call: get user
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              login: "testuser",
              id: 12345,
            }),
          ),
        );
      }
      // Third call: check permission
      return Promise.resolve(
        new Response(
          JSON.stringify({
            permission: "admin",
            role_name: "admin",
          }),
        ),
      );
    });

    const result = await verifyGitHubOwnership("test-code", "owner/repo");
    expect(result.success).toBe(true);
    expect(result.method).toBe("github_oauth");
    expect(result.platformUsername).toBe("testuser");
    expect(result.proof).toMatchObject({
      githubUserId: 12345,
      permission: "admin",
      roleName: "admin",
    });
    expect(result.error).toBeUndefined();
  });

  test("fails when user has write permission (not admin)", async () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              scope: "repo",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              login: "contributor",
              id: 67890,
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            permission: "write",
            role_name: "contributor",
          }),
        ),
      );
    });

    const result = await verifyGitHubOwnership("test-code", "owner/repo");
    expect(result.success).toBe(false);
    expect(result.error).toContain("has 'write' permission, needs 'admin'");
    expect(result.platformUsername).toBe("contributor");
  });

  test("handles OAuth code exchange failure", async () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: "bad_verification_code",
          }),
        ),
      ),
    );

    const result = await verifyGitHubOwnership("invalid-code", "owner/repo");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to exchange GitHub OAuth code");
  });

  test("handles user fetch failure", async () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              scope: "repo",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response("Unauthorized", { status: 401 }),
      );
    });

    const result = await verifyGitHubOwnership("test-code", "owner/repo");
    expect(result.success).toBe(false);
    expect(result.error).toContain("GitHub API error: 401");
  });

  test("handles permission check failure", async () => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = mockEnv.GITHUB_CLIENT_SECRET;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
              scope: "repo",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              login: "testuser",
              id: 12345,
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response("Not Found", { status: 404 }),
      );
    });

    const result = await verifyGitHubOwnership("test-code", "owner/repo");
    expect(result.success).toBe(false);
    expect(result.error).toContain("GitHub API error: 404");
  });
});

// ─── verifyGitHubFile ───────────────────────────────────

describe("verifyGitHubFile", () => {
  test("returns error for invalid project ID format", async () => {
    const result = await verifyGitHubFile("invalid", "code123", "0x123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid project ID");
    expect(result.method).toBe("github_file");
  });

  test("successfully verifies with matching code and wallet", async () => {
    const fileContent = "verification-code=abc123\nwallet-address=0xABCD1234";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0xABCD1234");
    expect(result.success).toBe(true);
    expect(result.method).toBe("github_file");
    expect(result.projectId).toBe("owner/repo");
    expect(result.proof).toMatchObject({
      fileContent,
    });
  });

  test("returns error when file not found", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Not Found", { status: 404 }),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "code", "0x123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Verification file not found");
    expect(result.error).toContain(".well-known/pool-claim.txt");
  });

  test("returns error on API failure (non-404)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Server Error", { status: 500 }),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "code", "0x123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("GitHub API error: 500");
  });

  test("returns error when verification code does not match", async () => {
    const fileContent = "verification-code=wrong123\nwallet-address=0x123";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "correct123", "0x123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Verification code does not match");
  });

  test("returns error when wallet address does not match", async () => {
    const fileContent = "verification-code=abc123\nwallet-address=0xWRONG";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0xCORRECT");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Wallet address does not match");
  });

  test("matches wallet addresses case-insensitively", async () => {
    const fileContent = "verification-code=abc123\nwallet-address=0xAbCd1234";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0xABCD1234");
    expect(result.success).toBe(true);
  });

  test("handles file with extra whitespace", async () => {
    const fileContent = "  verification-code=abc123  \n  wallet-address=0x123  \n";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0x123");
    expect(result.success).toBe(true);
  });

  test("handles file with empty lines", async () => {
    const fileContent = "\nverification-code=abc123\n\nwallet-address=0x123\n\n";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0x123");
    expect(result.success).toBe(true);
  });

  test("handles file with additional comments or content", async () => {
    const fileContent = "# Pool Claim Verification\nverification-code=abc123\nwallet-address=0x123\n# End";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0x123");
    expect(result.success).toBe(true);
  });

  test("constructs correct API URL", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response("Not Found", { status: 404 }),
      ),
    );
    globalThis.fetch = fetchMock;

    await verifyGitHubFile("testowner/testrepo", "code", "0x123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/testowner/testrepo/contents/.well-known/pool-claim.txt",
      expect.objectContaining({
        headers: { Accept: "application/vnd.github+json" },
      }),
    );
  });

  test("handles fetch errors", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Network error")),
    );

    const result = await verifyGitHubFile("owner/repo", "code", "0x123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });

  test("handles non-Error exceptions", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject("String error"),
    );

    const result = await verifyGitHubFile("owner/repo", "code", "0x123");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unknown error");
  });
});

// ─── Edge Cases ─────────────────────────────────────────

describe("verifyGitHubFile — edge cases", () => {
  test("handles missing verification code line", async () => {
    const fileContent = "wallet-address=0x123";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0x123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Verification code does not match");
  });

  test("handles missing wallet address line", async () => {
    const fileContent = "verification-code=abc123";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0x123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Wallet address does not match");
  });

  test("handles malformed key=value pairs", async () => {
    const fileContent = "verification-code\nwallet-address";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0x123");
    expect(result.success).toBe(false);
  });

  test("handles empty file", async () => {
    const fileContent = "";
    const encodedContent = Buffer.from(fileContent).toString("base64");

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: encodedContent,
            encoding: "base64",
          }),
        ),
      ),
    );

    const result = await verifyGitHubFile("owner/repo", "abc123", "0x123");
    expect(result.success).toBe(false);
  });
});
