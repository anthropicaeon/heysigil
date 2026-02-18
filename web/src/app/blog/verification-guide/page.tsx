import Image from "next/image";
import Link from "next/link";

export default function VerificationGuidePage() {
    return (
        <article className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                        Guide
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4">
                        Complete Guide to Multi-Channel Verification
                    </h1>
                    <p className="text-muted-foreground max-w-3xl mb-6">
                        A step-by-step walkthrough of verifying your identity across all 5 Sigil
                        channels, earning your onchain attestation, and maximizing your verification
                        score.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>Sigil Team</span>
                        <span>Feb 10, 2026</span>
                        <span>8-10 min read</span>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="border-border border-b aspect-video relative">
                    <Image
                        src="/images/blog/verification-guide.jpg"
                        alt="Verification Guide"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="px-6 py-12 lg:px-12 lg:py-16 max-w-3xl">
                    <div className="prose prose-lg prose-neutral dark:prose-invert">
                        <h2>Understanding Verification Score</h2>
                        <p>
                            Your verification score (1-5) represents the number of channels
                            you&apos;ve successfully verified. Higher scores unlock:
                        </p>
                        <ul>
                            <li>Greater fee routing allocations</li>
                            <li>More governance weight</li>
                            <li>Priority access to new features</li>
                            <li>Enhanced credibility with communities</li>
                        </ul>

                        <h2>Channel 1: GitHub Verification</h2>
                        <p>
                            <strong>What it proves:</strong> Your code contributions and developer
                            identity
                        </p>
                        <p>
                            <strong>How it works:</strong>
                        </p>
                        <ol>
                            <li>Click &quot;Verify GitHub&quot; on the verification page</li>
                            <li>Authorize Sigil&apos;s OAuth app (read-only access)</li>
                            <li>We verify account ownership and extract your username</li>
                            <li>Attestation is created with your verified GitHub handle</li>
                        </ol>
                        <p>
                            <strong>Tips:</strong>
                        </p>
                        <ul>
                            <li>Use your primary development account</li>
                            <li>Account age and contributions are visible onchain</li>
                            <li>You can unlink OAuth access after verification</li>
                        </ul>

                        <h2>Channel 2: X (Twitter) Verification via zkTLS</h2>
                        <p>
                            <strong>What it proves:</strong> Your social presence without OAuth
                        </p>
                        <p>
                            <strong>How it works:</strong>
                        </p>
                        <ol>
                            <li>Click &quot;Verify X&quot;</li>
                            <li>Install the browser extension (one-time)</li>
                            <li>Navigate to your X profile</li>
                            <li>Extension generates a zkTLS proof of your handle</li>
                            <li>Proof is verified and attestation created</li>
                        </ol>
                        <p>
                            <strong>Why zkTLS?</strong>
                        </p>
                        <ul>
                            <li>No OAuth required—X doesn&apos;t need to approve us</li>
                            <li>Cryptographic proof of your actual profile</li>
                            <li>Privacy-preserving: we only see what you choose to prove</li>
                        </ul>

                        <h2>Channel 3: Facebook Verification</h2>
                        <p>
                            <strong>What it proves:</strong> Your real-world identity
                        </p>
                        <p>
                            <strong>How it works:</strong>
                        </p>
                        <ol>
                            <li>Click &quot;Verify Facebook&quot;</li>
                            <li>Log in via Facebook OAuth</li>
                            <li>We verify account ownership (read-only)</li>
                            <li>Attestation links your wallet to your Facebook identity</li>
                        </ol>
                        <p>
                            <strong>Privacy note:</strong>
                        </p>
                        <ul>
                            <li>We don&apos;t store or post to your Facebook</li>
                            <li>Only profile ownership is verified</li>
                            <li>You control what&apos;s public via Facebook settings</li>
                        </ul>

                        <h2>Channel 4: Instagram Verification</h2>
                        <p>
                            <strong>What it proves:</strong> Your creative and professional work
                        </p>
                        <p>
                            <strong>How it works:</strong>
                        </p>
                        <ol>
                            <li>Click &quot;Verify Instagram&quot;</li>
                            <li>Connect via Instagram OAuth</li>
                            <li>Account ownership is verified</li>
                            <li>Attestation includes your Instagram handle</li>
                        </ol>
                        <p>
                            <strong>Best for:</strong>
                        </p>
                        <ul>
                            <li>Creators with established audiences</li>
                            <li>Projects with visual portfolios</li>
                            <li>Influencers and content creators</li>
                        </ul>

                        <h2>Channel 5: Domain Verification</h2>
                        <p>
                            <strong>What it proves:</strong> You control your project&apos;s web
                            presence
                        </p>
                        <p>
                            <strong>How it works:</strong>
                        </p>
                        <ol>
                            <li>Enter your domain (e.g., myproject.com)</li>
                            <li>Add a DNS TXT record with your wallet address</li>
                            <li>We verify the record exists</li>
                            <li>Attestation links your wallet to the domain</li>
                        </ol>
                        <p>
                            <strong>Example DNS record:</strong>
                        </p>
                        <pre>
                            <code>sigil-verify=0x1234...abcd</code>
                        </pre>
                        <p>
                            <strong>Verification time:</strong> Usually instant, up to 24 hours for
                            DNS propagation
                        </p>

                        <h2>After Verification</h2>
                        <p>Once verified, your attestation is:</p>
                        <ul>
                            <li>
                                <strong>Permanent</strong> - Stored onchain via EAS on Base
                            </li>
                            <li>
                                <strong>Queryable</strong> - Anyone can verify your credentials
                            </li>
                            <li>
                                <strong>Composable</strong> - Other protocols can integrate your
                                verification
                            </li>
                        </ul>

                        <h2>Common Questions</h2>
                        <p>
                            <strong>Can I update my verification?</strong>
                            <br />
                            Yes, you can re-verify channels if your accounts change. New
                            attestations are created; old ones remain for history.
                        </p>
                        <p>
                            <strong>What if I don&apos;t have all 5 channels?</strong>
                            <br />
                            Verify what you have. Even 2-3 channels significantly increases your
                            credibility and fee allocation.
                        </p>
                        <p>
                            <strong>Is verification free?</strong>
                            <br />
                            Yes—you only pay network gas fees on Base (typically under $0.01).
                        </p>
                        <p>
                            <strong>Can I verify multiple wallets?</strong>
                            <br />
                            Each wallet verifies independently. We recommend verifying your primary
                            address.
                        </p>

                        <hr />
                        <p>
                            Ready to get started?{" "}
                            <Link href="/verify" className="text-primary font-medium">
                                Begin Verification →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
