"use client";

import Link from "next/link";

const METHODS = [
  {
    icon: "GH",
    name: "GitHub",
    desc: "Prove admin access to a repository",
    badge: "OAuth",
    badgeClass: "badge-oauth",
  },
  {
    icon: "DNS",
    name: "Domain (DNS)",
    desc: "Add a TXT record to prove domain ownership",
    badge: "Manual",
    badgeClass: "badge-manual",
  },
  {
    icon: "WWW",
    name: "Domain (File)",
    desc: "Place a verification file on your website",
    badge: "Manual",
    badgeClass: "badge-manual",
  },
  {
    icon: "TW",
    name: "Tweet + zkTLS",
    desc: "Cryptographic proof, no X API needed",
    badge: "zkTLS",
    badgeClass: "badge-zktls",
  },
  {
    icon: "FB",
    name: "Facebook Page",
    desc: "Verify you admin a Facebook Page",
    badge: "OAuth",
    badgeClass: "badge-oauth",
  },
  {
    icon: "IG",
    name: "Instagram",
    desc: "Verify a Business or Creator account",
    badge: "OAuth",
    badgeClass: "badge-oauth",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">We Fund Builders</div>
          <h1>Build what matters.<br />We handle the rest.</h1>
          <p>
            Sigil funds developer projects and provides the tools, community management, and crypto support so you can focus on what you do best.
          </p>
          <div className="hero-actions">
            <Link href="/verify">
              <button className="btn-primary btn-lg">Stamp Your Sigil</button>
            </Link>
            <Link href="/chat">
              <button className="btn-outline btn-lg">Talk to Sigil</button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="section section-sage">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "var(--text-3xl)", letterSpacing: "-0.03em", marginBottom: "var(--space-6)" }}>
            The problem is clear.
          </h2>
          <p style={{ fontSize: "var(--text-lg)", maxWidth: 600, margin: "0 auto", lineHeight: 1.65 }}>
            Current launchpads entice developers to claim fees, then leave them stranded. No community support. No guidance through crypto. No protection when platforms revoke API access. Developers end up managing communities instead of building.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "var(--space-6)",
              marginTop: "var(--space-12)",
              textAlign: "left",
            }}
          >
            <div>
              <h4 style={{ marginBottom: "var(--space-2)", color: "var(--purple)" }}>
                API access revoked
              </h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Other platforms leave you vulnerable when verification methods disappear. Sigil provides multiple ways to stamp your approval, so you are never locked out.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)", color: "var(--purple)" }}>
                No post-launch support
              </h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Claim your fees, then figure it out alone. That created real stress for developers. We exist to change that by providing ongoing support after day one.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)", color: "var(--purple)" }}>
                Builders forced into marketing
              </h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Developers should build. Not manage Discord servers, not run Twitter campaigns, not navigate crypto community dynamics they never signed up for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="feature-section">
        <div className="container">
          <h2>How Sigil works</h2>
          <p>Five steps from project to funded development.</p>
          <div
            className="grid grid-3"
            style={{ textAlign: "left", marginTop: "var(--space-8)" }}
          >
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "var(--lavender)", color: "var(--purple)" }}
              >
                1
              </div>
              <h3>Token deployed</h3>
              <p>
                Someone deploys a token about your project. The community signals interest before you ever have to get involved.
              </p>
            </div>
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "var(--sage)", color: "var(--success)" }}
              >
                2
              </div>
              <h3>Verify ownership</h3>
              <p>
                Prove you own the project through GitHub, domain, tweet, or social accounts. Multiple methods so you are never locked out.
              </p>
            </div>
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "var(--rose)", color: "var(--error)" }}
              >
                3
              </div>
              <h3>Stamp your Sigil</h3>
              <p>
                Your on-chain seal of approval. An EAS attestation on Base that signals to the community: this project is real, and the builder is here.
              </p>
            </div>
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "var(--cream)", color: "var(--warning)" }}
              >
                4
              </div>
              <h3>Earn USDC</h3>
              <p>
                USDC fees from LP activity flow directly to your wallet. Your native tokens stay locked, aligning incentives with your community.
              </p>
            </div>
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "var(--lavender)", color: "var(--purple)" }}
              >
                5
              </div>
              <h3>Community milestones</h3>
              <p>
                The community votes on milestones to unlock your native tokens. Build, ship, earn. The structure rewards real progress.
              </p>
            </div>
            <div className="feature-card" style={{ background: "var(--purple)", border: "none" }}>
              <div
                className="feature-icon"
                style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
              >
                +
              </div>
              <h3 style={{ color: "white" }}>Premium support</h3>
              <p style={{ color: "rgba(255,255,255,0.7)" }}>
                Opt into community management agents, human specialists, and crypto guidance. A small share of fees powers the SIGIL token buyback flywheel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three angles */}
      <section className="section section-gray">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
            <h2 style={{ fontSize: "var(--text-3xl)", letterSpacing: "-0.03em" }}>
              Three ways in
            </h2>
          </div>
          <div className="grid grid-3">
            <div
              className="feature-card"
              style={{ borderTop: "3px solid var(--purple)" }}
            >
              <span
                className="badge badge-lavender"
                style={{ marginBottom: "var(--space-4)", display: "inline-block" }}
              >
                For supporters
              </span>
              <h3>Fund your favorite developer</h3>
              <p>
                Deploy a token for a project you believe in. When the developer stamps their Sigil, it is their seal of approval. You decide via milestones whether they earn the full token allocation.
              </p>
            </div>
            <div
              className="feature-card"
              style={{ borderTop: "3px solid var(--success)" }}
            >
              <span
                className="badge badge-sage"
                style={{ marginBottom: "var(--space-4)", display: "inline-block" }}
              >
                For builders
              </span>
              <h3>Create and get funded</h3>
              <p>
                Have an idea? Build it. Sigil provides the funding mechanism so you can focus on development. No community management required. No crypto expertise needed.
              </p>
            </div>
            <div
              className="feature-card"
              style={{ borderTop: "3px solid var(--warning)" }}
            >
              <span
                className="badge badge-cream"
                style={{ marginBottom: "var(--space-4)", display: "inline-block" }}
              >
                For newcomers
              </span>
              <h3>Get support in a new world</h3>
              <p>
                Crypto can be daunting. Sigil provides community management agents and human specialists to guide you. We make the unfamiliar clear and the complex manageable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verification methods */}
      <section className="feature-section">
        <div className="container">
          <h2>Multiple ways to verify</h2>
          <p>
            You will never be locked out. No single API dependency. No single point of failure.
          </p>
          <div
            className="grid grid-3"
            style={{ textAlign: "left" }}
          >
            {METHODS.map((m) => (
              <div key={m.name} className="card">
                <div className="card-header">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: "var(--text-xs)",
                      background: "var(--gray-100)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {m.icon}
                  </span>
                  <h3 style={{ fontSize: "var(--text-sm)" }}>{m.name}</h3>
                  <span className={`badge ${m.badgeClass}`}>{m.badge}</span>
                </div>
                <p style={{ fontSize: "var(--text-sm)" }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes Sigil different */}
      <section className="section section-lavender">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "var(--text-3xl)", letterSpacing: "-0.03em", marginBottom: "var(--space-6)" }}>
            Why Sigil exists
          </h2>
          <p style={{ fontSize: "var(--text-lg)", maxWidth: 560, margin: "0 auto var(--space-12)", lineHeight: 1.65 }}>
            We saw what happened when platforms claimed to support developers but walked away the moment fees were collected. We are building the alternative.
          </p>
          <div
            className="grid grid-2"
            style={{ textAlign: "left", maxWidth: 720, margin: "0 auto" }}
          >
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>Funded, not abandoned</h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                We fund your development and provide tools to keep building. Not a one-time payout. Ongoing support.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>Verification resilience</h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Eight verification methods. If one API goes down, you have seven more. Your stamp of authentication is never at risk.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>Community handled</h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Our agents and specialists manage your crypto community so you can stay focused on code. Opt in when you want more.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>Token flywheel</h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Premium service fees flow back to SIGIL token buybacks. The more developers succeed, the stronger the ecosystem becomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section section-purple">
        <div className="container">
          <h2>Ready to build?</h2>
          <p>
            Stamp your Sigil. Earn while you build. Let us handle the rest.
          </p>
          <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center" }}>
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
                Get Started
              </button>
            </Link>
            <Link href="/chat">
              <button
                className="btn-lg"
                style={{
                  background: "transparent",
                  color: "white",
                  border: "1.5px solid rgba(255,255,255,0.4)",
                  fontWeight: 500,
                  borderRadius: "var(--radius-full)",
                }}
              >
                Talk to Sigil
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
