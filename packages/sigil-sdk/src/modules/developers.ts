import type { SigilHttpClient } from "../http.js";

export function createDevelopersModule(_http: SigilHttpClient) {
    return {
        info() {
            return {
                product: "Sigil",
                docs: [
                    "/developers",
                    "/verify",
                    "/launches",
                    "/governance",
                    "/chat",
                ],
                channels: ["github", "twitter", "facebook", "instagram", "domain"],
                capabilities: [
                    "verify ownership",
                    "launch token",
                    "route fees",
                    "chat automation",
                    "milestone governance (ui pending backend)",
                ],
            };
        },
    };
}
