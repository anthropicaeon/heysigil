import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    jsonb,
    integer,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";

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
 * Private keys can be encrypted in two formats:
 * 1. ethers keystore v3 (encryptedKeystore) - Recommended for new wallets
 * 2. AES-256-GCM (encryptedKey, iv, authTag) - Legacy format, maintained for migration
 *
 * New wallets use keystore format. Old wallets are lazily migrated on read.
 */
export const wallets = pgTable("wallets", {
    id: uuid("id").primaryKey().defaultRandom(),
    /** The wallet's public address */
    address: varchar("address", { length: 42 }).notNull().unique(),

    // ─── New Keystore Format (v2+) ─────────────────────────
    /** JSON keystore using ethers.Wallet.encrypt() format */
    encryptedKeystore: text("encrypted_keystore"),
    /** Keystore format version (null = legacy, 2 = current) */
    keystoreVersion: integer("keystore_version"),

    // ─── Legacy AES-256-GCM Format (v1) ────────────────────
    /** @deprecated Use encryptedKeystore instead */
    encryptedKey: text("encrypted_key"),
    /** @deprecated Part of legacy encryption */
    iv: varchar("iv", { length: 64 }),
    /** @deprecated Part of legacy encryption */
    authTag: varchar("auth_tag", { length: 64 }),

    /** What this wallet is keyed to: "user" | "session" */
    keyType: varchar("key_type", { length: 16 }).notNull(),
    /** The key value: userId or sessionId */
    keyId: varchar("key_id", { length: 256 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * MCP personal access tokens (PATs) for agent access.
 * Tokens are stored hashed; plaintext is shown once at creation.
 */
export const mcpTokens = pgTable(
    "mcp_tokens",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        /** Privy user ID (DID) that owns this token */
        userId: varchar("user_id", { length: 256 }).notNull(),
        /** Friendly token label shown in UI */
        name: varchar("name", { length: 128 }).notNull(),
        /** Stable token prefix (non-secret) for lookup */
        tokenPrefix: varchar("token_prefix", { length: 64 }).notNull(),
        /** SHA-256 hash of the full token */
        tokenHash: varchar("token_hash", { length: 128 }).notNull(),
        /** Allowed MCP scopes */
        scopes: jsonb("scopes").$type<string[]>().notNull(),
        /** Optional expiration date */
        expiresAt: timestamp("expires_at"),
        /** Last successful usage */
        lastUsedAt: timestamp("last_used_at"),
        /** Revocation timestamp (null = active) */
        revokedAt: timestamp("revoked_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("mcp_tokens_token_prefix_uq").on(table.tokenPrefix),
        uniqueIndex("mcp_tokens_token_hash_uq").on(table.tokenHash),
    ],
);

// ─── Fee Distribution Audit Trail ────────────────────────

/**
 * Fee distributions indexed from SigilFeeVault events.
 * Provides a queryable audit trail of all fee movements.
 *
 * Events indexed:
 *   - FeesDeposited: Swap fee collected, dev known
 *   - FeesEscrowed: Swap fee collected, dev unknown
 *   - DevAssigned: Dev verified, escrow released
 *   - FeesExpired: 30-day escrow expired to protocol
 *   - DevFeesClaimed: Dev withdrew fees
 *   - ProtocolFeesClaimed: Protocol withdrew fees
 */
export const feeDistributions = pgTable(
    "fee_distributions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        /** Event type: deposit, escrow, dev_assigned, expired, dev_claimed, protocol_claimed */
        eventType: varchar("event_type", { length: 32 }).notNull(),
        /** Transaction hash */
        txHash: varchar("tx_hash", { length: 66 }).notNull(),
        /** Block number when event occurred */
        blockNumber: integer("block_number").notNull(),
        /** Log index within the transaction (for deduplication) */
        logIndex: integer("log_index").notNull(),
        /** V4 pool identifier (for FeesDeposited, FeesEscrowed, DevAssigned, FeesExpired) */
        poolId: varchar("pool_id", { length: 66 }),
        /** Token address involved in the fee */
        tokenAddress: varchar("token_address", { length: 42 }).notNull(),
        /** Total amount (used for single-amount events) */
        amount: text("amount"),
        /** Developer's share of the fee (for FeesDeposited) */
        devAmount: text("dev_amount"),
        /** Protocol's share of the fee (for FeesDeposited, ProtocolFeesClaimed) */
        protocolAmount: text("protocol_amount"),
        /** Developer wallet address (for FeesDeposited, DevAssigned, DevFeesClaimed) */
        devAddress: varchar("dev_address", { length: 42 }),
        /** Recipient of funds (for ProtocolFeesClaimed) */
        recipientAddress: varchar("recipient_address", { length: 42 }),
        /** Block timestamp when event occurred */
        blockTimestamp: timestamp("block_timestamp").notNull(),
        /** When this event was indexed */
        indexedAt: timestamp("indexed_at").notNull().defaultNow(),
        /** Linked project ID from projects table (populated asynchronously) */
        projectId: varchar("project_id", { length: 512 }),
    },
    (table) => [
        // Unique constraint for deduplication: (txHash, logIndex)
        uniqueIndex("fee_distributions_tx_log_idx").on(table.txHash, table.logIndex),
    ],
);

/**
 * Indexer state tracking.
 * Stores the last processed block for resumable indexing.
 */
export const indexerState = pgTable("indexer_state", {
    /** Identifier for the indexer (e.g., "fee-indexer") */
    id: varchar("id", { length: 64 }).primaryKey(),
    /** Last successfully processed block number */
    lastProcessedBlock: integer("last_processed_block").notNull(),
    /** When this state was last updated */
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Connected Bot Instances ─────────────────────────────

/**
 * Tracks SigilBot / OpenClaw instances connected via /connect handshake.
 * Each record maps a user to a deployed bot runtime.
 */
export const connectedBots = pgTable("connected_bots", {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Privy user ID (DID) that owns this connection */
    userId: varchar("user_id", { length: 256 }).notNull(),
    /** Bot stack type */
    stack: varchar("stack", { length: 32 }).notNull(),
    /** Deployed bot endpoint URL */
    endpoint: varchar("endpoint", { length: 512 }).notNull(),
    /** Connection ID returned by the bot's /v1/handshake */
    connectionId: varchar("connection_id", { length: 128 }),
    /** Bot's self-reported ID */
    botId: varchar("bot_id", { length: 128 }),
    /** "connected" | "disconnected" */
    status: varchar("status", { length: 16 }).notNull().default("connected"),
    /** Scopes granted during handshake */
    scopes: jsonb("scopes").$type<string[]>(),
    /** Last health-check or interaction */
    lastSeenAt: timestamp("last_seen_at"),
    /** Provisioner used for this runtime (e.g. railway) */
    provisioner: varchar("provisioner", { length: 32 }),
    /** Provisioning status (pending, ready, failed) */
    provisionStatus: varchar("provision_status", { length: 32 }),
    /** Provisioned project identifier (provider-specific) */
    provisionProjectId: varchar("provision_project_id", { length: 128 }),
    /** Provisioned service identifier (provider-specific) */
    provisionServiceId: varchar("provision_service_id", { length: 128 }),
    /** Provisioned deployment identifier (provider-specific) */
    provisionDeploymentId: varchar("provision_deployment_id", { length: 128 }),
    connectedAt: timestamp("connected_at").notNull().defaultNow(),
    disconnectedAt: timestamp("disconnected_at"),
});

/**
 * One-time claim tokens returned by quick-launch.
 * Tokens are stored hashed and atomically consumed on redemption.
 */
export const launchClaimTokens = pgTable(
    "launch_claim_tokens",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: varchar("project_id", { length: 512 }).notNull(),
        projectRefId: uuid("project_ref_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        tokenPrefix: varchar("token_prefix", { length: 64 }).notNull(),
        tokenHash: varchar("token_hash", { length: 128 }).notNull(),
        createdIpHash: varchar("created_ip_hash", { length: 128 }).notNull(),
        consumedIpHash: varchar("consumed_ip_hash", { length: 128 }),
        expiresAt: timestamp("expires_at").notNull(),
        consumedAt: timestamp("consumed_at"),
        consumedByUserId: varchar("consumed_by_user_id", { length: 256 }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("launch_claim_tokens_prefix_uq").on(table.tokenPrefix),
        uniqueIndex("launch_claim_tokens_hash_uq").on(table.tokenHash),
        index("launch_claim_tokens_project_idx").on(table.projectRefId),
    ],
);

/**
 * Strict quick-launch IP guardrail store (1 launch per IP hash).
 */
export const quickLaunchIpGuardrails = pgTable(
    "quick_launch_ip_guardrails",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        ipHash: varchar("ip_hash", { length: 128 }).notNull(),
        firstLaunchAt: timestamp("first_launch_at").notNull().defaultNow(),
        lastProjectId: varchar("last_project_id", { length: 512 }),
        launchCount: integer("launch_count").notNull().default(1),
    },
    (table) => [uniqueIndex("quick_launch_ip_guardrails_hash_uq").on(table.ipHash)],
);

/**
 * One-time handshake intents used to harden /connect/handshake against replay.
 */
export const connectHandshakeIntents = pgTable(
    "connect_handshake_intents",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        endpoint: varchar("endpoint", { length: 512 }).notNull(),
        stack: varchar("stack", { length: 32 }).notNull(),
        tokenPrefix: varchar("token_prefix", { length: 64 }).notNull(),
        tokenHash: varchar("token_hash", { length: 128 }).notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        consumedAt: timestamp("consumed_at"),
        consumedByIpHash: varchar("consumed_by_ip_hash", { length: 128 }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("connect_handshake_intents_prefix_uq").on(table.tokenPrefix),
        uniqueIndex("connect_handshake_intents_hash_uq").on(table.tokenHash),
        index("connect_handshake_intents_user_idx").on(table.userId),
    ],
);

/**
 * Tracks asynchronous one-click /connect provisioning operations.
 */
export const connectQuickLaunches = pgTable(
    "connect_quick_launches",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        stack: varchar("stack", { length: 32 }).notNull(),
        status: varchar("status", { length: 32 }).notNull().default("pending"),
        endpoint: varchar("endpoint", { length: 512 }),
        error: text("error"),
        mcpTokenId: uuid("mcp_token_id").references(() => mcpTokens.id, { onDelete: "set null" }),
        railwayProjectId: varchar("railway_project_id", { length: 128 }),
        railwayServiceId: varchar("railway_service_id", { length: 128 }),
        railwayDeploymentId: varchar("railway_deployment_id", { length: 128 }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [index("connect_quick_launches_user_idx").on(table.userId, table.createdAt)],
);

// ─── Chat Persistence ───────────────────────────────────────────────

/**
 * Persistent chat sessions keyed by sessionId.
 * In-memory session manager remains as a fallback when DB is unavailable.
 */
export const chatSessions = pgTable(
    "chat_sessions",
    {
        /** Session identifier used by /api/chat */
        id: varchar("id", { length: 64 }).primaryKey(),
        /** Platform where session started (web, sdk, mcp, etc.) */
        platform: varchar("platform", { length: 32 }).notNull().default("web"),
        /** Owning user (Privy DID); null for anonymous sessions */
        ownerUserId: varchar("owner_user_id", { length: 256 }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
        lastMessageAt: timestamp("last_message_at"),
    },
    (table) => [
        index("chat_sessions_owner_user_idx").on(table.ownerUserId),
        index("chat_sessions_updated_at_idx").on(table.updatedAt),
    ],
);

/**
 * Persistent chat messages.
 */
export const chatMessages = pgTable(
    "chat_messages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        sessionId: varchar("session_id", { length: 64 })
            .notNull()
            .references(() => chatSessions.id, { onDelete: "cascade" }),
        role: varchar("role", { length: 16 }).notNull(), // "user" | "assistant"
        /** message origin actor */
        source: varchar("source", { length: 16 }).notNull().default("user"), // "user" | "assistant" | "agent"
        content: text("content").notNull(),
        /** Privy DID of actor if authenticated */
        createdByUserId: varchar("created_by_user_id", { length: 256 }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        deletedAt: timestamp("deleted_at"),
        deletedBy: varchar("deleted_by", { length: 320 }),
    },
    (table) => [
        index("chat_messages_session_created_idx").on(table.sessionId, table.createdAt),
        index("chat_messages_created_by_idx").on(table.createdByUserId),
        index("chat_messages_deleted_at_idx").on(table.deletedAt),
    ],
);

/**
 * Per-actor message voting.
 * A single actor can keep one active vote per message.
 */
export const chatMessageVotes = pgTable(
    "chat_message_votes",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        sessionId: varchar("session_id", { length: 64 })
            .notNull()
            .references(() => chatSessions.id, { onDelete: "cascade" }),
        messageId: uuid("message_id")
            .notNull()
            .references(() => chatMessages.id, { onDelete: "cascade" }),
        actorKey: varchar("actor_key", { length: 320 }).notNull(),
        vote: integer("vote").notNull(), // 1 = upvote, -1 = downvote
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex("chat_message_votes_unique_actor").on(table.messageId, table.actorKey),
        index("chat_message_votes_session_idx").on(table.sessionId),
        index("chat_message_votes_message_idx").on(table.messageId),
    ],
);
