"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section
        style={{
          textAlign: "center",
          padding: "var(--space-32) 0 var(--space-24)",
          background:
            "linear-gradient(180deg, var(--lavender) 0%, var(--white) 100%)",
        }}
      >
        <div className="container">
          <div className="hero-eyebrow">We Fund Builders</div>
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
            Fund your favorite developer.
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
            Deploy a token for any project you believe in. Every developer is
            verified on-chain. Community votes govern milestones. Your capital
            goes somewhere real.
          </p>
          <div
            className="hero-actions"
            style={{ marginTop: "var(--space-10)" }}
          >
            <Link href="/chat">
              <button className="btn-primary btn-lg">Launch a Token</button>
            </Link>
            <Link href="/developers">
              <button className="btn-outline btn-lg">I'm a Developer</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section
        style={{
          padding: "var(--space-10) 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
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
            Every project is verified
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "var(--space-6)",
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            <span>GitHub OAuth</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>Domain DNS</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>File Verification</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>Meta Tags</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>Twitter + zkTLS</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>Instagram</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>Facebook</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>Well-Known File</span>
          </div>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-tertiary)",
              marginTop: "var(--space-2)",
            }}
          >
            Eight independent verification methods. No single point of failure.
          </p>
        </div>
      </section>

      {/* ── How it works (supporter perspective) ── */}
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
            Three steps to fund a builder.
          </h2>
          <div className="grid grid-3">
            <div style={{ padding: "var(--space-6) 0", textAlign: "left" }}>
              <p
                style={{
                  fontSize: "var(--text-4xl)",
                  fontWeight: 700,
                  color: "var(--purple)",
                  opacity: 0.2,
                  marginBottom: "var(--space-3)",
                }}
              >
                01
              </p>
              <h3 style={{ marginBottom: "var(--space-2)" }}>
                Pick a project
              </h3>
              <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                Find a developer or project you believe in. GitHub repos,
                Instagram creators, open-source tools. If they build it, you can
                fund it.
              </p>
            </div>
            <div style={{ padding: "var(--space-6) 0", textAlign: "left" }}>
              <p
                style={{
                  fontSize: "var(--text-4xl)",
                  fontWeight: 700,
                  color: "var(--purple)",
                  opacity: 0.2,
                  marginBottom: "var(--space-3)",
                }}
              >
                02
              </p>
              <h3 style={{ marginBottom: "var(--space-2)" }}>
                Deploy a token
              </h3>
              <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                Launch a token for that project through Sigil. It takes seconds.
                The token is deployed on Base with built-in LP and fee
                distribution.
              </p>
            </div>
            <div style={{ padding: "var(--space-6) 0", textAlign: "left" }}>
              <p
                style={{
                  fontSize: "var(--text-4xl)",
                  fontWeight: 700,
                  color: "var(--purple)",
                  opacity: 0.2,
                  marginBottom: "var(--space-3)",
                }}
              >
                03
              </p>
              <h3 style={{ marginBottom: "var(--space-2)" }}>
                Developer stamps their Sigil
              </h3>
              <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                The developer verifies ownership and stamps their Sigil. USDC
                fees flow to them. Community votes unlock native tokens as
                milestones are met.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Sigil (supporter confidence) ── */}
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
              Why Sigil
            </p>
            <h2
              style={{
                fontSize: "var(--text-3xl)",
                letterSpacing: "-0.03em",
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              Your capital funds real, verified development.
            </h2>
          </div>
          <div className="grid grid-2" style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="feature-card" style={{ background: "var(--white)" }}>
              <h3 style={{ marginBottom: "var(--space-2)" }}>
                Verified developers
              </h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Every project is verified through on-chain EAS attestations.
                Eight independent methods ensure no single API revocation can
                erase proof of ownership.
              </p>
            </div>
            <div className="feature-card" style={{ background: "var(--white)" }}>
              <h3 style={{ marginBottom: "var(--space-2)" }}>
                Milestone governance
              </h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Native tokens stay locked. The community votes on milestones
                before tokens unlock. Real progress gates real rewards.
              </p>
            </div>
            <div className="feature-card" style={{ background: "var(--white)" }}>
              <h3 style={{ marginBottom: "var(--space-2)" }}>
                USDC earnings
              </h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                LP fees flow as USDC directly to verified developers. Clear,
                immediate, transparent. No hidden terms or surprise conditions.
              </p>
            </div>
            <div className="feature-card" style={{ background: "var(--white)" }}>
              <h3 style={{ marginBottom: "var(--space-2)" }}>
                Supported builders
              </h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Developers on Sigil get community management agents and human
                specialists. They stay focused on code. The projects you fund
                keep shipping.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Positioning statement ── */}
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
            The projects you fund are verified. The developers are real. The
            milestones are on-chain.
          </h2>
          <p
            style={{
              fontSize: "var(--text-lg)",
              maxWidth: 560,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Sigil connects supporters to builders through verified funding
            infrastructure. On-chain attestations, milestone governance, and
            ongoing support for every project.
          </p>
        </div>
      </section>

      {/* ── The flywheel ── */}
      <section className="section section-cream">
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
              The model
            </p>
            <h2
              style={{
                fontSize: "var(--text-3xl)",
                letterSpacing: "-0.03em",
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              A flywheel that rewards everyone.
            </h2>
          </div>
          <div
            className="grid grid-2"
            style={{ maxWidth: 800, margin: "0 auto" }}
          >
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>
                Your token funds development
              </h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                When you deploy a token for a project, USDC fees from LP
                activity flow directly to the verified developer. Your capital
                goes to building, not marketing.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>
                Developers stay supported
              </h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Community management agents and human specialists handle the
                work that drains developer energy. The projects you back keep
                shipping real updates.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>
                SIGIL buyback
              </h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Premium support services generate fees that buy back SIGIL
                tokens. More successful projects means more demand for support,
                which strengthens the ecosystem.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>
                Milestone accountability
              </h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Community votes unlock native tokens as developers hit
                milestones. The relationship between funder and builder stays
                accountable throughout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="cta-section"
        style={{
          background: "var(--purple)",
          color: "white",
          padding: "var(--space-32) 0",
        }}
      >
        <div className="container">
          <h2
            style={{
              color: "white",
              fontSize: "var(--text-4xl)",
              letterSpacing: "-0.03em",
              marginBottom: "var(--space-4)",
            }}
          >
            Fund a project that matters.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "var(--text-xl)",
              maxWidth: 480,
              margin: "0 auto var(--space-10)",
            }}
          >
            Pick a developer. Deploy a token. Let Sigil handle verification,
            community, and support.
          </p>
          <div
            style={{
              display: "flex",
              gap: "var(--space-4)",
              justifyContent: "center",
            }}
          >
            <Link href="/chat">
              <button
                className="btn-lg"
                style={{
                  background: "white",
                  color: "var(--purple)",
                  fontWeight: 600,
                  borderRadius: "var(--radius-full)",
                }}
              >
                Launch a Token
              </button>
            </Link>
            <Link href="/developers">
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
                Developer? Start here
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
