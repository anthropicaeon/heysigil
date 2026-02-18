import { ArrowLeft, Calendar, CheckCircle, Clock, Lock, Shield, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function UnderstandingZkTLSPage() {
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
                        Technical Deep Dive
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                        how zktls powers trustless social verification
                    </h1>
                    <p className="text-muted-foreground max-w-3xl mb-6">
                        Understanding the cryptographic magic behind Sigil&apos;s X (Twitter)
                        verification—how zkTLS proves you own an account without OAuth, APIs, or
                        trusting anyone.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <User className="size-4" />
                            Sigil Team
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            Jan 28, 2026
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            10-12 min read
                        </span>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="border-border border-b aspect-video relative bg-lavender/20">
                    <Image
                        src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80"
                        alt="Understanding zkTLS"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-12 lg:px-12 lg:py-16 max-w-3xl">
                        {/* Section: The OAuth Problem */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                the oauth problem
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Traditional social verification relies on OAuth:
                            </p>
                            <div className="border border-border divide-y divide-border mb-6">
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <span className="size-6 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                        1
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        User clicks &quot;Connect with X&quot;
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <span className="size-6 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                        2
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        X redirects to authorization page
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <span className="size-6 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                        3
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        User approves access
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <span className="size-6 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                        4
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        X sends access token to verifier
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <span className="size-6 bg-primary/10 text-primary text-xs flex items-center justify-center">
                                        5
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Verifier calls X API to confirm identity
                                    </span>
                                </div>
                            </div>

                            <p className="text-foreground font-medium mb-3">The problems:</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="border border-border px-4 py-3 bg-red-50 flex items-start gap-2">
                                    <X className="size-4 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-sm text-muted-foreground">
                                        Requires X&apos;s cooperation (they can revoke)
                                    </span>
                                </div>
                                <div className="border border-border px-4 py-3 bg-red-50 flex items-start gap-2">
                                    <X className="size-4 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-sm text-muted-foreground">
                                        API rate limits and costs
                                    </span>
                                </div>
                                <div className="border border-border px-4 py-3 bg-red-50 flex items-start gap-2">
                                    <X className="size-4 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-sm text-muted-foreground">
                                        Trust in verifier&apos;s API handling
                                    </span>
                                </div>
                                <div className="border border-border px-4 py-3 bg-red-50 flex items-start gap-2">
                                    <X className="size-4 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-sm text-muted-foreground">
                                        X knows who&apos;s verifying
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Section: Enter zkTLS */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                enter zktls
                            </h2>
                            <div className="border border-border p-4 bg-sage/10 mb-6">
                                <p className="text-muted-foreground">
                                    <strong className="text-foreground">zkTLS</strong>{" "}
                                    (Zero-Knowledge TLS) allows you to prove facts about HTTPS
                                    responses without revealing the full response or requiring any
                                    cooperation from the server.
                                </p>
                            </div>

                            <h3 className="text-lg font-medium text-foreground mb-3">
                                How TLS Works
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Every HTTPS connection involves:
                            </p>
                            <div className="border border-border divide-y divide-border mb-6">
                                <div className="px-4 py-3">
                                    <p className="font-medium text-foreground">1. Handshake</p>
                                    <p className="text-sm text-muted-foreground">
                                        Client and server establish encrypted channel
                                    </p>
                                </div>
                                <div className="px-4 py-3">
                                    <p className="font-medium text-foreground">2. Data Exchange</p>
                                    <p className="text-sm text-muted-foreground">
                                        Encrypted request/response
                                    </p>
                                </div>
                                <div className="px-4 py-3">
                                    <p className="font-medium text-foreground">3. Verification</p>
                                    <p className="text-sm text-muted-foreground">
                                        Both parties can verify authenticity
                                    </p>
                                </div>
                            </div>

                            <div className="border border-border p-4 bg-lavender/10">
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Key insight:</strong> TLS
                                    responses are cryptographically signed. If we can prove a
                                    signature is valid without revealing the full content, we can
                                    verify claims trustlessly.
                                </p>
                            </div>
                        </section>

                        {/* Section: The zkTLS Flow */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                the zktls flow
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                When you verify X with Sigil:
                            </p>
                            <div className="border border-border divide-y divide-border">
                                <div className="px-4 py-4 flex items-start gap-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Visit your X profile
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            In your browser, as normal
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-4 flex items-start gap-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Extension captures TLS session
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Session data securely recorded
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-4 flex items-start gap-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Zero-knowledge proof generated
                                        </p>
                                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                            <p className="flex items-center gap-2">
                                                <CheckCircle className="size-3 text-primary" />{" "}
                                                Valid TLS response from x.com
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <CheckCircle className="size-3 text-primary" />{" "}
                                                Response contained your profile
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <CheckCircle className="size-3 text-primary" /> Your
                                                handle is what you claim
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-4 flex items-start gap-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                                        4
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Proof submitted
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Without revealing full response
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-4 flex items-start gap-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                                        5
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Verifier validates proof
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Cryptographically verified onchain
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: What This Enables */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                what this enables
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="border border-border p-4 bg-sage/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="size-5 text-primary" />
                                        <h3 className="font-medium text-foreground">
                                            No OAuth Required
                                        </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        X doesn&apos;t need to approve anything. Proof comes from
                                        their existing TLS responses.
                                    </p>
                                </div>
                                <div className="border border-border p-4 bg-sage/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lock className="size-5 text-primary" />
                                        <h3 className="font-medium text-foreground">
                                            True Privacy
                                        </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        We only see specific claims you prove (handle), not full
                                        profile, DMs, or activity.
                                    </p>
                                </div>
                                <div className="border border-border p-4 bg-lavender/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="size-5 text-primary" />
                                        <h3 className="font-medium text-foreground">
                                            Censorship Resistant
                                        </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        X cannot selectively deny verification to users they
                                        don&apos;t like.
                                    </p>
                                </div>
                                <div className="border border-border p-4 bg-lavender/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="size-5 text-primary" />
                                        <h3 className="font-medium text-foreground">
                                            No API Dependencies
                                        </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        No rate limits, costs, or access tokens to manage.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section: zk-SNARKs Properties */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                proof properties (zk-snarks)
                            </h2>
                            <div className="border border-border divide-y divide-border">
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">Succinct</p>
                                        <p className="text-sm text-muted-foreground">
                                            Small constant size regardless of data
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Non-interactive
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            No back-and-forth required
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Zero-knowledge
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Only proves what you choose to reveal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Comparison Table */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                comparison to alternatives
                            </h2>
                            <div className="border border-border overflow-hidden">
                                <div className="grid grid-cols-4 bg-sage/20 border-b border-border">
                                    <div className="px-3 py-2 text-sm font-medium text-foreground">
                                        Method
                                    </div>
                                    <div className="px-3 py-2 text-sm font-medium text-foreground border-l border-border">
                                        OAuth
                                    </div>
                                    <div className="px-3 py-2 text-sm font-medium text-foreground border-l border-border">
                                        zkTLS
                                    </div>
                                    <div className="px-3 py-2 text-sm font-medium text-foreground border-l border-border">
                                        Screenshot
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 border-b border-border">
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        X cooperation
                                    </div>
                                    <div className="px-3 py-2 text-sm text-red-600 border-l border-border">
                                        Required
                                    </div>
                                    <div className="px-3 py-2 text-sm text-green-600 border-l border-border">
                                        No
                                    </div>
                                    <div className="px-3 py-2 text-sm text-green-600 border-l border-border">
                                        No
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 border-b border-border">
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        Privacy
                                    </div>
                                    <div className="px-3 py-2 text-sm text-yellow-600 border-l border-border">
                                        Moderate
                                    </div>
                                    <div className="px-3 py-2 text-sm text-green-600 border-l border-border">
                                        High
                                    </div>
                                    <div className="px-3 py-2 text-sm text-red-600 border-l border-border">
                                        Low
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 border-b border-border">
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        Trustless
                                    </div>
                                    <div className="px-3 py-2 text-sm text-red-600 border-l border-border">
                                        No
                                    </div>
                                    <div className="px-3 py-2 text-sm text-green-600 border-l border-border">
                                        Yes
                                    </div>
                                    <div className="px-3 py-2 text-sm text-red-600 border-l border-border">
                                        No
                                    </div>
                                </div>
                                <div className="grid grid-cols-4">
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        Censorship resistant
                                    </div>
                                    <div className="px-3 py-2 text-sm text-red-600 border-l border-border">
                                        No
                                    </div>
                                    <div className="px-3 py-2 text-sm text-green-600 border-l border-border">
                                        Yes
                                    </div>
                                    <div className="px-3 py-2 text-sm text-red-600 border-l border-border">
                                        No
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Future Extensions */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                future extensions
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                zkTLS can verify almost any web content:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="border border-border px-4 py-3 bg-background">
                                    <p className="font-medium text-foreground">Email</p>
                                    <p className="text-sm text-muted-foreground">
                                        Prove you received email from a domain
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-background">
                                    <p className="font-medium text-foreground">Banking</p>
                                    <p className="text-sm text-muted-foreground">
                                        Prove account balances privately
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-background">
                                    <p className="font-medium text-foreground">Employment</p>
                                    <p className="text-sm text-muted-foreground">
                                        Prove you work somewhere
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-background">
                                    <p className="font-medium text-foreground">Any HTTPS site</p>
                                    <p className="text-sm text-muted-foreground">
                                        Prove any web interaction
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                Sigil is building the infrastructure to bring these verifications
                                onchain.
                            </p>
                        </section>

                        {/* CTA */}
                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                try it yourself
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Ready to verify your X account trustlessly?
                            </p>
                            <Link
                                href="/verify"
                                className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                            >
                                Start Verification
                                <ArrowLeft className="size-4 rotate-180" />
                            </Link>
                        </section>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="px-6 py-6 lg:px-12 bg-lavender/30 flex items-center justify-between">
                    <Link
                        href="/blog/governance-deep-dive"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Prev: Governance Deep Dive
                    </Link>
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        All Posts
                        <ArrowLeft className="size-4 rotate-180" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
