import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Copy,
    Github,
    Globe,
    Instagram,
    Shield,
    Twitter,
    User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function VerificationGuidePage() {
    return (
        <article className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                {/* Back Navigation */}
                <div className="border-border border-b px-6 py-3 lg:px-12 bg-lavender/30">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Blog
                    </Link>
                </div>

                {/* Header */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-2/3 px-6 py-10 lg:px-12 lg:py-14 border-border border-b lg:border-b-0 lg:border-r">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                                Guide
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                                complete guide to multi-channel verification
                            </h1>
                            <p className="text-muted-foreground">
                                A step-by-step walkthrough of verifying your identity across all 5 Sigil
                                channels, earning your onchain attestation, and maximizing your verification
                                score.
                            </p>
                        </div>
                        <div className="lg:w-1/3 flex flex-col">
                            <div className="flex-1 px-6 py-6 lg:px-8 border-border border-b flex items-center gap-3">
                                <User className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Sigil Team</span>
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 border-border border-b flex items-center gap-3">
                                <Calendar className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Feb 10, 2026</span>
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 flex items-center gap-3">
                                <Clock className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">8-10 min read</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="border-border border-b aspect-video relative bg-lavender/20">
                    <Image
                        src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80"
                        alt="Verification Guide"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Section: Understanding Score */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-4 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-sage/20">
                            <h2 className="text-lg font-semibold text-foreground lowercase">
                                understanding verification score
                            </h2>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-12 border-border border-b">
                            <p className="text-muted-foreground">
                                Your verification score (1-5) represents the number of channels
                                you&apos;ve successfully verified. Higher scores unlock benefits.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-4 lg:px-8 bg-sage/10 flex items-center gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0" />
                        <span className="text-sm text-foreground">Greater fee routing allocations</span>
                    </div>
                    <div className="px-6 py-4 lg:px-8 bg-sage/10 flex items-center gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0" />
                        <span className="text-sm text-foreground">More governance weight</span>
                    </div>
                </div>
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-4 lg:px-8 bg-sage/10 flex items-center gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0" />
                        <span className="text-sm text-foreground">Priority access to new features</span>
                    </div>
                    <div className="px-6 py-4 lg:px-8 bg-sage/10 flex items-center gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0" />
                        <span className="text-sm text-foreground">Enhanced credibility</span>
                    </div>
                </div>

                {/* Section: Verification Channels */}
                <div className="bg-lavender/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            verification channels
                        </h2>
                    </div>
                </div>

                {/* Channel 1: GitHub */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/4 px-6 py-4 lg:px-8 border-border border-b lg:border-b-0 lg:border-r bg-sage/20 flex items-center gap-3">
                            <div className="size-10 bg-background border border-border flex items-center justify-center">
                                <Github className="size-5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-sm">GitHub</h3>
                                <p className="text-xs text-muted-foreground">Code contributions</p>
                            </div>
                        </div>
                        <div className="lg:w-3/4 px-6 py-4 lg:px-8">
                            <div className="divide-y divide-border border border-border">
                                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">1</span>
                                    Click &quot;Verify GitHub&quot; on the verification page
                                </div>
                                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">2</span>
                                    Authorize Sigil&apos;s OAuth app (read-only)
                                </div>
                                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">3</span>
                                    Attestation created with your verified handle
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Channel 2: X/Twitter */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/4 px-6 py-4 lg:px-8 border-border border-b lg:border-b-0 lg:border-r bg-lavender/20 flex items-center gap-3">
                            <div className="size-10 bg-background border border-border flex items-center justify-center">
                                <Twitter className="size-5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-sm">X (Twitter)</h3>
                                <p className="text-xs text-muted-foreground">Social via zkTLS</p>
                            </div>
                        </div>
                        <div className="lg:w-3/4 px-6 py-4 lg:px-8">
                            <div className="divide-y divide-border border border-border mb-3">
                                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">1</span>
                                    Install browser extension (one-time)
                                </div>
                                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">2</span>
                                    Navigate to your X profile
                                </div>
                                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">3</span>
                                    Extension generates zkTLS proof
                                </div>
                                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">4</span>
                                    Proof verified, attestation created
                                </div>
                            </div>
                            <div className="bg-lavender/10 border border-border p-3">
                                <p className="text-xs text-foreground font-medium mb-1">Why zkTLS?</p>
                                <p className="text-xs text-muted-foreground">
                                    No OAuth required—cryptographic proof of your actual profile. Privacy-preserving.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Channel 3: Facebook */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/4 px-6 py-4 lg:px-8 border-border border-b lg:border-b-0 lg:border-r bg-sage/20 flex items-center gap-3">
                            <div className="size-10 bg-background border border-border flex items-center justify-center">
                                <Shield className="size-5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-sm">Facebook</h3>
                                <p className="text-xs text-muted-foreground">Real identity</p>
                            </div>
                        </div>
                        <div className="lg:w-3/4 px-6 py-4 lg:px-8">
                            <p className="text-sm text-muted-foreground mb-2">
                                Log in via Facebook OAuth. We verify account ownership (read-only) and create
                                attestation linking your wallet to your Facebook identity.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                <strong>Privacy:</strong> We don&apos;t store or post to your Facebook.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Channel 4: Instagram */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/4 px-6 py-4 lg:px-8 border-border border-b lg:border-b-0 lg:border-r bg-lavender/20 flex items-center gap-3">
                            <div className="size-10 bg-background border border-border flex items-center justify-center">
                                <Instagram className="size-5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-sm">Instagram</h3>
                                <p className="text-xs text-muted-foreground">Creative work</p>
                            </div>
                        </div>
                        <div className="lg:w-3/4 px-6 py-4 lg:px-8">
                            <p className="text-sm text-muted-foreground mb-2">
                                Connect via Instagram OAuth. Account ownership verified, attestation includes your handle.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                <strong>Best for:</strong> Creators, projects with visual portfolios, influencers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Channel 5: Domain */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/4 px-6 py-4 lg:px-8 border-border border-b lg:border-b-0 lg:border-r bg-sage/20 flex items-center gap-3">
                            <div className="size-10 bg-background border border-border flex items-center justify-center">
                                <Globe className="size-5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-sm">Domain</h3>
                                <p className="text-xs text-muted-foreground">Website control</p>
                            </div>
                        </div>
                        <div className="lg:w-3/4 px-6 py-4 lg:px-8">
                            <p className="text-sm text-muted-foreground mb-3">
                                Add a DNS TXT record with your wallet address. We verify and create attestation.
                            </p>
                            <div className="bg-cream/50 border border-border p-3 font-mono text-sm mb-3 flex items-center gap-2">
                                <span className="text-muted-foreground">sigil-verify=</span>
                                <span className="text-primary">0x1234...abcd</span>
                                <Copy className="size-4 text-muted-foreground ml-auto cursor-pointer hover:text-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                <strong>Verification time:</strong> Usually instant, up to 24 hours for DNS propagation.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section: After Verification */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            after verification
                        </h2>
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-background">
                        <p className="text-muted-foreground">
                            Once verified, your attestation is:
                        </p>
                    </div>
                </div>

                {/* After Verification List */}
                <div className="border-border border-b divide-y divide-border bg-background">
                    <div className="px-6 py-4 lg:px-12 flex items-start gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">Permanent</p>
                            <p className="text-sm text-muted-foreground">Stored onchain via EAS on Base</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 lg:px-12 flex items-start gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">Queryable</p>
                            <p className="text-sm text-muted-foreground">Anyone can verify your credentials</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 lg:px-12 flex items-start gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">Composable</p>
                            <p className="text-sm text-muted-foreground">Other protocols can integrate your verification</p>
                        </div>
                    </div>
                </div>

                {/* Section: FAQ */}
                <div className="bg-lavender/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            common questions
                        </h2>
                    </div>
                </div>
                <div className="border-border border-b divide-y divide-border bg-background">
                    <div className="px-6 py-4 lg:px-12">
                        <p className="font-medium text-foreground mb-1">Can I update my verification?</p>
                        <p className="text-sm text-muted-foreground">
                            Yes, you can re-verify channels if your accounts change. New attestations are created; old ones remain for history.
                        </p>
                    </div>
                    <div className="px-6 py-4 lg:px-12">
                        <p className="font-medium text-foreground mb-1">What if I don&apos;t have all 5 channels?</p>
                        <p className="text-sm text-muted-foreground">
                            Verify what you have. Even 2-3 channels significantly increases your credibility and fee allocation.
                        </p>
                    </div>
                    <div className="px-6 py-4 lg:px-12">
                        <p className="font-medium text-foreground mb-1">Is verification free?</p>
                        <p className="text-sm text-muted-foreground">
                            Yes—you only pay network gas fees on Base (typically under $0.01).
                        </p>
                    </div>
                    <div className="px-6 py-4 lg:px-12">
                        <p className="font-medium text-foreground mb-1">Can I verify multiple wallets?</p>
                        <p className="text-sm text-muted-foreground">
                            Each wallet verifies independently. We recommend verifying your primary address.
                        </p>
                    </div>
                </div>

                {/* CTA - fills remaining space */}
                <div className="flex-1 flex flex-col lg:flex-row border-border border-t">
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-sage/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Get Started
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                            begin verification
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Start verifying your identity across all 5 channels. It&apos;s free—you only pay gas fees.
                        </p>
                        <div className="flex-1" />
                        <Link href="/verify">
                            <Button size="lg">
                                Start Verification
                                <ArrowLeft className="size-4 ml-2 rotate-180" />
                            </Button>
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 bg-lavender/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Navigation
                            </span>
                        </div>
                        <div className="space-y-4">
                            <Link
                                href="/blog/introducing-sigil-protocol"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="size-4" />
                                Prev: Introducing Sigil
                            </Link>
                            <Link
                                href="/blog/governance-deep-dive"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                Next: Governance Deep Dive
                                <ArrowLeft className="size-4 rotate-180" />
                            </Link>
                        </div>
                        <div className="flex-1" />
                    </div>
                </div>
            </div>
        </article>
    );
}
