import { describe, expect, test, beforeEach } from "bun:test";
import {
    createPhantomUser,
    claimIdentity,
    findIdentity,
    findUserByPlatform,
    findUserByPrivyId,
    findUserByWallet,
    hasIdentity,
    getUserIdentities,
    findByGitHubRepo,
    getUserWallet,
    listPhantomUsers,
} from "../src/services/identity";

// ─── Phantom User Creation ─────────────────────────────

describe("Identity: Phantom User Creation", () => {
    test("creates a phantom user with wallet and identity", () => {
        const platform = "github";
        const platformId = `test-repo-${Date.now()}`;
        const result = createPhantomUser(platform, platformId);

        expect(result.isNew).toBe(true);
        expect(result.user.status).toBe("phantom");
        expect(result.user.privyUserId).toBeNull();
        expect(result.user.walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(result.user.mergedInto).toBeNull();
        expect(result.identity.platform).toBe(platform);
        expect(result.identity.platformId).toBe(platformId);
        expect(result.walletAddress).toBe(result.user.walletAddress);
    });

    test("is idempotent - returns same user for same platform/platformId", () => {
        const platform = "github";
        const platformId = `test-idempotent-${Date.now()}`;

        const r1 = createPhantomUser(platform, platformId);
        const r2 = createPhantomUser(platform, platformId);

        expect(r1.isNew).toBe(true);
        expect(r2.isNew).toBe(false);
        expect(r1.user.id).toBe(r2.user.id);
        expect(r1.walletAddress).toBe(r2.walletAddress);
    });

    test("creates different users for different platforms", () => {
        const platformId = `test-diff-${Date.now()}`;

        const r1 = createPhantomUser("github", platformId);
        const r2 = createPhantomUser("gitlab", platformId);

        expect(r1.user.id).not.toBe(r2.user.id);
        expect(r1.walletAddress).not.toBe(r2.walletAddress);
    });

    test("creates different users for different platformIds", () => {
        const platform = "github";

        const r1 = createPhantomUser(platform, `test-1-${Date.now()}`);
        const r2 = createPhantomUser(platform, `test-2-${Date.now()}`);

        expect(r1.user.id).not.toBe(r2.user.id);
        expect(r1.walletAddress).not.toBe(r2.walletAddress);
    });

    test("stores createdBy when provided", () => {
        const platform = "github";
        const platformId = `test-creator-${Date.now()}`;
        const createdBy = "system-bot";

        const result = createPhantomUser(platform, platformId, createdBy);

        expect(result.identity.createdBy).toBe(createdBy);
    });

    test("sets createdBy to null when not provided", () => {
        const platform = "github";
        const platformId = `test-no-creator-${Date.now()}`;

        const result = createPhantomUser(platform, platformId);

        expect(result.identity.createdBy).toBeNull();
    });
});

// ─── Identity Claiming ──────────────────────────────────

describe("Identity: Claiming", () => {
    test("claims a phantom identity successfully", () => {
        const platform = "github";
        const platformId = `test-claim-${Date.now()}`;
        const privyUserId = `privy-${Date.now()}`;

        const phantom = createPhantomUser(platform, platformId);
        const claim = claimIdentity(platform, platformId, privyUserId);

        expect(claim.success).toBe(true);
        expect(claim.user?.id).toBe(phantom.user.id);
        expect(claim.user?.status).toBe("claimed");
        expect(claim.user?.privyUserId).toBe(privyUserId);
        expect(claim.user?.claimedAt).toBeInstanceOf(Date);
        expect(claim.walletAddress).toBe(phantom.walletAddress);
        expect(claim.merged).toBe(false);
    });

    test("returns private key on first claim", () => {
        const platform = "github";
        const platformId = `test-pk-${Date.now()}`;
        const privyUserId = `privy-${Date.now()}`;

        createPhantomUser(platform, platformId);
        const claim = claimIdentity(platform, platformId, privyUserId);

        expect(claim.success).toBe(true);
        expect(claim.privateKey).toBeDefined();
        expect(claim.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    test("fails to claim non-existent identity", () => {
        const platform = "github";
        const platformId = `non-existent-${Date.now()}`;
        const privyUserId = `privy-${Date.now()}`;

        const claim = claimIdentity(platform, platformId, privyUserId);

        expect(claim.success).toBe(false);
        expect(claim.message).toContain("No phantom identity found");
    });

    test("claiming same identity twice is idempotent", () => {
        const platform = "github";
        const platformId = `test-double-${Date.now()}`;
        const privyUserId = `privy-${Date.now()}`;

        createPhantomUser(platform, platformId);
        const claim1 = claimIdentity(platform, platformId, privyUserId);
        const claim2 = claimIdentity(platform, platformId, privyUserId);

        expect(claim1.success).toBe(true);
        expect(claim2.success).toBe(true);
        expect(claim1.user?.id).toBe(claim2.user?.id);
        expect(claim2.message).toContain("already belongs to this user");
    });

    test("merges users when same privy user claims second identity", () => {
        const privyUserId = `privy-${Date.now()}`;

        const phantom1 = createPhantomUser("github", `repo1-${Date.now()}`);
        const phantom2 = createPhantomUser("github", `repo2-${Date.now()}`);

        const claim1 = claimIdentity("github", phantom1.identity.platformId, privyUserId);
        const claim2 = claimIdentity("github", phantom2.identity.platformId, privyUserId);

        expect(claim1.success).toBe(true);
        expect(claim1.merged).toBe(false);
        expect(claim2.success).toBe(true);
        expect(claim2.merged).toBe(true);
        expect(claim2.user?.id).toBe(claim1.user?.id);
        expect(claim2.walletAddress).toBe(claim1.walletAddress);
    });

    test("merge moves all identities to primary user", () => {
        const privyUserId = `privy-${Date.now()}`;

        const phantom1 = createPhantomUser("github", `repo1-${Date.now()}`);
        const phantom2 = createPhantomUser("github", `repo2-${Date.now()}`);

        claimIdentity("github", phantom1.identity.platformId, privyUserId);
        claimIdentity("github", phantom2.identity.platformId, privyUserId);

        const identities = getUserIdentities(phantom1.user.id);
        expect(identities.length).toBe(2);
    });
});

// ─── Identity Lookups ───────────────────────────────────

describe("Identity: Lookups", () => {
    test("findIdentity finds existing identity", () => {
        const platform = "github";
        const platformId = `test-find-${Date.now()}`;
        const created = createPhantomUser(platform, platformId);

        const found = findIdentity(platform, platformId);

        expect(found).toBeDefined();
        expect(found?.id).toBe(created.identity.id);
        expect(found?.platform).toBe(platform);
        expect(found?.platformId).toBe(platformId);
    });

    test("findIdentity returns null for non-existent identity", () => {
        const found = findIdentity("github", `non-existent-${Date.now()}`);
        expect(found).toBeNull();
    });

    test("hasIdentity returns true for existing identity", () => {
        const platform = "github";
        const platformId = `test-has-${Date.now()}`;
        createPhantomUser(platform, platformId);

        expect(hasIdentity(platform, platformId)).toBe(true);
    });

    test("hasIdentity returns false for non-existent identity", () => {
        expect(hasIdentity("github", `non-existent-${Date.now()}`)).toBe(false);
    });

    test("findUserByPlatform finds user by platform identity", () => {
        const platform = "github";
        const platformId = `test-user-${Date.now()}`;
        const created = createPhantomUser(platform, platformId);

        const found = findUserByPlatform(platform, platformId);

        expect(found).toBeDefined();
        expect(found?.id).toBe(created.user.id);
        expect(found?.walletAddress).toBe(created.walletAddress);
    });

    test("findUserByPlatform returns null for non-existent platform", () => {
        const found = findUserByPlatform("github", `non-existent-${Date.now()}`);
        expect(found).toBeNull();
    });

    test("findUserByPrivyId finds claimed user", () => {
        const platform = "github";
        const platformId = `test-privy-${Date.now()}`;
        const privyUserId = `privy-${Date.now()}`;

        createPhantomUser(platform, platformId);
        const claimed = claimIdentity(platform, platformId, privyUserId);

        const found = findUserByPrivyId(privyUserId);

        expect(found).toBeDefined();
        expect(found?.id).toBe(claimed.user?.id);
        expect(found?.privyUserId).toBe(privyUserId);
    });

    test("findUserByPrivyId returns null for unclaimed privy id", () => {
        const found = findUserByPrivyId(`privy-non-existent-${Date.now()}`);
        expect(found).toBeNull();
    });

    test("findUserByWallet finds user by wallet address", () => {
        const platform = "github";
        const platformId = `test-wallet-${Date.now()}`;
        const created = createPhantomUser(platform, platformId);

        const found = findUserByWallet(created.walletAddress);

        expect(found).toBeDefined();
        expect(found?.id).toBe(created.user.id);
        expect(found?.walletAddress).toBe(created.walletAddress);
    });

    test("findUserByWallet returns null for non-existent wallet", () => {
        const found = findUserByWallet("0x1234567890123456789012345678901234567890");
        expect(found).toBeNull();
    });
});

// ─── User Identities ────────────────────────────────────

describe("Identity: User Identities", () => {
    test("getUserIdentities returns all identities for a user", () => {
        const privyUserId = `privy-${Date.now()}`;

        const phantom1 = createPhantomUser("github", `repo1-${Date.now()}`);
        const phantom2 = createPhantomUser("github", `repo2-${Date.now()}`);

        claimIdentity("github", phantom1.identity.platformId, privyUserId);
        claimIdentity("github", phantom2.identity.platformId, privyUserId);

        const identities = getUserIdentities(phantom1.user.id);

        expect(identities.length).toBe(2);
        expect(identities.some(i => i.platformId === phantom1.identity.platformId)).toBe(true);
        expect(identities.some(i => i.platformId === phantom2.identity.platformId)).toBe(true);
    });

    test("getUserIdentities returns single identity for unclaimed user", () => {
        const platform = "github";
        const platformId = `test-single-${Date.now()}`;
        const created = createPhantomUser(platform, platformId);

        const identities = getUserIdentities(created.user.id);

        expect(identities.length).toBe(1);
        expect(identities[0].platformId).toBe(platformId);
    });

    test("getUserIdentities resolves merged users", () => {
        const privyUserId = `privy-${Date.now()}`;

        const phantom1 = createPhantomUser("github", `repo1-${Date.now()}`);
        const phantom2 = createPhantomUser("github", `repo2-${Date.now()}`);

        claimIdentity("github", phantom1.identity.platformId, privyUserId);
        claimIdentity("github", phantom2.identity.platformId, privyUserId);

        const identities = getUserIdentities(phantom2.user.id);
        expect(identities.length).toBe(2);
    });
});

// ─── GitHub Repo Normalization ──────────────────────────

describe("Identity: GitHub Repo", () => {
    test("findByGitHubRepo finds by simple format", () => {
        const repoName = `owner/repo-${Date.now()}`;
        const created = createPhantomUser("github", repoName);

        const found = findByGitHubRepo(repoName);

        expect(found).toBeDefined();
        expect(found?.user.id).toBe(created.user.id);
        expect(found?.identity.platformId).toBe(repoName);
    });

    test("findByGitHubRepo normalizes github.com URLs", () => {
        const repoName = `owner/repo-${Date.now()}`;
        createPhantomUser("github", repoName);

        const found = findByGitHubRepo(`github.com/${repoName}`);

        expect(found).toBeDefined();
        expect(found?.identity.platformId).toBe(repoName);
    });

    test("findByGitHubRepo normalizes https URLs", () => {
        const repoName = `owner/repo-${Date.now()}`;
        createPhantomUser("github", repoName);

        const found = findByGitHubRepo(`https://github.com/${repoName}`);

        expect(found).toBeDefined();
        expect(found?.identity.platformId).toBe(repoName);
    });

    test("findByGitHubRepo returns null for non-existent repo", () => {
        const found = findByGitHubRepo(`owner/non-existent-${Date.now()}`);
        expect(found).toBeNull();
    });
});

// ─── Wallet Operations ──────────────────────────────────

describe("Identity: Wallet Operations", () => {
    test("getUserWallet returns valid wallet signer", () => {
        const platform = "github";
        const platformId = `test-signer-${Date.now()}`;
        const created = createPhantomUser(platform, platformId);

        const wallet = getUserWallet(created.user.id);

        expect(wallet).toBeDefined();
        expect(wallet?.address).toBe(created.walletAddress);
    });

    test("getUserWallet throws error for non-existent user", () => {
        expect(() => getUserWallet("non-existent-user-id")).toThrow("User not found");
    });
});

// ─── Phantom Users Listing ──────────────────────────────

describe("Identity: Phantom Users", () => {
    test("listPhantomUsers returns unclaimed users", () => {
        const platform = "github";
        const platformId1 = `phantom1-${Date.now()}`;
        const platformId2 = `phantom2-${Date.now()}`;

        const p1 = createPhantomUser(platform, platformId1);
        const p2 = createPhantomUser(platform, platformId2);

        const phantoms = listPhantomUsers();

        expect(phantoms.some(u => u.id === p1.user.id)).toBe(true);
        expect(phantoms.some(u => u.id === p2.user.id)).toBe(true);
    });

    test("listPhantomUsers excludes claimed users", () => {
        const platform = "github";
        const platformId = `claimed-${Date.now()}`;
        const privyUserId = `privy-${Date.now()}`;

        const created = createPhantomUser(platform, platformId);
        claimIdentity(platform, platformId, privyUserId);

        const phantoms = listPhantomUsers();

        expect(phantoms.some(u => u.id === created.user.id)).toBe(false);
    });

    test("listPhantomUsers excludes merged users", () => {
        const privyUserId = `privy-${Date.now()}`;

        const phantom1 = createPhantomUser("github", `repo1-${Date.now()}`);
        const phantom2 = createPhantomUser("github", `repo2-${Date.now()}`);

        claimIdentity("github", phantom1.identity.platformId, privyUserId);
        claimIdentity("github", phantom2.identity.platformId, privyUserId);

        const phantoms = listPhantomUsers();

        expect(phantoms.some(u => u.id === phantom2.user.id)).toBe(false);
    });
});
