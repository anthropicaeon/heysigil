import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { verify } from "./routes/verify.js";
import { claim } from "./routes/claim.js";
import { chat } from "./routes/chat.js";
import { launch } from "./routes/launch.js";
import { wallet } from "./routes/wallet.js";
import { getEnv } from "../config/env.js";
import { DatabaseUnavailableError } from "../db/client.js";
import { privyAuthOptional } from "../middleware/auth.js";
import { globalRateLimit } from "../middleware/rate-limit.js";

// Allowed localhost ports for development CORS
// 3000 = default frontend, 5173 = Vite dev server
const ALLOWED_DEV_PORTS = [3000, 5173];

export function createApp() {
  const env = getEnv();

  // SECURITY: Warn at startup if auth service isn't configured
  if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
    console.warn("[SECURITY] Privy not configured - privyAuth() will reject all requests (503)");
  }

  const app = new Hono();

  // Global error handler — catches DB unavailable, unknown errors, etc.
  app.onError((err, c) => {
    if (err instanceof DatabaseUnavailableError) {
      return c.json({ error: err.message }, 503);
    }
    console.error("Unhandled error:", err);
    return c.json({ error: err.message || "Internal server error" }, 500);
  });

  // Detect production environment (HTTPS in BASE_URL)
  const isProduction = env.BASE_URL.startsWith("https://");

  // Middleware
  app.use("*", logger());

  // Global rate limit: 100 requests per minute per IP
  app.use("*", globalRateLimit());

  // X-Request-ID for request tracing
  app.use("*", async (c, next) => {
    const requestId = c.req.header("X-Request-ID") || crypto.randomUUID();
    c.header("X-Request-ID", requestId);
    await next();
  });

  // Security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
  app.use(
    "*",
    secureHeaders({
      // Prevent clickjacking
      xFrameOptions: "DENY",
      // Prevent MIME sniffing
      xContentTypeOptions: "nosniff",
      // XSS protection (legacy but still useful)
      xXssProtection: "1; mode=block",
      // Referrer policy
      referrerPolicy: "strict-origin-when-cross-origin",
      // HSTS - only in production (requires HTTPS)
      strictTransportSecurity: isProduction
        ? "max-age=31536000; includeSubDomains"
        : false,
      // CSP - restrictive policy for API server
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : undefined,
      },
    }),
  );

  // CORS - restrictive configuration
  app.use(
    "*",
    cors({
      origin: (origin) => {
        // No origin header (e.g., server-to-server, curl) - allow if same-origin
        if (!origin) return env.FRONTEND_URL;

        // Production: only allow exact FRONTEND_URL match
        if (isProduction) {
          return origin === env.FRONTEND_URL ? origin : null;
        }

        // Development: allow specific localhost ports only
        for (const port of ALLOWED_DEV_PORTS) {
          if (origin === `http://localhost:${port}`) return origin;
        }

        // Also allow the configured FRONTEND_URL in development
        if (origin === env.FRONTEND_URL) return origin;

        // Reject unknown origins
        return null;
      },
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
      exposeHeaders: ["X-Request-ID"],
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
