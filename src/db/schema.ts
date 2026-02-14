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
  /** Verified owner wallet */
  ownerWallet: varchar("owner_wallet", { length: 42 }),
  /** Verification method used */
  verificationMethod: varchar("verification_method", { length: 32 }),
  /** EAS attestation UID */
  attestationUid: varchar("attestation_uid", { length: 66 }),
  /** Pool token contract address (if a token was deployed for this project) */
  poolTokenAddress: varchar("pool_token_address", { length: 42 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
});
