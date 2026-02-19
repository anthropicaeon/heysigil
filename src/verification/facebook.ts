import type { VerificationResult } from "./types.js";
import { OAuthVerifier, buildOAuthRedirectUri } from "./oauth-base.js";
import { getEnv } from "../config/env.js";

// ─── Types ──────────────────────────────────────────────

interface FacebookTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
}

interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    category: string;
}

interface FacebookPagesResponse {
    data: FacebookPage[];
}

interface FacebookUser {
    id: string;
    name: string;
}

// ─── Facebook OAuth Verifier ────────────────────────────

class FacebookOAuthVerifier extends OAuthVerifier {
    constructor() {
        super({
            providerName: "Facebook",
            method: "facebook_oauth",
            authEndpoint: "https://www.facebook.com/v21.0/dialog/oauth",
            callbackPath: "/api/verify/facebook/callback",
            scopes: ["pages_show_list", "pages_read_engagement"],
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
        const data = (await response.json()) as FacebookTokenResponse;
        if (!data.access_token) {
            throw new Error("Failed to exchange Facebook OAuth code");
        }
        return data.access_token;
    }

    protected async platformVerify(
        accessToken: string,
        projectId: string,
    ): Promise<VerificationResult> {
        const user = await this.getUser(accessToken);
        const pages = await this.getUserPages(accessToken);

        // Match by page ID or page name (case-insensitive)
        const matchedPage = pages.find(
            (p) => p.id === projectId || p.name.toLowerCase() === projectId.toLowerCase(),
        );

        if (!matchedPage) {
            return this.buildFailureResult(
                projectId,
                `User ${user.name} does not admin a page matching "${projectId}". Pages found: ${pages.map((p) => p.name).join(", ") || "none"}`,
                user.name,
            );
        }

        return this.buildSuccessResult(projectId, user.name, {
            facebookUserId: user.id,
            pageId: matchedPage.id,
            pageName: matchedPage.name,
            pageCategory: matchedPage.category,
        });
    }

    private async getUser(accessToken: string): Promise<FacebookUser> {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/me?access_token=${accessToken}`,
        );
        if (!response.ok) {
            throw new Error(`Facebook API error: ${response.status}`);
        }
        return response.json() as Promise<FacebookUser>;
    }

    private async getUserPages(accessToken: string): Promise<FacebookPage[]> {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`,
        );
        if (!response.ok) {
            throw new Error(`Facebook API error: ${response.status}`);
        }
        const data = (await response.json()) as FacebookPagesResponse;
        return data.data;
    }
}

// ─── Singleton instance ─────────────────────────────────

const facebookVerifier = new FacebookOAuthVerifier();

// ─── Exported functions (backward compatible) ───────────

export function getFacebookAuthUrl(state: string): string {
    return facebookVerifier.getAuthUrl(state);
}

export async function verifyFacebookOwnership(
    code: string,
    projectId: string,
): Promise<VerificationResult> {
    return facebookVerifier.verify(code, projectId);
}

export async function exchangeFacebookCode(code: string): Promise<string> {
    const env = getEnv();
    const params = new URLSearchParams({
        client_id: env.FACEBOOK_APP_ID,
        client_secret: env.FACEBOOK_APP_SECRET,
        redirect_uri: buildOAuthRedirectUri(env.BASE_URL, "/api/verify/facebook/callback"),
        code,
    });
    const response = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${params}`);
    const data = (await response.json()) as FacebookTokenResponse;
    if (!data.access_token) {
        throw new Error("Failed to exchange Facebook OAuth code");
    }
    return data.access_token;
}
