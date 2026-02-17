/**
 * Structured Logging with Pino
 *
 * Production-grade logging with:
 * - JSON output for log aggregation (production)
 * - Pretty-printed output (development)
 * - Correlation IDs for request tracing
 * - Automatic redaction of sensitive fields
 */

import pino, { type Logger, type LoggerOptions } from "pino";
import { isProduction } from "../config/env.js";

const VALID_LOG_LEVELS = new Set(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

// Sensitive fields to redact from logs
const REDACT_PATHS = [
    "password",
    "token",
    "authorization",
    "cookie",
    "privateKey",
    "secret",
    "apiKey",
    "encryptionKey",
    "*.password",
    "*.token",
    "*.privateKey",
    "*.secret",
    "*.apiKey",
    "headers.authorization",
    "headers.cookie",
];

/**
 * Create the base logger configuration
 */
function createLoggerConfig(): LoggerOptions {
    const prod = isProduction();
    const configuredLevel = process.env.LOG_LEVEL?.toLowerCase();
    const defaultLevel = prod ? "info" : "debug";
    const level =
        configuredLevel && VALID_LOG_LEVELS.has(configuredLevel) ? configuredLevel : defaultLevel;

    const baseConfig: LoggerOptions = {
        level,
        redact: {
            paths: REDACT_PATHS,
            censor: "[REDACTED]",
        },
        formatters: {
            level: (label) => ({ level: label }),
            bindings: (bindings) => ({
                pid: bindings.pid,
                host: bindings.hostname,
            }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    };

    // In development, use pretty printing if pino-pretty is available
    if (!prod) {
        return {
            ...baseConfig,
            transport: {
                target: "pino/file",
                options: { destination: 1 }, // stdout
            },
        };
    }

    return baseConfig;
}

/**
 * Root application logger
 */
export const logger: Logger = pino(createLoggerConfig());

/**
 * Create a child logger with a specific module name
 */
export function createLogger(module: string): Logger {
    return logger.child({ module });
}

/**
 * Create a child logger with request context
 */
export function createRequestLogger(correlationId: string, module?: string): Logger {
    return logger.child({
        correlationId,
        ...(module && { module }),
    });
}

// Pre-created module loggers for common services
export const loggers = {
    startup: createLogger("startup"),
    server: createLogger("server"),
    deployer: createLogger("deployer"),
    feeIndexer: createLogger("fee-indexer"),
    identity: createLogger("identity"),
    auth: createLogger("auth"),
    rateLimit: createLogger("rate-limit"),
    crypto: createLogger("crypto"),
    db: createLogger("db"),
    agent: createLogger("agent"),
    verify: createLogger("verify"),
};

export default logger;
