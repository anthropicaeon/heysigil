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
        <h1>OpenClaw Verify</h1>
        <p style={{ marginTop: "0.5rem", maxWidth: "540px" }}>
          Prove you own a project and claim your pool rewards. No X API
          dependency — verify through GitHub, your domain, a tweet, or social
          accounts.
        </p>
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

      <div style={{ marginTop: "2rem" }}>
        <Link href="/verify">
          <button className="btn-primary" style={{ width: "100%", padding: "0.85rem" }}>
            Start Verification
          </button>
        </Link>
      </div>

      <div
        style={{
          marginTop: "3rem",
          padding: "1.25rem",
          background: "var(--bg-secondary)",
          borderRadius: "10px",
          border: "1px solid var(--border)",
        }}
      >
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
          How it works
        </h3>
        <ol
          style={{
            paddingLeft: "1.25rem",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            lineHeight: "1.8",
          }}
        >
          <li>Choose a verification method</li>
          <li>Prove you own the project (GitHub repo, domain, social account)</li>
          <li>An EAS attestation is created on Base linking your wallet to the project</li>
          <li>Use the attestation to claim pool rewards from the smart contract</li>
        </ol>
      </div>
    </div>
  );
}
