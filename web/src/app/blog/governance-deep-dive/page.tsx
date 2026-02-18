import Image from "next/image";
import Link from "next/link";

export default function GovernanceDeepDivePage() {
    return (
        <article className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                        Governance
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4">
                        Milestone Governance - How Community Validation Works
                    </h1>
                    <p className="text-muted-foreground max-w-3xl mb-6">
                        Deep dive into Sigil&apos;s milestone governance system, where community
                        token holders validate builder progress and control fund unlocks through
                        transparent onchain voting.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>Sigil Team</span>
                        <span>Feb 5, 2026</span>
                        <span>7-9 min read</span>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="border-border border-b aspect-video relative">
                    <Image
                        src="/images/blog/governance-deep-dive.jpg"
                        alt="Governance Deep Dive"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="px-6 py-12 lg:px-12 lg:py-16 max-w-3xl">
                    <div className="prose prose-lg prose-neutral dark:prose-invert">
                        <h2>The Problem with Traditional Funding</h2>
                        <p>
                            Most crypto funding is binary: you either get funded upfront (risky) or
                            don&apos;t get funded at all (limiting). This creates:
                        </p>
                        <ul>
                            <li>
                                <strong>For communities:</strong> No accountability after tokens
                                launch
                            </li>
                            <li>
                                <strong>For builders:</strong> Pressure to over-promise to secure
                                funding
                            </li>
                            <li>
                                <strong>For everyone:</strong> Misaligned incentives
                            </li>
                        </ul>

                        <h2>Sigil&apos;s Approach: Progressive Unlocks</h2>
                        <p>
                            Instead of all-or-nothing funding, Sigil enables milestone-based token
                            unlocks validated by community governance.
                        </p>

                        <h3>How It Works</h3>
                        <ol>
                            <li>
                                <strong>Lock Tokens</strong> - Projects lock LP tokens or native
                                tokens in Sigil&apos;s vault
                            </li>
                            <li>
                                <strong>Define Milestones</strong> - Set clear, measurable
                                deliverables
                            </li>
                            <li>
                                <strong>Build & Deliver</strong> - Complete milestones and submit
                                for review
                            </li>
                            <li>
                                <strong>Community Vote</strong> - Token holders validate completion
                            </li>
                            <li>
                                <strong>Unlock Funds</strong> - Approved milestones release locked
                                tokens
                            </li>
                        </ol>

                        <h2>Governance Mechanics</h2>

                        <h3>Proposal Types</h3>
                        <p>
                            <strong>Milestone Proposals</strong>
                        </p>
                        <ul>
                            <li>Builder submits evidence of completion</li>
                            <li>Community votes to approve or reject</li>
                            <li>Passing unlocks associated tokens</li>
                        </ul>
                        <p>
                            <strong>Parameter Proposals</strong>
                        </p>
                        <ul>
                            <li>Modify fee percentages</li>
                            <li>Adjust voting thresholds</li>
                            <li>Update protocol settings</li>
                        </ul>

                        <h3>Voting Power</h3>
                        <p>Your voting power is determined by:</p>
                        <ul>
                            <li>Verification score (1-5x multiplier)</li>
                            <li>Token holdings</li>
                            <li>Historical participation</li>
                        </ul>
                        <p>Higher verification scores mean more governance influence.</p>

                        <h3>Thresholds</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Quorum</td>
                                    <td>10% of circulating supply</td>
                                </tr>
                                <tr>
                                    <td>Pass threshold</td>
                                    <td>51% approval</td>
                                </tr>
                                <tr>
                                    <td>Voting period</td>
                                    <td>7 days</td>
                                </tr>
                                <tr>
                                    <td>Execution delay</td>
                                    <td>24 hours</td>
                                </tr>
                            </tbody>
                        </table>

                        <h2>For Builders</h2>

                        <h3>Creating Milestones</h3>
                        <p>Good milestones are:</p>
                        <ul>
                            <li>
                                <strong>Specific</strong> - &quot;Deploy mainnet contract&quot; not
                                &quot;make progress&quot;
                            </li>
                            <li>
                                <strong>Measurable</strong> - Include quantifiable criteria
                            </li>
                            <li>
                                <strong>Achievable</strong> - Realistic within the timeframe
                            </li>
                            <li>
                                <strong>Relevant</strong> - Directly serves token holders
                            </li>
                            <li>
                                <strong>Time-bound</strong> - Clear deadlines
                            </li>
                        </ul>

                        <h3>Submitting for Review</h3>
                        <ol>
                            <li>Navigate to Governance dashboard</li>
                            <li>Click &quot;Submit Milestone&quot;</li>
                            <li>Provide evidence links and description</li>
                            <li>Pay gas to create proposal</li>
                            <li>Engage with community during voting</li>
                        </ol>

                        <h2>For Communities</h2>

                        <h3>Evaluating Proposals</h3>
                        <p>Before voting, verify:</p>
                        <ul>
                            <li>Evidence links are accessible</li>
                            <li>Claims match actual deliverables</li>
                            <li>Quality meets expectations</li>
                            <li>Timeline was reasonable</li>
                        </ul>

                        <h3>Voting</h3>
                        <ol>
                            <li>Connect verified wallet</li>
                            <li>Navigate to active proposals</li>
                            <li>Review evidence and discussion</li>
                            <li>Cast your vote (Approve/Reject)</li>
                            <li>Change vote anytime before deadline</li>
                        </ol>

                        <h3>Delegation</h3>
                        <p>
                            Don&apos;t have time to vote? Delegate your voting power to trusted
                            community members who actively participate.
                        </p>

                        <h2>Why This Matters</h2>
                        <p>Milestone governance creates:</p>
                        <ul>
                            <li>
                                <strong>Accountability</strong> - Builders must deliver to earn
                            </li>
                            <li>
                                <strong>Transparency</strong> - Everything happens onchain
                            </li>
                            <li>
                                <strong>Alignment</strong> - Success requires community approval
                            </li>
                            <li>
                                <strong>Sustainability</strong> - Progressive unlocks reduce rug
                                risk
                            </li>
                        </ul>

                        <h2>Getting Started</h2>
                        <p>
                            <strong>For Builders:</strong>{" "}
                            <Link href="/verify" className="text-primary font-medium">
                                Lock tokens and create milestones →
                            </Link>
                        </p>
                        <p>
                            <strong>For Community:</strong>{" "}
                            <Link href="/governance" className="text-primary font-medium">
                                Participate in governance →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
