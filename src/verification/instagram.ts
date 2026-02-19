import type { VerificationResult } from "./types.js";
import { OAuthVerifier } from "./oauth-base.js";

// ─── Types ──────────────────────────────────────────────

interface FacebookPage {
    id: string;
    name: string;
    instagram_business_account?: {
        id: string;
    };
}

interface InstagramUser {
    id: string;
    username: string;
    name?: string;
}

// ─── Instagram OAuth Verifier ───────────────────────────
// Instagram Graph API uses Facebook OAuth — requires a Facebook Page
// linked to an Instagram Business/Creator account.

class InstagramOAuthVerifier extends OAuthVerifier {
    constructor() {
        super({
            providerName: "Instagram",
            method: "instagram_graph",
            authEndpoint: "https://www.facebook.com/v21.0/dialog/oauth",
            callbackPath: "/api/verify/instagram/callback",
            scopes: ["instagram_basic", "pages_show_list"],
        });
    }

    protected getClientId(): string {
        return this.env.FACEBOOK_APP_ID;
    }

    protected getClientSecret(): string {
        return this.env.FACEBOOK_APP_SECRET;
    }

    protected async exchangeCode(code: string): Promise<string> {
        const params = new URLSearchParams({
            client_id: this.getClientId(),
            client_secret: this.getClientSecret(),
            redirect_uri: this.getRedirectUri(),
            code,
        });

        const response = await fetch(
            `https://graph.facebook.com/v21.0/oauth/access_token?${params}`,
        );
        const data = (await response.json()) as { access_token: string };
        if (!data.access_token) {
            throw new Error("Failed to exchange OAuth code for Instagram verification");
        }
        return data.access_token;
    }

    protected async platformVerify(
        accessToken: string,
        projectId: string,
    ): Promise<VerificationResult> {
        const igAccounts = await this.getLinkedInstagramAccounts(accessToken);

        const targetUsername = projectId.replace(/^@/, "").toLowerCase();
        const matched = igAccounts.find(
            (a) => a.username.toLowerCase() === targetUsername,
        );

        if (!matched) {
            return this.buildFailureResult(
                projectId,
                `No linked Instagram Business/Creator account matches "@${targetUsername}". Found: ${igAccounts.map((a) => `@${a.username}`).join(", ") || "none"}. Note: personal Instagram accounts cannot be verified via the official API.`,
            );
        }

        return this.buildSuccessResult(projectId, matched.username, {
            instagramUserId: matched.id,
            instagramUsername: matched.username,
        });
    }

    private async getLinkedInstagramAccounts(
        accessToken: string,
    ): Promise<InstagramUser[]> {
        // Get user's Facebook pages with linked Instagram accounts
        const pagesRes = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
        );
        if (!pagesRes.ok) {
            throw new Error(`Facebook API error: ${pagesRes.status}`);
        }
        const pagesData = (await pagesRes.json()) as { data: FacebookPage[] };

        const igAccounts: InstagramUser[] = [];

        for (const page of pagesData.data) {
            if (!page.instagram_business_account) continue;

            const igRes = await fetch(
                `https://graph.facebook.com/v21.0/${page.instagram_business_account.id}?fields=id,username,name&access_token=${accessToken}`,
            );
            if (!igRes.ok) continue;

            const igUser = (await igRes.json()) as InstagramUser;
            igAccounts.push(igUser);
        }

        return igAccounts;
    }
}

// ─── Singleton instance ─────────────────────────────────

const instagramVerifier = new InstagramOAuthVerifier();

// ─── Exported functions (backward compatible) ───────────

export function getInstagramAuthUrl(state: string): string {
    return instagramVerifier.getAuthUrl(state);
}

export async function verifyInstagramOwnership(
    code: string,
    projectId: string,
): Promise<VerificationResult> {
    return instagramVerifier.verify(code, projectId);
}
