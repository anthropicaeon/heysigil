/**
 * Identity Service — User-Centric Model
 *
 * Data model:
 *   User (1) ←→ Wallet (1)
 *   User (1) ←→ Identities (many)
 *
 * Lifecycle:
 *   1. Third-party launch → createPhantomUser("github", "org/repo")
 *      Creates: User (phantom) + Wallet + Identity
 *
 *   2. Another launch for same dev but different platform?
 *      We can't know they're the same person yet → new User + Wallet + Identity
 *
 *   3. Dev verifies Identity A → user claimed, linked to Privy account
 *
 *   4. Dev verifies Identity B → same Privy account?
 *      → mergeUsers() consolidates wallet B into wallet A
 *      → Identity B now points to User A
 *      → User B marked as merged
 */

import { ethers } from "ethers";
import crypto from "node:crypto";
import { getEnv } from "../config/env.js";
import { encryptKey, decryptKey } from "../utils/crypto.js";

// ─── Types ──────────────────────────────────────────────

export interface User {
    id: string;
    walletAddress: string;
    privyUserId: string | null;
    status: "phantom" | "claimed";
    createdAt: Date;
    claimedAt: Date | null;
    mergedInto: string | null;
}

export interface Identity {
    id: string;
    userId: string;
    platform: string;
    platformId: string;
    createdBy: string | null;
    createdAt: Date;
}

export interface CreatePhantomResult {
    user: User;
    identity: Identity;
    walletAddress: string;
    isNew: boolean; // false if identity already existed
}

export interface ClaimResult {
    success: boolean;
    user?: User;
    walletAddress?: string;
    privateKey?: string;
    merged?: boolean; // true if a merge happened
    message: string;
}

// ─── In-Memory Stores ───────────────────────────────────

const userStore = new Map<string, User>();
const identityStore = new Map<string, Identity>();
const walletKeyStore = new Map<
    string,
    {
        address: string;
        encryptedKey: string;
        iv: string;
        authTag: string;
    }
>();

// Indexes
const platformIndex = new Map<string, string>(); // "platform:platformId" → identityId
const privyUserIndex = new Map<string, string>(); // privyUserId → userId
const walletUserIndex = new Map<string, string>(); // walletAddress → userId

// ─── Core: Create ───────────────────────────────────────

/**
 * Create a phantom user + identity + wallet for a platform account.
 * Idempotent: if an identity for this platform/platformId already exists, returns the existing user.
 */
export function createPhantomUser(
    platform: string,
    platformId: string,
    createdBy?: string,
): CreatePhantomResult {
    const indexKey = `${platform}:${platformId}`;

    // Check if identity already exists → return existing user
    const existingIdentityId = platformIndex.get(indexKey);
    if (existingIdentityId) {
        const identity = identityStore.get(existingIdentityId)!;
        const user = resolveUser(identity.userId);
        return { user, identity, walletAddress: user.walletAddress, isNew: false };
    }

    // Create wallet
    const wallet = ethers.Wallet.createRandom();
    const { encrypted, iv, authTag } = encryptKey(wallet.privateKey);

    // Create user
    const userId = crypto.randomUUID();
    const user: User = {
        id: userId,
        walletAddress: wallet.address,
        privyUserId: null,
        status: "phantom",
        createdAt: new Date(),
        claimedAt: null,
        mergedInto: null,
    };

    // Create identity
    const identityId = crypto.randomUUID();
    const identity: Identity = {
        id: identityId,
        userId,
        platform,
        platformId,
        createdBy: createdBy || null,
        createdAt: new Date(),
    };

    // Store everything
    userStore.set(userId, user);
    identityStore.set(identityId, identity);
    walletKeyStore.set(userId, {
        address: wallet.address,
        encryptedKey: encrypted,
        iv,
        authTag,
    });
    platformIndex.set(indexKey, identityId);
    walletUserIndex.set(wallet.address, userId);

    console.log(`[identity] Created phantom user: ${platform}/${platformId} → ${wallet.address}`);

    return { user, identity, walletAddress: wallet.address, isNew: true };
}

// ─── Core: Claim ────────────────────────────────────────

/**
 * Claim an identity — the real dev verifies and takes ownership.
 *
 * If the dev (privyUserId) has already claimed another identity,
 * this merges the two users into one (consolidating wallets).
 *
 * @param platform - Platform type (e.g., "github")
 * @param platformId - Platform identifier (e.g., "org/repo")
 * @param privyUserId - The verified dev's Privy user ID
 */
export function claimIdentity(
    platform: string,
    platformId: string,
    privyUserId: string,
): ClaimResult {
    // Find the identity
    const indexKey = `${platform}:${platformId}`;
    const identityId = platformIndex.get(indexKey);
    if (!identityId) {
        return {
            success: false,
            message: `No phantom identity found for ${platform}/${platformId}`,
        };
    }

    const identity = identityStore.get(identityId)!;
    const phantomUser = resolveUser(identity.userId);

    // Check if this Privy user already has a claimed user
    const existingUserId = privyUserIndex.get(privyUserId);

    if (existingUserId) {
        // Dev already verified another identity — merge phantom into existing
        const existingUser = resolveUser(existingUserId);

        if (phantomUser.id === existingUser.id) {
            // Already the same user, just adding another identity
            return {
                success: true,
                user: existingUser,
                walletAddress: existingUser.walletAddress,
                message: `Identity ${platform}/${platformId} already belongs to this user.`,
            };
        }

        // MERGE: phantom user → existing user
        return mergeUsers(existingUser, phantomUser, identity, privyUserId);
    }

    // First claim for this Privy user — just take over the phantom user
    phantomUser.status = "claimed";
    phantomUser.privyUserId = privyUserId;
    phantomUser.claimedAt = new Date();
    privyUserIndex.set(privyUserId, phantomUser.id);

    const stored = walletKeyStore.get(phantomUser.id);
    const privateKey = stored
        ? decryptKey(stored.encryptedKey, stored.iv, stored.authTag)
        : undefined;

    console.log(
        `[identity] User claimed: ${platform}/${platformId} → ${privyUserId} (wallet: ${phantomUser.walletAddress})`,
    );

    return {
        success: true,
        user: phantomUser,
        walletAddress: phantomUser.walletAddress,
        privateKey,
        merged: false,
        message: `Claimed wallet ${phantomUser.walletAddress} for ${platform}/${platformId}`,
    };
}

// ─── Core: Merge ────────────────────────────────────────

/**
 * Merge a phantom user into an existing claimed user.
 *
 * - All identities of the phantom user → point to primary user
 * - Phantom user marked as merged
 * - Phantom wallet's funds should be swept to primary wallet (off-chain or on-chain)
 */
function mergeUsers(
    primaryUser: User,
    phantomUser: User,
    triggeringIdentity: Identity,
    privyUserId: string,
): ClaimResult {
    // Move all identities from phantom to primary
    for (const identity of identityStore.values()) {
        if (identity.userId === phantomUser.id) {
            identity.userId = primaryUser.id;
        }
    }

    // Mark phantom user as merged
    phantomUser.mergedInto = primaryUser.id;
    phantomUser.status = "claimed";

    // Log the merge for audit
    console.log(
        `[identity] MERGE: user ${phantomUser.id} (wallet ${phantomUser.walletAddress}) → ` +
            `user ${primaryUser.id} (wallet ${primaryUser.walletAddress})`,
    );
    console.log(
        `[identity]   Trigger: ${triggeringIdentity.platform}/${triggeringIdentity.platformId} ` +
            `claimed by ${privyUserId}`,
    );
    console.log(
        `[identity]   ⚠️  Phantom wallet ${phantomUser.walletAddress} has accumulated fees.` +
            ` Funds should be swept to primary wallet ${primaryUser.walletAddress}.`,
    );

    return {
        success: true,
        user: primaryUser,
        walletAddress: primaryUser.walletAddress,
        merged: true,
        message: [
            `Identity merged! ${triggeringIdentity.platform}/${triggeringIdentity.platformId} linked to your account.`,
            `Fees from wallet ${phantomUser.walletAddress} will be consolidated into ${primaryUser.walletAddress}.`,
        ].join(" "),
    };
}

// ─── Lookups ────────────────────────────────────────────

/**
 * Follow the merge chain to find the canonical user.
 */
function resolveUser(userId: string): User {
    let user = userStore.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    // Follow merge chain
    let depth = 0;
    while (user.mergedInto && depth < 10) {
        user = userStore.get(user.mergedInto) || user;
        depth++;
    }
    return user;
}

/**
 * Find an identity by platform + platformId.
 */
export function findIdentity(platform: string, platformId: string): Identity | null {
    const indexKey = `${platform}:${platformId}`;
    const id = platformIndex.get(indexKey);
    if (!id) return null;
    return identityStore.get(id) || null;
}

/**
 * Find the user that owns a platform identity.
 */
export function findUserByPlatform(platform: string, platformId: string): User | null {
    const identity = findIdentity(platform, platformId);
    if (!identity) return null;
    return resolveUser(identity.userId);
}

/**
 * Find a user by their Privy user ID (i.e., after they've claimed).
 */
export function findUserByPrivyId(privyUserId: string): User | null {
    const userId = privyUserIndex.get(privyUserId);
    if (!userId) return null;
    return resolveUser(userId);
}

/**
 * Find user by wallet address.
 */
export function findUserByWallet(walletAddress: string): User | null {
    const userId = walletUserIndex.get(walletAddress);
    if (!userId) return null;
    return resolveUser(userId);
}

/**
 * Check if a platform identity already has a user.
 */
export function hasIdentity(platform: string, platformId: string): boolean {
    return platformIndex.has(`${platform}:${platformId}`);
}

/**
 * Get all identities for a user.
 */
export function getUserIdentities(userId: string): Identity[] {
    const resolved = resolveUser(userId);
    return Array.from(identityStore.values()).filter((i) => {
        try {
            return resolveUser(i.userId).id === resolved.id;
        } catch {
            return false;
        }
    });
}

/**
 * Find identity by GitHub repo (handles normalization).
 */
export function findByGitHubRepo(repoFullName: string): { user: User; identity: Identity } | null {
    const normalized = repoFullName.replace(/^https?:\/\//, "").replace(/^github\.com\//, "");

    let identity = findIdentity("github", normalized);
    if (!identity) {
        identity = findIdentity("github", `github.com/${normalized}`);
    }
    if (!identity) return null;

    return { user: resolveUser(identity.userId), identity };
}

/**
 * Get the wallet signer for a user.
 */
export function getUserWallet(userId: string): ethers.Wallet | null {
    const user = resolveUser(userId);
    const stored = walletKeyStore.get(user.id);
    if (!stored) return null;

    const env = getEnv();
    const rpcUrl = env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const privateKey = decryptKey(stored.encryptedKey, stored.iv, stored.authTag);
    return new ethers.Wallet(privateKey, provider);
}

/**
 * List all phantom users (admin/debug).
 */
export function listPhantomUsers(): User[] {
    return Array.from(userStore.values()).filter((u) => u.status === "phantom" && !u.mergedInto);
}

// ─── Backward compatibility ─────────────────────────────
// These aliases maintain compatibility with existing code

/** @deprecated Use createPhantomUser instead */
export function createPhantomIdentity(platform: string, platformId: string, createdBy?: string) {
    const result = createPhantomUser(platform, platformId, createdBy);
    return {
        identity: {
            ...result.identity,
            walletAddress: result.walletAddress,
            status: result.user.status,
        },
        walletAddress: result.walletAddress,
        isNew: result.isNew,
    };
}

/** @deprecated Use findIdentity instead */
export function findByPlatformId(platform: string, platformId: string) {
    const identity = findIdentity(platform, platformId);
    if (!identity) return null;
    const user = resolveUser(identity.userId);
    return {
        id: identity.id,
        platform: identity.platform,
        platformId: identity.platformId,
        walletAddress: user.walletAddress,
        privyUserId: user.privyUserId,
        status: user.status,
        createdBy: identity.createdBy,
        createdAt: identity.createdAt,
        claimedAt: user.claimedAt,
    };
}

/**
 * Get all wallet addresses owned by a Privy user.
 * Includes the primary wallet and any merged phantom wallets.
 */
export function getWalletAddressesByPrivyId(privyUserId: string): string[] {
    const userId = privyUserIndex.get(privyUserId);
    if (!userId) return [];

    const primaryUser = resolveUser(userId);
    const addresses = [primaryUser.walletAddress];

    // Include wallets from merged users
    for (const user of userStore.values()) {
        if (user.mergedInto === primaryUser.id) {
            addresses.push(user.walletAddress);
        }
    }

    return addresses;
}
