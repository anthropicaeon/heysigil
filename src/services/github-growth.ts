import { Octokit } from "octokit";
import { getEnv } from "../config/env.js";
import { getPrivyGithubUsername } from "../middleware/auth.js";
import { loggers } from "../utils/logger.js";

const log = loggers.server;

const SIGIL_REPO_OWNER = "heysigil";
const SIGIL_REPO_NAME = "heysigil";

export async function autoStarSigilRepoForClaimant(
    privyUserId: string,
): Promise<{ attempted: boolean; success: boolean; reason?: string }> {
    const githubUsername = await getPrivyGithubUsername(privyUserId);
    if (!githubUsername) {
        return {
            attempted: false,
            success: false,
            reason: "claimant has no linked GitHub account",
        };
    }

    const token = getEnv().GITHUB_AUTO_STAR_TOKEN;
    if (!token) {
        return {
            attempted: false,
            success: false,
            reason: "GITHUB_AUTO_STAR_TOKEN not configured",
        };
    }

    try {
        const octokit = new Octokit({ auth: token });
        await octokit.request("PUT /user/starred/{owner}/{repo}", {
            owner: SIGIL_REPO_OWNER,
            repo: SIGIL_REPO_NAME,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });

        log.info(
            { privyUserId, githubUsername, repo: `${SIGIL_REPO_OWNER}/${SIGIL_REPO_NAME}` },
            "Best-effort repo star attempted after claim",
        );

        return { attempted: true, success: true };
    } catch (error) {
        log.warn(
            { error, privyUserId, githubUsername },
            "Best-effort repo star failed after claim",
        );
        return { attempted: true, success: false, reason: "github api call failed" };
    }
}
