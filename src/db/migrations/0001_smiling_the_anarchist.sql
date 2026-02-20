CREATE TABLE IF NOT EXISTS "identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" varchar(32) NOT NULL,
	"platform_id" varchar(512) NOT NULL,
	"created_by" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"privy_user_id" varchar(256),
	"status" varchar(16) DEFAULT 'phantom' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	"merged_into" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(42) NOT NULL,
	"encrypted_key" text NOT NULL,
	"iv" varchar(64) NOT NULL,
	"auth_tag" varchar(64) NOT NULL,
	"key_type" varchar(16) NOT NULL,
	"key_id" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_address_unique" UNIQUE("address")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD COLUMN "description" text; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD COLUMN "pool_id" varchar(66); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD COLUMN "deploy_tx_hash" varchar(66); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD COLUMN "deployed_by" varchar(16); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD COLUMN "dev_links" jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD COLUMN "user_id" uuid; EXCEPTION WHEN duplicate_column THEN NULL; END $$;