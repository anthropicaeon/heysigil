import { ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const proofLinks = [
    {
        icon: "/icons/code-browser.svg",
        label: "smart contracts",
        href: "https://basescan.org",
        external: true,
    },
    {
        icon: "/icons/shield-tick.svg",
        label: "EAS schema",
        href: "https://base.easscan.org",
        external: true,
    },
    {
        icon: "/icons/file-06.svg",
        label: "verification docs",
        href: "/developers",
        external: false,
    },
    {
        icon: "/icons/git-branch-01.svg",
        label: "source code",
        href: "https://github.com/heysigil",
        external: true,
    },
];

const attestationData = [
    { label: "project", value: "vaultprotocol" },
    { label: "builder", value: "0x7f2…3a9c" },
    { label: "verified", value: "2026-02-14 · 09:41 UTC" },
];

const channels = [
    { name: "github", verified: true },
    { name: "x (zkTLS)", verified: true },
    { name: "domain", verified: true },
    { name: "facebook", verified: true },
    { name: "instagram", verified: true },
];

const attestationStats = [
    { label: "status", value: "SIGIL ACTIVE", highlight: true },
    { label: "fees routed", value: "$4,217 USDC" },
    { label: "milestones", value: "2 / 4 validated" },
    { label: "attestation", value: "0xea5…7b2f" },
];

export default function SigilProof() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Proof Links Bar */}
                <div className="flex flex-col sm:flex-row border-border border-b overflow-x-auto">
                    {proofLinks.map((link) => (
                        <div
                            key={link.label}
                            className={cn(
                                "flex-1 border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                            )}
                        >
                            {link.external ? (
                                <a
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-4 lg:px-6 hover:bg-secondary/30 transition-colors"
                                >
                                    <Image src={link.icon} alt="" width={16} height={16} />
                                    <span className="text-sm font-medium text-foreground">
                                        {link.label}
                                    </span>
                                    <ExternalLink className="size-3 text-muted-foreground" />
                                </a>
                            ) : (
                                <Link
                                    href={link.href}
                                    className="flex items-center justify-center gap-2 px-4 py-4 lg:px-6 hover:bg-secondary/30 transition-colors"
                                >
                                    <Image src={link.icon} alt="" width={16} height={16} />
                                    <span className="text-sm font-medium text-foreground">
                                        {link.label}
                                    </span>
                                    <ArrowRight className="size-3 text-muted-foreground" />
                                </Link>
                            )}
                        </div>
                    ))}
                    {/* Audit - disabled */}
                    <div className="flex-1 flex items-center justify-center gap-2 px-4 py-4 lg:px-6 opacity-60 border-border border-b sm:border-b-0">
                        <Image src="/icons/check-verified-02.svg" alt="" width={16} height={16} />
                        <span className="text-sm font-medium text-foreground">audit</span>
                        <Badge variant="secondary" className="text-xs">
                            pending
                        </Badge>
                    </div>
                </div>

                {/* Example Attestation */}
                <div className="bg-sage/30">
                    {/* Attestation Header */}
                    <div className="px-6 py-3 lg:px-12 border-border border-b bg-secondary/50">
                        <span className="text-muted-foreground text-xs font-mono">
                            example · sigil attestation · base
                        </span>
                    </div>

                    {/* Attestation Content */}
                    <div className="flex flex-col lg:flex-row">
                        {/* Left - Basic Info */}
                        <div className="lg:flex-1 border-border border-b lg:border-b-0 lg:border-r">
                            {attestationData.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex px-6 py-3 lg:px-12 border-border border-b last:border-b-0 lg:last:border-b font-mono text-sm"
                                >
                                    <span className="text-muted-foreground w-24 shrink-0">
                                        {item.label}:
                                    </span>
                                    <span className="text-foreground">{item.value}</span>
                                </div>
                            ))}
                            {/* Channels */}
                            <div className="flex flex-wrap px-6 py-3 lg:px-12 border-border border-b font-mono text-sm gap-2">
                                <span className="text-muted-foreground w-24 shrink-0">
                                    channels:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {channels.map((ch) => (
                                        <Badge
                                            key={ch.name}
                                            variant="secondary"
                                            className="text-xs text-green-600 font-mono"
                                        >
                                            ✓ {ch.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right - Stats */}
                        <div className="lg:flex-1">
                            {attestationStats.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex px-6 py-3 lg:px-12 border-border border-b last:border-b-0 font-mono text-sm"
                                >
                                    <span className="text-muted-foreground w-24 shrink-0">
                                        {item.label}:
                                    </span>
                                    <span
                                        className={cn(
                                            item.highlight
                                                ? "text-green-600 font-semibold"
                                                : "text-foreground",
                                        )}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
