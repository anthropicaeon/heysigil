import Image from "next/image";
import Link from "next/link";

export default function UnderstandingZkTLSPage() {
    return (
        <article className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                        Technical Deep Dive
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4">
                        How zkTLS Powers Trustless Social Verification
                    </h1>
                    <p className="text-muted-foreground max-w-3xl mb-6">
                        Understanding the cryptographic magic behind Sigil&apos;s X (Twitter)
                        verification—how zkTLS proves you own an account without OAuth, APIs, or
                        trusting anyone.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>Sigil Team</span>
                        <span>Jan 28, 2026</span>
                        <span>10-12 min read</span>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="border-border border-b aspect-video relative">
                    <Image
                        src="/images/blog/understanding-zktls.jpg"
                        alt="Understanding zkTLS"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="px-6 py-12 lg:px-12 lg:py-16 max-w-3xl">
                    <div className="prose prose-lg prose-neutral dark:prose-invert">
                        <h2>The OAuth Problem</h2>
                        <p>Traditional social verification relies on OAuth:</p>
                        <ol>
                            <li>User clicks &quot;Connect with X&quot;</li>
                            <li>X redirects to authorization page</li>
                            <li>User approves access</li>
                            <li>X sends access token to verifier</li>
                            <li>Verifier calls X API to confirm identity</li>
                        </ol>
                        <p>
                            <strong>The problems:</strong>
                        </p>
                        <ul>
                            <li>Requires X&apos;s cooperation (they can revoke access)</li>
                            <li>API rate limits and costs</li>
                            <li>Trust in the verifier&apos;s API handling</li>
                            <li>X knows who&apos;s verifying</li>
                        </ul>

                        <h2>Enter zkTLS</h2>
                        <p>
                            zkTLS (Zero-Knowledge TLS) allows you to prove facts about HTTPS
                            responses without revealing the full response or requiring any
                            cooperation from the server.
                        </p>

                        <h3>How TLS Works</h3>
                        <p>Every HTTPS connection involves:</p>
                        <ol>
                            <li>
                                <strong>Handshake</strong> - Client and server establish encrypted
                                channel
                            </li>
                            <li>
                                <strong>Data exchange</strong> - Encrypted request/response
                            </li>
                            <li>
                                <strong>Verification</strong> - Both parties can verify authenticity
                            </li>
                        </ol>
                        <p>
                            The key insight: TLS responses are cryptographically signed. If we can
                            prove a signature is valid without revealing the full content, we can
                            verify claims trustlessly.
                        </p>

                        <h3>The zkTLS Flow</h3>
                        <p>When you verify X with Sigil:</p>
                        <ol>
                            <li>
                                <strong>You visit your X profile</strong> (in your browser)
                            </li>
                            <li>
                                <strong>Extension captures TLS session</strong> data
                            </li>
                            <li>
                                <strong>Zero-knowledge proof generated</strong> that:
                                <ul>
                                    <li>You received valid TLS response from x.com</li>
                                    <li>Response contained your profile data</li>
                                    <li>Your handle is exactly what you claim</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Proof submitted</strong> without revealing full response
                            </li>
                            <li>
                                <strong>Verifier validates</strong> proof cryptographically
                            </li>
                        </ol>

                        <h2>What This Enables</h2>

                        <h3>No OAuth Required</h3>
                        <p>
                            X doesn&apos;t need to approve anything. The proof comes from their
                            existing TLS responses.
                        </p>

                        <h3>True Privacy</h3>
                        <p>
                            We only see the specific claims you prove (your handle), not your full
                            profile, DMs, or activity.
                        </p>

                        <h3>Censorship Resistance</h3>
                        <p>X cannot selectively deny verification to users they don&apos;t like.</p>

                        <h3>No API Dependencies</h3>
                        <p>
                            We&apos;re not calling X&apos;s API, so there are no rate limits, costs,
                            or access tokens to manage.
                        </p>

                        <h2>Technical Deep Dive</h2>

                        <h3>Notarization</h3>
                        <p>The browser extension acts as a TLS &quot;notarizer&quot;:</p>
                        <pre>
                            <code>
                                {`Client                    Extension                    Server (x.com)
   │                          │                              │
   │─── Request profile ──────┼─────────────────────────────▶│
   │                          │                              │
   │◀── TLS Response ─────────┼──────────────────────────────│
   │                          │                              │
   │   [Extension captures    │                              │
   │    session keys and      │                              │
   │    response transcript]  │                              │`}
                            </code>
                        </pre>

                        <h3>Proof Generation</h3>
                        <p>The captured data allows generating a proof that:</p>
                        <ol>
                            <li>The TLS handshake was valid (server authenticated)</li>
                            <li>The response came from x.com (domain verified)</li>
                            <li>The response body contains your handle (selective disclosure)</li>
                        </ol>
                        <p>Using zk-SNARKs, this proof is:</p>
                        <ul>
                            <li>
                                <strong>Succinct</strong> - Small constant size regardless of data
                            </li>
                            <li>
                                <strong>Non-interactive</strong> - No back-and-forth required
                            </li>
                            <li>
                                <strong>Zero-knowledge</strong> - Only proves what you choose
                            </li>
                        </ul>

                        <h3>Verification</h3>
                        <p>The onchain verifier checks:</p>
                        <ul>
                            <li>Proof structure is valid</li>
                            <li>Public inputs match claimed handle</li>
                            <li>Proof cryptographically verifies</li>
                        </ul>
                        <p>If all checks pass, the attestation is created.</p>

                        <h2>Security Considerations</h2>

                        <h3>What Could Go Wrong?</h3>
                        <p>
                            <strong>Browser compromise</strong>
                            <br />
                            If your browser is malicious, it could generate fake proofs. Solution:
                            Use a clean browser/device for verification.
                        </p>
                        <p>
                            <strong>Extension tampering</strong>
                            <br />
                            Malicious extensions could intercept data. Solution: Open-source
                            extension, reproducible builds.
                        </p>
                        <p>
                            <strong>Man-in-the-middle</strong>
                            <br />
                            Attackers intercepting TLS could forge responses. Solution: TLS prevents
                            this; that&apos;s why we verify TLS validity.
                        </p>

                        <h3>What We Don&apos;t Trust</h3>
                        <ul>
                            <li>
                                X&apos;s servers (we use their responses, not their cooperation)
                            </li>
                            <li>Our own backend (proofs are cryptographically verified)</li>
                            <li>Your browser vendor (proofs are publicly verifiable)</li>
                        </ul>

                        <h2>Comparison to Alternatives</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Method</th>
                                    <th>OAuth</th>
                                    <th>zkTLS</th>
                                    <th>Screenshot</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>X cooperation</td>
                                    <td>Required</td>
                                    <td>No</td>
                                    <td>No</td>
                                </tr>
                                <tr>
                                    <td>Privacy</td>
                                    <td>Moderate</td>
                                    <td>High</td>
                                    <td>Low</td>
                                </tr>
                                <tr>
                                    <td>Trustless</td>
                                    <td>No</td>
                                    <td>Yes</td>
                                    <td>No</td>
                                </tr>
                                <tr>
                                    <td>Censorship resistant</td>
                                    <td>No</td>
                                    <td>Yes</td>
                                    <td>No</td>
                                </tr>
                            </tbody>
                        </table>

                        <h2>Future Extensions</h2>
                        <p>zkTLS can verify almost any web content:</p>
                        <ul>
                            <li>
                                <strong>Email</strong> - Prove you received email from a domain
                            </li>
                            <li>
                                <strong>Banking</strong> - Prove account balances
                            </li>
                            <li>
                                <strong>Employment</strong> - Prove you work somewhere
                            </li>
                            <li>
                                <strong>Any HTTPS site</strong> - Prove any web interaction
                            </li>
                        </ul>
                        <p>
                            Sigil is building the infrastructure to bring these verifications
                            onchain.
                        </p>

                        <h2>Try It Yourself</h2>
                        <p>Ready to verify your X account trustlessly?</p>
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
