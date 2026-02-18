import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { swaggerUI } from "@hono/swagger-ui";
import { verify } from "./routes/verify.js";
import { claim } from "./routes/claim.js";
import { chat } from "./routes/chat.js";
import { launch } from "./routes/launch.js";
import { wallet } from "./routes/wallet.js";
import { fees } from "./routes/fees.js";
import { claimGas } from "./routes/claim-gas.js";
import { getEnv } from "../config/env.js";
import { DatabaseUnavailableError } from "../db/client.js";
import { privyAuthOptional } from "../middleware/auth.js";
import { globalRateLimit } from "../middleware/rate-limit.js";
import { requestLogger, getRequestLogger } from "../middleware/request-logger.js";
import { openApiInfo } from "./openapi.js";
import { loggers } from "../utils/logger.js";
import { getErrorMessage } from "../utils/errors.js";
import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";

const log = loggers.server;

// Allowed localhost ports for development CORS
// 3000 = default frontend, 5173 = Vite dev server
const ALLOWED_DEV_PORTS = [3000, 5173];

// ─── Health Check Schema ────────────────────────────────

const HealthResponseSchema = z
    .object({
        status: z.literal("ok"),
        timestamp: z.string().datetime(),
    })
    .openapi("HealthResponse");

// ─── Methods Schema ─────────────────────────────────────

const VerificationMethodInfoSchema = z
    .object({
        id: z.string().openapi({ example: "github_oauth" }),
        name: z.string().openapi({ example: "GitHub OAuth" }),
        description: z.string().openapi({
            example: "Verify admin access to a GitHub repository",
        }),
        projectIdFormat: z.string().openapi({ example: "owner/repo" }),
        requiresOAuth: z.boolean().openapi({ example: true }),
    })
    .openapi("VerificationMethodInfo");

const MethodsResponseSchema = z
    .object({
        methods: z.array(VerificationMethodInfoSchema),
    })
    .openapi("MethodsResponse");

export function createApp() {
    const env = getEnv();

    // SECURITY: Warn at startup if auth service isn't configured
    if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
        log.warn("Privy not configured - privyAuth() will reject all requests (503)");
    }

    const app = new OpenAPIHono();

    // Global error handler — catches DB unavailable, unknown errors, etc.
    app.onError((err, c) => {
        if (err instanceof DatabaseUnavailableError) {
            return c.json({ error: getErrorMessage(err) }, 503);
        }
        const reqLog = getRequestLogger(c);
        reqLog.error({ err }, "Unhandled error");
        return c.json({ error: getErrorMessage(err, "Internal server error") }, 500);
    });

    // Detect production environment (HTTPS in BASE_URL)
    const isProduction = env.BASE_URL.startsWith("https://");

    // Middleware - Request logging with correlation IDs
    app.use("*", requestLogger());

    // Global rate limit: 100 requests per minute per IP
    app.use("*", globalRateLimit());

    // X-Request-ID for request tracing
    app.use("*", async (c, next) => {
        const requestId = c.req.header("X-Request-ID") || crypto.randomUUID();
        c.header("X-Request-ID", requestId);
        await next();
    });

    // Security headers with relaxed CSP for /docs (Swagger UI)
    app.use("*", async (c, next) => {
        const path = c.req.path;

        // Relaxed CSP for Swagger UI (needs inline scripts/styles)
        if (path === "/docs" || path.startsWith("/docs/")) {
            c.header(
                "Content-Security-Policy",
                "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
                    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
                    "img-src 'self' data: https://cdn.jsdelivr.net; " +
                    "font-src 'self' https://cdn.jsdelivr.net;",
            );
            await next();
            return;
        }

        // Standard secure headers for all other routes
        await secureHeaders({
            // Prevent clickjacking
            xFrameOptions: "DENY",
            // Prevent MIME sniffing
            xContentTypeOptions: "nosniff",
            // XSS protection (legacy but still useful)
            xXssProtection: "1; mode=block",
            // Referrer policy
            referrerPolicy: "strict-origin-when-cross-origin",
            // HSTS - only in production (requires HTTPS)
            strictTransportSecurity: isProduction ? "max-age=31536000; includeSubDomains" : false,
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
        })(c, next);
    });

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

    // ─── OpenAPI Documentation ──────────────────────────────

    // Configure servers based on environment
    const servers = [
        {
            url: env.BASE_URL,
            description: isProduction ? "Production" : "Development",
        },
    ];

    if (!isProduction) {
        servers.push({
            url: "http://localhost:3000",
            description: "Local development",
        });
    }

    // Generate OpenAPI spec at /openapi.json
    app.doc("/openapi.json", {
        ...openApiInfo,
        servers,
    });

    // Mount Swagger UI at /docs
    app.get("/docs", swaggerUI({ url: "/openapi.json" }));

    // ─── Health Check ───────────────────────────────────────

    const healthRoute = createRoute({
        method: "get",
        path: "/health",
        tags: ["Health"],
        summary: "Health check",
        description: "Check if the API server is running.",
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: HealthResponseSchema,
                    },
                },
                description: "Server is healthy",
            },
        },
    });

    app.openapi(healthRoute, (c) => {
        return c.json({
            status: "ok" as const,
            timestamp: new Date().toISOString(),
        });
    });

    // Apply optional auth to routes that benefit from it
    app.use("/api/chat/*", privyAuthOptional());
    app.use("/api/wallet/*", privyAuthOptional());
    app.use("/api/launch/*", privyAuthOptional());

    // ─── API Routes ─────────────────────────────────────────

    app.route("/api/chat", chat);
    app.route("/api/verify", verify);
    app.route("/api/claim", claim);
    app.route("/api/launch", launch);
    app.route("/api/wallet", wallet);
    app.route("/api/fees", fees);
    app.route("/api/fees", claimGas);

    // ─── Methods Endpoint ───────────────────────────────────

    const methodsRoute = createRoute({
        method: "get",
        path: "/api/methods",
        tags: ["Methods"],
        summary: "List verification methods",
        description: "Get all available verification methods with their configuration.",
        responses: {
            200: {
                content: {
                    "application/json": {
                        schema: MethodsResponseSchema,
                    },
                },
                description: "List of available verification methods",
            },
        },
    });

    app.openapi(methodsRoute, (c) => {
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
