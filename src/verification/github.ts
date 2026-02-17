import type { VerificationResult } from "./types.js";
import { OAuthVerifier, fetchWithAuth } from "./oauth-base.js";
import { getEnv } from "../config/env.js";

// ─── Types ──────────────────────────────────────────────

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

const GITHUB_API_HEADERS = { Accept: "application/vnd.github+json" };

// ─── GitHub OAuth Verifier ──────────────────────────────

class GitHubOAuthVerifier extends OAuthVerifier {
    constructor() {
        super({
            providerName: "GitHub",
            method: "github_oauth",
            authEndpoint: "https://github.com/login/oauth/authorize",
            callbackPath: "/api/verify/github/callback",
            scopes: ["repo", "read:org"],
        });
    }

    protected getClientId(): string {
        return this.env.GITHUB_CLIENT_ID;
    }

    protected getClientSecret(): string {
        return this.env.GITHUB_CLIENT_SECRET;
    }

    protected async exchangeCode(code: string): Promise<string> {
        const response = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: this.getClientId(),
                client_secret: this.getClientSecret(),
                code,
                redirect_uri: `${this.env.BASE_URL}${this.config.callbackPath}`,
            }),
        });

        const data = (await response.json()) as GitHubTokenResponse;
        if (!data.access_token) {
            throw new Error("Failed to exchange GitHub OAuth code");
        }
        return data.access_token;
    }

    protected async platformVerify(
        accessToken: string,
        projectId: string,
    ): Promise<VerificationResult> {
        // projectId format: "owner/repo"
        const parts = projectId.split("/");
        if (parts.length !== 2) {
            return this.buildFailureResult(
                projectId,
                "Invalid project ID — expected 'owner/repo' format",
            );
        }
        const [owner, repo] = parts;

        const user = await getGitHubUser(accessToken);
        const permission = await checkRepoPermission(accessToken, owner, repo, user.login);

        const isAdmin = permission.permission === "admin";

        if (!isAdmin) {
            return this.buildFailureResult(
                projectId,
                `User ${user.login} has '${permission.permission}' permission, needs 'admin'`,
                user.login,
            );
        }

        return this.buildSuccessResult(projectId, user.login, {
            githubUserId: user.id,
            permission: permission.permission,
            roleName: permission.role_name,
        });
    }
}

// ─── Singleton instance ─────────────────────────────────

const githubVerifier = new GitHubOAuthVerifier();

// ─── Exported functions (backward compatible) ───────────

export function getGitHubAuthUrl(state: string): string {
    return githubVerifier.getAuthUrl(state);
}

export async function verifyGitHubOwnership(
    code: string,
    projectId: string,
): Promise<VerificationResult> {
    const parts = projectId.split("/");
    if (parts.length !== 2) {
        return {
            success: false,
            method: "github_oauth",
            projectId,
            error: "Invalid project ID — expected 'owner/repo' format",
        };
    }
    return githubVerifier.verify(code, projectId);
}

// ─── Backward-compatible helper exports ─────────────────

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
            redirect_uri: `${env.BASE_URL}/api/verify/github/callback`,
        }),
    });
    const data = (await response.json()) as GitHubTokenResponse;
    if (!data.access_token) {
        throw new Error("Failed to exchange GitHub OAuth code");
    }
    return data.access_token;
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
    try {
        return await fetchWithAuth<GitHubUser>(
            "https://api.github.com/user",
            accessToken,
            GITHUB_API_HEADERS,
        );
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        if (msg.startsWith("API error: ")) {
            throw new Error(`GitHub ${msg}`);
        }
        throw error;
    }
}

export async function checkRepoPermission(
    accessToken: string,
    owner: string,
    repo: string,
    username: string,
): Promise<GitHubPermission> {
    try {
        return await fetchWithAuth<GitHubPermission>(
            `https://api.github.com/repos/${owner}/${repo}/collaborators/${username}/permission`,
            accessToken,
            GITHUB_API_HEADERS,
        );
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        if (msg.startsWith("API error: ")) {
            throw new Error(`GitHub ${msg}`);
        }
        throw error;
    }
}

// ─── File-based verification (non-OAuth) ────────────────

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
            { headers: { Accept: "application/vnd.github+json" } },
        );

        if (!response.ok) {
            return {
                success: false,
                method: "github_file",
                projectId,
                error:
                    response.status === 404
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
