import { pgTable, text, timestamp, uuid, varchar, jsonb } from "drizzle-orm/pg-core";

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  method: varchar("method", { length: 32 }).notNull(),
  projectId: varchar("project_id", { length: 512 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
  challengeCode: varchar("challenge_code", { length: 128 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  platformUsername: varchar("platform_username", { length: 256 }),
  proof: jsonb("proof"),
  attestationUid: varchar("attestation_uid", { length: 66 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Canonical project identifier (e.g., "github.com/org/repo", "example.com") */
  projectId: varchar("project_id", { length: 512 }).notNull().unique(),
  /** Display name */
  name: varchar("name", { length: 256 }),
  /** Project description */
  description: text("description"),
  /** Verified owner wallet */
  ownerWallet: varchar("owner_wallet", { length: 42 }),
  /** Verification method used */
  verificationMethod: varchar("verification_method", { length: 32 }),
  /** EAS attestation UID */
  attestationUid: varchar("attestation_uid", { length: 66 }),
  /** Pool token contract address (deployed by SigilFactory) */
  poolTokenAddress: varchar("pool_token_address", { length: 42 }),
  /** V4 pool identifier */
  poolId: varchar("pool_id", { length: 66 }),
  /** Deployment transaction hash */
  deployTxHash: varchar("deploy_tx_hash", { length: 66 }),
  /** How the token was launched */
  deployedBy: varchar("deployed_by", { length: 16 }), // "chat" | "api" | "social"
  /** Developer links for claiming — array of { platform, url, projectId } */
  devLinks: jsonb("dev_links").$type<{ platform: string; url: string; projectId: string }[]>(),
  /** User ID — links to the user that owns this project */
  userId: uuid("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

// ─── User & Identity System ─────────────────────────────

/**
 * Users are the real people. A user has ONE wallet and MANY identities.
 *
 * Lifecycle:
 *   1. Phantom user created when someone launches a token for a dev
 *   2. User gets a single custodial wallet
 *   3. When dev verifies any identity, user is "claimed"
 *   4. If dev verifies more identities, they all link to the same user
 *   5. If a second phantom user existed for another platform identity,
 *      it's merged into the primary user (wallets consolidated)
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Primary custodial wallet address */
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
  /** Privy user ID — null until dev creates a real account */
  privyUserId: varchar("privy_user_id", { length: 256 }),
  /** "phantom" | "claimed" */
  status: varchar("status", { length: 16 }).notNull().default("phantom"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  /** When the real dev verified and claimed */
  claimedAt: timestamp("claimed_at"),
  /** If this user was merged into another, points to the primary user */
  mergedInto: uuid("merged_into"),
});

/**
 * Identities are platform accounts (GitHub repos, Twitter handles, etc.)
 * Each identity belongs to exactly ONE user.
 *
 * Multiple identities can point to the same user — that's the grouping.
 */
export const identities = pgTable("identities", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** The user this identity belongs to */
  userId: uuid("user_id").notNull(),
  /** Platform type: "github", "twitter", "instagram", "facebook", "domain" */
  platform: varchar("platform", { length: 32 }).notNull(),
  /** Platform-specific identifier: "org/repo" for GitHub, "@handle" for Twitter */
  platformId: varchar("platform_id", { length: 512 }).notNull(),
  /** Who created this identity (sessionId or privyUserId of the launcher) */
  createdBy: varchar("created_by", { length: 256 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Persistent wallet storage.
 * Private keys are AES-256-GCM encrypted.
 */
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** The wallet's public address */
  address: varchar("address", { length: 42 }).notNull().unique(),
  /** AES-256-GCM encrypted private key (hex) */
  encryptedKey: text("encrypted_key").notNull(),
  /** Initialization vector (hex) */
  iv: varchar("iv", { length: 64 }).notNull(),
  /** GCM authentication tag (hex) */
  authTag: varchar("auth_tag", { length: 64 }).notNull(),
  /** What this wallet is keyed to: "user" | "session" */
  keyType: varchar("key_type", { length: 16 }).notNull(),
  /** The key value: userId or sessionId */
  keyId: varchar("key_id", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
