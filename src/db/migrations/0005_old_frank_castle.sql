CREATE TABLE "chat_message_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"message_id" uuid NOT NULL,
	"actor_key" varchar(320) NOT NULL,
	"vote" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"role" varchar(16) NOT NULL,
	"source" varchar(16) DEFAULT 'user' NOT NULL,
	"content" text NOT NULL,
	"created_by_user_id" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar(320)
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"platform" varchar(32) DEFAULT 'web' NOT NULL,
	"owner_user_id" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "connect_handshake_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"endpoint" varchar(512) NOT NULL,
	"stack" varchar(32) NOT NULL,
	"token_prefix" varchar(64) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"consumed_by_ip_hash" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connect_quick_launches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"stack" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"endpoint" varchar(512),
	"error" text,
	"mcp_token_id" uuid,
	"railway_project_id" varchar(128),
	"railway_service_id" varchar(128),
	"railway_deployment_id" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connected_bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"stack" varchar(32) NOT NULL,
	"endpoint" varchar(512) NOT NULL,
	"connection_id" varchar(128),
	"bot_id" varchar(128),
	"status" varchar(16) DEFAULT 'connected' NOT NULL,
	"scopes" jsonb,
	"last_seen_at" timestamp,
	"provisioner" varchar(32),
	"provision_status" varchar(32),
	"provision_project_id" varchar(128),
	"provision_service_id" varchar(128),
	"provision_deployment_id" varchar(128),
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"disconnected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fee_distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"block_number" integer NOT NULL,
	"log_index" integer NOT NULL,
	"pool_id" varchar(66),
	"token_address" varchar(42) NOT NULL,
	"amount" text,
	"dev_amount" text,
	"protocol_amount" text,
	"dev_address" varchar(42),
	"recipient_address" varchar(42),
	"block_timestamp" timestamp NOT NULL,
	"indexed_at" timestamp DEFAULT now() NOT NULL,
	"project_id" varchar(512)
);
--> statement-breakpoint
CREATE TABLE "indexer_state" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"last_processed_block" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "launch_claim_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar(512) NOT NULL,
	"project_ref_id" uuid NOT NULL,
	"token_prefix" varchar(64) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"created_ip_hash" varchar(128) NOT NULL,
	"consumed_ip_hash" varchar(128),
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"consumed_by_user_id" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"name" varchar(128) NOT NULL,
	"token_prefix" varchar(64) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"scopes" jsonb NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_relays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_address" varchar(42) NOT NULL,
	"v1_amount" text NOT NULL,
	"v2_amount_sent" text,
	"v1_returned" integer DEFAULT 0 NOT NULL,
	"tx_hash_in" varchar(66) NOT NULL,
	"tx_hash_out" varchar(66),
	"block_number" integer NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"reason" varchar(32),
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "quick_launch_ip_guardrails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_hash" varchar(128) NOT NULL,
	"first_launch_at" timestamp DEFAULT now() NOT NULL,
	"last_project_id" varchar(512),
	"launch_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "encrypted_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "iv" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "auth_tag" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "encrypted_keystore" text;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "keystore_version" integer;--> statement-breakpoint
ALTER TABLE "chat_message_votes" ADD CONSTRAINT "chat_message_votes_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message_votes" ADD CONSTRAINT "chat_message_votes_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connect_quick_launches" ADD CONSTRAINT "connect_quick_launches_mcp_token_id_mcp_tokens_id_fk" FOREIGN KEY ("mcp_token_id") REFERENCES "public"."mcp_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launch_claim_tokens" ADD CONSTRAINT "launch_claim_tokens_project_ref_id_projects_id_fk" FOREIGN KEY ("project_ref_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_message_votes_unique_actor" ON "chat_message_votes" USING btree ("message_id","actor_key");--> statement-breakpoint
CREATE INDEX "chat_message_votes_session_idx" ON "chat_message_votes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "chat_message_votes_message_idx" ON "chat_message_votes" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "chat_messages_session_created_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_created_by_idx" ON "chat_messages" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "chat_messages_deleted_at_idx" ON "chat_messages" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "chat_sessions_owner_user_idx" ON "chat_sessions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "chat_sessions_updated_at_idx" ON "chat_sessions" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "connect_handshake_intents_prefix_uq" ON "connect_handshake_intents" USING btree ("token_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "connect_handshake_intents_hash_uq" ON "connect_handshake_intents" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "connect_handshake_intents_user_idx" ON "connect_handshake_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "connect_quick_launches_user_idx" ON "connect_quick_launches" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_distributions_tx_log_idx" ON "fee_distributions" USING btree ("tx_hash","log_index");--> statement-breakpoint
CREATE UNIQUE INDEX "launch_claim_tokens_prefix_uq" ON "launch_claim_tokens" USING btree ("token_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "launch_claim_tokens_hash_uq" ON "launch_claim_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "launch_claim_tokens_project_idx" ON "launch_claim_tokens" USING btree ("project_ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_tokens_token_prefix_uq" ON "mcp_tokens" USING btree ("token_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_tokens_token_hash_uq" ON "mcp_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "migration_relays_tx_hash_in_uq" ON "migration_relays" USING btree ("tx_hash_in");--> statement-breakpoint
CREATE INDEX "migration_relays_sender_idx" ON "migration_relays" USING btree ("sender_address");--> statement-breakpoint
CREATE UNIQUE INDEX "quick_launch_ip_guardrails_hash_uq" ON "quick_launch_ip_guardrails" USING btree ("ip_hash");