import type { SigilHttpClient } from "../http.js";

export function createClaimModule(http: SigilHttpClient) {
    return {
        create(verificationId: string) {
            return http.post<Record<string, unknown>>("/api/claim", { verificationId });
        },
        status(projectId: string) {
            return http.get<Record<string, unknown>>(`/api/claim/status/${encodeURIComponent(projectId)}`);
        },
    };
}
