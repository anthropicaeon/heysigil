import type { VerificationResult } from "./types.js";
import { OAuthVerifier, fetchWithAuth } from "./oauth-base.js";
import { getErrorMessage } from "../utils/errors.js";
import { parseConfigFile } from "../utils/config-parser.js";
import { buildSuccess, buildFailure } from "./result-builder.js";

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
                redirect_uri: this.getRedirectUri(),
            }),
        });

        const data = (await response.json()) as GitHubTokenResponse;
        if (!data.access_token) {
            throw new Error("Failed to exchange GitHub OAuth code");
        }
        return data.access_token;
    }

    /**
     * Exchange OAuth code for access token.
     * Public wrapper for backward compatibility.
     */
    async exchangeCodeForToken(code: string): Promise<string> {
        return this.exchangeCode(code);
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

/**
 * Exchange OAuth code for access token.
 * Delegates to GitHubOAuthVerifier singleton.
 */
export function exchangeGitHubCode(code: string): Promise<string> {
    return githubVerifier.exchangeCodeForToken(code);
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
    try {
        return await fetchWithAuth<GitHubUser>(
            "https://api.github.com/user",
            accessToken,
            GITHUB_API_HEADERS,
        );
    } catch (error) {
        const msg = getErrorMessage(error);
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
        const msg = getErrorMessage(error);
        if (msg.startsWith("API error: ")) {
            throw new Error(`GitHub ${msg}`);
        }
        throw error;
    }
}

// ─── Privy-based verification (no OAuth redirect) ───────

/**
 * Verify GitHub repo ownership/contribution using a known GitHub username.
 * Skips OAuth code exchange — uses unauthenticated GitHub API.
 * Works for public repos only.
 *
 * Checks two things (in order):
 * 1. Is the user the repo owner? (via /repos/:owner/:repo)
 * 2. Is the user a contributor? (via /repos/:owner/:repo/contributors)
 */
export async function verifyGitHubViaPrivy(
    githubUsername: string,
    projectId: string,
): Promise<VerificationResult> {
    const parts = projectId.split("/");
    if (parts.length !== 2) {
        return buildFailure(
            "github_oauth",
            projectId,
            "Invalid project ID — expected 'owner/repo' format",
        );
    }
    const [owner, repo] = parts;
    const usernameLower = githubUsername.toLowerCase();

    try {
        // 1. Check if repo exists and if user is the owner
        const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: GITHUB_API_HEADERS,
        });

        if (!repoResponse.ok) {
            if (repoResponse.status === 404) {
                return buildFailure(
                    "github_oauth",
                    projectId,
                    `Repository ${projectId} not found or is private. Privy-based verification only works for public repos.`,
                );
            }
            return buildFailure(
                "github_oauth",
                projectId,
                `GitHub API error: ${repoResponse.status}`,
            );
        }

        const repoData = (await repoResponse.json()) as { owner: { login: string } };

        // Direct owner match — strongest signal
        if (repoData.owner.login.toLowerCase() === usernameLower) {
            return buildSuccess("github_oauth", projectId, githubUsername, {
                permission: "admin",
                roleName: "owner",
                verifiedVia: "privy_identity",
            });
        }

        // 2. Check if user is a contributor (paginated, check first 100)
        const contribResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
            { headers: GITHUB_API_HEADERS },
        );

        if (contribResponse.ok) {
            const contributors = (await contribResponse.json()) as { login: string }[];
            const isContributor = contributors.some((c) => c.login.toLowerCase() === usernameLower);

            if (isContributor) {
                return buildSuccess("github_oauth", projectId, githubUsername, {
                    permission: "write",
                    roleName: "contributor",
                    verifiedVia: "privy_identity",
                });
            }
        }

        // User is neither owner nor contributor
        return buildFailure(
            "github_oauth",
            projectId,
            `User ${githubUsername} is not an owner or contributor of ${projectId}`,
            { platformUsername: githubUsername },
        );
    } catch (err) {
        return buildFailure("github_oauth", projectId, getErrorMessage(err));
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
        return buildFailure(
            "github_file",
            projectId,
            "Invalid project ID — expected 'owner/repo' format",
        );
    }
    const [owner, repo] = parts;

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/.well-known/pool-claim.txt`,
            { headers: { Accept: "application/vnd.github+json" } },
        );

        if (!response.ok) {
            return buildFailure(
                "github_file",
                projectId,
                response.status === 404
                    ? "Verification file not found — add .well-known/pool-claim.txt to your repo"
                    : `GitHub API error: ${response.status}`,
            );
        }

        const data = (await response.json()) as { content: string; encoding: string };
        const content = Buffer.from(data.content, "base64").toString("utf-8").trim();

        // Expected format:
        // verification-code=<code>
        // wallet-address=<address>
        const parsed = parseConfigFile(content, ["verification-code", "wallet-address"]);
        const fileCode = parsed["verification-code"];
        const fileWallet = parsed["wallet-address"];

        if (fileCode !== expectedCode) {
            return buildFailure("github_file", projectId, "Verification code does not match");
        }

        if (fileWallet?.toLowerCase() !== expectedWallet.toLowerCase()) {
            return buildFailure("github_file", projectId, "Wallet address does not match");
        }

        return buildSuccess("github_file", projectId, undefined, { fileContent: content });
    } catch (err) {
        return buildFailure("github_file", projectId, getErrorMessage(err));
    }
}
