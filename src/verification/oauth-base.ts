/**
 * OAuth Verification Base Class
 *
 * Template Method pattern for OAuth verification flows.
 * Handles common patterns: auth URL generation, error handling, result building.
 * Subclasses implement platform-specific token exchange and verification logic.
 */

import type { VerificationMethod, VerificationResult } from "./types.js";
import { getEnv } from "../config/env.js";

export interface OAuthConfig {
    /** OAuth provider name for logging */
    providerName: string;
    /** Verification method identifier */
    method: VerificationMethod;
    /** OAuth authorization endpoint */
    authEndpoint: string;
    /** Callback path (appended to BASE_URL) */
    callbackPath: string;
    /** Required OAuth scopes */
    scopes: string[];
}

export interface TokenExchangeConfig {
    /** Token exchange endpoint */
    tokenEndpoint: string;
    /** HTTP method for token exchange (GET or POST) */
    httpMethod: "GET" | "POST";
}

/**
 * Abstract base class for OAuth verification providers.
 * Implements Template Method pattern for consistent OAuth flows.
 */
export abstract class OAuthVerifier {
    protected readonly config: OAuthConfig;
    protected readonly env = getEnv();

    constructor(config: OAuthConfig) {
        this.config = config;
    }

    /**
     * Generate the OAuth authorization URL.
     * Common implementation using provider-specific config.
     */
    getAuthUrl(state: string): string {
        const params = new URLSearchParams({
            client_id: this.getClientId(),
            redirect_uri: `${this.env.BASE_URL}${this.config.callbackPath}`,
            scope: this.config.scopes.join(" "),
            state,
        });
        return `${this.config.authEndpoint}?${params}`;
    }

    /**
     * Full verification flow — Template Method.
     * Handles error wrapping consistently across all providers.
     */
    async verify(code: string, projectId: string): Promise<VerificationResult> {
        try {
            // Step 1: Exchange code for token
            const accessToken = await this.exchangeCode(code);

            // Step 2: Platform-specific verification
            return await this.platformVerify(accessToken, projectId);
        } catch (err) {
            return this.buildErrorResult(projectId, err);
        }
    }

    /**
     * Build a consistent error result.
     */
    protected buildErrorResult(projectId: string, err: unknown): VerificationResult {
        return {
            success: false,
            method: this.config.method,
            projectId,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }

    /**
     * Build a success result with platform-specific proof.
     */
    protected buildSuccessResult(
        projectId: string,
        platformUsername: string | undefined,
        proof: Record<string, unknown>,
    ): VerificationResult {
        return {
            success: true,
            method: this.config.method,
            projectId,
            platformUsername,
            proof,
        };
    }

    /**
     * Build a failure result (verification failed, not an error).
     */
    protected buildFailureResult(
        projectId: string,
        errorMessage: string,
        platformUsername?: string,
    ): VerificationResult {
        return {
            success: false,
            method: this.config.method,
            projectId,
            platformUsername,
            error: errorMessage,
        };
    }

    // ─── Abstract methods for subclasses ────────────────────

    /** Get OAuth client ID from environment */
    protected abstract getClientId(): string;

    /** Get OAuth client secret from environment */
    protected abstract getClientSecret(): string;

    /** Exchange OAuth code for access token */
    protected abstract exchangeCode(code: string): Promise<string>;

    /** Platform-specific verification logic */
    protected abstract platformVerify(
        accessToken: string,
        projectId: string,
    ): Promise<VerificationResult>;
}

/**
 * Helper for making authenticated API requests.
 * Throws on non-OK responses for consistent error handling.
 */
export async function fetchWithAuth<T>(
    url: string,
    accessToken: string,
    headers?: Record<string, string>,
): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...headers,
        },
    });
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    return response.json() as Promise<T>;
}
