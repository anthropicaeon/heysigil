/**
 * General Handlers - help, unknown
 */

import type { ActionHandler } from "./types.js";

export const helpHandler: ActionHandler = async (params) => {
    const { topic } = params;
    const helpText = [
        "I'm Sigil. Funding for dev projects without the weight of handling a community.\n",
        "**Stamp Your Sigil:**",
        '  "verify github.com/org/repo" — prove you own a project',
        '  "stamp my sigil" — create your on-chain seal of approval',
        '  "pool status for myproject" — check LP fees and pool balance\n',
        "Your Sigil = your stamp of approval. You earn USDC fees from LPs.",
        "Your native tokens stay locked until the community votes on milestones.\n",
        "**Trading:**",
        '  "swap 0.1 ETH to USDC" — swap tokens on any chain',
        '  "bridge 100 USDC from ethereum to base" — cross-chain bridge',
        '  "send 50 USDC to 0x..." — send tokens',
        '  "price ETH" — check token prices',
        '  "balance" — check your wallet balance\n',
        "**Token Launches:**",
        '  "launch token called MyToken for https://github.com/org/repo" — deploy a token with dev links\n',
        "Use natural language — I'll figure out what you mean.",
    ].join("\n");

    return {
        success: true,
        message: topic ? `Help on "${topic}":\n\n${helpText}` : helpText,
    };
};

export const unknownHandler: ActionHandler = async () => {
    return {
        success: false,
        message: "I didn't quite get that. Try saying something like:\n- \"swap 0.1 ETH to USDC\"\n- \"verify github.com/my-org/my-repo\"\n- \"launch a token for https://github.com/org/repo\"\n- \"help\"",
    };
};
