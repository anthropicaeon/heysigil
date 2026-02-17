import { z } from "zod";

const envSchema = z.object({
    // GitHub OAuth (optional for local dev — features will fail gracefully)
    GITHUB_CLIENT_ID: z.string().default(""),
    GITHUB_CLIENT_SECRET: z.string().default(""),

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

    // Server
    PORT: z.coerce.number().default(3001),
    BASE_URL: z.string().url().default("http://localhost:3001"),
    FRONTEND_URL: z.string().url().default("http://localhost:3000"),

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
