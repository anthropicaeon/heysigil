import Image from "next/image";
import Link from "next/link";

export default function IntroducingSigilPage() {
    return (
        <article className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                        Announcement
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4">
                        Introducing Sigil - The Verification Layer for the Agentic Economy
                    </h1>
                    <p className="text-muted-foreground max-w-3xl mb-6">
                        Today we&apos;re launching Sigil, the verification infrastructure that
                        connects builders to sustainable funding through multi-channel identity
                        verification and milestone-based governance.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>Sigil Team</span>
                        <span>Feb 15, 2026</span>
                        <span>5-7 min read</span>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="border-border border-b aspect-video relative">
                    <Image
                        src="/images/blog/introducing-sigil.jpg"
                        alt="Introducing Sigil"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="px-6 py-12 lg:px-12 lg:py-16 max-w-3xl">
                    <div className="prose prose-lg prose-neutral dark:prose-invert">
                        <h2>Why Sigil?</h2>
                        <p>
                            The crypto ecosystem has a trust problem. Legitimate builders struggle
                            to differentiate themselves from bad actors, while communities have no
                            reliable way to verify who they&apos;re funding.
                        </p>
                        <p>
                            <strong>The current state:</strong>
                        </p>
                        <ul>
                            <li>Project founders are anonymous by default</li>
                            <li>Funding flows to marketing, not building</li>
                            <li>Token launches lack accountability mechanisms</li>
                            <li>Communities have no recourse when projects fail</li>
                        </ul>

                        <h2>The Solution: Verification Infrastructure</h2>
                        <p>
                            Sigil creates a trust layer that connects verified identity to onchain
                            activity:
                        </p>

                        <h3>Multi-Channel Verification</h3>
                        <p>Builders verify across 5 independent channels:</p>
                        <ul>
                            <li>
                                <strong>GitHub</strong> - Prove your code contributions
                            </li>
                            <li>
                                <strong>X (Twitter)</strong> - Verify your social presence via zkTLS
                            </li>
                            <li>
                                <strong>Facebook</strong> - Connect your real identity
                            </li>
                            <li>
                                <strong>Instagram</strong> - Link your creative work
                            </li>
                            <li>
                                <strong>Domain</strong> - Prove you control your project&apos;s
                                website
                            </li>
                        </ul>

                        <h3>Onchain Attestations</h3>
                        <p>
                            Every verification creates a permanent, queryable attestation via EAS on
                            Base. Anyone can verify a builder&apos;s credentials without trusting
                            us.
                        </p>

                        <h3>USDC Fee Routing</h3>
                        <p>
                            A portion of protocol fees routes directly to verified builders. No
                            grants, no applications—just build and earn.
                        </p>

                        <h3>Milestone Governance</h3>
                        <p>
                            Community token holders vote on milestone completion. Funds unlock
                            progressively as builders deliver.
                        </p>

                        <h2>How It Works</h2>
                        <ol>
                            <li>
                                <strong>Connect</strong> your wallet
                            </li>
                            <li>
                                <strong>Verify</strong> across multiple channels (free, pay only
                                gas)
                            </li>
                            <li>
                                <strong>Receive</strong> your onchain attestation
                            </li>
                            <li>
                                <strong>Earn</strong> USDC fees as you build
                            </li>
                        </ol>

                        <h2>Why Base?</h2>
                        <p>We built on Base for several reasons:</p>
                        <ul>
                            <li>Low gas costs make verification accessible</li>
                            <li>EAS integration for standardized attestations</li>
                            <li>Strong builder community</li>
                            <li>Enterprise-grade infrastructure</li>
                        </ul>

                        <h2>What&apos;s Next</h2>
                        <p>Over the coming weeks we&apos;ll be:</p>
                        <ul>
                            <li>Onboarding launch partners</li>
                            <li>Opening governance for early participants</li>
                            <li>Publishing our audit report</li>
                            <li>Expanding verification channels</li>
                        </ul>

                        <h2>Join Us</h2>
                        <p>
                            Whether you&apos;re a builder looking for sustainable funding or a
                            community seeking accountability, Sigil is built for you.
                        </p>
                        <p>
                            <Link href="/verify" className="text-primary font-medium">
                                Start Verification →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
