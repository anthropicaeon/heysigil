import { ApiError, AuthError } from "./errors.js";
import type { SigilClientConfig } from "./types.js";

export class SigilHttpClient {
    private readonly baseUrl: string;
    private readonly staticToken?: string;
    private readonly tokenProvider?: SigilClientConfig["tokenProvider"];
    private readonly fetchImpl: typeof globalThis.fetch;
    private readonly timeoutMs: number;

    constructor(config: SigilClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.staticToken = config.token;
        this.tokenProvider = config.tokenProvider;
        this.fetchImpl = config.fetch || globalThis.fetch;
        this.timeoutMs = config.timeoutMs ?? 20000;
    }

    async get<T>(path: string, init?: RequestInit): Promise<T> {
        return this.request<T>(path, { ...init, method: "GET" });
    }

    async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
        return this.request<T>(path, {
            ...init,
            method: "POST",
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    }

    async del<T>(path: string, init?: RequestInit): Promise<T> {
        return this.request<T>(path, { ...init, method: "DELETE" });
    }

    private async resolveToken(): Promise<string | null> {
        if (this.staticToken) return this.staticToken;
        if (!this.tokenProvider) return null;
        const provided = await this.tokenProvider();
        return provided || null;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const token = await this.resolveToken();
            const headers = new Headers(init.headers || {});

            if (!headers.has("Content-Type") && init.body) {
                headers.set("Content-Type", "application/json");
            }
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }

            const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
                ...init,
                headers,
                signal: init.signal || controller.signal,
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message =
                    typeof payload?.error === "string"
                        ? payload.error
                        : `HTTP ${response.status}`;
                if (response.status === 401) {
                    throw new AuthError(message);
                }
                throw new ApiError(message, response.status, payload);
            }

            return payload as T;
        } finally {
            clearTimeout(timeout);
        }
    }
}
