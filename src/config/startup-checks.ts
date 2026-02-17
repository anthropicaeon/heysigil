/**
 * Startup Security Checks
 *
 * Validates critical security configuration before accepting requests.
 * Fails fast in production if secrets are misconfigured.
 */

import { getEnv, isProduction } from "./env.js";
import { validateEncryptionConfig } from "../utils/crypto.js";
import { loggers } from "../utils/logger.js";

interface CheckResult {
    name: string;
    status: "ok" | "warning" | "error";
    message: string;
}

/**
 * Run all startup security checks.
 * Throws in production if any critical check fails.
 */
export function runStartupChecks(): void {
    const results: CheckResult[] = [];
    const env = getEnv();
    const prod = isProduction();

    loggers.startup.info({ nodeEnv: env.NODE_ENV }, "Running security checks");

    // ─── Critical: Encryption Key ────────────────────────
    const encryptionCheck = validateEncryptionConfig();
    results.push({
        name: "WALLET_ENCRYPTION_KEY",
        status: encryptionCheck.valid
            ? prod || env.WALLET_ENCRYPTION_KEY
                ? "ok"
                : "warning"
            : "error",
        message: encryptionCheck.message,
    });

    // ─── Critical: Privy Auth ────────────────────────────
    if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
        results.push({
            name: "PRIVY_AUTH",
            status: prod ? "error" : "warning",
            message: prod
                ? "PRIVY_APP_ID and PRIVY_APP_SECRET required for authentication"
                : "Privy not configured — privyAuth() will reject all requests",
        });
    } else {
        results.push({
            name: "PRIVY_AUTH",
            status: "ok",
            message: "Privy authentication configured",
        });
    }

    // ─── Important: Deployer Key (if deployer enabled) ───
    if (env.SIGIL_FACTORY_ADDRESS && !env.DEPLOYER_PRIVATE_KEY) {
        results.push({
            name: "DEPLOYER_WALLET",
            status: "warning",
            message:
                "SIGIL_FACTORY_ADDRESS set but DEPLOYER_PRIVATE_KEY missing — token launches disabled",
        });
    } else if (env.DEPLOYER_PRIVATE_KEY) {
        results.push({
            name: "DEPLOYER_WALLET",
            status: "ok",
            message: "Deployer wallet configured",
        });
    }

    // ─── Critical: Database (production) ────────────────
    if (!env.DATABASE_URL) {
        results.push({
            name: "DATABASE_URL",
            status: prod ? "error" : "warning",
            message: prod
                ? "DATABASE_URL required in production — in-memory storage is not persistent"
                : "DATABASE_URL not set — using in-memory storage (data lost on restart)",
        });
    } else {
        results.push({
            name: "DATABASE_URL",
            status: "ok",
            message: "Database connection configured",
        });
    }

    // ─── Important: LLM API Key ──────────────────────────
    if (!env.ANTHROPIC_API_KEY) {
        results.push({
            name: "ANTHROPIC_API_KEY",
            status: "warning",
            message: "Not configured — chat will run in offline mode",
        });
    } else {
        results.push({
            name: "ANTHROPIC_API_KEY",
            status: "ok",
            message: "LLM API configured",
        });
    }

    // ─── Print results ───────────────────────────────────
    let hasErrors = false;
    let hasWarnings = false;

    for (const result of results) {
        if (result.status === "error") {
            loggers.startup.error({ check: result.name }, result.message);
        } else if (result.status === "warning") {
            loggers.startup.warn({ check: result.name }, result.message);
        } else {
            loggers.startup.info({ check: result.name }, result.message);
        }

        if (result.status === "error") hasErrors = true;
        if (result.status === "warning") hasWarnings = true;
    }

    // ─── Fail in production if errors ────────────────────
    if (hasErrors && prod) {
        loggers.startup.error(
            "Security check failed in production. Fix configuration before deploying.",
        );
        process.exit(1);
    }

    if (hasWarnings && prod) {
        loggers.startup.warn("Some security checks have warnings. Review before going live.");
    }

    if (!hasErrors && !hasWarnings) {
        loggers.startup.info("All security checks passed.");
    }
}
