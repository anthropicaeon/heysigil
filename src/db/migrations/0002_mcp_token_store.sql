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
CREATE UNIQUE INDEX "mcp_tokens_token_prefix_uq" ON "mcp_tokens" USING btree ("token_prefix");
--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_tokens_token_hash_uq" ON "mcp_tokens" USING btree ("token_hash");
