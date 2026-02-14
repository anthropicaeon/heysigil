import type { VerificationResult } from "./types.js";
import { getEnv } from "../config/env.js";

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

/**
 * Generate the Facebook OAuth authorization URL.
 */
export function getFacebookAuthUrl(state: string): string {
  const env = getEnv();
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    redirect_uri: `${env.BASE_URL}/api/verify/facebook/callback`,
    scope: "pages_show_list,pages_read_engagement",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

/**
 * Exchange a Facebook OAuth code for an access token.
 */
export async function exchangeFacebookCode(code: string): Promise<string> {
  const env = getEnv();
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    client_secret: env.FACEBOOK_APP_SECRET,
    redirect_uri: `${env.BASE_URL}/api/verify/facebook/callback`,
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

/**
 * Get the authenticated Facebook user's pages.
 */
async function getUserPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`,
  );
  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.status}`);
  }
  const data = (await response.json()) as FacebookPagesResponse;
  return data.data;
}

/**
 * Get authenticated Facebook user profile.
 */
async function getFacebookUser(accessToken: string): Promise<FacebookUser> {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/me?access_token=${accessToken}`,
  );
  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.status}`);
  }
  return response.json() as Promise<FacebookUser>;
}

/**
 * Verify Facebook page ownership.
 * projectId should be the Facebook Page ID or name.
 */
export async function verifyFacebookOwnership(
  code: string,
  projectId: string,
): Promise<VerificationResult> {
  try {
    const accessToken = await exchangeFacebookCode(code);
    const user = await getFacebookUser(accessToken);
    const pages = await getUserPages(accessToken);

    // Match by page ID or page name (case-insensitive)
    const matchedPage = pages.find(
      (p) =>
        p.id === projectId || p.name.toLowerCase() === projectId.toLowerCase(),
    );

    if (!matchedPage) {
      return {
        success: false,
        method: "facebook_oauth",
        projectId,
        platformUsername: user.name,
        error: `User ${user.name} does not admin a page matching "${projectId}". Pages found: ${pages.map((p) => p.name).join(", ") || "none"}`,
      };
    }

    return {
      success: true,
      method: "facebook_oauth",
      projectId,
      platformUsername: user.name,
      proof: {
        facebookUserId: user.id,
        pageId: matchedPage.id,
        pageName: matchedPage.name,
        pageCategory: matchedPage.category,
      },
    };
  } catch (err) {
    return {
      success: false,
      method: "facebook_oauth",
      projectId,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
