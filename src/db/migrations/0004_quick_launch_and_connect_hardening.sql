DO $$ BEGIN ALTER TABLE "connected_bots" ADD COLUMN "provisioner" varchar(32); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "connected_bots" ADD COLUMN "provision_status" varchar(32); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "connected_bots" ADD COLUMN "provision_project_id" varchar(128); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "connected_bots" ADD COLUMN "provision_service_id" varchar(128); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "connected_bots" ADD COLUMN "provision_deployment_id" varchar(128); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "launch_claim_tokens" (
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
CREATE TABLE IF NOT EXISTS "quick_launch_ip_guardrails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_hash" varchar(128) NOT NULL,
	"first_launch_at" timestamp DEFAULT now() NOT NULL,
	"last_project_id" varchar(512),
	"launch_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connect_handshake_intents" (
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
CREATE TABLE IF NOT EXISTS "connect_quick_launches" (
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
DO $$ BEGIN ALTER TABLE "launch_claim_tokens" ADD CONSTRAINT "launch_claim_tokens_project_ref_id_projects_id_fk" FOREIGN KEY ("project_ref_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "connect_quick_launches" ADD CONSTRAINT "connect_quick_launches_mcp_token_id_mcp_tokens_id_fk" FOREIGN KEY ("mcp_token_id") REFERENCES "public"."mcp_tokens"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "launch_claim_tokens_prefix_uq" ON "launch_claim_tokens" USING btree ("token_prefix");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "launch_claim_tokens_hash_uq" ON "launch_claim_tokens" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "launch_claim_tokens_project_idx" ON "launch_claim_tokens" USING btree ("project_ref_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quick_launch_ip_guardrails_hash_uq" ON "quick_launch_ip_guardrails" USING btree ("ip_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "connect_handshake_intents_prefix_uq" ON "connect_handshake_intents" USING btree ("token_prefix");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "connect_handshake_intents_hash_uq" ON "connect_handshake_intents" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connect_handshake_intents_user_idx" ON "connect_handshake_intents" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connect_quick_launches_user_idx" ON "connect_quick_launches" USING btree ("user_id","created_at");
