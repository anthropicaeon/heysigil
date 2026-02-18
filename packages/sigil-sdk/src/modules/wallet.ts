import type { WalletResponse } from "../types.js";
import type { SigilHttpClient } from "../http.js";

export function createWalletModule(http: SigilHttpClient) {
    return {
        myWallet() {
            return http.get<WalletResponse>("/api/wallet/me");
        },
        createMyWallet() {
            return http.post<WalletResponse>("/api/wallet/me");
        },
        sessionWallet(sessionId: string) {
            return http.get<WalletResponse>(`/api/wallet/${sessionId}`);
        },
        createSessionWallet(sessionId: string) {
            return http.post<WalletResponse>(`/api/wallet/${sessionId}/create`);
        },
    };
}
