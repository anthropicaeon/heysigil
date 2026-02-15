CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar(512) NOT NULL,
	"name" varchar(256),
	"owner_wallet" varchar(42),
	"verification_method" varchar(32),
	"attestation_uid" varchar(66),
	"pool_token_address" varchar(42),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	CONSTRAINT "projects_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method" varchar(32) NOT NULL,
	"project_id" varchar(512) NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"challenge_code" varchar(128) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"platform_username" varchar(256),
	"proof" jsonb,
	"attestation_uid" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"expires_at" timestamp
);
