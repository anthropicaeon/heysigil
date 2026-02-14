import type { ParsedAction, ActionResult } from "./types.js";

type ActionHandler = (params: Record<string, string | number>) => Promise<ActionResult>;

const handlers: Record<string, ActionHandler> = {
  swap: async (params) => {
    const { fromToken, toToken, amount, chain = "base" } = params;
    // TODO: Integrate with DEX aggregator (0x, 1inch, Jupiter)
    return {
      success: true,
      message: `Swap ${amount} ${fromToken} → ${toToken} on ${chain}.\n\nThis would execute via DEX aggregator. Connect your wallet to proceed.`,
      data: { fromToken, toToken, amount, chain, status: "preview" },
    };
  },

  bridge: async (params) => {
    const { token, amount, fromChain, toChain } = params;
    // TODO: Integrate with bridge protocol (Across, Stargate)
    return {
      success: true,
      message: `Bridge ${amount} ${token} from ${fromChain} → ${toChain}.\n\nThis would execute via bridge protocol. Connect your wallet to proceed.`,
      data: { token, amount, fromChain, toChain, status: "preview" },
    };
  },

  send: async (params) => {
    const { token, amount, toAddress, chain = "base" } = params;
    return {
      success: true,
      message: `Send ${amount} ${token} to ${toAddress} on ${chain}.\n\nConnect your wallet to sign this transaction.`,
      data: { token, amount, toAddress, chain, status: "preview" },
    };
  },

  balance: async (params) => {
    const { chain, token } = params;
    // TODO: Query on-chain balances via RPC
    return {
      success: true,
      message: `Checking balance${token ? ` for ${token}` : ""}${chain ? ` on ${chain}` : " across all chains"}...\n\nConnect your wallet to view balances.`,
      data: { chain, token, status: "needs_wallet" },
    };
  },

  price: async (params) => {
    const { token } = params;
    // TODO: Query price from CoinGecko / DeFiLlama
    return {
      success: true,
      message: `Looking up price for ${token}...\n\nPrice feed integration coming soon.`,
      data: { token, status: "pending_integration" },
    };
  },

  launch_token: async (params) => {
    const { name, symbol, description } = params;
    // TODO: Integrate with Clanker (Base) or pump.fun (Solana)
    return {
      success: true,
      message: `Launch token: ${name} ($${symbol})\n"${description}"\n\nThis would deploy via Clanker on Base. Connect your wallet to proceed.`,
      data: { name, symbol, description, status: "preview" },
    };
  },

  verify_project: async (params) => {
    const { method, projectId } = params;
    return {
      success: true,
      message: `Starting ${method} verification for "${projectId}".\n\nOnce verified, you can stamp your Sigil — your on-chain seal of approval. You'll earn USDC fees from LP activity while your native tokens stay locked until the community votes on milestones.\n\nVisit the Stamp page to complete the flow, or provide your wallet address to generate a challenge here.`,
      data: { method, projectId, redirectUrl: `/verify?method=${method}&project=${projectId}` },
    };
  },

  claim_reward: async (params) => {
    const { projectId } = params;
    return {
      success: true,
      message: `Stamping your Sigil for "${projectId}".\n\nYou need a verified EAS attestation first. If you haven't verified yet, say "verify ${projectId}".\n\nOnce stamped, you'll earn USDC fees from LP activity. Your native tokens remain locked until the community votes to unlock them via milestones.`,
      data: { projectId, status: "needs_attestation" },
    };
  },

  pool_status: async (params) => {
    const { projectId } = params;
    // TODO: Query the PoolReward contract on-chain
    return {
      success: true,
      message: `Checking pool status for "${projectId}"...\n\nPool contract query coming soon.`,
      data: { projectId, status: "pending_integration" },
    };
  },

  help: async (params) => {
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
      '  "launch token called MyToken (MTK)" — deploy a new token\n',
      "Use natural language — I'll figure out what you mean.",
    ].join("\n");

    return {
      success: true,
      message: topic ? `Help on "${topic}":\n\n${helpText}` : helpText,
    };
  },

  unknown: async () => {
    return {
      success: false,
      message: "I didn't quite get that. Try saying something like:\n- \"swap 0.1 ETH to USDC\"\n- \"verify github.com/my-org/my-repo\"\n- \"help\"",
    };
  },
};

/**
 * Route a parsed action to the appropriate handler and execute it.
 */
export async function executeAction(action: ParsedAction): Promise<ActionResult> {
  const handler = handlers[action.intent] || handlers.unknown;
  return handler(action.params);
}
