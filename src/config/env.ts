import { z } from "zod";

const envSchema = z.object({
    // GitHub OAuth (optional for local dev — features will fail gracefully)
    GITHUB_CLIENT_ID: z.string().default(""),
    GITHUB_CLIENT_SECRET: z.string().default(""),
    GITHUB_AUTO_STAR_TOKEN: z.string().default(""),

    // Facebook OAuth
    FACEBOOK_APP_ID: z.string().default(""),
    FACEBOOK_APP_SECRET: z.string().default(""),

    // EAS
    EAS_CONTRACT_ADDRESS: z.string().default("0x4200000000000000000000000000000000000021"),
    EAS_SCHEMA_UID: z.string().default(""),
    ATTESTATION_SIGNER_KEY: z.string().default(""),

    // Reclaim Protocol
    RECLAIM_APP_ID: z.string().default(""),
    RECLAIM_APP_SECRET: z.string().default(""),

    // LLM (chat agent)
    ANTHROPIC_API_KEY: z.string().default(""),

    // Deployer (server-side wallet for gas-sponsored launches)
    DEPLOYER_PRIVATE_KEY: z.string().default(""),
    SIGIL_FACTORY_ADDRESS: z.string().default(""),
    SIGIL_FEE_VAULT_ADDRESS: z.string().default(""),
    SIGIL_LP_LOCKER_ADDRESS: z.string().default(""),

    // V1 → V2 Migration Relayer
    MIGRATION_RELAYER_ADDRESS: z.string().default(""),
    MIGRATION_RELAYER_PRIVATE_KEY: z.string().default(""),
    V1_TOKEN_ADDRESS: z.string().default(""),
    V2_TOKEN_ADDRESS: z.string().default(""),
    MIGRATOR_ADDRESS: z.string().default(""),
    BASE_RPC_URL: z.string().default("https://mainnet.base.org"),

    // Privy (authentication)
    PRIVY_APP_ID: z.string().default(""),
    PRIVY_APP_SECRET: z.string().default(""),

    // Custodial wallets (AES-256 encryption key, 64 hex chars)
    WALLET_ENCRYPTION_KEY: z.string().default(""),

    // Trading (0x API)
    ZEROX_API_KEY: z.string().default(""),

    // Basescan API (optional — for transaction history)
    BASESCAN_API_KEY: z.string().default(""),

    // Database (optional — uses in-memory store when not set)
    DATABASE_URL: z.string().default(""),

    // Redis (optional — uses in-memory rate limiting when not set)
    REDIS_URL: z.string().default(""),

    // Quick launch security + claim token lifecycle
    QUICK_LAUNCH_CLAIM_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(10080).default(1440),
    QUICK_LAUNCH_IP_SALT: z.string().default(""),

    // Connect handshake hardening
    CONNECT_HANDSHAKE_INTENT_TTL_SECONDS: z.coerce.number().int().min(10).max(900).default(120),

    // Railway provisioning (optional)
    RAILWAY_API_TOKEN: z.string().default(""),
    RAILWAY_TEAM_ID: z.string().default(""),
    RAILWAY_PROJECT_ID: z.string().default(""),
    RAILWAY_ENVIRONMENT_ID: z.string().default(""),
    RAILWAY_SOURCE_REPO: z.string().default("heysigil/heysigil"),
    RAILWAY_SOURCE_BRANCH: z.string().default("main"),
    RAILWAY_SOURCE_ROOT_DIR: z.string().default("packages/sigilbot"),
    RAILWAY_SERVICE_DOMAIN_SUFFIX: z.string().default("up.railway.app"),
    RAILWAY_SERVICE_NAME_PREFIX: z.string().default("sigilbot"),
    RAILWAY_MIN_CPU_MILLICORES: z.coerce.number().int().min(50).max(2000).default(100),
    RAILWAY_MIN_MEMORY_MB: z.coerce.number().int().min(64).max(4096).default(256),

    // Server
    PORT: z.coerce.number().default(3001),
    BASE_URL: z.string().trim().url().default("http://localhost:3001"),
    FRONTEND_URL: z.string().trim().url().default("http://localhost:3000"),

    // Environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Proxy trust configuration for rate limiting
    // Values: "cloudflare", "true" (trust all), "false" (trust none)
    // Default: trusts headers in dev/test, warns in production
    TRUST_PROXY: z.enum(["cloudflare", "true", "false", ""]).default(""),
});

/**
 * Check if running in production environment.
 */
export function isProduction(): boolean {
    return getEnv().NODE_ENV === "production";
}

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
    if (!_env) {
        const result = envSchema.safeParse(process.env);
        if (!result.success) {
            console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
            throw new Error("Invalid environment variables");
        }
        _env = result.data;
    }
    return _env;
}
