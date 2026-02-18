import { ArrowLeft, Calendar, CheckCircle, Clock, Lock, Shield, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function UnderstandingZkTLSPage() {
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
                                Technical Deep Dive
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                                how zktls powers trustless social verification
                            </h1>
                            <p className="text-muted-foreground">
                                Understanding the cryptographic magic behind Sigil&apos;s X (Twitter)
                                verification—how zkTLS proves you own an account without OAuth, APIs, or
                                trusting anyone.
                            </p>
                        </div>
                        <div className="lg:w-1/3 flex flex-col">
                            <div className="flex-1 px-6 py-6 lg:px-8 border-border border-b flex items-center gap-3">
                                <User className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Sigil Team</span>
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 border-border border-b flex items-center gap-3">
                                <Calendar className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Jan 28, 2026</span>
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 flex items-center gap-3">
                                <Clock className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">10-12 min read</span>
                            </div>
                        </div>
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

                {/* Section: The OAuth Problem */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-4 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-rose/20">
                            <h2 className="text-lg font-semibold text-foreground lowercase">
                                the oauth problem
                            </h2>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-12 border-border border-b">
                            <p className="text-muted-foreground">
                                Traditional social verification relies on OAuth. Here&apos;s the typical flow:
                            </p>
                        </div>
                    </div>
                </div>

                {/* OAuth Flow Steps */}
                <div className="border-border border-b divide-y divide-border bg-background">
                    {[
                        "User clicks \"Connect with X\"",
                        "X redirects to authorization page",
                        "User approves access",
                        "X sends access token to verifier",
                        "Verifier calls X API to confirm identity",
                    ].map((step, i) => (
                        <div key={step} className="px-6 py-3 lg:px-12 flex items-center gap-3">
                            <span className="size-6 bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">
                                {i + 1}
                            </span>
                            <span className="text-sm text-muted-foreground">{step}</span>
                        </div>
                    ))}
                </div>

                {/* Problems Grid */}
                <div className="bg-rose/10">
                    <div className="px-6 py-2 lg:px-12 border-border border-b bg-rose/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            The Problems
                        </span>
                    </div>
                </div>
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-4 lg:px-8 bg-rose/10 flex items-start gap-2">
                        <X className="size-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">Requires X&apos;s cooperation (they can revoke)</span>
                    </div>
                    <div className="px-6 py-4 lg:px-8 bg-rose/10 flex items-start gap-2">
                        <X className="size-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">API rate limits and costs</span>
                    </div>
                </div>
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-4 lg:px-8 bg-rose/10 flex items-start gap-2">
                        <X className="size-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">Trust in verifier&apos;s API handling</span>
                    </div>
                    <div className="px-6 py-4 lg:px-8 bg-rose/10 flex items-start gap-2">
                        <X className="size-4 text-destructive shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">X knows who&apos;s verifying</span>
                    </div>
                </div>

                {/* Section: Enter zkTLS */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            enter zktls
                        </h2>
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-sage/10">
                        <p className="text-muted-foreground">
                            <strong className="text-foreground">zkTLS</strong> (Zero-Knowledge TLS) allows you to prove facts about HTTPS
                            responses without revealing the full response or requiring any cooperation from the server.
                        </p>
                    </div>
                </div>

                {/* How TLS Works */}
                <div className="bg-background">
                    <div className="px-6 py-2 lg:px-12 border-border border-b bg-lavender/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            How TLS Works
                        </span>
                    </div>
                </div>
                <div className="border-border border-b divide-y divide-border bg-background">
                    <div className="px-6 py-4 lg:px-12">
                        <p className="font-medium text-foreground">1. Handshake</p>
                        <p className="text-sm text-muted-foreground">Client and server establish encrypted channel</p>
                    </div>
                    <div className="px-6 py-4 lg:px-12">
                        <p className="font-medium text-foreground">2. Data Exchange</p>
                        <p className="text-sm text-muted-foreground">Encrypted request/response</p>
                    </div>
                    <div className="px-6 py-4 lg:px-12">
                        <p className="font-medium text-foreground">3. Verification</p>
                        <p className="text-sm text-muted-foreground">Both parties can verify authenticity</p>
                    </div>
                </div>

                <div className="border-border border-b px-6 py-4 lg:px-12 bg-lavender/10">
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Key insight:</strong> TLS responses are cryptographically signed. If we can prove a
                        signature is valid without revealing the full content, we can verify claims trustlessly.
                    </p>
                </div>

                {/* Section: The zkTLS Flow */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            the zktls flow
                        </h2>
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-background">
                        <p className="text-muted-foreground">
                            When you verify X with Sigil:
                        </p>
                    </div>
                </div>

                {/* zkTLS Steps */}
                <div className="border-border border-b divide-y divide-border bg-background">
                    <div className="flex items-start gap-4 px-6 py-4 lg:px-12">
                        <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
                        <div>
                            <p className="font-medium text-foreground">Visit your X profile</p>
                            <p className="text-sm text-muted-foreground">In your browser, as normal</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 px-6 py-4 lg:px-12">
                        <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
                        <div>
                            <p className="font-medium text-foreground">Extension captures TLS session</p>
                            <p className="text-sm text-muted-foreground">Session data securely recorded</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 px-6 py-4 lg:px-12">
                        <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</div>
                        <div>
                            <p className="font-medium text-foreground">Zero-knowledge proof generated</p>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="size-3 text-primary" />
                                    Valid TLS response from x.com
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="size-3 text-primary" />
                                    Response contained your profile
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="size-3 text-primary" />
                                    Your handle is what you claim
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 px-6 py-4 lg:px-12">
                        <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">4</div>
                        <div>
                            <p className="font-medium text-foreground">Proof submitted</p>
                            <p className="text-sm text-muted-foreground">Without revealing full response</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 px-6 py-4 lg:px-12">
                        <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">5</div>
                        <div>
                            <p className="font-medium text-foreground">Verifier validates proof</p>
                            <p className="text-sm text-muted-foreground">Cryptographically verified onchain</p>
                        </div>
                    </div>
                </div>

                {/* Section: What This Enables */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            what this enables
                        </h2>
                    </div>
                </div>
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-6 lg:px-8 bg-sage/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="size-5 text-primary" />
                            <h3 className="font-medium text-foreground">No OAuth Required</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            X doesn&apos;t need to approve anything. Proof comes from their existing TLS responses.
                        </p>
                    </div>
                    <div className="px-6 py-6 lg:px-8 bg-sage/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="size-5 text-primary" />
                            <h3 className="font-medium text-foreground">True Privacy</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            We only see specific claims you prove (handle), not full profile, DMs, or activity.
                        </p>
                    </div>
                </div>
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-6 lg:px-8 bg-lavender/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="size-5 text-primary" />
                            <h3 className="font-medium text-foreground">Censorship Resistant</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            X cannot selectively deny verification to users they don&apos;t like.
                        </p>
                    </div>
                    <div className="px-6 py-6 lg:px-8 bg-lavender/10">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="size-5 text-primary" />
                            <h3 className="font-medium text-foreground">No API Dependencies</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            No rate limits, costs, or access tokens to manage.
                        </p>
                    </div>
                </div>

                {/* Section: Proof Properties */}
                <div className="bg-lavender/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            proof properties (zk-snarks)
                        </h2>
                    </div>
                </div>
                <div className="border-border border-b divide-y divide-border bg-background">
                    <div className="px-6 py-4 lg:px-12 flex items-start gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">Succinct</p>
                            <p className="text-sm text-muted-foreground">Small constant size regardless of data</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 lg:px-12 flex items-start gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">Non-interactive</p>
                            <p className="text-sm text-muted-foreground">No back-and-forth required</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 lg:px-12 flex items-start gap-3">
                        <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">Zero-knowledge</p>
                            <p className="text-sm text-muted-foreground">Only proves what you choose to reveal</p>
                        </div>
                    </div>
                </div>

                {/* Section: Comparison Table */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            comparison to alternatives
                        </h2>
                    </div>
                </div>
                <div className="border-border border-b bg-background overflow-x-auto">
                    <div className="grid grid-cols-4 bg-sage/20 border-b border-border">
                        <div className="px-4 py-2 text-sm font-medium text-foreground">Method</div>
                        <div className="px-4 py-2 text-sm font-medium text-foreground border-l border-border">OAuth</div>
                        <div className="px-4 py-2 text-sm font-medium text-foreground border-l border-border">zkTLS</div>
                        <div className="px-4 py-2 text-sm font-medium text-foreground border-l border-border">Screenshot</div>
                    </div>
                    {[
                        { metric: "X cooperation", oauth: "Required", zktls: "No", screenshot: "No", oauthColor: "text-destructive", zktlsColor: "text-primary", screenshotColor: "text-primary" },
                        { metric: "Privacy", oauth: "Moderate", zktls: "High", screenshot: "Low", oauthColor: "text-yellow-600", zktlsColor: "text-primary", screenshotColor: "text-destructive" },
                        { metric: "Trustless", oauth: "No", zktls: "Yes", screenshot: "No", oauthColor: "text-destructive", zktlsColor: "text-primary", screenshotColor: "text-destructive" },
                        { metric: "Censorship resistant", oauth: "No", zktls: "Yes", screenshot: "No", oauthColor: "text-destructive", zktlsColor: "text-primary", screenshotColor: "text-destructive" },
                    ].map((row, i, arr) => (
                        <div key={row.metric} className={`grid grid-cols-4 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                            <div className="px-4 py-2 text-sm text-muted-foreground">{row.metric}</div>
                            <div className={`px-4 py-2 text-sm border-l border-border ${row.oauthColor}`}>{row.oauth}</div>
                            <div className={`px-4 py-2 text-sm border-l border-border ${row.zktlsColor}`}>{row.zktls}</div>
                            <div className={`px-4 py-2 text-sm border-l border-border ${row.screenshotColor}`}>{row.screenshot}</div>
                        </div>
                    ))}
                </div>

                {/* Section: Future Extensions */}
                <div className="bg-lavender/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            future extensions
                        </h2>
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-background">
                        <p className="text-muted-foreground">
                            zkTLS can verify almost any web content:
                        </p>
                    </div>
                </div>
                <div className="border-border border-b grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    {[
                        { title: "Email", desc: "Prove you received email from a domain" },
                        { title: "Banking", desc: "Prove account balances privately" },
                        { title: "Employment", desc: "Prove you work somewhere" },
                        { title: "Any HTTPS site", desc: "Prove any web interaction" },
                    ].map((item) => (
                        <div key={item.title} className="px-6 py-4 lg:px-6 bg-lavender/10">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA - fills remaining space */}
                <div className="flex-1 flex flex-col lg:flex-row border-border border-t">
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-sage/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Try It Yourself
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                            verify your x account
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Ready to verify your X account trustlessly? Start now and get your onchain attestation.
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
                                href="/blog/governance-deep-dive"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="size-4" />
                                Prev: Governance Deep Dive
                            </Link>
                            <Link
                                href="/blog"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                All Posts
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
