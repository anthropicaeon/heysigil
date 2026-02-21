/**
 * Verification Handlers - verify_project, claim_reward, pool_status
 */

import type { ActionHandler } from "./types.js";
import { parseLink, bestVerifyMethod } from "../../utils/link-parser.js";
import type { ParsedLink } from "../../utils/link-parser.js";

export const verifyProjectHandler: ActionHandler = async (params) => {
    // Accept either "link" (new) or legacy "method" + "projectId"
    const rawLink = (params.link as string) || (params.projectId as string);

    if (!rawLink) {
        return {
            success: true,
            message: [
                "I can verify your project ownership. Just provide a link:",
                "",
                "• **GitHub** — `https://github.com/org/repo` or just `org/repo`",
                "• **Instagram** — `https://instagram.com/handle` or `@handle`",
                "• **Twitter/X** — `https://x.com/handle` or `@handle`",
                "• **Website** — `https://myproject.dev`",
                "",
                'Say something like: "verify https://github.com/my-org/my-project"',
            ].join("\n"),
            data: { status: "needs_link" },
        };
    }

    const parsed = parseLink(rawLink);

    if (!parsed) {
        return {
            success: false,
            message: `I couldn't recognize "${rawLink}" as a supported link. Try a full URL like \`https://github.com/org/repo\` or \`https://instagram.com/handle\`.`,
        };
    }

    const method = bestVerifyMethod(parsed.platform);

    // Build platform-specific instructions
    const instructions = getVerifyInstructions(parsed, method);

    return {
        success: true,
        message: instructions,
        data: {
            platform: parsed.platform,
            projectId: parsed.projectId,
            displayUrl: parsed.displayUrl,
            method,
            verifyMethods: parsed.verifyMethods,
            redirectUrl: `/verify?method=${method}&project=${encodeURIComponent(parsed.projectId)}`,
            status: "ready_to_verify",
        },
    };
};

export const claimRewardHandler: ActionHandler = async (params) => {
    const rawLink = (params.link as string) || (params.projectId as string);

    // Try to parse as a link first
    const parsed = rawLink ? parseLink(rawLink) : null;
    const projectId = parsed?.projectId || rawLink;

    return {
        success: true,
        message: `Stamping your Sigil for "${projectId}".\n\nYou need a verified EAS attestation first. If you haven't verified yet, say "verify ${parsed?.displayUrl || projectId}".\n\nOnce stamped, you'll earn USDC fees from LP activity. Your native tokens remain locked until the community votes to unlock them via milestones.`,
        data: { projectId, platform: parsed?.platform, status: "needs_attestation" },
    };
};

export const poolStatusHandler: ActionHandler = async (params) => {
    const rawLink = (params.link as string) || (params.projectId as string);
    const parsed = rawLink ? parseLink(rawLink) : null;
    const projectId = parsed?.projectId || rawLink;

    // TODO: Query pool status via SigilFeeVault on-chain
    return {
        success: true,
        message: `Checking pool status for "${projectId}"...\n\nPool contract query coming soon.`,
        data: { projectId, status: "pending_integration" },
    };
};

/**
 * Build verification instructions based on detected platform.
 */
function getVerifyInstructions(parsed: ParsedLink, method: string): string {
    const lines: string[] = [];

    switch (parsed.platform) {
        case "github":
            lines.push(
                `🔗 **GitHub Repo Detected:** [${parsed.projectId}](${parsed.displayUrl})`,
                "",
                "**Two ways to verify:**",
                "",
                "**1. GitHub OAuth (recommended)** — Instant verification",
                "   Connect your GitHub account and we'll check you have admin access.",
                `   → Visit the Stamp page or provide your wallet address to start.`,
                "",
                "**2. File-based** — No OAuth needed",
                "   Add a `.well-known/pool-claim.txt` file to your repo with your verification code.",
                "   We'll check the file contents match.",
                "",
                "Provide your wallet address to generate a verification challenge, or visit the **Stamp** page to begin.",
            );
            break;

        case "instagram":
            lines.push(
                `📸 **Instagram Account Detected:** [@${parsed.projectId}](${parsed.displayUrl})`,
                "",
                "**Verification via Instagram Graph API:**",
                "Connect your Instagram Business/Creator account to verify ownership.",
                "",
                "→ Visit the Stamp page to start the OAuth flow.",
            );
            break;

        case "twitter":
            lines.push(
                `🐦 **Twitter/X Account Detected:** [@${parsed.projectId}](${parsed.displayUrl})`,
                "",
                "**Verification via Tweet + zkTLS:**",
                "Tweet a verification code, then we generate a zkTLS proof — no API keys needed.",
                "",
                "Provide your wallet address to generate a challenge code, or visit the **Stamp** page.",
            );
            break;

        case "domain":
            lines.push(
                `🌐 **Website Detected:** [${parsed.projectId}](${parsed.displayUrl})`,
                "",
                "**Three ways to verify:**",
                "",
                "**1. DNS TXT Record** — Add a TXT record to your domain",
                "**2. Well-Known File** — Place a `.well-known/pool-claim.txt` on your server",
                "**3. HTML Meta Tag** — Add a `<meta>` tag to your homepage",
                "",
                "Provide your wallet address to generate a challenge, or visit the **Stamp** page.",
            );
            break;
    }

    lines.push(
        "",
        "Once verified, your Sigil stamp goes on-chain via EAS attestation. You earn USDC fees from LP activity without managing a community.",
    );

    return lines.join("\n");
}
