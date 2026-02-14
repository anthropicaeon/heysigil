"use client";

import Link from "next/link";

const METHODS = [
  {
    icon: "GH",
    name: "GitHub",
    desc: "Prove you have admin access to a repository",
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
    desc: "Tweet a code, prove it cryptographically — no X API needed",
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
    desc: "Verify a Business/Creator Instagram account",
    badge: "OAuth",
    badgeClass: "badge-oauth",
  },
];

export default function Home() {
  return (
    <div className="container">
      <div style={{ marginBottom: "2.5rem" }}>
        <h1>Sigil</h1>
        <p
          style={{
            marginTop: "0.5rem",
            maxWidth: "540px",
            fontSize: "1.05rem",
            lineHeight: "1.7",
            color: "var(--text)",
          }}
        >
          Funding for dev projects without the weight of handling a community.
        </p>
        <p
          style={{
            marginTop: "0.75rem",
            maxWidth: "540px",
            color: "var(--text-secondary)",
            lineHeight: "1.7",
          }}
        >
          Stamp your Sigil as your seal of approval. Earn USDC fees from LPs while
          your native tokens stay locked. The community decides if you hit milestones
          to unlock them. Either way, you keep building and keep earning.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2.5rem" }}>
        <Link href="/chat">
          <button className="btn-primary" style={{ padding: "0.85rem 2rem" }}>
            Chat with Sigil
          </button>
        </Link>
        <Link href="/verify">
          <button className="btn-secondary" style={{ padding: "0.85rem 2rem" }}>
            Stamp Your Sigil
          </button>
        </Link>
      </div>

      {/* How it works */}
      <div
        style={{
          padding: "1.5rem",
          background: "var(--bg-secondary)",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          marginBottom: "2.5rem",
        }}
      >
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>
          How it works
        </h3>
        <ol
          style={{
            paddingLeft: "1.25rem",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            lineHeight: "2",
          }}
        >
          <li>Someone deploys a token about your project</li>
          <li>Verify you own the project (GitHub, domain, tweet, social)</li>
          <li>Stamp your Sigil — your on-chain seal of approval</li>
          <li>Earn USDC fees from LP activity while your tokens stay locked</li>
          <li>Community votes on milestones to unlock your native tokens</li>
        </ol>
      </div>

      {/* Value props */}
      <div className="method-grid" style={{ marginBottom: "2.5rem" }}>
        <div className="card">
          <div className="card-header">
            <span className="badge badge-manual">For Devs</span>
          </div>
          <p style={{ fontSize: "0.85rem" }}>
            You don&apos;t need to run a coin community. Stamp your Sigil, collect USDC
            fees, and get back to building. Your tokens unlock when the community
            agrees you&apos;ve hit milestones.
          </p>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="badge badge-oauth">For Community</span>
          </div>
          <p style={{ fontSize: "0.85rem" }}>
            Deploy tokens for projects you believe in. When the dev stamps their
            Sigil, it&apos;s their seal of approval. You decide via milestones whether
            they earn the full token allocation.
          </p>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="badge badge-zktls">For LPs</span>
          </div>
          <p style={{ fontSize: "0.85rem" }}>
            Provide liquidity for stamped projects. Fees flow to verified
            developers, aligning incentives between builders and their supporters.
          </p>
        </div>
      </div>

      <h2>Verification Methods</h2>

      <div className="method-grid">
        {METHODS.map((m) => (
          <div key={m.name} className="card">
            <div className="card-header">
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  background: "var(--bg-secondary)",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                }}
              >
                {m.icon}
              </span>
              <h3>{m.name}</h3>
              <span className={`badge ${m.badgeClass}`}>{m.badge}</span>
            </div>
            <p style={{ fontSize: "0.85rem" }}>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
