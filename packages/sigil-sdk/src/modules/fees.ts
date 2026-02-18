import type { FeesTotalsResponse } from "../types.js";
import type { SigilHttpClient } from "../http.js";

export function createFeesModule(http: SigilHttpClient) {
    return {
        totals() {
            return http.get<FeesTotalsResponse>("/api/fees/totals");
        },
        distributions(query?: Record<string, string | number | undefined>) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(query || {})) {
                if (value === undefined || value === null) continue;
                params.set(key, String(value));
            }
            const suffix = params.toString();
            return http.get<Record<string, unknown>>(
                `/api/fees/distributions${suffix ? `?${suffix}` : ""}`,
            );
        },
        project(projectId: string, query?: { limit?: number; offset?: number }) {
            const params = new URLSearchParams();
            if (query?.limit) params.set("limit", String(query.limit));
            if (query?.offset) params.set("offset", String(query.offset));
            const suffix = params.toString();
            return http.get<Record<string, unknown>>(
                `/api/fees/project/${encodeURIComponent(projectId)}${suffix ? `?${suffix}` : ""}`,
            );
        },
        claimable(walletAddress: string) {
            return http.get<Record<string, unknown>>(`/api/fees/claimable/${walletAddress}`);
        },
        claim(token?: string) {
            return http.post<Record<string, unknown>>("/api/fees/claim", token ? { token } : {});
        },
        claimGas() {
            return http.post<Record<string, unknown>>("/api/fees/claim-gas");
        },
    };
}
