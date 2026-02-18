"use client";

import {
    ArrowRight,
    Bot,
    Cloud,
    Coins,
    Copy,
    Check,
    ExternalLink,
    Globe,
    KeyRound,
    Rocket,
    Scale,
    Shield,
    Terminal,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Skill file content (embedded from .agents/) ──────────────── */

const SIGIL_SKILL_MD = `---
name: sigil-agent-skill
description: Skill file for AI agents integrating with the Sigil protocol. Covers identity attestation, token launches, fee claiming, and governance.
---

# Sigil Agent Skill

Sigil is a decentralized verification protocol on Base (chain ID 8453). Agents use Sigil to attest their identity, launch tokens, claim trading fees, and participate in milestone governance — all without human intervention.

## Authentication

Agents authenticate via key-pair signature. No GitHub, no OAuth — just cryptographic proof.

### 1. Request Challenge
\`\`\`
POST /api/verify/challenge
Content-Type: application/json

{
  "method": "agent_keypair",
  "projectId": "your-agent-name",
  "walletAddress": "0xYourAgentWallet"
}

→ { "challengeCode": "abc123...", "verificationId": "agent-..." }
\`\`\`

### 2. Sign Challenge (EIP-191)
\`\`\`typescript
const message = \`sigil-agent-verify:\${challengeCode}\`;
const signature = await wallet.signMessage(message);
\`\`\`

### 3. Submit Proof
\`\`\`
POST /api/verify/check
Content-Type: application/json

{
  "verificationId": "agent-...",
  "proofData": "{\\"signature\\":\\"0x...\\",\\"challengeCode\\":\\"abc123...\\"}"
}

→ EAS attestation issued onchain
\`\`\`

## Deploy a Token

Agents launch tokens using the \`agent://\` identifier prefix (no GitHub URL required).

\`\`\`
POST /api/deploy
Content-Type: application/json

{
  "name": "My Agent Token",
  "symbol": "sAGENT",
  "projectId": "my-agent",
  "isSelfLaunch": false,
  "devLinks": ["agent://my-agent"]
}

→ { "tokenAddress": "0x...", "poolId": "0x...", "txHash": "0x..." }
\`\`\`

The deployer wallet pays gas. Token is immediately live and tradeable on Uniswap V3 (Base).

## Claim Fees

Trading fees accumulate automatically in the SigilFeeVault. Query and claim at any time.

\`\`\`typescript
const feeVault = new ethers.Contract(FEE_VAULT_ADDRESS, FEE_VAULT_ABI, wallet);

// Check claimable USDC
const claimable = await feeVault.devFees(wallet.address);

// Claim
if (claimable > 0n) {
  const tx = await feeVault.claimDevFees();
  await tx.wait(1);
}
\`\`\`

## Query Attestations

Check any builder or agent's verification score before transacting.

\`\`\`
GET /api/attestations?address=0x...

→ { "score": 4, "verified": true, "channels": ["agent_keypair", "domain_dns"] }
\`\`\`

## Rate Limits

- 1 deploy per wallet per 24 hours
- Verification challenges expire after 1 hour
- No rate limit on read endpoints (attestations, fees, tokens)

## Infrastructure

| Component       | Details                                  |
|-----------------|------------------------------------------|
| Chain           | Base (L2, chain ID 8453)                 |
| DEX             | Uniswap V3                              |
| Contracts       | SigilFactoryV3, SigilFeeVault, SigilToken |
| Attestation     | EAS (Ethereum Attestation Service)       |
| Token Standard  | ERC-20                                   |
| Fee Currency    | USDC                                     |

## Security

- All tokens use audited Sigil contracts
- API keys required for write operations (deploy, claim)
- Read endpoints are public (attestations, tokens, fees)
- All addresses validated as proper 0x-prefixed hex (42 chars)
- No private keys stored server-side

## Need Help?

DM [@HeySigil](https://x.com/HeySigil) on X, or visit the [developer docs](/developers).
`;

/* ─── Copy button component ────────────────────────────────────── */

function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-2.5 py-1"
        >
            {copied ? (
                <>
                    <Check className="size-3" />
                    Copied
                </>
            ) : (
                <>
                    <Copy className="size-3" />
                    {label || "Copy"}
                </>
            )}
        </button>
    );
}

/* ─── Markdown-ish renderer for the agent view ─────────────────── */

function SkillMarkdownView({ content }: { content: string }) {
    return (
        <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {content}
        </div>
    );
}

/* ─── Main page ────────────────────────────────────────────────── */

export default function AgentsPage() {
    const [view, setView] = useState<"humans" | "agents">("humans");

    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-10 lg:px-12 lg:py-16 bg-lavender/10">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-3">
                        agent skill
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase leading-tight">
                        integrate with sigil
                    </h1>
                    <p className="text-muted-foreground max-w-xl">
                        Everything an autonomous agent needs to verify identity, launch tokens,
                        and claim fees on the Sigil protocol.
                    </p>
                </div>

                {/* Toggle */}
                <div className="border-border border-b px-6 py-3 lg:px-12 flex items-center gap-3 bg-secondary/20">
                    <button
                        onClick={() => setView("humans")}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium transition-all border",
                            view === "humans"
                                ? "bg-foreground text-background border-foreground"
                                : "bg-transparent text-muted-foreground border-border hover:text-foreground",
                        )}
                    >
                        For Humans
                    </button>
                    <button
                        onClick={() => setView("agents")}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium transition-all border",
                            view === "agents"
                                ? "bg-foreground text-background border-foreground"
                                : "bg-transparent text-muted-foreground border-border hover:text-foreground",
                        )}
                    >
                        For Agents
                    </button>
                    <div className="flex-1" />
                    <CopyButton
                        text={SIGIL_SKILL_MD}
                        label="Copy skill.md"
                    />
                </div>

                {/* ─── For Agents View ──────────────────────────── */}
                {view === "agents" && (
                    <div className="border-border border-b">
                        <div className="px-6 py-2 lg:px-12 border-border border-b bg-secondary/10">
                            <span className="text-xs text-muted-foreground font-mono">
                                skill.md — paste this into your agent&apos;s context
                            </span>
                        </div>
                        <div className="px-6 py-6 lg:px-12 bg-foreground/[0.02]">
                            <SkillMarkdownView content={SIGIL_SKILL_MD} />
                        </div>
                    </div>
                )}

                {/* ─── For Humans View ──────────────────────────── */}
                {view === "humans" && (
                    <>
                        {/* How It Works */}
                        <div className="border-border border-b">
                            <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    how it works
                                </h2>
                            </div>
                            <div className="grid lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
                                {[
                                    {
                                        step: "1",
                                        icon: KeyRound,
                                        title: "Verify Identity",
                                        description:
                                            "Agent signs a challenge message with its private key. EAS attestation issued onchain.",
                                    },
                                    {
                                        step: "2",
                                        icon: Rocket,
                                        title: "Launch Token",
                                        description:
                                            "Call the deploy API with an agent:// identifier. Protocol handles gas and pool creation.",
                                    },
                                    {
                                        step: "3",
                                        icon: Coins,
                                        title: "Earn Fees",
                                        description:
                                            "Trading fees accumulate automatically in the SigilFeeVault. Paid in USDC.",
                                    },
                                    {
                                        step: "4",
                                        icon: Wallet,
                                        title: "Claim USDC",
                                        description:
                                            "Agent calls claimDevFees() on the fee vault at any time to collect earnings.",
                                    },
                                ].map((item) => (
                                    <div key={item.step} className="px-6 py-6 lg:px-8">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="size-8 bg-primary/10 flex items-center justify-center">
                                                <item.icon className="size-4 text-primary" />
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                Step {item.step}
                                            </span>
                                        </div>
                                        <h3 className="font-medium text-foreground mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Start */}
                        <div className="border-border border-b bg-sage/10">
                            <div className="px-6 py-4 lg:px-12 border-border border-b">
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    quick start
                                </h2>
                            </div>
                            <div className="px-6 py-6 lg:px-12 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                            Verify Agent Identity
                                        </span>
                                        <CopyButton
                                            text={`curl -X POST https://heysigil.com/api/verify/challenge \\
  -H "Content-Type: application/json" \\
  -d '{"method":"agent_keypair","projectId":"my-agent","walletAddress":"0xYOUR_WALLET"}'`}
                                        />
                                    </div>
                                    <div className="bg-foreground/5 border border-border px-5 py-4">
                                        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                            {`curl -X POST https://heysigil.com/api/verify/challenge \\
  -H "Content-Type: application/json" \\
  -d '{"method":"agent_keypair","projectId":"my-agent","walletAddress":"0xYOUR_WALLET"}'`}
                                        </pre>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                            Deploy a Token
                                        </span>
                                        <CopyButton
                                            text={`curl -X POST https://heysigil.com/api/deploy \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My Token","symbol":"sTOKEN","projectId":"my-agent","devLinks":["agent://my-agent"]}'`}
                                        />
                                    </div>
                                    <div className="bg-foreground/5 border border-border px-5 py-4">
                                        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                            {`curl -X POST https://heysigil.com/api/deploy \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My Token","symbol":"sTOKEN","projectId":"my-agent","devLinks":["agent://my-agent"]}'`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What You Get */}
                        <div className="border-border border-b">
                            <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    what you get
                                </h2>
                            </div>
                            <div className="px-6 lg:px-12">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-border border-b">
                                            <th className="text-left text-xs text-muted-foreground font-mono uppercase tracking-wider py-3 pr-4">
                                                Feature
                                            </th>
                                            <th className="text-left text-xs text-muted-foreground font-mono uppercase tracking-wider py-3">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {[
                                            ["Identity", "Key-pair attestation via EAS (no GitHub required)"],
                                            ["Token Launch", "Deploy ERC-20 with auto Uniswap V3 pool on Base"],
                                            ["Fee Collection", "Claim USDC from SigilFeeVault at any time"],
                                            ["Governance", "Vote on milestone proposals programmatically"],
                                            ["Verification", "Query builder/agent attestation scores via API"],
                                            ["Gas", "Protocol deployer pays gas — agents pay nothing"],
                                        ].map(([feature, details]) => (
                                            <tr key={feature}>
                                                <td className="py-3 pr-4 font-medium text-foreground">
                                                    {feature}
                                                </td>
                                                <td className="py-3 text-muted-foreground">
                                                    {details}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Infrastructure */}
                        <div className="border-border border-b bg-lavender/10">
                            <div className="px-6 py-4 lg:px-12 border-border border-b">
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    infrastructure
                                </h2>
                            </div>
                            <div className="px-6 lg:px-12">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-border border-b">
                                            <th className="text-left text-xs text-muted-foreground font-mono uppercase tracking-wider py-3 pr-4">
                                                Component
                                            </th>
                                            <th className="text-left text-xs text-muted-foreground font-mono uppercase tracking-wider py-3">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {[
                                            ["Chain", "Base (L2, chain ID 8453)"],
                                            ["DEX", "Uniswap V3"],
                                            ["Contracts", "SigilFactoryV3, SigilFeeVault, SigilToken"],
                                            ["Attestation", "EAS (Ethereum Attestation Service)"],
                                            ["Token", "Standard ERC-20"],
                                            ["Fees", "USDC"],
                                        ].map(([component, details]) => (
                                            <tr key={component}>
                                                <td className="py-3 pr-4 font-medium text-foreground">
                                                    {component}
                                                </td>
                                                <td className="py-3 text-muted-foreground">
                                                    {details}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Ecosystem Agents */}
                        <div className="border-border border-b">
                            <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    ecosystem agents
                                </h2>
                            </div>
                            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                                {[
                                    {
                                        name: "OpenCLaw",
                                        tagline: "Autonomous computer-use agent",
                                        capabilities: [
                                            "Desktop/browser interaction",
                                            "Crypto wallet management",
                                            "DeFi operations",
                                            "AML compliance",
                                        ],
                                        color: "sage",
                                    },
                                    {
                                        name: "Conway Research",
                                        tagline: "Infrastructure for autonomous AI",
                                        url: "https://conway.tech",
                                        capabilities: [
                                            "AI-native cloud (VMs)",
                                            "Domain registration",
                                            "Automaton framework",
                                            "MCP tools (conway-terminal)",
                                        ],
                                        color: "lavender",
                                    },
                                ].map((agent) => (
                                    <div key={agent.name} className="px-6 py-6 lg:px-8">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className={cn(
                                                    "size-8 flex items-center justify-center border border-border",
                                                    agent.color === "sage"
                                                        ? "bg-sage/30"
                                                        : "bg-lavender/30",
                                                )}
                                            >
                                                <Bot className="size-4 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-foreground">
                                                    {agent.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {agent.tagline}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 mb-3">
                                            {agent.capabilities.map((cap) => (
                                                <div
                                                    key={cap}
                                                    className="flex items-center gap-2"
                                                >
                                                    <div className="size-1 bg-primary shrink-0" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {cap}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {agent.url && (
                                            <Link
                                                href={agent.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                {agent.url.replace("https://", "")}
                                                <ExternalLink className="size-3" />
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security */}
                        <div className="border-border border-b bg-sage/10">
                            <div className="px-6 py-4 lg:px-12 border-border border-b">
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    security
                                </h2>
                            </div>
                            <div className="px-6 py-6 lg:px-12 space-y-2">
                                {[
                                    "All tokens use audited Sigil contracts — no custom smart contracts",
                                    "API keys required for all write operations (deploy, claim)",
                                    "Read endpoints are public (attestations, tokens, fees)",
                                    "Request body capped at 1MB, all inputs validated server-side",
                                    "All addresses validated as proper 0x-prefixed hex (42 chars)",
                                    "No private keys or sensitive data stored server-side",
                                ].map((point) => (
                                    <div key={point} className="flex items-start gap-2">
                                        <div className="size-1 bg-primary mt-2 shrink-0" />
                                        <span className="text-sm text-muted-foreground">
                                            {point}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Need Help - shown in both views */}
                <div className="border-border border-b px-6 py-6 lg:px-12 bg-secondary/10">
                    <h2 className="text-lg font-semibold text-foreground lowercase mb-3">
                        need help?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        DM{" "}
                        <Link
                            href="https://x.com/HeySigil"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            @HeySigil
                        </Link>{" "}
                        on X, or check the{" "}
                        <Link href="/developers" className="text-primary hover:underline">
                            developer docs
                        </Link>{" "}
                        and{" "}
                        <Link href="/chat" className="text-primary hover:underline">
                            chat with Sigil
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </section>
    );
}
