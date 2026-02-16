import type { ParsedAction, ActionResult } from "./types.js";
import { parseLink, parseLinks, bestVerifyMethod } from "../utils/link-parser.js";
import type { ParsedLink } from "../utils/link-parser.js";
import {
  deployToken,
  isDeployerConfigured,
  generateName,
  generateSymbol,
} from "../services/deployer.js";
import {
  screenAction,
  screenPrompt,
  formatScreenMessage,
} from "../services/sentinel.js";
import {
  createWallet,
  hasWallet,
  getAddress,
  getBalance as getWalletBalance,
  getSignerWallet,
  requestExport,
  confirmExport,
  hasPendingExport,
} from "../services/wallet.js";
import {
  executeSwap,
  getQuote,
  resolveToken,
} from "../services/trading.js";

type ActionHandler = (params: Record<string, unknown>, sessionId?: string) => Promise<ActionResult>;

const handlers: Record<string, ActionHandler> = {
  swap: async (params, sessionId) => {
    const { fromToken, toToken, amount, chain = "base" } = params;
    const from = String(fromToken || "");
    const to = String(toToken || "");
    const amt = String(amount || "");

    if (!from || !to || !amt) {
      return {
        success: false,
        message: 'Please specify what to swap. Example: "swap 0.01 ETH to USDC"',
      };
    }

    // Ensure user has a wallet
    if (!sessionId || !hasWallet(sessionId)) {
      return {
        success: false,
        message: `To swap tokens, you need a wallet first.\n\nSay **"show my wallet"** to create one and get your deposit address. Fund it with ETH, then try swapping again.`,
      };
    }

    // Check if tokens are known
    const fromResolved = resolveToken(from);
    const toResolved = resolveToken(to);
    if (!fromResolved) return { success: false, message: `Unknown token: ${from}. Try using a contract address (0x...) instead.` };
    if (!toResolved) return { success: false, message: `Unknown token: ${to}. Try using a contract address (0x...) instead.` };

    // Execute the swap
    const result = await executeSwap(sessionId, from, to, amt);

    if (result.success) {
      return {
        success: true,
        message: [
          `✅ **Swap Executed!**`,
          "",
          `${amt} ${from.toUpperCase()} → ${result.toAmount} ${to.toUpperCase()}`,
          "",
          `🔗 [View on BaseScan](${result.explorerUrl})`,
          "",
          `Tx: \`${result.txHash}\``,
        ].join("\n"),
        data: { ...result },
      };
    } else {
      return {
        success: false,
        message: `❌ Swap failed: ${result.error}`,
        data: { ...result },
      };
    }
  },

  bridge: async (params) => {
    const { token, amount, fromChain, toChain } = params;
    return {
      success: true,
      message: `Bridge ${amount} ${token} from ${fromChain} → ${toChain}.\n\n🚧 Cross-chain bridging is coming soon. For now, you can swap tokens on Base.`,
      data: { token, amount, fromChain, toChain, status: "coming_soon" },
    };
  },

  send: async (params, sessionId) => {
    const { token, amount, toAddress, chain = "base" } = params;
    const to = String(toAddress || "");
    const amt = String(amount || "");
    const tkn = String(token || "ETH");

    if (!to || !amt) {
      return { success: false, message: 'Please specify amount and recipient. Example: "send 0.01 ETH to 0x1234..."' };
    }

    if (!sessionId || !hasWallet(sessionId)) {
      return {
        success: false,
        message: 'You need a wallet first. Say **"show my wallet"** to create one.',
      };
    }

    const wallet = getSignerWallet(sessionId);
    if (!wallet) return { success: false, message: "Wallet error. Please try again." };

    try {
      const { ethers } = await import("ethers");

      if (tkn.toUpperCase() === "ETH") {
        const tx = await wallet.sendTransaction({
          to,
          value: ethers.parseEther(amt),
        });
        const receipt = await tx.wait(1);
        return {
          success: true,
          message: [
            `✅ **Sent ${amt} ETH** to \`${to.slice(0, 10)}...${to.slice(-8)}\``,
            "",
            `🔗 [View on BaseScan](https://basescan.org/tx/${receipt?.hash || tx.hash})`,
          ].join("\n"),
          data: { txHash: receipt?.hash || tx.hash },
        };
      } else {
        // ERC-20 transfer
        const resolved = resolveToken(tkn);
        if (!resolved) return { success: false, message: `Unknown token: ${tkn}` };

        const erc20 = new ethers.Contract(
          resolved.address,
          ["function transfer(address, uint256) returns (bool)"],
          wallet,
        );
        const value = ethers.parseUnits(amt, resolved.decimals);
        const tx = await erc20.transfer(to, value);
        const receipt = await tx.wait(1);
        return {
          success: true,
          message: [
            `✅ **Sent ${amt} ${tkn.toUpperCase()}** to \`${to.slice(0, 10)}...${to.slice(-8)}\``,
            "",
            `🔗 [View on BaseScan](https://basescan.org/tx/${receipt?.hash || tx.hash})`,
          ].join("\n"),
          data: { txHash: receipt?.hash || tx.hash },
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("insufficient funds")) {
        return { success: false, message: "Insufficient funds. Deposit more ETH to cover this transfer + gas." };
      }
      return { success: false, message: `Transfer failed: ${msg}` };
    }
  },

  balance: async (_params, sessionId) => {
    if (!sessionId || !hasWallet(sessionId)) {
      return {
        success: true,
        message: 'You don\'t have a wallet yet. Say **"show my wallet"** to create one and get your deposit address.',
        data: { status: "no_wallet" },
      };
    }

    const address = getAddress(sessionId);
    const balance = await getWalletBalance(sessionId);

    if (!balance) {
      return { success: false, message: "Failed to fetch balance. Please try again." };
    }

    const lines = [
      `💰 **Your Wallet Balance**`,
      "",
      `Address: \`${address}\``,
      "",
      `**ETH:** ${balance.ethFormatted} ETH`,
    ];

    if (balance.tokens.length > 0) {
      lines.push("");
      for (const t of balance.tokens) {
        lines.push(`**${t.symbol}:** ${t.formatted}`);
      }
    }

    if (parseFloat(balance.ethFormatted) === 0 && balance.tokens.length === 0) {
      lines.push("", "Your wallet is empty. Send ETH or tokens to the address above to get started.");
    }

    return {
      success: true,
      message: lines.join("\n"),
      data: { address, ...balance },
    };
  },

  price: async (params) => {
    const { token } = params;
    const tokenMap: Record<string, string> = {
      eth: "ethereum", ethereum: "ethereum", weth: "ethereum",
      btc: "bitcoin", bitcoin: "bitcoin",
      usdc: "usd-coin", usdt: "tether",
      sol: "solana", solana: "solana",
      base: "ethereum",
      matic: "matic-network", polygon: "matic-network",
      arb: "arbitrum", arbitrum: "arbitrum",
      op: "optimism", optimism: "optimism",
      avax: "avalanche-2", link: "chainlink",
      uni: "uniswap", aave: "aave",
    };

    const tokenStr = String(token || "eth").toLowerCase();
    const coinId = tokenMap[tokenStr] || tokenStr;

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;
      const priceData = data[coinId];

      if (!priceData) {
        return {
          success: false,
          message: `Couldn't find price for "${token}". Try a common token like ETH, BTC, SOL, or USDC.`,
        };
      }

      const price = priceData.usd;
      const change24h = priceData.usd_24h_change;
      const changeStr = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
      const emoji = change24h >= 0 ? "📈" : "📉";

      return {
        success: true,
        message: `${emoji} **${String(token).toUpperCase()}**: $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}\n24h change: ${changeStr}`,
        data: { token: tokenStr, price, change24h, source: "coingecko" },
      };
    } catch {
      return {
        success: false,
        message: `Failed to fetch price for ${token}. CoinGecko API may be rate-limited, try again in a moment.`,
      };
    }
  },

  // ─── Token Launch ─────────────────────────────────────

  launch_token: async (params) => {
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
      const result = await deployToken({
        name: tokenName,
        symbol: tokenSymbol,
        projectId,
      });

      const linkSummary = parsedLinks.map((l) =>
        `• **${l.platform}** — [${l.projectId}](${l.displayUrl})`,
      );

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
          "The developer can now verify any of these links to stamp their Sigil and start earning 80% of swap fees.",
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
  },

  // ─── Project Verification ─────────────────────────────

  verify_project: async (params) => {
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
  },

  claim_reward: async (params) => {
    const rawLink = (params.link as string) || (params.projectId as string);

    // Try to parse as a link first
    const parsed = rawLink ? parseLink(rawLink) : null;
    const projectId = parsed?.projectId || rawLink;

    return {
      success: true,
      message: `Stamping your Sigil for "${projectId}".\n\nYou need a verified EAS attestation first. If you haven't verified yet, say "verify ${parsed?.displayUrl || projectId}".\n\nOnce stamped, you'll earn USDC fees from LP activity. Your native tokens remain locked until the community votes to unlock them via milestones.`,
      data: { projectId, platform: parsed?.platform, status: "needs_attestation" },
    };
  },

  pool_status: async (params) => {
    const rawLink = (params.link as string) || (params.projectId as string);
    const parsed = rawLink ? parseLink(rawLink) : null;
    const projectId = parsed?.projectId || rawLink;

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
      '  "launch token called MyToken for https://github.com/org/repo" — deploy a token with dev links\n',
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
      message: "I didn't quite get that. Try saying something like:\n- \"swap 0.1 ETH to USDC\"\n- \"verify github.com/my-org/my-repo\"\n- \"launch a token for https://github.com/org/repo\"\n- \"help\"",
    };
  },

  // ─── Wallet Management ────────────────────────────────

  deposit: async (_params, sessionId) => {
    if (!sessionId) return { success: false, message: "Session error." };

    const walletInfo = createWallet(sessionId);

    return {
      success: true,
      message: [
        "🏦 **Your Sigil Wallet**",
        "",
        `Address: \`${walletInfo.address}\``,
        "",
        "**To fund your wallet**, send ETH (on Base) to the address above.",
        "",
        "You can send from:",
        "• Coinbase → withdraw ETH to Base",
        "• MetaMask → send to this address on Base network",
        "• Any exchange that supports Base",
        "",
        "Once funded, you can:",
        '• **"swap 0.01 ETH to USDC"** — trade tokens',
        '• **"what\'s my balance"** — check your funds',
        '• **"send 10 USDC to 0x..."** — transfer tokens',
        '• **"export my private key"** — take full control of your wallet',
      ].join("\n"),
      data: { address: walletInfo.address },
    };
  },

  export_key: async (params, sessionId) => {
    if (!sessionId) return { success: false, message: "Session error." };

    if (!hasWallet(sessionId)) {
      return {
        success: false,
        message: 'You don\'t have a wallet yet. Say **"show my wallet"** to create one.',
      };
    }

    // Check if this is a confirmation of a pending export
    const rawText = String(params.rawText || "").toLowerCase();
    const isConfirm = rawText.includes("yes") && rawText.includes("export");

    if (isConfirm && hasPendingExport(sessionId)) {
      const result = confirmExport(sessionId);
      return {
        success: result.success,
        message: result.message,
        data: result.success ? { exported: true } : undefined,
      };
    }

    // First request — show warning
    const result = requestExport(sessionId);
    return {
      success: true,
      message: result.message,
      data: { pending: true },
    };
  },
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
        'Provide your wallet address to generate a verification challenge, or visit the **Stamp** page to begin.',
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

/**
 * Route a parsed action to the appropriate handler and execute it.
 * All actions pass through Sentinel security screening first.
 */
export async function executeAction(
  action: ParsedAction,
  userMessage?: string,
  sessionId?: string,
): Promise<ActionResult> {
  // ── Sentinel: Screen before execution ──────────────────

  // 1. Prompt injection check (if we have the original message)
  if (userMessage) {
    const promptCheck = screenPrompt(userMessage);
    if (!promptCheck.allowed) {
      return {
        success: false,
        message: formatScreenMessage(promptCheck),
        data: { blocked: true, reason: "prompt_injection", details: promptCheck.reasons },
      };
    }
  }

  // 2. Full action screening (addresses + tokens)
  const addresses: string[] = [];
  const params = action.params;

  // Collect any addresses from params
  for (const [key, val] of Object.entries(params)) {
    if (
      typeof val === "string" &&
      /^0x[0-9a-fA-F]{40}$/.test(val) &&
      ["to", "from", "address", "wallet", "devAddress", "recipient", "tokenAddress"].includes(key)
    ) {
      addresses.push(val);
    }
  }

  if (addresses.length > 0 || (params.tokenAddress && typeof params.tokenAddress === "string")) {
    const screenResult = await screenAction({
      userMessage: userMessage || "",
      intent: action.intent,
      addresses,
      tokenAddress: params.tokenAddress as string | undefined,
      chain: (params.chain as string) || "base",
    });

    if (!screenResult.allowed) {
      return {
        success: false,
        message: formatScreenMessage(screenResult),
        data: { blocked: true, reason: "sentinel_screen", details: screenResult.reasons },
      };
    }

    // Attach warning to result if there are warnings
    if (screenResult.risk === "warning") {
      const handler = handlers[action.intent] || handlers.unknown;
      const result = await handler(action.params, sessionId);
      result.message = formatScreenMessage(screenResult) + "\n\n" + result.message;
      return result;
    }
  }

  // ── Auto-create wallet for session if needed ───────────
  if (sessionId && !hasWallet(sessionId)) {
    createWallet(sessionId);
  }

  // ── Execute the action ─────────────────────────────────
  const handler = handlers[action.intent] || handlers.unknown;
  return handler(action.params, sessionId);
}
