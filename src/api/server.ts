import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { verify } from "./routes/verify.js";
import { claim } from "./routes/claim.js";
import { chat } from "./routes/chat.js";
import { launch } from "./routes/launch.js";
import { wallet } from "./routes/wallet.js";
import { getEnv } from "../config/env.js";
import { DatabaseUnavailableError } from "../db/client.js";
import { privyAuthOptional } from "../middleware/auth.js";

export function createApp() {
  const env = getEnv();

  const app = new Hono();

  // Global error handler — catches DB unavailable, unknown errors, etc.
  app.onError((err, c) => {
    if (err instanceof DatabaseUnavailableError) {
      return c.json({ error: err.message }, 503);
    }
    console.error("Unhandled error:", err);
    return c.json({ error: err.message || "Internal server error" }, 500);
  });

  // Middleware
  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: (origin) => {
        // Allow any localhost origin for local dev, plus the configured FRONTEND_URL
        if (!origin) return env.FRONTEND_URL;
        if (origin.startsWith("http://localhost:")) return origin;
        if (origin === env.FRONTEND_URL) return origin;
        return env.FRONTEND_URL;
      },
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Health check
  app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

  // Apply optional auth to routes that benefit from it
  app.use("/api/chat/*", privyAuthOptional());
  app.use("/api/wallet/*", privyAuthOptional());
  app.use("/api/launch/*", privyAuthOptional());

  // API routes
  app.route("/api/chat", chat);
  app.route("/api/verify", verify);
  app.route("/api/claim", claim);
  app.route("/api/launch", launch);
  app.route("/api/wallet", wallet);

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
