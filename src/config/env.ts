import { z } from "zod";

const envSchema = z.object({
  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

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

  // Database
  DATABASE_URL: z.string().url(),

  // Server
  PORT: z.coerce.number().default(3001),
  BASE_URL: z.string().url().default("http://localhost:3001"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

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
