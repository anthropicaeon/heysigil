"use client";

import Link from "next/link";
import Image from "next/image";

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
                    <div className="hero-eyebrow">for builders</div>
                    <h1
                        style={{
                            fontSize: "var(--text-6xl)",
                            fontWeight: 700,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.05,
                            maxWidth: 780,
                            margin: "0 auto var(--space-6)",
                            textTransform: "lowercase",
                        }}
                    >
                        get verified. get funded. keep shipping.
                    </h1>
                    <p
                        style={{
                            fontSize: "var(--text-xl)",
                            maxWidth: 560,
                            margin: "0 auto",
                            lineHeight: 1.55,
                            color: "var(--text-secondary)",
                            textTransform: "lowercase",
                        }}
                    >
                        the sigil is proof you're real. the code is proof you shipped.
                        verify across five channels, earn USDC, and let our agents handle
                        the community you never wanted to run.
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
                        the problem
                    </p>
                    <h2
                        style={{
                            fontSize: "var(--text-3xl)",
                            letterSpacing: "-0.03em",
                            maxWidth: 640,
                            margin: "0 auto var(--space-6)",
                        }}
                    >
                        the agentic economy is scaling. the infrastructure for builders isn't.
                    </h2>
                    <p
                        style={{
                            fontSize: "var(--text-lg)",
                            maxWidth: 600,
                            margin: "0 auto",
                            lineHeight: 1.65,
                        }}
                    >
                        builder verification tied to single-platform APIs. no accountability
                        after launch. no way to separate real projects from noise. the
                        infrastructure underneath fails the builders it's supposed to serve.
                    </p>
                </div>
            </section>

            {/* ── Three problems in detail ── */}
            <section className="section section-rose">
                <div className="container">
                    <div className="grid grid-3" style={{ textAlign: "left" }}>
                        <div style={{ padding: "var(--space-8) 0" }}>
                            <h3 style={{ marginBottom: "var(--space-3)" }}>
                                fragility
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                                builder verification tied to one platform's API. when that
                                platform changes policy, the entire trust layer breaks.
                                sigil provides five independent channels — if one closes,
                                four remain.
                            </p>
                        </div>
                        <div style={{ padding: "var(--space-8) 0" }}>
                            <h3 style={{ marginBottom: "var(--space-3)" }}>
                                misalignment
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                                builders collect fees with no obligation to ship. no milestones.
                                no governance. capital without accountability creates misaligned
                                incentives at scale.
                            </p>
                        </div>
                        <div style={{ padding: "var(--space-8) 0" }}>
                            <h3 style={{ marginBottom: "var(--space-3)" }}>
                                noise
                            </h3>
                            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                                real dev projects and low-effort entries move through the same
                                channels with no distinction. communities have no reliable way
                                to identify verified builders.
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
                        three steps. then back to building.
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
                                verify identity across five independent channels — GitHub,
                                X (via zkTLS), Facebook, Instagram, and your domain. onchain.
                                portable. permanent.
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
                                USDC fees route directly to your wallet. our community
                                management agents handle engagement, moderation, and
                                communication. you stay in your codebase.
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
                            you build. we handle the rest.
                        </h2>
                    </div>
                    <div
                        className="grid grid-2"
                        style={{ maxWidth: 800, margin: "0 auto" }}
                    >
                        <div className="feature-card" style={{ background: "var(--white)" }}>
                            <Image src="/icons/message-chat-circle.svg" alt="" width={24} height={24} style={{ marginBottom: "var(--space-3)", opacity: 0.6 }} />
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
                            <Image src="/icons/users-01.svg" alt="" width={24} height={24} style={{ marginBottom: "var(--space-3)", opacity: 0.6 }} />
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
                            <Image src="/icons/life-buoy-01.svg" alt="" width={24} height={24} style={{ marginBottom: "var(--space-3)", opacity: 0.6 }} />
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
                            <Image src="/icons/coins-hand.svg" alt="" width={24} height={24} style={{ marginBottom: "var(--space-3)", opacity: 0.6 }} />
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
                        your stamp. your proof. your terms.
                    </h2>
                    <p
                        style={{
                            fontSize: "var(--text-lg)",
                            maxWidth: 560,
                            margin: "0 auto var(--space-8)",
                            lineHeight: 1.65,
                        }}
                    >
                        five independent verification channels. no dependence on any single
                        platform. if one goes down, four remain. your proof of ownership
                        lives onchain and cannot be revoked.
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
                            "GitHub · OAuth",
                            "X / Twitter · zkTLS",
                            "Facebook · OAuth",
                            "Instagram · OAuth",
                            "Domain · DNS / File",
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
                        verified, deployed, and supported in 48 hours.
                    </h2>
                    <p
                        style={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: "var(--text-xl)",
                            maxWidth: 480,
                            margin: "0 auto var(--space-10)",
                        }}
                    >
                        verification across five channels. first EAS attestation. token
                        deployed. community agent activated. you go back to building.
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
