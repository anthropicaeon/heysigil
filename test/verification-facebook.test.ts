import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
  getFacebookAuthUrl,
  exchangeFacebookCode,
  verifyFacebookOwnership,
} from "../src/verification/facebook.js";
import { resetEnv } from "../src/config/env.js";

// Mock environment variables
const mockEnv = {
  FACEBOOK_APP_ID: "test-app-id",
  FACEBOOK_APP_SECRET: "test-app-secret",
  BASE_URL: "https://test.example.com",
};

// Set up environment variables and reset fetch mock before each test
beforeEach(() => {
  // Reset environment cache
  resetEnv();
  // Set mock environment variables
  process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
  process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
  process.env.BASE_URL = mockEnv.BASE_URL;

  globalThis.fetch = mock(() => Promise.resolve(new Response()));
});

// ─── getFacebookAuthUrl ─────────────────────────────────

describe("getFacebookAuthUrl", () => {
  test("generates correct OAuth URL with state", () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const state = "test-state-123";
    const url = getFacebookAuthUrl(state);

    expect(url).toContain("https://www.facebook.com/v21.0/dialog/oauth");
    expect(url).toContain(`client_id=${mockEnv.FACEBOOK_APP_ID}`);
    expect(url).toContain(`state=${state}`);
    expect(url).toContain("scope=pages_show_list%2Cpages_read_engagement");
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent(`${mockEnv.BASE_URL}/api/verify/facebook/callback`)}`,
    );
  });

  test("includes correct redirect URI", () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const url = getFacebookAuthUrl("state");
    const urlObj = new URL(url);
    const redirectUri = urlObj.searchParams.get("redirect_uri");

    expect(redirectUri).toBe(`${mockEnv.BASE_URL}/api/verify/facebook/callback`);
  });

  test("includes correct scopes", () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const url = getFacebookAuthUrl("state");
    const urlObj = new URL(url);
    const scope = urlObj.searchParams.get("scope");

    expect(scope).toBe("pages_show_list,pages_read_engagement");
  });

  test("uses Facebook Graph API v21.0", () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const url = getFacebookAuthUrl("state");
    expect(url).toContain("v21.0");
  });
});

// ─── exchangeFacebookCode ───────────────────────────────

describe("exchangeFacebookCode", () => {
  test("exchanges code for access token", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const mockToken = "fb_test_token_123";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: mockToken,
            token_type: "bearer",
            expires_in: 5184000,
          }),
          { status: 200 },
        ),
      ),
    );

    const token = await exchangeFacebookCode("test-code");
    expect(token).toBe(mockToken);
  });

  test("throws error when access token is missing", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: "Invalid verification code",
              type: "OAuthException",
              code: 100,
            },
          }),
          { status: 400 },
        ),
      ),
    );

    await expect(exchangeFacebookCode("invalid-code")).rejects.toThrow(
      "Failed to exchange Facebook OAuth code",
    );
  });

  test("sends correct request to Facebook", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: "token",
            token_type: "bearer",
          }),
        ),
      ),
    );
    globalThis.fetch = fetchMock;

    await exchangeFacebookCode("test-code");

    const callUrl = (fetchMock as any).mock.calls[0][0];
    expect(callUrl).toContain("https://graph.facebook.com/v21.0/oauth/access_token");
    expect(callUrl).toContain(`client_id=${mockEnv.FACEBOOK_APP_ID}`);
    expect(callUrl).toContain(`client_secret=${mockEnv.FACEBOOK_APP_SECRET}`);
    expect(callUrl).toContain("code=test-code");
  });

  test("includes redirect URI in token exchange", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: "token",
            token_type: "bearer",
          }),
        ),
      ),
    );
    globalThis.fetch = fetchMock;

    await exchangeFacebookCode("test-code");

    const callUrl = (fetchMock as any).mock.calls[0][0];
    expect(callUrl).toContain(
      encodeURIComponent(`${mockEnv.BASE_URL}/api/verify/facebook/callback`),
    );
  });
});

// ─── verifyFacebookOwnership ────────────────────────────

describe("verifyFacebookOwnership", () => {
  test("successfully verifies page ownership by page ID", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

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
            }),
          ),
        );
      }
      // Second call: get user
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      // Third call: get pages
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "page123",
                name: "Test Page",
                access_token: "page-token",
                category: "Company",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "page123");
    expect(result.success).toBe(true);
    expect(result.method).toBe("facebook_oauth");
    expect(result.platformUsername).toBe("Test User");
    expect(result.proof).toMatchObject({
      facebookUserId: "12345",
      pageId: "page123",
      pageName: "Test Page",
      pageCategory: "Company",
    });
    expect(result.error).toBeUndefined();
  });

  test("successfully verifies page ownership by page name (case-insensitive)", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "page456",
                name: "My Cool Page",
                access_token: "page-token",
                category: "Entertainment",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "my cool page");
    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("Test User");
    expect(result.proof).toMatchObject({
      pageId: "page456",
      pageName: "My Cool Page",
    });
  });

  test("fails when user does not admin the specified page", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "page999",
                name: "Different Page",
                access_token: "page-token",
                category: "Company",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "nonexistent-page");
    expect(result.success).toBe(false);
    expect(result.platformUsername).toBe("Test User");
    expect(result.error).toContain('does not admin a page matching "nonexistent-page"');
    expect(result.error).toContain("Different Page");
  });

  test("fails when user has no pages", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "any-page");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Pages found: none");
  });

  test("handles OAuth code exchange failure", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: "Invalid authorization code",
              type: "OAuthException",
            },
          }),
        ),
      ),
    );

    const result = await verifyFacebookOwnership("invalid-code", "page123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to exchange Facebook OAuth code");
  });

  test("handles user fetch failure", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response("Unauthorized", { status: 401 }),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "page123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Facebook API error: 401");
  });

  test("handles pages fetch failure", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response("Forbidden", { status: 403 }),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "page123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Facebook API error: 403");
  });

  test("handles network errors", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Network error")),
    );

    const result = await verifyFacebookOwnership("test-code", "page123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });

  test("handles non-Error exceptions", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    globalThis.fetch = mock(() =>
      Promise.reject("String error"),
    );

    const result = await verifyFacebookOwnership("test-code", "page123");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unknown error");
  });

  test("returns correct projectId in result", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "my-page-id",
                name: "My Page",
                access_token: "page-token",
                category: "Community",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "my-page-id");
    expect(result.projectId).toBe("my-page-id");
  });

  test("matches multiple pages and returns first match", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "page1",
                name: "First Page",
                access_token: "token1",
                category: "Brand",
              },
              {
                id: "page2",
                name: "Second Page",
                access_token: "token2",
                category: "Community",
              },
              {
                id: "page3",
                name: "Third Page",
                access_token: "token3",
                category: "Entertainment",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "page2");
    expect(result.success).toBe(true);
    expect(result.proof).toMatchObject({
      pageId: "page2",
      pageName: "Second Page",
    });
  });
});

// ─── Edge Cases ─────────────────────────────────────────

describe("verifyFacebookOwnership — edge cases", () => {
  test("handles empty projectId", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "page1",
                name: "Page",
                access_token: "token",
                category: "Brand",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "");
    expect(result.success).toBe(false);
  });

  test("handles projectId with special characters", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "page-special-123",
                name: "Page & Co.",
                access_token: "token",
                category: "Brand",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "Page & Co.");
    expect(result.success).toBe(true);
    expect(result.proof).toMatchObject({
      pageName: "Page & Co.",
    });
  });

  test("handles page name with different casing", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "page1",
                name: "TeSt PaGe",
                access_token: "token",
                category: "Brand",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "TEST PAGE");
    expect(result.success).toBe(true);
  });

  test("page ID match takes precedence over name match", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-token",
              token_type: "bearer",
            }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "12345",
              name: "Test User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "mypage",
                name: "Other Name",
                access_token: "token1",
                category: "Brand",
              },
              {
                id: "other-id",
                name: "mypage",
                access_token: "token2",
                category: "Community",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyFacebookOwnership("test-code", "mypage");
    expect(result.success).toBe(true);
    expect(result.proof).toMatchObject({
      pageId: "mypage",
      pageName: "Other Name",
    });
  });
});
