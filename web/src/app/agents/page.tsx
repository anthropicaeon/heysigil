import {
    ArrowRight,
    Bot,
    Cloud,
    Code2,
    Coins,
    Cpu,
    ExternalLink,
    Globe,
    KeyRound,
    MessageSquare,
    Rocket,
    Scale,
    Server,
    Shield,
    Terminal,
    Wallet,
    Zap,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

const agents = [
    {
        name: "OpenCLaw",
        tagline: "Autonomous AI agent for the open internet",
        description:
            "An open-source AI assistant that performs tasks autonomously on a user's computer. OpenCLaw agents operate across digital platforms — managing crypto wallets, executing trades, handling compliance checks, and interacting with onchain protocols without human intervention.",
        status: "active",
        capabilities: [
            {
                icon: Cpu,
                label: "Computer Use",
                detail: "Autonomous desktop and browser interaction",
            },
            {
                icon: Wallet,
                label: "Crypto Operations",
                detail: "Wallet management, trading, and DeFi interactions",
            },
            {
                icon: Scale,
                label: "AML Compliance",
                detail: "Real-time risk assessment and sanctions screening",
            },
            {
                icon: Shield,
                label: "Verification",
                detail: "Sigil attestation queries and builder verification",
            },
        ],
        integrationPoints: [
            "Query builder attestations via Sigil SDK",
            "Claim fees from SigilFeeVault autonomously",
            "Participate in milestone governance votes",
            "Launch and manage tokens via SigilFactory",
        ],
        color: "sage" as const,
    },
    {
        name: "Conway Research",
        tagline: "Infrastructure for self-improving, autonomous AI",
        description:
            "Conway builds the primitives that allow AI agents to function autonomously without a human in the loop. Their infrastructure enables agents to provision their own compute, register domains, and transact using stablecoins — all at machine speed.",
        status: "active",
        url: "https://conway.tech",
        capabilities: [
            {
                icon: Cloud,
                label: "AI-Native Cloud",
                detail: "Agents pay for and manage their own Linux VMs",
            },
            {
                icon: Globe,
                label: "Domain Registration",
                detail: "AI registers and manages its own domain names",
            },
            {
                icon: Bot,
                label: "Automaton Framework",
                detail: "AI that earns its own existence, replicates, and evolves",
            },
            {
                icon: Terminal,
                label: "MCP Tools",
                detail: "Write access to the real world via conway-terminal",
            },
        ],
        integrationPoints: [
            "Permissionless verification via Sigil attestations",
            "Stablecoin-based fee routing through the protocol",
            "Key-pair identity mapped to onchain Sigils",
            "Agent-to-agent trust via attestation scores",
        ],
        color: "lavender" as const,
    },
];

const sigilAgentFeatures = [
    {
        icon: Shield,
        title: "Verification Layer",
        description:
            "Agents query Sigil attestations to verify builder legitimacy before transacting. Five independent verification channels provide resilient trust signals.",
    },
    {
        icon: Zap,
        title: "Fee Routing",
        description:
            "Automated fee distribution through SigilFeeVault. Agents can claim USDC fees, route capital to verified builders, and manage treasury operations.",
    },
    {
        icon: Code2,
        title: "SDK Access",
        description:
            "First-class SDK support for agent integration. Query attestations, verify builders, and interact with Sigil contracts programmatically.",
    },
    {
        icon: Server,
        title: "Onchain Operations",
        description:
            "Agents launch tokens via SigilFactory, participate in milestone governance, and execute onchain transactions through verified channels.",
    },
];

export default function AgentsPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-20 bg-lavender/20"
                >
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            agents
                        </p>
                        <h1 className="text-3xl lg:text-5xl font-semibold text-foreground mb-6 lowercase leading-tight">
                            the agentic ecosystem
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            AI agents are the majority of future internet participants — transacting at
                            machine speed, managing capital, and operating across platforms. Sigil
                            provides the trust layer they need.
                        </p>
                    </div>
                </PixelCard>

                {/* Agent Cards */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            featured agents
                        </h2>
                    </div>
                    <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                        {agents.map((agent) => (
                            <div key={agent.name} className="flex flex-col">
                                {/* Agent Header */}
                                <div
                                    className={cn(
                                        "px-6 py-6 lg:px-8 border-border border-b",
                                        agent.color === "sage" ? "bg-sage/20" : "bg-lavender/20",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div
                                                    className={cn(
                                                        "size-10 flex items-center justify-center border border-border",
                                                        agent.color === "sage"
                                                            ? "bg-sage/40"
                                                            : "bg-lavender/40",
                                                    )}
                                                >
                                                    <Bot className="size-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-foreground">
                                                        {agent.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {agent.tagline}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="size-2 bg-green-500 animate-pulse" />
                                            <Badge
                                                variant="outline"
                                                className="text-xs bg-green-100 text-green-700"
                                            >
                                                Active
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-3">
                                        {agent.description}
                                    </p>
                                    {agent.url && (
                                        <Link
                                            href={agent.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
                                        >
                                            {agent.url.replace("https://", "")}
                                            <ExternalLink className="size-3" />
                                        </Link>
                                    )}
                                </div>

                                {/* Capabilities */}
                                <div className="border-border border-b">
                                    <div className="px-6 py-2 lg:px-8 bg-secondary/20">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Capabilities
                                        </span>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {agent.capabilities.map((cap) => (
                                            <div
                                                key={cap.label}
                                                className="px-6 py-3 lg:px-8 flex items-center gap-3"
                                            >
                                                <div className="size-8 bg-primary/10 flex items-center justify-center shrink-0">
                                                    <cap.icon className="size-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium text-foreground">
                                                        {cap.label}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground">
                                                        {cap.detail}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Integration Points */}
                                <div className="flex-1">
                                    <div className="px-6 py-2 lg:px-8 bg-secondary/20 border-border border-b">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Sigil Integration
                                        </span>
                                    </div>
                                    <div className="px-6 py-4 lg:px-8 space-y-2">
                                        {agent.integrationPoints.map((point) => (
                                            <div key={point} className="flex items-start gap-2">
                                                <div className="size-1.5 bg-primary mt-1.5 shrink-0" />
                                                <span className="text-sm text-muted-foreground">
                                                    {point}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How Agents Use Sigil */}
                <div className="border-border border-b bg-sage/20">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            how agents use sigil
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                        {sigilAgentFeatures.map((feature, i) => (
                            <div
                                key={feature.title}
                                className={cn(
                                    "px-6 py-6 lg:px-8 border-border",
                                    i < 4 && "border-b lg:border-b-0",
                                    i < 2 && "sm:border-b",
                                    i % 4 !== 3 && "lg:border-r",
                                    i % 2 === 0 && "sm:border-r lg:border-r-0",
                                    i % 4 !== 3 && "lg:border-r",
                                )}
                            >
                                <div className="size-12 bg-sage/40 flex items-center justify-center mb-4 border border-border">
                                    <feature.icon className="size-6 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agent Activity Briefing */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            agent activity
                        </h2>
                    </div>
                    <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
                        {/* Mini bar chart */}
                        <div className="px-6 py-6 lg:px-8">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                                Verifications (7d)
                            </p>
                            <div className="h-20 flex items-end gap-0.5">
                                {[40, 55, 45, 70, 60, 85, 75].map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-primary/20"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div
                                            className="w-full bg-primary"
                                            style={{ height: `${h > 70 ? 100 : 60}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-lg font-semibold text-foreground mt-2">342</p>
                            <p className="text-xs text-muted-foreground">agent-initiated verifications</p>
                        </div>

                        {/* Progress bar */}
                        <div className="px-6 py-6 lg:px-8">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                                Protocol Coverage
                            </p>
                            <div className="space-y-3 mt-4">
                                <div>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Attestation Queries</span>
                                        <span>87%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-secondary">
                                        <div className="h-full bg-primary" style={{ width: "87%" }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Fee Claims</span>
                                        <span>64%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-secondary">
                                        <div className="h-full bg-primary" style={{ width: "64%" }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Governance Votes</span>
                                        <span>41%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-secondary">
                                        <div className="h-full bg-primary" style={{ width: "41%" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dot grid */}
                        <div className="px-6 py-6 lg:px-8">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                                Agent Network
                            </p>
                            <div className="grid grid-cols-6 gap-1 mt-4">
                                {[
                                    true, true, false, true, false, true,
                                    false, true, true, false, true, true,
                                    true, false, true, true, false, false,
                                    true, true, false, false, true, true,
                                ].map((active, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "aspect-square",
                                            active ? "bg-primary/30" : "bg-secondary/30",
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="text-lg font-semibold text-foreground mt-3">14</p>
                            <p className="text-xs text-muted-foreground">active agent nodes</p>
                        </div>
                    </div>
                </div>

                {/* Launch With Sigil */}
                <div className="border-border border-b bg-lavender/20">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            launch with sigil
                        </h2>
                    </div>
                    <div className="px-6 py-8 lg:px-12">
                        <p className="text-muted-foreground mb-8 max-w-2xl">
                            Agents can launch tokens directly through the Sigil protocol — no GitHub
                            repository required. Use key-pair attestation to verify your agent identity,
                            then deploy via the SigilFactory.
                        </p>
                        <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border border border-border">
                            {[
                                {
                                    step: "01",
                                    icon: KeyRound,
                                    title: "Attest Identity",
                                    description:
                                        "Sign a challenge message with your agent's private key. No GitHub, no OAuth — just cryptographic proof of key ownership.",
                                    code: "POST /api/verify/challenge\n{ method: \"agent_keypair\" }",
                                },
                                {
                                    step: "02",
                                    icon: Rocket,
                                    title: "Launch Token",
                                    description:
                                        "Call the deployer with your agent identifier. The protocol handles gas, pool creation, and liquidity seeding.",
                                    code: 'devLinks: ["agent://my-agent"]\n→ SigilFactory.launch()',
                                },
                                {
                                    step: "03",
                                    icon: Coins,
                                    title: "Claim Fees",
                                    description:
                                        "Trading fees accumulate automatically. Your agent can query and claim USDC from the SigilFeeVault at any time.",
                                    code: "SigilFeeVault.devFees(addr)\n→ SigilFeeVault.claimDevFees()",
                                },
                            ].map((item) => (
                                <div key={item.step} className="px-6 py-6 lg:px-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="size-10 bg-lavender/40 flex items-center justify-center border border-border">
                                            <item.icon className="size-5 text-primary" />
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                                Step {item.step}
                                            </span>
                                            <h3 className="font-medium text-foreground">
                                                {item.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {item.description}
                                    </p>
                                    <div className="bg-foreground/5 border border-border px-4 py-3">
                                        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                            {item.code}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Agent Attestation Detail */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            agent attestation
                        </h2>
                    </div>
                    <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                        <div className="px-6 py-8 lg:px-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 bg-sage/40 flex items-center justify-center border border-border">
                                    <KeyRound className="size-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        Key-Pair Verification
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        EIP-191 signature-based identity
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">
                                Agents don&apos;t have GitHub repos — they have key pairs. The
                                <code className="text-xs bg-secondary px-1.5 py-0.5 mx-1">
                                    agent_keypair
                                </code>
                                verification method lets an agent prove identity by signing a challenge
                                with their private key. This mirrors Conway&apos;s key-pair identity
                                model.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Request a challenge nonce from the verification API",
                                    "Sign the challenge with your agent's private key (EIP-191)",
                                    "Submit the signature — backend recovers signer address",
                                    "EAS attestation issued onchain to your agent's wallet",
                                ].map((step, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="size-6 bg-primary/10 flex items-center justify-center shrink-0 text-xs font-medium text-primary">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-8 lg:px-12">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
                                Example — ethers.js
                            </p>
                            <div className="bg-foreground/5 border border-border px-5 py-4">
                                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                                    {`// 1. Request challenge
const res = await fetch("/api/verify/challenge", {
  method: "POST",
  body: JSON.stringify({
    method: "agent_keypair",
    projectId: "my-agent",
    walletAddress: wallet.address
  })
});
const { challengeCode } = await res.json();

// 2. Sign with agent key
const msg = \`sigil-agent-verify:\${challengeCode}\`;
const signature = await wallet.signMessage(msg);

// 3. Submit for attestation
await fetch("/api/verify/check", {
  method: "POST",
  body: JSON.stringify({
    verificationId, signature
  })
});`}
                                </pre>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <Link href="/verify">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                    >
                                        Verify Now
                                        <ArrowRight className="size-3" />
                                    </Button>
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                    Available in the verification flow
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-primary">
                    <div className="px-6 py-3 lg:px-12 border-b border-primary-foreground/20">
                        <span className="text-xs text-primary-foreground/70 uppercase tracking-wider">
                            Build
                        </span>
                    </div>
                    <div className="flex flex-col lg:flex-row">
                        <PixelCard
                            variant="primary"
                            className="flex-1 border-border border-b lg:border-b-0 lg:border-r border-primary-foreground/20"
                            noFocus
                        >
                            <div className="flex flex-col h-full">
                                <div className="px-6 py-4 lg:px-8 border-b border-primary-foreground/20 flex items-center gap-3">
                                    <div className="size-10 bg-background/20 flex items-center justify-center">
                                        <Bot className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        Agent Development
                                    </span>
                                </div>
                                <div className="flex-1 px-6 py-10 lg:px-12 lg:py-12">
                                    <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                        build your agent.
                                    </h2>
                                    <p className="text-primary-foreground/80 mb-8 max-w-md">
                                        integrate sigil verification into your autonomous agent. query
                                        attestations, route fees, and participate in governance
                                        programmatically.
                                    </p>
                                    <Link href="/developers">
                                        <Button
                                            size="lg"
                                            variant="secondary"
                                            className="bg-background text-foreground hover:bg-background/90 gap-2"
                                        >
                                            Developer Docs
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </PixelCard>

                        <PixelCard variant="primary" className="flex-1" noFocus>
                            <div className="flex flex-col h-full">
                                <div className="px-6 py-4 lg:px-8 border-b border-primary-foreground/20 flex items-center gap-3">
                                    <div className="size-10 bg-background/20 flex items-center justify-center">
                                        <MessageSquare className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        Questions
                                    </span>
                                </div>
                                <div className="flex-1 px-6 py-10 lg:px-12 lg:py-12">
                                    <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                        talk to sigil.
                                    </h2>
                                    <p className="text-primary-foreground/80 mb-8 max-w-md">
                                        have questions about agent integration, verification, or the sdk?
                                        chat with our AI assistant.
                                    </p>
                                    <Link href="/chat">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 gap-2"
                                        >
                                            Start Chat
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </PixelCard>
                    </div>
                </div>
            </div>
        </section>
    );
}
