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
import { getErrorMessage } from "../../utils/errors.js";

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
                    ? `**${nameParam}${symbolParam ? ` ($${symbolParam})` : ""}**`
                    : "Need a project link to launch.",
                "",
                "Drop a link (GitHub, website, Twitter, Instagram).",
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
                `**Launch Preview: ${tokenName} ($${tokenSymbol})**`,
                "",
                ...linkSummary,
                "",
                "Deployer not configured. Set `DEPLOYER_PRIVATE_KEY` and `SIGIL_FACTORY_ADDRESS` to deploy.",
            ]
                .filter(Boolean)
                .join("\n"),
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

    // ── Confirmation gate ──
    // If not confirmed, show a preview and wait for user to say "yes"
    const confirmed = params.confirmed === true;

    if (!confirmed) {
        const linkSummary = parsedLinks.map(
            (l) => `• **${l.platform}** — [${l.projectId}](${l.displayUrl})`,
        );

        return {
            success: true,
            message: [
                `**Launch Preview: ${tokenName} ($${tokenSymbol})**`,
                "",
                ...linkSummary,
                "",
                "Ready to deploy on Base. Confirm?",
            ].join("\n"),
            data: {
                name: tokenName,
                symbol: tokenSymbol,
                projectId,
                devLinks: parsedLinks.map((l) => ({
                    platform: l.platform,
                    projectId: l.projectId,
                    displayUrl: l.displayUrl,
                })),
                status: "pending_confirmation",
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
            devLinks: parsedLinks.map((l) => l.displayUrl),
        });

        const linkSummary = parsedLinks.map(
            (l) => `• **${l.platform}** — [${l.projectId}](${l.displayUrl})`,
        );

        return {
            success: true,
            message: [
                `✅ **Deployed: ${tokenName} ($${tokenSymbol})**`,
                "",
                `**Contract:** \`${result.tokenAddress}\``,
                `**Tx Hash:** \`${result.txHash}\``,
                `**Pool ID:** \`${result.poolId}\``,
                "",
                `🔗 [View on BaseScan](${result.explorerUrl})`,
                `📊 [DEX Screener](${result.dexUrl})`,
                "",
                ...linkSummary,
                "",
                isSelfLaunch
                    ? "Verify your project to start earning fees."
                    : "The dev can claim fees by verifying ownership.",
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
        const errorMsg = getErrorMessage(err, "Unknown deployment error");
        return {
            success: false,
            message: [
                `❌ **Deployment failed:** ${errorMsg}`,
                "",
                "Could be a gas or network issue. Try again.",
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
