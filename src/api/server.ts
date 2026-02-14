import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { verify } from "./routes/verify.js";
import { claim } from "./routes/claim.js";
import { chat } from "./routes/chat.js";
import { getEnv } from "../config/env.js";

export function createApp() {
  const env = getEnv();

  const app = new Hono();

  // Middleware
  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: env.FRONTEND_URL,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Health check
  app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

  // API routes
  app.route("/api/chat", chat);
  app.route("/api/verify", verify);
  app.route("/api/claim", claim);

  // List available verification methods
  app.get("/api/methods", (c) => {
    return c.json({
      methods: [
        {
          id: "github_oauth",
          name: "GitHub OAuth",
          description: "Verify admin access to a GitHub repository",
          projectIdFormat: "owner/repo",
          requiresOAuth: true,
        },
        {
          id: "github_file",
          name: "GitHub File",
          description: "Place a verification file in your GitHub repo",
          projectIdFormat: "owner/repo",
          requiresOAuth: false,
        },
        {
          id: "domain_dns",
          name: "DNS TXT Record",
          description: "Add a DNS TXT record to prove domain ownership",
          projectIdFormat: "example.com",
          requiresOAuth: false,
        },
        {
          id: "domain_file",
          name: "Well-Known File",
          description: "Place a verification file on your website",
          projectIdFormat: "example.com",
          requiresOAuth: false,
        },
        {
          id: "domain_meta",
          name: "HTML Meta Tag",
          description: "Add a meta tag to your website",
          projectIdFormat: "example.com",
          requiresOAuth: false,
        },
        {
          id: "tweet_zktls",
          name: "Tweet + zkTLS Proof",
          description: "Tweet a code and prove it with a zkTLS proof (no X API needed)",
          projectIdFormat: "@handle (without @)",
          requiresOAuth: false,
        },
        {
          id: "facebook_oauth",
          name: "Facebook Page",
          description: "Verify you admin a Facebook Page",
          projectIdFormat: "Page name or ID",
          requiresOAuth: true,
        },
        {
          id: "instagram_graph",
          name: "Instagram Business",
          description: "Verify ownership of an Instagram Business/Creator account",
          projectIdFormat: "username (without @)",
          requiresOAuth: true,
        },
      ],
    });
  });

  return app;
}
