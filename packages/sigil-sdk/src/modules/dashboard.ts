import type { DashboardOverview } from "../types.js";
import type { SigilHttpClient } from "../http.js";

export function createDashboardModule(http: SigilHttpClient) {
    return {
        async overview(): Promise<DashboardOverview> {
            const [wallet, projects, feesTotals] = await Promise.all([
                http.get<DashboardOverview["wallet"]>("/api/wallet/me"),
                http.get<DashboardOverview["projects"]>("/api/launch/my-projects"),
                http.get<DashboardOverview["feesTotals"]>("/api/fees/totals"),
            ]);

            return {
                wallet,
                projects,
                feesTotals,
            };
        },
    };
}
