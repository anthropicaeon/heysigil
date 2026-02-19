"use client";

import {
    ArrowRight,
    Bot,
    Check,
    Cloud,
    Coins,
    Copy,
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
import { PixelCard } from "@/components/ui/pixel-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const HERO_SIGNALS = [
    { icon: Shield, label: "Attestation", value: "EAS on Base" },
    { icon: Globe, label: "Network", value: "Base 8453" },
    { icon: Cloud, label: "Deploy", value: "agent:// flow" },
    { icon: Scale, label: "Governance", value: "Milestone votes" },
];

const AGENT_RAILS = [
    {
        icon: Terminal,
        title: "System Prompt Ready",
        description: "Drop skill.md into your runtime context with no additional parsing.",
    },
    {
        icon: Shield,
        title: "Verification Native",
        description: "Agent keypair verification and EAS attestation are first-class protocol paths.",
    },
    {
        icon: Globe,
        title: "Production Surface",
        description: "Works across verification, deploy, attestations, and fee claiming endpoints.",
    },
];

const AGENT_PACKAGE_GUIDES = [
    {
        value: "mcp",
        label: "mcp server",
        packageName: "@heysigil/sigil-mcp",
        status: "workspace",
        summary:
            "Scope-aware MCP server wrapping Sigil capabilities for autonomous tool-calling agents.",
        highlights: [
            "Transports: stdio (default) and streamable HTTP at /mcp.",
            "Tools cover verify, dashboard, chat, launches, developers info.",
            "Governance tools currently return explicit not_implemented placeholders.",
        ],
        command: `SIGIL_API_URL=http://localhost:3001
SIGIL_MCP_TOKEN=your_pat
SIGIL_MCP_TRANSPORT=http
SIGIL_MCP_HOST=127.0.0.1
SIGIL_MCP_PORT=8788
sigil-mcp`,
        snippet: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "sigil_launch_list",
    "arguments": { "limit": 5 }
  }
}`,
    },
    {
        value: "sdk",
        label: "sdk client",
        packageName: "@heysigil/sigil-sdk",
        status: "public",
        summary:
            "Typed JS/TS client used by apps and agent runtimes to call Sigil APIs directly.",
        highlights: [
            "Namespaces: verify, launch, wallet, fees, claim, chat, dashboard, mcp.",
            "Typed interfaces for challenge flow, launch flow, and fee analytics.",
            "Single token input supports both user auth and MCP PAT workflows.",
        ],
        command: "npm install @heysigil/sigil-sdk",
        snippet: `import { createSigilClient } from "@heysigil/sigil-sdk";

const sigil = createSigilClient({
  baseUrl: "https://heysigil.com",
  token: process.env.SIGIL_TOKEN,
});

const challenge = await sigil.verify.createChallenge({
  method: "agent_keypair",
  projectId: "my-agent",
  walletAddress: "0x...",
});`,
    },
    {
        value: "core",
        label: "core contracts",
        packageName: "@heysigil/sigil-core",
        status: "workspace",
        summary:
            "Shared package for canonical Sigil scopes, schemas, errors, and internal cross-package types.",
        highlights: [
            "Defines SIGIL_SCOPES used by SDK + MCP token authorization logic.",
            "Keeps schema and type definitions consistent across packages.",
            "Designed for DRY internals rather than external app consumption.",
        ],
        command: "npm run --workspace @heysigil/sigil-core build",
        snippet: `import { SIGIL_SCOPES } from "@heysigil/sigil-core";

const required = ["chat:write", "launch:write"];
const allowed = required.every((scope) => SIGIL_SCOPES.includes(scope));`,
    },
] as const;

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
            className="inline-flex h-8 items-center gap-1.5 border border-border bg-background/70 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
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
        <div className="font-mono text-xs lg:text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {content}
        </div>
    );
}

/* ─── Main page ────────────────────────────────────────────────── */

export default function AgentsPage() {
    const [view, setView] = useState<"humans" | "agents">("humans");

    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 flex flex-col">
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-lavender/30"
                >
                    <div className="grid lg:grid-cols-[1fr_320px]">
                        <div className="px-6 py-12 lg:px-12 lg:py-16 border-border lg:border-r">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-3">
                                agent infrastructure
                            </p>
                            <h1 className="text-3xl lg:text-5xl font-semibold text-foreground mb-4 lowercase leading-tight">
                                production rails for autonomous agents
                            </h1>
                            <p className="text-muted-foreground max-w-2xl text-base lg:text-lg mb-6">
                                Identity verification, token launch, attestations, and fee routing in
                                a single border-centric protocol surface.
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mb-8">
                                <Badge variant="outline">agent:// identifiers</Badge>
                                <Badge variant="outline">EAS attestations</Badge>
                                <Badge variant="outline">USDC fee vault</Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link href="/verify">
                                    <Button size="lg" className="gap-2">
                                        Stamp Agent Sigil
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                                <Link href="/chat">
                                    <Button variant="outline" size="lg">
                                        Open Sigil Chat
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 border-border border-t lg:border-t-0 bg-background/60 backdrop-blur-sm">
                            {HERO_SIGNALS.map((item, index) => (
                                <div
                                    key={item.label}
                                    className={cn(
                                        "px-5 py-6 border-border",
                                        index === 0 && "border-r border-b",
                                        index === 1 && "border-b",
                                        index === 2 && "border-r",
                                    )}
                                >
                                    <div className="size-9 bg-sage/30 border border-border flex items-center justify-center mb-3">
                                        <item.icon className="size-4 text-primary" />
                                    </div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                        {item.label}
                                    </p>
                                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </PixelCard>

                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-sage/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 border border-border bg-sage/40 flex items-center justify-center">
                                <Terminal className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-xs font-medium uppercase tracking-wider">
                                    integration guides
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    package-level setup for agent runtimes
                                </h2>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="mcp" className="w-full">
                        <div className="border-border border-b px-6 py-3 lg:px-12 bg-background/80">
                            <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0">
                                {AGENT_PACKAGE_GUIDES.map((guide, index) => (
                                    <TabsTrigger
                                        key={guide.value}
                                        value={guide.value}
                                        className={cn(
                                            "h-10 rounded-none border border-border px-4 py-2 text-xs font-mono uppercase tracking-wider data-[state=active]:border-border data-[state=active]:bg-lavender/40",
                                            index > 0 && "-ml-px",
                                        )}
                                    >
                                        {guide.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {AGENT_PACKAGE_GUIDES.map((guide) => (
                            <TabsContent key={guide.value} value={guide.value} className="mt-0">
                                <div className="grid lg:grid-cols-[1.1fr_1fr]">
                                    <div className="border-border border-b lg:border-b-0 lg:border-r px-6 py-6 lg:px-8 lg:py-8">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <Badge variant="outline" className="text-[11px] font-mono">
                                                {guide.packageName}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] uppercase">
                                                {guide.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-5">{guide.summary}</p>
                                        <div className="space-y-2">
                                            {guide.highlights.map((item) => (
                                                <div key={item} className="flex items-start gap-2">
                                                    <div className="size-1.5 bg-primary mt-2 shrink-0" />
                                                    <span className="text-sm text-muted-foreground">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="px-6 py-6 lg:px-8 lg:py-8 bg-foreground/[0.02] space-y-4">
                                        <div className="border border-border bg-background/80">
                                            <div className="border-border border-b px-4 py-2.5 flex items-center justify-between gap-2">
                                                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                                    command
                                                </p>
                                                <CopyButton text={guide.command} />
                                            </div>
                                            <pre className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                                {guide.command}
                                            </pre>
                                        </div>
                                        <div className="border border-border bg-background/80">
                                            <div className="border-border border-b px-4 py-2.5 flex items-center justify-between gap-2">
                                                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                                    example
                                                </p>
                                                <CopyButton text={guide.snippet} />
                                            </div>
                                            <pre className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                                {guide.snippet}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                <div className="border-border border-b bg-background/80">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                        <div className="flex border-border sm:border-r">
                            <button
                                onClick={() => setView("humans")}
                                className={cn(
                                    "h-12 px-6 text-sm font-medium lowercase transition-colors border-border border-r",
                                    view === "humans"
                                        ? "bg-background text-foreground"
                                        : "bg-transparent text-muted-foreground hover:text-foreground",
                                )}
                            >
                                for humans
                            </button>
                            <button
                                onClick={() => setView("agents")}
                                className={cn(
                                    "h-12 px-6 text-sm font-medium lowercase transition-colors",
                                    view === "agents"
                                        ? "bg-background text-foreground"
                                        : "bg-transparent text-muted-foreground hover:text-foreground",
                                )}
                            >
                                for agents
                            </button>
                        </div>
                        <div className="hidden sm:block flex-1" />
                        <div className="border-border border-t sm:border-t-0 sm:border-l px-4 py-3 sm:px-6 sm:py-0">
                            <CopyButton text={SIGIL_SKILL_MD} label="Copy skill.md" />
                        </div>
                    </div>
                </div>

                {/* ─── For Agents View ──────────────────────────── */}
                {view === "agents" && (
                    <div className="border-border border-b bg-background">
                        <div className="grid lg:grid-cols-[280px_1fr]">
                            <div className="border-border border-b lg:border-b-0 lg:border-r bg-sage/10 px-6 py-6 lg:px-8 lg:py-8">
                                <p className="text-primary text-xs font-medium uppercase tracking-wider mb-4">
                                    runtime profile
                                </p>
                                <div className="space-y-3">
                                    {AGENT_RAILS.map((item) => (
                                        <div
                                            key={item.title}
                                            className="border border-border bg-background/80 px-3 py-3"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <item.icon className="size-4 text-primary mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <div className="px-6 py-3 lg:px-8 border-border border-b bg-foreground/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <span className="text-xs text-muted-foreground font-mono">
                                        skill.md - paste into your agent&apos;s system context
                                    </span>
                                    <CopyButton text={SIGIL_SKILL_MD} />
                                </div>
                                <div className="px-6 py-6 lg:px-8 bg-foreground/[0.02] max-h-[65vh] lg:max-h-[780px] overflow-auto">
                                    <SkillMarkdownView content={SIGIL_SKILL_MD} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* For Humans View */}
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
                            <div className="px-6 py-6 lg:px-12 space-y-4">
                                <div className="border border-border bg-background/70">
                                    <div className="border-border border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                            Verify Agent Identity
                                        </span>
                                        <CopyButton
                                            text={`curl -X POST https://heysigil.com/api/verify/challenge \\
  -H "Content-Type: application/json" \\
  -d '{"method":"agent_keypair","projectId":"my-agent","walletAddress":"0xYOUR_WALLET"}'`}
                                        />
                                    </div>
                                    <div className="bg-foreground/5 px-4 py-4">
                                        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                            {`curl -X POST https://heysigil.com/api/verify/challenge \\
  -H "Content-Type: application/json" \\
  -d '{"method":"agent_keypair","projectId":"my-agent","walletAddress":"0xYOUR_WALLET"}'`}
                                        </pre>
                                    </div>
                                </div>
                                <div className="border border-border bg-background/70">
                                    <div className="border-border border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                            Deploy a Token
                                        </span>
                                        <CopyButton
                                            text={`curl -X POST https://heysigil.com/api/deploy \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My Token","symbol":"sTOKEN","projectId":"my-agent","devLinks":["agent://my-agent"]}'`}
                                        />
                                    </div>
                                    <div className="bg-foreground/5 px-4 py-4">
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
                            <div className="px-6 lg:px-12 overflow-x-auto">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead>
                                        <tr className="border-border border-b">
                                            <th className="text-left text-xs text-muted-foreground font-mono uppercase tracking-wider py-3 pr-4">
                                                Feature
                                            </th>
                                            <th className="text-left text-xs text-muted-foreground font-mono uppercase tracking-wider py-3 border-l border-border pl-4">
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
                                                <td className="py-3 text-muted-foreground border-l border-border pl-4">
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
                            <div className="px-6 lg:px-12 overflow-x-auto">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead>
                                        <tr className="border-border border-b">
                                            <th className="text-left text-xs text-muted-foreground font-mono uppercase tracking-wider py-3 pr-4">
                                                Component
                                            </th>
                                            <th className="text-left text-xs text-muted-foreground font-mono uppercase tracking-wider py-3 border-l border-border pl-4">
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
                                                <td className="py-3 text-muted-foreground border-l border-border pl-4">
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

