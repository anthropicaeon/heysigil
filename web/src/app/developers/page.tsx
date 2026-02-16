"use client";

import Link from "next/link";

export default function DevelopersPage() {
    return (
        <main>
            {/* ── Hero ── */}
            <section
                style={{
                    textAlign: "center",
                    padding: "var(--space-32) 0 var(--space-24)",
                    background:
                        "linear-gradient(180deg, var(--sage) 0%, var(--white) 100%)",
                }}
            >
                <div className="container">
                    <div className="hero-eyebrow">For Developers</div>
                    <h1
                        style={{
                            fontSize: "var(--text-6xl)",
                            fontWeight: 700,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.05,
                            maxWidth: 780,
                            margin: "0 auto var(--space-6)",
                        }}
                    >
                        You write code. We run the rest.
                    </h1>
                    <p
                        style={{
                            fontSize: "var(--text-xl)",
                            maxWidth: 560,
                            margin: "0 auto",
                            lineHeight: 1.55,
                            color: "var(--text-secondary)",
                        }}
                    >
                        Stamp your Sigil, earn USDC fees, and let our agents and
                        specialists manage the community you never wanted to run.
                    </p>
                    <div
                        className="hero-actions"
                        style={{ marginTop: "var(--space-10)" }}
                    >
                        <Link href="/verify">
                            <button className="btn-primary btn-lg">Stamp Your Sigil</button>
                        </Link>
                        <Link href="/chat">
                            <button className="btn-outline btn-lg">Talk to Sigil</button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── The problem you know ── */}
            <section className="section-lg">
                <div className="container" style={{ textAlign: "center" }}>
                    <p
                        style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 600,
                            color: "var(--purple)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "var(--space-4)",
                        }}
                    >
                        The problem you know
                    </p>
                    <h2
                        style={{
                            fontSize: "var(--text-3xl)",
                            letterSpacing: "-0.03em",
                            maxWidth: 640,
                            margin: "0 auto var(--space-6)",
                        }}
                    >
                        You got funded. Then you inherited a second job.
                    </h2>
                    <p
                        style={{
                            fontSize: "var(--text-lg)",
                            maxWidth: 600,
                            margin: "0 auto",
                            lineHeight: 1.65,
                        }}
                    >
                        Claim fees. Answer community questions. Moderate Discord. Post
                        updates. Manage expectations. Suddenly you are a community manager,
                        a marketer, and a token strategist. The code that earned the funding
                        sits untouched.
                    </p>
                </div>
            </section>

            {/* ── Three problems in detail ── */}
            <section className="section section-rose">
                <div className="container">
                    <div className="grid grid-3" style={{ textAlign: "left" }}>
                        <div style={{ padding: "var(--space-8) 0" }}>
                            <h3 style={{ marginBottom: "var(--space-3)" }}>
                                Verification that disappears
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                                When a platform depends on a single API, one policy change
                                erases your proof of ownership overnight. Sigil provides eight
                                independent verification methods. If one path closes, seven
                                remain.
                            </p>
                        </div>
                        <div style={{ padding: "var(--space-8) 0" }}>
                            <h3 style={{ marginBottom: "var(--space-3)" }}>
                                Launch and abandon
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                                Current platforms optimize for launch volume. More launches,
                                more fees. Once you claim, you are on your own. Sigil launches
                                your project and then connects you to a full support system.
                            </p>
                        </div>
                        <div style={{ padding: "var(--space-8) 0" }}>
                            <h3 style={{ marginBottom: "var(--space-3)" }}>
                                Roles you never signed up for
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                                A developer should not need to become a community manager, a
                                crypto strategist, or a marketing lead. These are distinct skill
                                sets. Sigil separates them cleanly. You build. We handle
                                everything else.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How Sigil works for you ── */}
            <section className="section-lg">
                <div className="container" style={{ textAlign: "center" }}>
                    <p
                        style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 600,
                            color: "var(--purple)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "var(--space-4)",
                        }}
                    >
                        How it works
                    </p>
                    <h2
                        style={{
                            fontSize: "var(--text-3xl)",
                            letterSpacing: "-0.03em",
                            marginBottom: "var(--space-12)",
                        }}
                    >
                        Three steps. Then back to building.
                    </h2>
                    <div className="grid grid-3">
                        <div
                            className="feature-card"
                            style={{
                                background: "var(--lavender)",
                                border: "none",
                                padding: "var(--space-10)",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "var(--text-sm)",
                                    fontWeight: 600,
                                    color: "var(--purple)",
                                    marginBottom: "var(--space-3)",
                                }}
                            >
                                01
                            </p>
                            <h3
                                style={{
                                    fontSize: "var(--text-2xl)",
                                    letterSpacing: "-0.02em",
                                    marginBottom: "var(--space-3)",
                                }}
                            >
                                Verify your project
                            </h3>
                            <p>
                                Connect your GitHub, domain, Twitter, Instagram, or any of
                                eight supported methods. Prove ownership on your terms, through
                                any path you choose.
                            </p>
                        </div>
                        <div
                            className="feature-card"
                            style={{
                                background: "var(--sage)",
                                border: "none",
                                padding: "var(--space-10)",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "var(--text-sm)",
                                    fontWeight: 600,
                                    color: "var(--success)",
                                    marginBottom: "var(--space-3)",
                                }}
                            >
                                02
                            </p>
                            <h3
                                style={{
                                    fontSize: "var(--text-2xl)",
                                    letterSpacing: "-0.02em",
                                    marginBottom: "var(--space-3)",
                                }}
                            >
                                Stamp your Sigil
                            </h3>
                            <p>
                                Your verification becomes an on-chain EAS attestation on Base.
                                Immutable proof of ownership. Your seal of approval on the
                                project your community funded.
                            </p>
                        </div>
                        <div
                            className="feature-card"
                            style={{
                                background: "var(--cream)",
                                border: "none",
                                padding: "var(--space-10)",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "var(--text-sm)",
                                    fontWeight: 600,
                                    color: "var(--warning)",
                                    marginBottom: "var(--space-3)",
                                }}
                            >
                                03
                            </p>
                            <h3
                                style={{
                                    fontSize: "var(--text-2xl)",
                                    letterSpacing: "-0.02em",
                                    marginBottom: "var(--space-3)",
                                }}
                            >
                                Earn and build
                            </h3>
                            <p>
                                USDC fees flow to you from LP activity. Our community
                                management agents handle engagement, moderation, and
                                communication. You stay in your codebase.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Support included ── */}
            <section className="section section-sage">
                <div className="container">
                    <div
                        style={{ textAlign: "center", marginBottom: "var(--space-12)" }}
                    >
                        <p
                            style={{
                                fontSize: "var(--text-sm)",
                                fontWeight: 600,
                                color: "var(--purple)",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: "var(--space-4)",
                            }}
                        >
                            Support included
                        </p>
                        <h2
                            style={{
                                fontSize: "var(--text-3xl)",
                                letterSpacing: "-0.03em",
                                maxWidth: 600,
                                margin: "0 auto",
                            }}
                        >
                            You build. We handle the rest.
                        </h2>
                    </div>
                    <div
                        className="grid grid-2"
                        style={{ maxWidth: 800, margin: "0 auto" }}
                    >
                        <div className="feature-card" style={{ background: "var(--white)" }}>
                            <h3 style={{ marginBottom: "var(--space-2)" }}>
                                Community management agents
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)" }}>
                                AI agents handle day-to-day community engagement, moderation,
                                and communication across your project channels. Active from the
                                moment you stamp.
                            </p>
                        </div>
                        <div className="feature-card" style={{ background: "var(--white)" }}>
                            <h3 style={{ marginBottom: "var(--space-2)" }}>
                                Human specialists
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)" }}>
                                For developers who want deeper support. Strategy, crisis
                                management, narrative development. Real people who understand
                                crypto communities.
                            </p>
                        </div>
                        <div className="feature-card" style={{ background: "var(--white)" }}>
                            <h3 style={{ marginBottom: "var(--space-2)" }}>
                                Crypto guidance
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)" }}>
                                Crypto can be overwhelming. We make the unfamiliar clear, the
                                technical accessible, and the transition manageable. You do not
                                need to become a crypto expert.
                            </p>
                        </div>
                        <div className="feature-card" style={{ background: "var(--white)" }}>
                            <h3 style={{ marginBottom: "var(--space-2)" }}>
                                Premium services flywheel
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)" }}>
                                Developers who opt into premium support share a small portion
                                of fees. These fees buy back SIGIL tokens, strengthening the
                                ecosystem that supports you.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Verification resilience ── */}
            <section className="section-lg">
                <div className="container" style={{ textAlign: "center" }}>
                    <div
                        className="divider divider-center"
                        style={{ marginBottom: "var(--space-8)" }}
                    />
                    <h2
                        style={{
                            fontSize: "var(--text-3xl)",
                            letterSpacing: "-0.03em",
                            maxWidth: 700,
                            margin: "0 auto var(--space-6)",
                        }}
                    >
                        Your stamp. Your proof. Your terms.
                    </h2>
                    <p
                        style={{
                            fontSize: "var(--text-lg)",
                            maxWidth: 560,
                            margin: "0 auto var(--space-8)",
                            lineHeight: 1.65,
                        }}
                    >
                        Eight independent verification methods. No dependence on any single
                        platform. If one goes down, seven remain. Your proof of ownership
                        lives on-chain and cannot be revoked.
                    </p>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            gap: "var(--space-3)",
                            maxWidth: 600,
                            margin: "0 auto",
                        }}
                    >
                        {[
                            "GitHub OAuth",
                            "Domain DNS",
                            "File Verification",
                            "Meta Tags",
                            "Twitter + zkTLS",
                            "Instagram",
                            "Facebook",
                            "Well-Known File",
                        ].map((method) => (
                            <span
                                key={method}
                                style={{
                                    padding: "var(--space-2) var(--space-4)",
                                    background: "var(--lavender)",
                                    borderRadius: "var(--radius-full)",
                                    fontSize: "var(--text-sm)",
                                    color: "var(--purple)",
                                    fontWeight: 500,
                                }}
                            >
                                {method}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stamp Sprint CTA ── */}
            <section
                className="cta-section"
                style={{
                    background: "var(--purple)",
                    color: "white",
                    padding: "var(--space-32) 0",
                }}
            >
                <div className="container">
                    <p
                        style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.5)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "var(--space-4)",
                        }}
                    >
                        Stamp Sprint
                    </p>
                    <h2
                        style={{
                            color: "white",
                            fontSize: "var(--text-4xl)",
                            letterSpacing: "-0.03em",
                            marginBottom: "var(--space-4)",
                        }}
                    >
                        Verified, deployed, and supported in 48 hours.
                    </h2>
                    <p
                        style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: "var(--text-xl)",
                            maxWidth: 480,
                            margin: "0 auto var(--space-10)",
                        }}
                    >
                        Verification across all methods. First EAS attestation. Token
                        deployed. Community agent activated. You go back to building.
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: "var(--space-4)",
                            justifyContent: "center",
                        }}
                    >
                        <Link href="/verify">
                            <button
                                className="btn-lg"
                                style={{
                                    background: "white",
                                    color: "var(--purple)",
                                    fontWeight: 600,
                                    borderRadius: "var(--radius-full)",
                                }}
                            >
                                Stamp Your Sigil
                            </button>
                        </Link>
                        <Link href="/chat">
                            <button
                                className="btn-lg"
                                style={{
                                    background: "transparent",
                                    color: "white",
                                    border: "1.5px solid rgba(255,255,255,0.35)",
                                    fontWeight: 500,
                                    borderRadius: "var(--radius-full)",
                                }}
                            >
                                Talk to Us
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
