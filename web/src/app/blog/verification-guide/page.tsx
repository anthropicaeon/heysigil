import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Github,
    Globe,
    Instagram,
    Shield,
    Twitter,
    User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function VerificationGuidePage() {
    return (
        <article className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Back Navigation */}
                <div className="border-border border-b px-6 py-4 lg:px-12 bg-lavender/30">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Blog
                    </Link>
                </div>

                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                        Guide
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                        complete guide to multi-channel verification
                    </h1>
                    <p className="text-muted-foreground max-w-3xl mb-6">
                        A step-by-step walkthrough of verifying your identity across all 5 Sigil
                        channels, earning your onchain attestation, and maximizing your verification
                        score.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <User className="size-4" />
                            Sigil Team
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            Feb 10, 2026
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            8-10 min read
                        </span>
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

                {/* Content */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-12 lg:px-12 lg:py-16 max-w-3xl">
                        {/* Section: Understanding Score */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                understanding verification score
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Your verification score (1-5) represents the number of channels
                                you&apos;ve successfully verified. Higher scores unlock:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="border border-border px-4 py-3 bg-sage/10 flex items-center gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0" />
                                    <span className="text-sm text-foreground">
                                        Greater fee routing allocations
                                    </span>
                                </div>
                                <div className="border border-border px-4 py-3 bg-sage/10 flex items-center gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0" />
                                    <span className="text-sm text-foreground">
                                        More governance weight
                                    </span>
                                </div>
                                <div className="border border-border px-4 py-3 bg-sage/10 flex items-center gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0" />
                                    <span className="text-sm text-foreground">
                                        Priority access to new features
                                    </span>
                                </div>
                                <div className="border border-border px-4 py-3 bg-sage/10 flex items-center gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0" />
                                    <span className="text-sm text-foreground">
                                        Enhanced credibility
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Channel Cards */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-6 lowercase">
                                verification channels
                            </h2>

                            {/* Channel 1: GitHub */}
                            <div className="border border-border mb-4">
                                <div className="px-4 py-3 bg-sage/20 border-b border-border flex items-center gap-3">
                                    <div className="size-10 bg-background border border-border flex items-center justify-center">
                                        <Github className="size-5 text-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-foreground">
                                            Channel 1: GitHub
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Proves your code contributions
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        How it works:
                                    </p>
                                    <div className="border border-border divide-y divide-border mb-4">
                                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                                1
                                            </span>
                                            Click &quot;Verify GitHub&quot; on the verification page
                                        </div>
                                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                                2
                                            </span>
                                            Authorize Sigil&apos;s OAuth app (read-only)
                                        </div>
                                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                                3
                                            </span>
                                            Attestation created with your verified handle
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Tip:</strong> Use your primary development account.
                                        You can unlink OAuth access after verification.
                                    </p>
                                </div>
                            </div>

                            {/* Channel 2: X/Twitter */}
                            <div className="border border-border mb-4">
                                <div className="px-4 py-3 bg-lavender/20 border-b border-border flex items-center gap-3">
                                    <div className="size-10 bg-background border border-border flex items-center justify-center">
                                        <Twitter className="size-5 text-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-foreground">
                                            Channel 2: X (Twitter) via zkTLS
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Proves social presence without OAuth
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        How it works:
                                    </p>
                                    <div className="border border-border divide-y divide-border mb-4">
                                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                                1
                                            </span>
                                            Install browser extension (one-time)
                                        </div>
                                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                                2
                                            </span>
                                            Navigate to your X profile
                                        </div>
                                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                                3
                                            </span>
                                            Extension generates zkTLS proof
                                        </div>
                                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="size-5 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                                4
                                            </span>
                                            Proof verified, attestation created
                                        </div>
                                    </div>
                                    <div className="bg-lavender/10 border border-border p-3">
                                        <p className="text-xs text-foreground font-medium mb-1">
                                            Why zkTLS?
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            No OAuth required—cryptographic proof of your actual
                                            profile. Privacy-preserving: we only see what you prove.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Channel 3: Facebook */}
                            <div className="border border-border mb-4">
                                <div className="px-4 py-3 bg-sage/20 border-b border-border flex items-center gap-3">
                                    <div className="size-10 bg-background border border-border flex items-center justify-center">
                                        <Shield className="size-5 text-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-foreground">
                                            Channel 3: Facebook
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Proves real-world identity
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Log in via Facebook OAuth. We verify account ownership
                                        (read-only) and create attestation linking your wallet to
                                        your Facebook identity.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Privacy:</strong> We don&apos;t store or post to
                                        your Facebook. Only profile ownership is verified.
                                    </p>
                                </div>
                            </div>

                            {/* Channel 4: Instagram */}
                            <div className="border border-border mb-4">
                                <div className="px-4 py-3 bg-lavender/20 border-b border-border flex items-center gap-3">
                                    <div className="size-10 bg-background border border-border flex items-center justify-center">
                                        <Instagram className="size-5 text-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-foreground">
                                            Channel 4: Instagram
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Proves creative work
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Connect via Instagram OAuth. Account ownership verified,
                                        attestation includes your Instagram handle.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Best for:</strong> Creators with established
                                        audiences, projects with visual portfolios, influencers.
                                    </p>
                                </div>
                            </div>

                            {/* Channel 5: Domain */}
                            <div className="border border-border">
                                <div className="px-4 py-3 bg-sage/20 border-b border-border flex items-center gap-3">
                                    <div className="size-10 bg-background border border-border flex items-center justify-center">
                                        <Globe className="size-5 text-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-foreground">
                                            Channel 5: Domain
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Proves website control
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Add a DNS TXT record with your wallet address. We verify the
                                        record and create attestation linking your wallet to the
                                        domain.
                                    </p>
                                    <div className="bg-background border border-border p-3 font-mono text-sm mb-3">
                                        <span className="text-muted-foreground">sigil-verify=</span>
                                        <span className="text-primary">0x1234...abcd</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Verification time:</strong> Usually instant, up to
                                        24 hours for DNS propagation.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* After Verification */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                after verification
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Once verified, your attestation is:
                            </p>
                            <div className="border border-border divide-y divide-border">
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">Permanent</p>
                                        <p className="text-sm text-muted-foreground">
                                            Stored onchain via EAS on Base
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">Queryable</p>
                                        <p className="text-sm text-muted-foreground">
                                            Anyone can verify your credentials
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">Composable</p>
                                        <p className="text-sm text-muted-foreground">
                                            Other protocols can integrate your verification
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                common questions
                            </h2>
                            <div className="border border-border divide-y divide-border">
                                <div className="px-4 py-4">
                                    <p className="font-medium text-foreground mb-1">
                                        Can I update my verification?
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Yes, you can re-verify channels if your accounts change. New
                                        attestations are created; old ones remain for history.
                                    </p>
                                </div>
                                <div className="px-4 py-4">
                                    <p className="font-medium text-foreground mb-1">
                                        What if I don&apos;t have all 5 channels?
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Verify what you have. Even 2-3 channels significantly
                                        increases your credibility and fee allocation.
                                    </p>
                                </div>
                                <div className="px-4 py-4">
                                    <p className="font-medium text-foreground mb-1">
                                        Is verification free?
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Yes—you only pay network gas fees on Base (typically under
                                        $0.01).
                                    </p>
                                </div>
                                <div className="px-4 py-4">
                                    <p className="font-medium text-foreground mb-1">
                                        Can I verify multiple wallets?
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Each wallet verifies independently. We recommend verifying
                                        your primary address.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* CTA */}
                        <section>
                            <Link
                                href="/verify"
                                className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                            >
                                Begin Verification
                                <ArrowLeft className="size-4 rotate-180" />
                            </Link>
                        </section>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="px-6 py-6 lg:px-12 bg-lavender/30 flex items-center justify-between">
                    <Link
                        href="/blog/introducing-sigil-protocol"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Prev: Introducing Sigil
                    </Link>
                    <Link
                        href="/blog/governance-deep-dive"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        Next: Governance Deep Dive
                        <ArrowLeft className="size-4 rotate-180" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
