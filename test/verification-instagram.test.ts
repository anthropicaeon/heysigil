import { describe, test, expect, mock, beforeEach } from "bun:test";
import {
  getInstagramAuthUrl,
  verifyInstagramOwnership,
} from "../src/verification/instagram.js";
import { resetEnv } from "../src/config/env.js";

// Mock environment variables
const mockEnv = {
  FACEBOOK_APP_ID: "test-fb-app-id",
  FACEBOOK_APP_SECRET: "test-fb-app-secret",
  BASE_URL: "https://test.example.com",
};

// Reset environment and mock fetch before each test
beforeEach(() => {
  resetEnv();
  process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
  process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
  process.env.BASE_URL = mockEnv.BASE_URL;
  globalThis.fetch = mock(() => Promise.resolve(new Response()));
});

// ─── getInstagramAuthUrl ────────────────────────────────

describe("getInstagramAuthUrl", () => {
  test("generates correct OAuth URL with state", () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const state = "test-state-123";
    const url = getInstagramAuthUrl(state);

    expect(url).toContain("https://www.facebook.com/v21.0/dialog/oauth");
    expect(url).toContain(`client_id=${mockEnv.FACEBOOK_APP_ID}`);
    expect(url).toContain(`state=${state}`);
    expect(url).toContain("scope=instagram_basic+pages_show_list");
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent(`${mockEnv.BASE_URL}/api/verify/instagram/callback`)}`,
    );
  });

  test("includes correct redirect URI", () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const url = getInstagramAuthUrl("state");
    const urlObj = new URL(url);
    const redirectUri = urlObj.searchParams.get("redirect_uri");

    expect(redirectUri).toBe(`${mockEnv.BASE_URL}/api/verify/instagram/callback`);
  });

  test("includes instagram_basic and pages_show_list scopes", () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const url = getInstagramAuthUrl("state");
    const urlObj = new URL(url);
    const scope = urlObj.searchParams.get("scope");

    expect(scope).toBe("instagram_basic pages_show_list");
  });
});

// ─── verifyInstagramOwnership ───────────────────────────

describe("verifyInstagramOwnership", () => {
  test("successfully verifies matching Instagram username", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      // First call: exchange code for access token
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "test-access-token",
            }),
            { status: 200 },
          ),
        );
      }
      // Second call: get Facebook pages
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page123",
                  name: "Test Page",
                  instagram_business_account: {
                    id: "ig123",
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      // Third call: get Instagram account info
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "ig123",
            username: "testuser",
            name: "Test User",
          }),
          { status: 200 },
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(true);
    expect(result.method).toBe("instagram_graph");
    expect(result.projectId).toBe("testuser");
    expect(result.platformUsername).toBe("testuser");
    expect(result.proof).toMatchObject({
      instagramUserId: "ig123",
      instagramUsername: "testuser",
    });
    expect(result.error).toBeUndefined();
  });

  test("matches username case-insensitively", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page123",
                  name: "Test Page",
                  instagram_business_account: { id: "ig123" },
                },
              ],
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "ig123",
            username: "TestUser",
            name: "Test User",
          }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "TESTUSER");
    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("TestUser");
  });

  test("handles username with @ prefix", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page123",
                  name: "Test Page",
                  instagram_business_account: { id: "ig123" },
                },
              ],
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "ig123",
            username: "testuser",
            name: "Test User",
          }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "@testuser");
    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("testuser");
  });

  test("returns error when no Instagram account matches", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page123",
                  name: "Test Page",
                  instagram_business_account: { id: "ig123" },
                },
              ],
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "ig123",
            username: "differentuser",
            name: "Different User",
          }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "targetuser");
    expect(result.success).toBe(false);
    expect(result.method).toBe("instagram_graph");
    expect(result.error).toContain('No linked Instagram Business/Creator account matches "@targetuser"');
    expect(result.error).toContain("Found: @differentuser");
    expect(result.error).toContain("personal Instagram accounts cannot be verified");
  });

  test("returns error when no linked Instagram accounts found", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      // No pages with Instagram business accounts
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "page123",
                name: "Test Page",
              },
            ],
          }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(false);
    expect(result.error).toContain('No linked Instagram Business/Creator account matches "@testuser"');
    expect(result.error).toContain("Found: none");
  });

  test("handles multiple Instagram accounts", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page1",
                  name: "Page 1",
                  instagram_business_account: { id: "ig1" },
                },
                {
                  id: "page2",
                  name: "Page 2",
                  instagram_business_account: { id: "ig2" },
                },
              ],
            }),
          ),
        );
      }
      if (callCount === 3) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "ig1",
              username: "firstuser",
              name: "First User",
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "ig2",
            username: "seconduser",
            name: "Second User",
          }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "seconduser");
    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("seconduser");
    expect(result.proof).toMatchObject({
      instagramUserId: "ig2",
      instagramUsername: "seconduser",
    });
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
              message: "Invalid OAuth code",
              type: "OAuthException",
            },
          }),
          { status: 400 },
        ),
      ),
    );

    const result = await verifyInstagramOwnership("invalid-code", "testuser");
    expect(result.success).toBe(false);
    expect(result.method).toBe("instagram_graph");
    expect(result.error).toContain("Failed to exchange OAuth code for Instagram verification");
  });

  test("handles Facebook API error when fetching pages", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      return Promise.resolve(
        new Response("Unauthorized", { status: 401 }),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Facebook API error: 401");
  });

  test("handles Instagram API error gracefully", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page123",
                  name: "Test Page",
                  instagram_business_account: { id: "ig123" },
                },
              ],
            }),
          ),
        );
      }
      // Instagram API fails
      return Promise.resolve(
        new Response("Not Found", { status: 404 }),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(false);
    expect(result.error).toContain('No linked Instagram Business/Creator account matches "@testuser"');
    expect(result.error).toContain("Found: none");
  });

  test("handles network errors", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Network error")),
    );

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  test("handles non-Error exceptions", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    globalThis.fetch = mock(() =>
      Promise.reject("String error"),
    );

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unknown error");
  });

  test("sends correct request to exchange code", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ access_token: "test-token" }),
        ),
      ),
    );
    globalThis.fetch = fetchMock;

    await verifyInstagramOwnership("test-code", "testuser");

    const firstCall = fetchMock.mock.calls[0] as [string];
    const callUrl = firstCall[0];
    expect(callUrl).toContain("https://graph.facebook.com/v21.0/oauth/access_token");
    expect(callUrl).toContain(`client_id=${mockEnv.FACEBOOK_APP_ID}`);
    expect(callUrl).toContain("client_secret=");
    expect(callUrl).toContain("code=test-code");
  });

  test("constructs correct API URL for Facebook pages", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    const fetchMock = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: [] }),
        ),
      );
    });
    globalThis.fetch = fetchMock;

    await verifyInstagramOwnership("test-code", "testuser");

    const secondCall = fetchMock.mock.calls[1] as [string];
    const callUrl = secondCall[0];
    expect(callUrl).toContain("https://graph.facebook.com/v21.0/me/accounts");
    expect(callUrl).toContain("fields=id,name,instagram_business_account");
    expect(callUrl).toContain("access_token=test-token");
  });

  test("constructs correct API URL for Instagram account", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    const fetchMock = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page123",
                  name: "Test Page",
                  instagram_business_account: { id: "ig123" },
                },
              ],
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "ig123",
            username: "testuser",
            name: "Test User",
          }),
        ),
      );
    });
    globalThis.fetch = fetchMock;

    await verifyInstagramOwnership("test-code", "testuser");

    const thirdCall = fetchMock.mock.calls[2] as [string];
    const callUrl = thirdCall[0];
    expect(callUrl).toContain("https://graph.facebook.com/v21.0/ig123");
    expect(callUrl).toContain("fields=id,username,name");
    expect(callUrl).toContain("access_token=test-token");
  });
});

// ─── Edge Cases ─────────────────────────────────────────

describe("verifyInstagramOwnership — edge cases", () => {
  test("handles empty pages data array", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: [] }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Found: none");
  });

  test("handles pages without Instagram business accounts", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              { id: "page1", name: "Page 1" },
              { id: "page2", name: "Page 2" },
            ],
          }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Found: none");
  });

  test("handles partial Instagram account failures", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page1",
                  name: "Page 1",
                  instagram_business_account: { id: "ig1" },
                },
                {
                  id: "page2",
                  name: "Page 2",
                  instagram_business_account: { id: "ig2" },
                },
              ],
            }),
          ),
        );
      }
      if (callCount === 3) {
        // First Instagram account fetch fails
        return Promise.resolve(
          new Response("Forbidden", { status: 403 }),
        );
      }
      // Second Instagram account succeeds
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "ig2",
            username: "testuser",
            name: "Test User",
          }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "testuser");
    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("testuser");
  });

  test("handles username with special characters", async () => {
    process.env.FACEBOOK_APP_ID = mockEnv.FACEBOOK_APP_ID;
    process.env.FACEBOOK_APP_SECRET = mockEnv.FACEBOOK_APP_SECRET;
    process.env.BASE_URL = mockEnv.BASE_URL;

    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: "test-token" }),
          ),
        );
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "page123",
                  name: "Test Page",
                  instagram_business_account: { id: "ig123" },
                },
              ],
            }),
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "ig123",
            username: "test_user.123",
            name: "Test User",
          }),
        ),
      );
    });

    const result = await verifyInstagramOwnership("test-code", "test_user.123");
    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("test_user.123");
  });
});
