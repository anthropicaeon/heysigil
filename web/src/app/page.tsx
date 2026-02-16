"use client";

import Link from "next/link";
import Image from "next/image";

const ROTATING_PROMPTS = [
  "Fund my next innovation...",
  "Verify my repo...",
  "Claim my fees...",
  "Authenticate my identity...",
];

export default function Home() {
  return (
    <main>
      {/* ── Section 1: Hero with @HeySigil + Rotating Text ── */}
      <section className="hero-sigil">
        <div className="hero-sigil-center">
          <p className="hero-eyebrow-protocol">the verification infrastructure of base</p>
          <div className="hero-sigil-row">
            <div className="hero-sigil-handle">
              <Image src="/icons/star-06.svg" alt="" width={28} height={28} className="hero-sigil-icon" />
              @HeySigil
            </div>
            <div className="roller-viewport">
              <div className="roller-track">
                {[...ROTATING_PROMPTS, ROTATING_PROMPTS[0]].map((prompt, i) => (
                  <div key={i} className="roller-item">{prompt}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 1b: Positioning Statement + CTAs ── */}
      <section className="positioning-section">
        <div className="container" style={{ textAlign: "center" }}>
          <p className="positioning-body">
            the agentic economy needs infrastructure that can verify real builders,
            route capital to them, and hold both sides accountable — without
            depending on any single platform. sigil is that infrastructure.
          </p>
          <div className="hero-actions">
            <Link href="/verify">
              <button className="btn-primary btn-lg">Stamp Your Sigil</button>
            </Link>
            <Link href="/developers">
              <button className="btn-outline btn-lg">Explore the Protocol</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 2: Verify · Fund · Govern triptych ── */}
      <section className="triptych-section">
        <div className="container">
          <div className="triptych-grid">
            <div className="triptych-card">
              <p className="triptych-label">verify</p>
              <h3 className="triptych-title">multi-channel trust</h3>
              <p className="triptych-body">
                builder identity verified across 5 independent channels. no single platform controls
                legitimacy. the attestation is onchain and portable.
              </p>
            </div>
            <div className="triptych-card">
              <p className="triptych-label">fund</p>
              <h3 className="triptych-title">capital routed to builders</h3>
              <p className="triptych-body">
                communities back projects with conviction. USDC fees route directly to verified
                builders. capital follows verification, not promises.
              </p>
            </div>
            <div className="triptych-card">
              <p className="triptych-label">govern</p>
              <h3 className="triptych-title">milestone accountability</h3>
              <p className="triptych-body">
                tokens stay locked. the community validates milestones to unlock them. accountability
                is structural — not optional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Context — Why This Matters ── */}
      <section className="context-section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
            <p className="section-tag">why this matters</p>
            <h2 className="section-heading" style={{ textTransform: "lowercase" }}>
              the agentic economy is scaling.<br />the infrastructure isn&apos;t.
            </h2>
            <p className="context-intro">
              AI agents are coordinating capital, managing communities, and operating
              across platforms at scale. but the infrastructure underneath still
              depends on single-platform APIs, offers no builder accountability, and
              can&apos;t separate real projects from noise.
            </p>
          </div>
          <div className="context-problems">
            <div className="context-problem-card">
              <Image src="/icons/alert-triangle.svg" alt="" width={24} height={24} className="context-icon" />
              <h3 className="context-problem-title">fragility</h3>
              <p className="context-problem-label">platform dependency</p>
              <p className="context-problem-body">
                builder verification tied to one platform&apos;s API. when that platform changes
                policy, the entire trust layer breaks. infrastructure for the agentic economy
                can&apos;t have a single point of failure.
              </p>
            </div>
            <div className="context-problem-card">
              <Image src="/icons/target-04.svg" alt="" width={24} height={24} className="context-icon" />
              <h3 className="context-problem-title">misalignment</h3>
              <p className="context-problem-label">zero accountability</p>
              <p className="context-problem-body">
                builders collect fees with no obligation to ship. no milestones. no governance.
                capital without accountability creates misaligned incentives at scale.
              </p>
            </div>
            <div className="context-problem-card">
              <Image src="/icons/signal-01.svg" alt="" width={24} height={24} className="context-icon" />
              <h3 className="context-problem-title">noise</h3>
              <p className="context-problem-label">no signal differentiation</p>
              <p className="context-problem-body">
                real dev projects and low-effort entries move through the same channels with no
                distinction. communities have no reliable way to identify verified builders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: How the standard works ── */}
      <section className="section-lg">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
            <p className="section-tag">protocol</p>
            <h2 className="section-heading" style={{ textTransform: "lowercase" }}>
              how the standard works.
            </h2>
            <p className="context-intro">
              four phases. permissionless. no single platform dependency at any point in the chain.
            </p>
          </div>
          <div className="steps-grid">
            {[
              {
                num: "01",
                title: "community backs a project",
                body: "a community identifies a dev project worth backing and commits capital onchain. the builder doesn't need to be involved. capital is the first signal of conviction.",
              },
              {
                num: "02",
                title: "builder proves legitimacy",
                body: "the builder verifies identity across five independent channels — GitHub, X (via zkTLS), Facebook, Instagram, and their domain. verification triggers an EAS attestation on Base.",
              },
              {
                num: "03",
                title: "stamp your sigil",
                body: "the sigil is an onchain attestation — portable proof of builder legitimacy. machine-readable. permanent. the verification standard for the agentic economy.",
              },
              {
                num: "04",
                title: "capital routes + milestones govern",
                body: "USDC fees from protocol activity route directly to the verified builder. native tokens remain locked under community-governed milestone validation. accountability is the default.",
              },
            ].map((step) => (
              <div key={step.num} className="step-card">
                <p className="step-num">{step.num}</p>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Audience Split ── */}
      <section className="audience-section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
            <p className="section-tag">participants</p>
          </div>
          <div className="audience-cards">
            <div className="audience-card audience-card-supporters">
              <span className="audience-label">for communities</span>
              <h3 className="audience-title">back the builders shaping the agentic economy.</h3>
              <p className="audience-body">
                back builders with conviction. govern milestones with proof.
              </p>
              <ul className="audience-bullets">
                <li>back dev projects with capital — protocols, tools, infra</li>
                <li>5-channel verification means you&apos;re backing verified builders</li>
                <li>community governs milestone completion</li>
              </ul>
              <Link href="/chat">
                <button className="btn-primary">Fund a Project</button>
              </Link>
            </div>
            <div className="audience-card audience-card-developers">
              <span className="audience-label">for builders</span>
              <h3 className="audience-title">get verified. get funded. keep shipping.</h3>
              <p className="audience-body">
                the sigil is proof you&apos;re real. the code is proof you shipped.
              </p>
              <ul className="audience-bullets">
                <li>verify across GitHub, X (zkTLS), FB, IG, or your domain</li>
                <li>USDC fees route to your wallet on verification</li>
                <li>native tokens unlock through community milestones</li>
                <li>no community management. no content calendar. no platform risk.</li>
              </ul>
              <Link href="/verify">
                <button className="btn-outline">Stamp Your Sigil</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Trust Layer — 5 Channels ── */}
      <section className="trust-layer-section">
        <div className="container" style={{ textAlign: "center" }}>
          <p className="section-tag">trust layer</p>
          <h2 className="section-heading" style={{ textTransform: "lowercase" }}>
            five channels.<br />no single point of failure.
          </h2>
          <p className="context-intro">
            the verification standard for the agentic economy can&apos;t depend on one
            platform&apos;s API. builder legitimacy is confirmed across five independent
            channels — resilient by architecture.
          </p>
          <div className="channels-grid">
            {[
              { abbr: "GH", name: "GitHub", method: "OAuth", icon: "/icons/git-branch-01.svg" },
              { abbr: "X", name: "X / Twitter", method: "zkTLS", icon: "/icons/at-sign.svg" },
              { abbr: "FB", name: "Facebook", method: "OAuth", icon: "/icons/users-01.svg" },
              { abbr: "IG", name: "Instagram", method: "OAuth", icon: "/icons/fingerprint-04.svg" },
              { abbr: "◎", name: "Domain", method: "DNS / File", icon: "/icons/browser.svg" },
            ].map((ch) => (
              <div key={ch.abbr} className="channel-card">
                <Image src={ch.icon} alt="" width={24} height={24} className="channel-icon" />
                <p className="channel-name">{ch.name}</p>
                <span className="channel-method">{ch.method}</span>
              </div>
            ))}
          </div>
          <p className="trust-layer-note">
            X verification via zkTLS — cryptographic proof of account ownership without
            touching X&apos;s API. no bot. no automation. nothing to revoke.
          </p>
        </div>
      </section>

      {/* ── Section 7: Infrastructure Statement ── */}
      <section className="infra-section">
        <div className="container" style={{ textAlign: "center" }}>
          <Image src="/logo-lavender.png" alt="Sigil" width={64} height={64} className="infra-logo" />
          <h2 className="infra-heading" style={{ textTransform: "lowercase" }}>
            the verification standard<br />for the agentic economy.
          </h2>
          <p className="infra-body">
            five-channel verification. onchain attestation. milestone governance.
            USDC fees route to verified builders. a percentage flows to $SIGIL stakers,
            powering the protocol flywheel.
          </p>
        </div>
      </section>

      {/* ── Section 8: Proof Section ── */}
      <section className="proof-section">
        <div className="container" style={{ textAlign: "center" }}>
          <p className="section-tag">proof</p>
          <h2 className="section-heading" style={{ textTransform: "lowercase" }}>
            don&apos;t trust the copy.<br />verify the infrastructure.
          </h2>
          <p className="context-intro">
            contracts are public. fee logic is onchain. verification is documented.
            the sigil is an EAS attestation — not a badge on a website.
          </p>
          <div className="proof-links">
            <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="proof-link">
              <Image src="/icons/code-browser.svg" alt="" width={18} height={18} />
              <span>smart contracts</span>
              <span className="proof-arrow">→</span>
            </a>
            <a href="https://base.easscan.org" target="_blank" rel="noopener noreferrer" className="proof-link">
              <Image src="/icons/shield-tick.svg" alt="" width={18} height={18} />
              <span>EAS schema</span>
              <span className="proof-arrow">→</span>
            </a>
            <a href="#" className="proof-link">
              <Image src="/icons/file-06.svg" alt="" width={18} height={18} />
              <span>verification docs</span>
              <span className="proof-arrow">→</span>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="proof-link">
              <Image src="/icons/git-branch-01.svg" alt="" width={18} height={18} />
              <span>source code</span>
              <span className="proof-arrow">→</span>
            </a>
            <a href="#" className="proof-link proof-link-pending">
              <Image src="/icons/check-verified-02.svg" alt="" width={18} height={18} />
              <span>audit</span>
              <span className="proof-badge">pending</span>
            </a>
          </div>

          {/* Example attestation */}
          <div className="proof-attestation">
            <div className="proof-attestation-header">
              <span>example · sigil attestation · base</span>
            </div>
            <div className="proof-attestation-body">
              <div className="proof-row"><span className="proof-key">project:</span> <span>vaultprotocol</span></div>
              <div className="proof-row"><span className="proof-key">builder:</span> <span>0x7f2…3a9c</span></div>
              <div className="proof-row"><span className="proof-key">verified:</span> <span>2026-02-14 · 09:41 UTC</span></div>
              <div className="proof-row">
                <span className="proof-key">channels:</span>
                <span className="proof-channels">
                  <span className="proof-check">✓ github</span>
                  <span className="proof-check">✓ x (zkTLS)</span>
                  <span className="proof-check">✓ domain</span>
                  <span className="proof-check">✓ facebook</span>
                  <span className="proof-check">✓ instagram</span>
                </span>
              </div>
              <div className="proof-row"><span className="proof-key">status:</span> <span className="proof-status-active">SIGIL ACTIVE</span></div>
              <div className="proof-row"><span className="proof-key">fees routed:</span> <span>$4,217 USDC</span></div>
              <div className="proof-row"><span className="proof-key">milestones:</span> <span>2 / 4 validated</span></div>
              <div className="proof-row"><span className="proof-key">attestation:</span> <span>0xea5…7b2f</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 9: Final CTA ── */}
      <section className="final-cta-section">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="final-cta-heading" style={{ textTransform: "lowercase" }}>
            claim your sigil.
          </h2>
          <p className="final-cta-body">
            the verification standard for the agentic economy. five channels.
            onchain attestation. milestone governance. dev projects only.
          </p>
          <div className="final-cta-actions">
            <Link href="/verify">
              <button className="btn-primary btn-lg">Stamp Your Sigil</button>
            </Link>
            <Link href="/chat">
              <button className="btn-outline btn-lg">Talk to Sigil</button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
