/**
 * Identity Service — User-Centric Model
 *
 * Data model:
 *   User (1) ←→ Wallet (1)
 *   User (1) ←→ Identities (many)
 *
 * Persistence:
 * - Uses PostgreSQL when DATABASE_URL is set
 * - Falls back to in-memory when not configured (development)
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
import * as identityRepo from "../db/repositories/identity.repository.js";
import * as walletRepo from "../db/repositories/wallet.repository.js";

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
    isNew: boolean;
}

export interface ClaimResult {
    success: boolean;
    user?: User;
    walletAddress?: string;
    privateKey?: string;
    merged?: boolean;
    message: string;
}

// ─── Helper: Resolve User (follow merge chain) ───────────

async function resolveUser(userId: string): Promise<User> {
    let user = await identityRepo.findUserById(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    // Follow merge chain
    let depth = 0;
    while (user.mergedInto && depth < 10) {
        const merged = await identityRepo.findUserById(user.mergedInto);
        if (!merged) break;
        user = merged;
        depth++;
    }
    return user;
}

// ─── Core: Create ───────────────────────────────────────

/**
 * Create a phantom user + identity + wallet for a platform account.
 * Idempotent: if an identity for this platform/platformId already exists, returns the existing user.
 */
export async function createPhantomUser(
    platform: string,
    platformId: string,
    createdBy?: string,
): Promise<CreatePhantomResult> {
    // Check if identity already exists → return existing user
    const existingIdentity = await identityRepo.findIdentityByPlatform(platform, platformId);
    if (existingIdentity) {
        const user = await resolveUser(existingIdentity.userId);
        return {
            user,
            identity: existingIdentity,
            walletAddress: user.walletAddress,
            isNew: false,
        };
    }

    // Create wallet
    const wallet = ethers.Wallet.createRandom();
    const { encrypted, iv, authTag } = encryptKey(wallet.privateKey);

    // Create user
    const userId = crypto.randomUUID();
    const user = await identityRepo.createUser({
        id: userId,
        walletAddress: wallet.address,
        privyUserId: null,
        status: "phantom",
    });

    // Create identity
    const identityId = crypto.randomUUID();
    const identity = await identityRepo.createIdentity({
        id: identityId,
        userId,
        platform,
        platformId,
        createdBy: createdBy || null,
    });

    // Store wallet
    await walletRepo.createWallet({
        address: wallet.address,
        encryptedKey: encrypted,
        iv,
        authTag,
        keyType: "user",
        keyId: userId,
    });

    console.log(`[identity] Created phantom user: ${platform}/${platformId} → ${wallet.address}`);

    return { user, identity, walletAddress: wallet.address, isNew: true };
}

// ─── Core: Claim ────────────────────────────────────────

/**
 * Claim an identity — the real dev verifies and takes ownership.
 *
 * If the dev (privyUserId) has already claimed another identity,
 * this merges the two users into one (consolidating wallets).
 */
export async function claimIdentity(
    platform: string,
    platformId: string,
    privyUserId: string,
): Promise<ClaimResult> {
    // Find the identity
    const identity = await identityRepo.findIdentityByPlatform(platform, platformId);
    if (!identity) {
        return {
            success: false,
            message: `No phantom identity found for ${platform}/${platformId}`,
        };
    }

    const phantomUser = await resolveUser(identity.userId);

    // Check if this Privy user already has a claimed user
    const existingUser = await identityRepo.findUserByPrivyId(privyUserId);

    if (existingUser) {
        const resolvedExisting = await resolveUser(existingUser.id);

        if (phantomUser.id === resolvedExisting.id) {
            // Already the same user, just adding another identity
            return {
                success: true,
                user: resolvedExisting,
                walletAddress: resolvedExisting.walletAddress,
                message: `Identity ${platform}/${platformId} already belongs to this user.`,
            };
        }

        // MERGE: phantom user → existing user
        return mergeUsers(resolvedExisting, phantomUser, identity, privyUserId);
    }

    // First claim for this Privy user — just take over the phantom user
    const updatedUser = await identityRepo.updateUser(phantomUser.id, {
        status: "claimed",
        privyUserId,
        claimedAt: new Date(),
    });

    if (!updatedUser) {
        return { success: false, message: "Failed to claim user" };
    }

    const storedWallet = await walletRepo.findWalletByKey("user", phantomUser.id);
    const privateKey = storedWallet
        ? decryptKey(storedWallet.encryptedKey, storedWallet.iv, storedWallet.authTag)
        : undefined;

    console.log(
        `[identity] User claimed: ${platform}/${platformId} → ${privyUserId} (wallet: ${updatedUser.walletAddress})`,
    );

    return {
        success: true,
        user: updatedUser,
        walletAddress: updatedUser.walletAddress,
        privateKey,
        merged: false,
        message: `Claimed wallet ${updatedUser.walletAddress} for ${platform}/${platformId}`,
    };
}

// ─── Core: Merge ────────────────────────────────────────

/**
 * Merge a phantom user into an existing claimed user.
 */
async function mergeUsers(
    primaryUser: User,
    phantomUser: User,
    triggeringIdentity: Identity,
    privyUserId: string,
): Promise<ClaimResult> {
    // Move all identities from phantom to primary
    await identityRepo.updateIdentitiesUserId(phantomUser.id, primaryUser.id);

    // Mark phantom user as merged
    await identityRepo.updateUser(phantomUser.id, {
        mergedInto: primaryUser.id,
        status: "claimed",
    });

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
 * Find an identity by platform + platformId.
 */
export async function findIdentity(platform: string, platformId: string): Promise<Identity | null> {
    return identityRepo.findIdentityByPlatform(platform, platformId);
}

/**
 * Find the user that owns a platform identity.
 */
export async function findUserByPlatform(
    platform: string,
    platformId: string,
): Promise<User | null> {
    const identity = await findIdentity(platform, platformId);
    if (!identity) return null;
    return resolveUser(identity.userId);
}

/**
 * Find a user by their Privy user ID (i.e., after they've claimed).
 */
export async function findUserByPrivyId(privyUserId: string): Promise<User | null> {
    const user = await identityRepo.findUserByPrivyId(privyUserId);
    if (!user) return null;
    return resolveUser(user.id);
}

/**
 * Find user by wallet address.
 */
export async function findUserByWallet(walletAddress: string): Promise<User | null> {
    const user = await identityRepo.findUserByWalletAddress(walletAddress);
    if (!user) return null;
    return resolveUser(user.id);
}

/**
 * Check if a platform identity already has a user.
 */
export async function hasIdentity(platform: string, platformId: string): Promise<boolean> {
    const identity = await identityRepo.findIdentityByPlatform(platform, platformId);
    return identity !== null;
}

/**
 * Get all identities for a user.
 */
export async function getUserIdentities(userId: string): Promise<Identity[]> {
    const resolved = await resolveUser(userId);
    return identityRepo.findIdentitiesByUserId(resolved.id);
}

/**
 * Find identity by GitHub repo (handles normalization).
 */
export async function findByGitHubRepo(
    repoFullName: string,
): Promise<{ user: User; identity: Identity } | null> {
    const normalized = repoFullName.replace(/^https?:\/\//, "").replace(/^github\.com\//, "");

    let identity = await findIdentity("github", normalized);
    if (!identity) {
        identity = await findIdentity("github", `github.com/${normalized}`);
    }
    if (!identity) return null;

    const user = await resolveUser(identity.userId);
    return { user, identity };
}

/**
 * Get the wallet signer for a user.
 */
export async function getUserWallet(userId: string): Promise<ethers.Wallet | null> {
    const user = await resolveUser(userId);
    const stored = await walletRepo.findWalletByKey("user", user.id);
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
export async function listPhantomUsers(): Promise<User[]> {
    return identityRepo.listPhantomUsers();
}

// ─── Backward compatibility ─────────────────────────────

/** @deprecated Use createPhantomUser instead */
export async function createPhantomIdentity(
    platform: string,
    platformId: string,
    createdBy?: string,
) {
    const result = await createPhantomUser(platform, platformId, createdBy);
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
export async function findByPlatformId(platform: string, platformId: string) {
    const identity = await findIdentity(platform, platformId);
    if (!identity) return null;
    const user = await resolveUser(identity.userId);
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
export async function getWalletAddressesByPrivyId(privyUserId: string): Promise<string[]> {
    const user = await identityRepo.findUserByPrivyId(privyUserId);
    if (!user) return [];

    const primaryUser = await resolveUser(user.id);
    const addresses = [primaryUser.walletAddress];

    // Include wallets from merged users
    const mergedUsers = await identityRepo.findUsersMergedInto(primaryUser.id);
    for (const merged of mergedUsers) {
        addresses.push(merged.walletAddress);
    }

    return addresses;
}
