import type { VerificationResult } from "./types.js";
import { getEnv } from "../config/env.js";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  login: string;
  id: number;
}

interface GitHubPermission {
  permission: "admin" | "maintain" | "write" | "triage" | "read";
  role_name: string;
}

/**
 * Generate the GitHub OAuth authorization URL.
 * Redirects user to GitHub to authorize our app.
 */
export function getGitHubAuthUrl(state: string): string {
  const env = getEnv();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.BASE_URL}/api/verify/github/callback`,
    scope: "repo read:org",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * Exchange an OAuth code for an access token.
 */
export async function exchangeGitHubCode(code: string): Promise<string> {
  const env = getEnv();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = (await response.json()) as GitHubTokenResponse;
  if (!data.access_token) {
    throw new Error("Failed to exchange GitHub OAuth code");
  }
  return data.access_token;
}

/**
 * Get the authenticated GitHub user's info.
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  return response.json() as Promise<GitHubUser>;
}

/**
 * Check if a user has admin permission on a repository.
 */
export async function checkRepoPermission(
  accessToken: string,
  owner: string,
  repo: string,
  username: string,
): Promise<GitHubPermission> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/collaborators/${username}/permission`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} — cannot check permission`);
  }
  return response.json() as Promise<GitHubPermission>;
}

/**
 * Full GitHub OAuth verification flow — after receiving the callback.
 * Verifies the user has admin access to the claimed repo.
 */
export async function verifyGitHubOwnership(
  code: string,
  projectId: string,
): Promise<VerificationResult> {
  // projectId format: "owner/repo"
  const parts = projectId.split("/");
  if (parts.length !== 2) {
    return {
      success: false,
      method: "github_oauth",
      projectId,
      error: "Invalid project ID — expected 'owner/repo' format",
    };
  }
  const [owner, repo] = parts;

  try {
    const accessToken = await exchangeGitHubCode(code);
    const user = await getGitHubUser(accessToken);
    const permission = await checkRepoPermission(accessToken, owner, repo, user.login);

    const isAdmin = permission.permission === "admin";

    return {
      success: isAdmin,
      method: "github_oauth",
      projectId,
      platformUsername: user.login,
      proof: {
        githubUserId: user.id,
        permission: permission.permission,
        roleName: permission.role_name,
      },
      error: isAdmin ? undefined : `User ${user.login} has '${permission.permission}' permission, needs 'admin'`,
    };
  } catch (err) {
    return {
      success: false,
      method: "github_oauth",
      projectId,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * File-based GitHub verification.
 * Checks for a verification file in the repo without needing OAuth.
 */
export async function verifyGitHubFile(
  projectId: string,
  expectedCode: string,
  expectedWallet: string,
): Promise<VerificationResult> {
  const parts = projectId.split("/");
  if (parts.length !== 2) {
    return {
      success: false,
      method: "github_file",
      projectId,
      error: "Invalid project ID — expected 'owner/repo' format",
    };
  }
  const [owner, repo] = parts;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/.well-known/pool-claim.txt`,
      {
        headers: { Accept: "application/vnd.github+json" },
      },
    );

    if (!response.ok) {
      return {
        success: false,
        method: "github_file",
        projectId,
        error: response.status === 404
          ? "Verification file not found — add .well-known/pool-claim.txt to your repo"
          : `GitHub API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as { content: string; encoding: string };
    const content = Buffer.from(data.content, "base64").toString("utf-8").trim();

    // Expected format:
    // verification-code=<code>
    // wallet-address=<address>
    const lines = content.split("\n").map((l) => l.trim());
    const codeMatch = lines.find((l) => l.startsWith("verification-code="));
    const walletMatch = lines.find((l) => l.startsWith("wallet-address="));

    const fileCode = codeMatch?.split("=")[1]?.trim();
    const fileWallet = walletMatch?.split("=")[1]?.trim();

    if (fileCode !== expectedCode) {
      return {
        success: false,
        method: "github_file",
        projectId,
        error: "Verification code does not match",
      };
    }

    if (fileWallet?.toLowerCase() !== expectedWallet.toLowerCase()) {
      return {
        success: false,
        method: "github_file",
        projectId,
        error: "Wallet address does not match",
      };
    }

    return {
      success: true,
      method: "github_file",
      projectId,
      proof: { fileContent: content },
    };
  } catch (err) {
    return {
      success: false,
      method: "github_file",
      projectId,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
