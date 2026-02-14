import type { VerificationResult } from "./types.js";
import { getEnv } from "../config/env.js";

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

/**
 * Generate the Instagram verification OAuth URL.
 * Instagram Graph API uses Facebook OAuth — requires a Facebook Page
 * linked to an Instagram Business/Creator account.
 */
export function getInstagramAuthUrl(state: string): string {
  const env = getEnv();
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    redirect_uri: `${env.BASE_URL}/api/verify/instagram/callback`,
    scope: "instagram_basic,pages_show_list",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

/**
 * Exchange code for token (same as Facebook).
 */
async function exchangeCode(code: string): Promise<string> {
  const env = getEnv();
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    client_secret: env.FACEBOOK_APP_SECRET,
    redirect_uri: `${env.BASE_URL}/api/verify/instagram/callback`,
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

/**
 * Get Instagram business accounts linked to the user's Facebook pages.
 */
async function getLinkedInstagramAccounts(
  accessToken: string,
): Promise<InstagramUser[]> {
  // Get user's Facebook pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
  );
  if (!pagesRes.ok) throw new Error(`Facebook API error: ${pagesRes.status}`);
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

/**
 * Verify Instagram account ownership.
 * projectId should be the Instagram username (without @).
 */
export async function verifyInstagramOwnership(
  code: string,
  projectId: string,
): Promise<VerificationResult> {
  try {
    const accessToken = await exchangeCode(code);
    const igAccounts = await getLinkedInstagramAccounts(accessToken);

    const targetUsername = projectId.replace(/^@/, "").toLowerCase();
    const matched = igAccounts.find(
      (a) => a.username.toLowerCase() === targetUsername,
    );

    if (!matched) {
      return {
        success: false,
        method: "instagram_graph",
        projectId,
        error: `No linked Instagram Business/Creator account matches "@${targetUsername}". Found: ${igAccounts.map((a) => `@${a.username}`).join(", ") || "none"}. Note: personal Instagram accounts cannot be verified via the official API.`,
      };
    }

    return {
      success: true,
      method: "instagram_graph",
      projectId,
      platformUsername: matched.username,
      proof: {
        instagramUserId: matched.id,
        instagramUsername: matched.username,
      },
    };
  } catch (err) {
    return {
      success: false,
      method: "instagram_graph",
      projectId,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
