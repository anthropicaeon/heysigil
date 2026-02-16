/**
 * Token Launch Handler
 */

import type { ActionHandler } from "./types.js";
import { parseLink, parseLinks, bestVerifyMethod } from "../../utils/link-parser.js";
import type { ParsedLink } from "../../utils/link-parser.js";
import {
    deployToken,
    isDeployerConfigured,
    generateName,
    generateSymbol,
} from "../../services/deployer.js";

export const launchTokenHandler: ActionHandler = async (params) => {
    const rawLinks = params.devLinks;
    const nameParam = params.name as string | undefined;
    const symbolParam = params.symbol as string | undefined;
    const description = params.description as string | undefined;

    // Parse developer links
    let parsedLinks: ParsedLink[] = [];
    if (rawLinks) {
        if (Array.isArray(rawLinks)) {
            parsedLinks = (rawLinks as string[])
                .map((l) => parseLink(String(l)))
                .filter((l): l is ParsedLink => l !== null);
        } else if (typeof rawLinks === "string") {
            parsedLinks = parseLinks(rawLinks as string);
        }
    }

    // If no links were provided, ask for them
    if (parsedLinks.length === 0) {
        return {
            success: true,
            message: [
                nameParam
                    ? `Got it — **${nameParam}${symbolParam ? ` ($${symbolParam})` : ""}**${description ? `: "${description}"` : ""}`
                    : "I can launch a token for any project.",
                "",
                "I need a link to the developer/project. This tells us who earns fees when their Sigil is stamped.",
                "",
                "Drop a link:",
                "• **GitHub repo** — `https://github.com/org/repo`",
                "• **Instagram** — `https://instagram.com/handle`",
                "• **Twitter/X** — `https://x.com/handle`",
                "• **Website** — `https://myproject.dev`",
            ].join("\n"),
            data: { name: nameParam, symbol: symbolParam, description, status: "needs_dev_links" },
        };
    }

    // Auto-generate name/symbol from the primary link if not provided
    const primaryLink = parsedLinks[0];
    const projectId = `${primaryLink.platform}:${primaryLink.projectId}`;
    const tokenName = nameParam || generateName(primaryLink.projectId);
    const tokenSymbol = symbolParam || generateSymbol(primaryLink.projectId);

    // Check if deployer is configured
    if (!isDeployerConfigured()) {
        // Preview mode — no on-chain deployment
        const linkSummary = parsedLinks.map((l) => {
            const method = bestVerifyMethod(l.platform);
            return `• **${l.platform}** — [${l.projectId}](${l.displayUrl}) → verify via \`${method}\``;
        });

        return {
            success: true,
            message: [
                `🚀 **Launch Preview: ${tokenName} ($${tokenSymbol})**`,
                description ? `"${description}"` : "",
                "",
                "**Developer links:**",
                ...linkSummary,
                "",
                "⚠️ On-chain deployer not configured. Set `DEPLOYER_PRIVATE_KEY` and `SIGIL_FACTORY_ADDRESS` to enable instant launches.",
                "",
                "Once configured, I'll deploy this token on Base instantly — no wallet connection needed.",
            ].filter(Boolean).join("\n"),
            data: {
                name: tokenName,
                symbol: tokenSymbol,
                projectId,
                devLinks: parsedLinks.map((l) => ({
                    platform: l.platform,
                    projectId: l.projectId,
                    displayUrl: l.displayUrl,
                })),
                status: "preview_only",
            },
        };
    }

    // Deploy on-chain! 🚀
    try {
        const isSelfLaunch = params.isSelfLaunch as boolean | undefined;
        const result = await deployToken({
            name: tokenName,
            symbol: tokenSymbol,
            projectId,
            isSelfLaunch: isSelfLaunch ?? true,
            devLinks: parsedLinks.map(l => l.displayUrl),
        });

        const linkSummary = parsedLinks.map((l) =>
            `• **${l.platform}** — [${l.projectId}](${l.displayUrl})`,
        );

        const feeMessage = isSelfLaunch === false
            ? "A phantom wallet has been created for the developer. When they verify their GitHub, they'll inherit this wallet and all accumulated fees."
            : "You'll earn 80% of all swap fees. The remaining 20% goes to the Sigil protocol.";

        return {
            success: true,
            message: [
                `🚀 **Deployed: ${tokenName} ($${tokenSymbol})**`,
                "",
                `**Token:** \`${result.tokenAddress}\``,
                `**Pool:** Live on Base`,
                `**Tx:** [View on BaseScan](${result.explorerUrl})`,
                `**Trade:** [DEX Screener](${result.dexUrl})`,
                "",
                "**Developer links:**",
                ...linkSummary,
                "",
                feeMessage,
                `Say "verify ${primaryLink.displayUrl}" to start the verification process.`,
            ].join("\n"),
            data: {
                name: tokenName,
                symbol: tokenSymbol,
                projectId,
                tokenAddress: result.tokenAddress,
                poolId: result.poolId,
                txHash: result.txHash,
                explorerUrl: result.explorerUrl,
                dexUrl: result.dexUrl,
                isSelfLaunch: isSelfLaunch ?? true,
                status: "deployed",
            },
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown deployment error";
        return {
            success: false,
            message: [
                `❌ **Deployment failed:** ${errorMsg}`,
                "",
                "This could be a gas issue or network problem. Try again in a moment.",
            ].join("\n"),
            data: {
                name: tokenName,
                symbol: tokenSymbol,
                projectId,
                error: errorMsg,
                status: "failed",
            },
        };
    }
};
