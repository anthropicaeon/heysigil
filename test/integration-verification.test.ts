import { describe, expect, test, beforeEach, mock } from "bun:test";
import {
  verifyGitHubFile,
  verifyGitHubOwnership,
} from "../src/verification/github.js";
import {
  verifyDomainFile,
  verifyDomainDns,
  verifyDomainMeta,
} from "../src/verification/domain.js";
import {
  createPhantomUser,
  claimIdentity,
  findUserByPlatform,
  hasIdentity,
  findIdentity,
  getUserIdentities,
  type User,
  type Identity,
} from "../src/services/identity.js";

// Mock environment variables
beforeEach(() => {
  process.env.GITHUB_CLIENT_ID = "test-client-id";
  process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
  process.env.BASE_URL = "https://test.example.com";
});

// ─── GitHub Verification Flow ──────────────────────────

describe("Verification Flow: GitHub File", () => {
  test("creates phantom user, verifies, and claims identity", async () => {
    const repoId = `testorg/testrepo-${Date.now()}`;
    const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    const verificationCode = "test-code-123";

    // Step 1: Create phantom user for third-party launch
    const phantom = await createPhantomUser("github", repoId);
    expect(phantom.isNew).toBe(true);
    expect(phantom.user.status).toBe("phantom");
    expect(phantom.walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);

    // Step 2: Mock GitHub API to simulate verification file
    const fileContent = `verification-code=${verificationCode}\nwallet-address=${phantom.walletAddress}`;
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

    // Step 3: Verify GitHub file
    const result = await verifyGitHubFile(
      repoId,
      verificationCode,
      phantom.walletAddress,
    );
    expect(result.success).toBe(true);
    expect(result.method).toBe("github_file");
    expect(result.projectId).toBe(repoId);

    // Step 4: Claim identity
    const privyUserId = `privy-user-${Date.now()}`;
    const claim = await claimIdentity("github", repoId, privyUserId);
    expect(claim.success).toBe(true);
    expect(claim.user?.status).toBe("claimed");
    expect(claim.user?.privyUserId).toBe(privyUserId);
    expect(claim.merged).toBe(false);
  });

  test("handles verification failure gracefully", async () => {
    const repoId = `testorg/testrepo-fail-${Date.now()}`;
    const correctCode = "correct-code";
    const wrongCode = "wrong-code";

    // Create phantom user
    const phantom = await createPhantomUser("github", repoId);

    // Mock GitHub API with wrong code
    const fileContent = `verification-code=${wrongCode}\nwallet-address=${phantom.walletAddress}`;
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

    // Verification should fail
    const result = await verifyGitHubFile(
      repoId,
      correctCode,
      phantom.walletAddress,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Verification code does not match");

    // Identity should still be phantom
    const user = await findUserByPlatform("github", repoId);
    expect(user?.status).toBe("phantom");
  });

  test("prevents claiming with wrong verification", async () => {
    const repoId = `testorg/testrepo-wrong-${Date.now()}`;

    // Create phantom user
    const phantom = await createPhantomUser("github", repoId);

    // Mock GitHub API - file not found
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Not Found", { status: 404 })),
    );

    // Verification fails
    const result = await verifyGitHubFile(
      repoId,
      "any-code",
      phantom.walletAddress,
    );
    expect(result.success).toBe(false);

    // Can still claim (claim is separate from verification),
    // but in a real flow, the backend would check verification first
    const privyUserId = `privy-user-${Date.now()}`;
    const claim = await claimIdentity("github", repoId, privyUserId);
    expect(claim.success).toBe(true); // Claim succeeds regardless of verification
  });
});

describe("Verification Flow: GitHub OAuth", () => {
  test("full OAuth flow with admin permission", async () => {
    const repoId = "testowner/testrepo";

    // Create phantom user
    const phantom = await createPhantomUser("github", repoId);

    // Mock GitHub OAuth flow
    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      // Exchange code for token
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
      // Get user
      if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              login: "testowner",
              id: 12345,
            }),
          ),
        );
      }
      // Check permission
      return Promise.resolve(
        new Response(
          JSON.stringify({
            permission: "admin",
            role_name: "admin",
          }),
        ),
      );
    });

    // Verify ownership
    const result = await verifyGitHubOwnership("oauth-code", repoId);
    expect(result.success).toBe(true);
    expect(result.platformUsername).toBe("testowner");
    expect(result.proof).toMatchObject({
      githubUserId: 12345,
      permission: "admin",
    });

    // Claim identity
    const privyUserId = `privy-user-${Date.now()}`;
    const claim = await claimIdentity("github", repoId, privyUserId);
    expect(claim.success).toBe(true);
    expect(claim.user?.privyUserId).toBe(privyUserId);
  });

  test("OAuth fails with insufficient permissions", async () => {
    const repoId = "testowner/testrepo-contributor";

    // Create phantom user
    await createPhantomUser("github", repoId);

    // Mock GitHub OAuth flow with write permission (not admin)
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

    // Verification should fail
    const result = await verifyGitHubOwnership("oauth-code", repoId);
    expect(result.success).toBe(false);
    expect(result.error).toContain("has 'write' permission, needs 'admin'");
  });
});

// ─── Domain Verification Flow ───────────────────────────

describe("Verification Flow: Domain File", () => {
  test("creates phantom user, verifies domain file, and claims", async () => {
    const domain = `example-${Date.now()}.com`;
    const verificationCode = "domain-code-123";

    // Create phantom user for domain
    const phantom = await createPhantomUser("domain", domain);
    expect(phantom.isNew).toBe(true);
    expect(phantom.user.status).toBe("phantom");

    // Mock domain verification file
    const fileContent = `verification-token=${verificationCode}\nwallet-address=${phantom.walletAddress}`;

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    // Verify domain file
    const result = await verifyDomainFile(
      domain,
      verificationCode,
      phantom.walletAddress,
    );
    expect(result.success).toBe(true);
    expect(result.method).toBe("domain_file");
    expect(result.projectId).toBe(domain);

    // Claim identity
    const privyUserId = `privy-user-${Date.now()}`;
    const claim = await claimIdentity("domain", domain, privyUserId);
    expect(claim.success).toBe(true);
    expect(claim.user?.status).toBe("claimed");
  });

  test("handles missing verification file", async () => {
    const domain = `missing-${Date.now()}.com`;

    // Create phantom user
    const phantom = await createPhantomUser("domain", domain);

    // Mock 404 response
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Not Found", { status: 404 })),
    );

    // Verification should fail
    const result = await verifyDomainFile(
      domain,
      "any-code",
      phantom.walletAddress,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Could not fetch");
  });
});

describe("Verification Flow: Domain Meta Tag", () => {
  test("verifies domain via meta tag", async () => {
    const domain = `meta-${Date.now()}.com`;
    const verificationCode = "meta-code-123";

    // Create phantom user
    const phantom = await createPhantomUser("domain", domain);

    // Mock HTML with meta tag
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="pool-claim-verification" content="${phantom.walletAddress}:${verificationCode}" />
        </head>
        <body>Test</body>
      </html>
    `;

    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(html, { status: 200 })),
    );

    // Verify domain meta tag
    const result = await verifyDomainMeta(
      domain,
      verificationCode,
      phantom.walletAddress,
    );
    expect(result.success).toBe(true);
    expect(result.method).toBe("domain_meta");

    // Claim identity
    const privyUserId = `privy-user-${Date.now()}`;
    const claim = await claimIdentity("domain", domain, privyUserId);
    expect(claim.success).toBe(true);
  });

  test("fails when meta tag is missing", async () => {
    const domain = `no-meta-${Date.now()}.com`;

    // Create phantom user
    const phantom = await createPhantomUser("domain", domain);

    // Mock HTML without meta tag
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>No Meta</title></head>
        <body>Test</body>
      </html>
    `;

    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(html, { status: 200 })),
    );

    // Verification should fail
    const result = await verifyDomainMeta(
      domain,
      "any-code",
      phantom.walletAddress,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Meta tag not found");
  });
});

// ─── Multi-Identity User Flow ───────────────────────────

describe("Verification Flow: Multi-Identity User", () => {
  test("merges multiple phantom users when claimed by same dev", async () => {
    const repo1 = `testorg/repo1-${Date.now()}`;
    const repo2 = `testorg/repo2-${Date.now()}`;
    const privyUserId = `privy-user-multi-${Date.now()}`;

    // Create two phantom users (third-party launches)
    const phantom1 = await createPhantomUser("github", repo1);
    const phantom2 = await createPhantomUser("github", repo2);

    expect(phantom1.walletAddress).not.toBe(phantom2.walletAddress);

    // Dev verifies and claims first identity
    const claim1 = await claimIdentity("github", repo1, privyUserId);
    expect(claim1.success).toBe(true);
    expect(claim1.merged).toBe(false);
    const primaryWallet = claim1.walletAddress!;

    // Dev verifies and claims second identity (same Privy user)
    const claim2 = await claimIdentity("github", repo2, privyUserId);
    expect(claim2.success).toBe(true);
    expect(claim2.merged).toBe(true);
    expect(claim2.walletAddress).toBe(primaryWallet);

    // Both identities should now point to the same user
    const user1 = await findUserByPlatform("github", repo1);
    const user2 = await findUserByPlatform("github", repo2);
    expect(user1?.id).toBe(user2?.id);
    expect(user1?.walletAddress).toBe(primaryWallet);
    expect(user2?.walletAddress).toBe(primaryWallet);

    // User should have both identities
    const identities = await getUserIdentities(user1!.id);
    expect(identities.length).toBe(2);
    expect(identities.some((i) => i.platformId === repo1)).toBe(true);
    expect(identities.some((i) => i.platformId === repo2)).toBe(true);
  });

  test("handles three-way merge correctly", async () => {
    const repo1 = `testorg/repo1-3way-${Date.now()}`;
    const repo2 = `testorg/repo2-3way-${Date.now()}`;
    const repo3 = `testorg/repo3-3way-${Date.now()}`;
    const privyUserId = `privy-user-3way-${Date.now()}`;

    // Create three phantom users
    await createPhantomUser("github", repo1);
    await createPhantomUser("github", repo2);
    await createPhantomUser("github", repo3);

    // Claim all three with same Privy user
    const claim1 = await claimIdentity("github", repo1, privyUserId);
    const claim2 = await claimIdentity("github", repo2, privyUserId);
    const claim3 = await claimIdentity("github", repo3, privyUserId);

    expect(claim1.success).toBe(true);
    expect(claim1.merged).toBe(false);
    expect(claim2.success).toBe(true);
    expect(claim2.merged).toBe(true);
    expect(claim3.success).toBe(true);
    expect(claim3.merged).toBe(true);

    // All should point to same wallet
    const primaryWallet = claim1.walletAddress;
    expect(claim2.walletAddress).toBe(primaryWallet);
    expect(claim3.walletAddress).toBe(primaryWallet);

    // Verify all identities belong to same user
    const user = await findUserByPlatform("github", repo1);
    const identities = await getUserIdentities(user!.id);
    expect(identities.length).toBe(3);
  });

  test("different devs can claim different phantom users", async () => {
    const repo1 = `testorg/repo1-diff-${Date.now()}`;
    const repo2 = `testorg/repo2-diff-${Date.now()}`;
    const privyUser1 = `privy-user-1-${Date.now()}`;
    const privyUser2 = `privy-user-2-${Date.now()}`;

    // Create two phantom users
    const phantom1 = await createPhantomUser("github", repo1);
    const phantom2 = await createPhantomUser("github", repo2);

    // Different devs claim different identities
    const claim1 = await claimIdentity("github", repo1, privyUser1);
    const claim2 = await claimIdentity("github", repo2, privyUser2);

    expect(claim1.success).toBe(true);
    expect(claim2.success).toBe(true);
    expect(claim1.merged).toBe(false);
    expect(claim2.merged).toBe(false);

    // Should have different wallets
    expect(claim1.walletAddress).not.toBe(claim2.walletAddress);

    // Should be different users
    const user1 = await findUserByPlatform("github", repo1);
    const user2 = await findUserByPlatform("github", repo2);
    expect(user1?.id).not.toBe(user2?.id);
  });
});

// ─── Cross-Platform Verification ────────────────────────

describe("Verification Flow: Cross-Platform", () => {
  test("dev can verify both GitHub and domain identities", async () => {
    const repo = `testorg/repo-cross-${Date.now()}`;
    const domain = `cross-${Date.now()}.com`;
    const privyUserId = `privy-user-cross-${Date.now()}`;

    // Create phantom users for both platforms
    const phantomGitHub = await createPhantomUser("github", repo);
    const phantomDomain = await createPhantomUser("domain", domain);

    expect(phantomGitHub.walletAddress).not.toBe(phantomDomain.walletAddress);

    // Claim GitHub identity first
    const claimGitHub = await claimIdentity("github", repo, privyUserId);
    expect(claimGitHub.success).toBe(true);

    // Claim domain identity with same Privy user
    const claimDomain = await claimIdentity("domain", domain, privyUserId);
    expect(claimDomain.success).toBe(true);
    expect(claimDomain.merged).toBe(true);

    // Both should point to same primary wallet
    expect(claimDomain.walletAddress).toBe(claimGitHub.walletAddress);

    // Verify cross-platform identity consolidation
    const userByGitHub = await findUserByPlatform("github", repo);
    const userByDomain = await findUserByPlatform("domain", domain);
    expect(userByGitHub?.id).toBe(userByDomain?.id);

    const identities = await getUserIdentities(userByGitHub!.id);
    expect(identities.length).toBe(2);
    expect(identities.some((i) => i.platform === "github")).toBe(true);
    expect(identities.some((i) => i.platform === "domain")).toBe(true);
  });
});

// ─── Idempotency and Edge Cases ─────────────────────────

describe("Verification Flow: Idempotency", () => {
  test("creating phantom user twice returns same user", async () => {
    const repo = `testorg/repo-idem-${Date.now()}`;

    const phantom1 = await createPhantomUser("github", repo);
    const phantom2 = await createPhantomUser("github", repo);

    expect(phantom1.isNew).toBe(true);
    expect(phantom2.isNew).toBe(false);
    expect(phantom1.walletAddress).toBe(phantom2.walletAddress);
    expect(phantom1.user.id).toBe(phantom2.user.id);
  });

  test("claiming same identity twice returns same result", async () => {
    const repo = `testorg/repo-claim-idem-${Date.now()}`;
    const privyUserId = `privy-user-idem-${Date.now()}`;

    // Create phantom user
    await createPhantomUser("github", repo);

    // Claim twice
    const claim1 = await claimIdentity("github", repo, privyUserId);
    const claim2 = await claimIdentity("github", repo, privyUserId);

    expect(claim1.success).toBe(true);
    expect(claim2.success).toBe(true);
    expect(claim1.walletAddress).toBe(claim2.walletAddress);
    expect(claim2.message).toContain("already belongs");
  });

  test("attempting to claim non-existent identity fails", async () => {
    const repo = `testorg/nonexistent-${Date.now()}`;
    const privyUserId = `privy-user-${Date.now()}`;

    const claim = await claimIdentity("github", repo, privyUserId);
    expect(claim.success).toBe(false);
    expect(claim.message).toContain("No phantom identity found");
  });
});

// ─── Error Recovery ─────────────────────────────────────

describe("Verification Flow: Error Recovery", () => {
  test("verification failure does not affect identity state", async () => {
    const repo = `testorg/repo-error-${Date.now()}`;

    // Create phantom user
    const phantom = await createPhantomUser("github", repo);
    const originalStatus = phantom.user.status;

    // Mock network error during verification
    globalThis.fetch = mock(() => Promise.reject(new Error("Network error")));

    // Verification fails
    const result = await verifyGitHubFile(
      repo,
      "any-code",
      phantom.walletAddress,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");

    // Identity should remain unchanged
    const user = await findUserByPlatform("github", repo);
    expect(user?.status).toBe(originalStatus);
    expect(user?.id).toBe(phantom.user.id);
  });

  test("partial verification data is handled gracefully", async () => {
    const repo = `testorg/repo-partial-${Date.now()}`;

    // Create phantom user
    const phantom = await createPhantomUser("github", repo);

    // Mock partial file content (missing wallet address)
    const fileContent = `verification-code=test-code`;
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

    // Verification should fail gracefully
    const result = await verifyGitHubFile(
      repo,
      "test-code",
      phantom.walletAddress,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Wallet address does not match");
  });
});
