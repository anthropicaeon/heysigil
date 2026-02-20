CREATE TABLE IF NOT EXISTS "chat_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"platform" varchar(32) DEFAULT 'web' NOT NULL,
	"owner_user_id" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
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
CREATE TABLE IF NOT EXISTS "chat_message_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"message_id" uuid NOT NULL,
	"actor_key" varchar(320) NOT NULL,
	"vote" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "chat_message_votes" ADD CONSTRAINT "chat_message_votes_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "chat_message_votes" ADD CONSTRAINT "chat_message_votes_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_role_chk" CHECK ("chat_messages"."role" IN ('user', 'assistant')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_source_chk" CHECK ("chat_messages"."source" IN ('user', 'assistant', 'agent')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "chat_message_votes" ADD CONSTRAINT "chat_message_votes_vote_chk" CHECK ("chat_message_votes"."vote" IN (1, -1)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_sessions_owner_user_idx" ON "chat_sessions" USING btree ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_sessions_updated_at_idx" ON "chat_sessions" USING btree ("updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_session_created_idx" ON "chat_messages" USING btree ("session_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_created_by_idx" ON "chat_messages" USING btree ("created_by_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_deleted_at_idx" ON "chat_messages" USING btree ("deleted_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chat_message_votes_unique_actor" ON "chat_message_votes" USING btree ("message_id","actor_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_message_votes_session_idx" ON "chat_message_votes" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_message_votes_message_idx" ON "chat_message_votes" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connected_bots_presence_idx" ON "connected_bots" USING btree ("user_id","status","last_seen_at");
