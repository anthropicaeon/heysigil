"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "var(--space-32) 0 var(--space-24)",
          background: "linear-gradient(180deg, var(--lavender) 0%, var(--white) 100%)",
        }}
      >
        <div className="container">
          <div className="hero-eyebrow">Sigil</div>
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
            We fund projects that matter.
          </h1>
          <p
            style={{
              fontSize: "var(--text-xl)",
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.55,
              color: "var(--text-secondary)",
            }}
          >
            Developers build. Sigil handles the funding, the community, and the complexity of crypto. So builders can stay focused on what they do best.
          </p>
          <div className="hero-actions" style={{ marginTop: "var(--space-10)" }}>
            <Link href="/verify">
              <button className="btn-primary btn-lg">Get Started</button>
            </Link>
            <Link href="/chat">
              <button className="btn-outline btn-lg">Talk to Sigil</button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core positioning */}
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
            The problem
          </p>
          <h2
            style={{
              fontSize: "var(--text-3xl)",
              letterSpacing: "-0.03em",
              maxWidth: 640,
              margin: "0 auto var(--space-6)",
            }}
          >
            Developers are being set up to fail.
          </h2>
          <p
            style={{
              fontSize: "var(--text-lg)",
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Current launchpads entice developers with fee claims, then vanish. No community support. No guidance through the complexity of crypto. Platforms revoke API access without warning. Builders end up managing Discord servers instead of shipping code. Some have faced real personal stress from this cycle.
          </p>
        </div>
      </section>

      {/* Three problems in detail */}
      <section className="section section-sage">
        <div className="container">
          <div
            className="grid grid-3"
            style={{ textAlign: "left" }}
          >
            <div style={{ padding: "var(--space-8) 0" }}>
              <h3 style={{ marginBottom: "var(--space-3)" }}>Verification fragility</h3>
              <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                When a platform depends on a single API for verification, one policy change locks you out permanently. Your stamp of authentication disappears overnight. Sigil provides eight independent verification methods. If one goes down, seven remain.
              </p>
            </div>
            <div style={{ padding: "var(--space-8) 0" }}>
              <h3 style={{ marginBottom: "var(--space-3)" }}>Post-launch abandonment</h3>
              <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                The current model is transactional. Claim fees, then you are on your own. This has created documented stress for developers who suddenly find themselves responsible for a community they never intended to build. Sigil provides ongoing support: community management agents, human specialists, and clear guidance.
              </p>
            </div>
            <div style={{ padding: "var(--space-8) 0" }}>
              <h3 style={{ marginBottom: "var(--space-3)" }}>Builders forced into roles they did not choose</h3>
              <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                A developer should not need to become a community manager, a crypto strategist, or a marketing lead. These are distinct skill sets. Sigil separates them cleanly: you build, we handle everything else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning statement */}
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
            Sigil is the funding and support layer for developers entering crypto.
          </h2>
          <p
            style={{
              fontSize: "var(--text-lg)",
              maxWidth: 560,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            We fund projects that matter. We provide verification that cannot be revoked. We handle community so builders can build. This is not a launchpad. It is infrastructure for developer-led projects in crypto.
          </p>
        </div>
      </section>

      {/* Three messaging angles */}
      <section className="section section-gray">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
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
              Three ways in
            </p>
            <h2
              style={{
                fontSize: "var(--text-3xl)",
                letterSpacing: "-0.03em",
              }}
            >
              Fund. Build. Belong.
            </h2>
          </div>
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
                Fund your favorite developer
              </h3>
              <p>
                Deploy a token for a project you believe in. When the developer stamps their Sigil, it is their seal of approval. The community decides through milestones whether the full token allocation unlocks.
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
                Create new ideas and get funded
              </h3>
              <p>
                Have an idea worth building? Sigil provides the mechanism to get funded without the burden of managing a token community. You write code. The funding structure handles the rest.
              </p>
            </div>
            <div
              className="feature-card"
              style={{
                background: "var(--rose)",
                border: "none",
                padding: "var(--space-10)",
              }}
            >
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--error)",
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
                Get support in a new world
              </h3>
              <p>
                Crypto can be overwhelming. Sigil provides community management agents and human specialists. We make the unfamiliar clear, the technical accessible, and the transition manageable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Headlines section */}
      <section className="section-lg">
        <div className="container" style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--purple)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "var(--space-6)",
            }}
          >
            What we stand for
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-12)",
              maxWidth: 700,
              margin: "0 auto",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "var(--text-3xl)",
                  letterSpacing: "-0.03em",
                  marginBottom: "var(--space-3)",
                }}
              >
                Build what matters. We handle the rest.
              </h2>
              <p style={{ fontSize: "var(--text-lg)" }}>
                Developer funding with community support built in. Not bolted on. Not an afterthought.
              </p>
            </div>
            <div
              className="divider divider-center"
            />
            <div>
              <h2
                style={{
                  fontSize: "var(--text-3xl)",
                  letterSpacing: "-0.03em",
                  marginBottom: "var(--space-3)",
                }}
              >
                Your stamp. Your proof. Your terms.
              </h2>
              <p style={{ fontSize: "var(--text-lg)" }}>
                Eight ways to verify ownership. Zero dependence on any single platform.
              </p>
            </div>
            <div
              className="divider divider-center"
            />
            <div>
              <h2
                style={{
                  fontSize: "var(--text-3xl)",
                  letterSpacing: "-0.03em",
                  marginBottom: "var(--space-3)",
                }}
              >
                Funded, not abandoned.
              </h2>
              <p style={{ fontSize: "var(--text-lg)" }}>
                We stay after launch. Community management agents, human specialists, and ongoing support for builders who want it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How the flywheel works */}
      <section className="section section-cream">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
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
              A flywheel that rewards builders
            </h2>
          </div>
          <div className="grid grid-2" style={{ maxWidth: 800, margin: "0 auto" }}>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>Developer earnings</h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                USDC fees from LP activity flow directly to verified developers. Native tokens remain locked, creating aligned incentives between builders and supporters.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>Premium services</h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Developers who opt into community management agents and human specialist support share a small portion of fees. This funds the tools that support them.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>SIGIL buyback</h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Premium service fees flow back to SIGIL token buybacks. More developers succeeding means more demand for support, which strengthens the token.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-2)" }}>Milestone governance</h4>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Community votes unlock native tokens as developers hit milestones. This keeps the relationship accountable and rewards sustained effort over speculation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
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
            Built different
          </p>
          <h2
            style={{
              fontSize: "var(--text-3xl)",
              letterSpacing: "-0.03em",
              maxWidth: 600,
              margin: "0 auto var(--space-12)",
            }}
          >
            High-trust. Signal-dense. Founder-led.
          </h2>
          <div className="grid grid-3" style={{ textAlign: "left" }}>
            <div className="feature-card">
              <h3 style={{ marginBottom: "var(--space-2)" }}>On-chain verification</h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                EAS attestations on Base. Immutable proof of project ownership. Not a database entry that can be edited or deleted.
              </p>
            </div>
            <div className="feature-card">
              <h3 style={{ marginBottom: "var(--space-2)" }}>No single point of failure</h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                GitHub, domain DNS, domain file, meta tags, tweet with zkTLS, Facebook, Instagram. Eight methods. If one disappears, you have seven more.
              </p>
            </div>
            <div className="feature-card">
              <h3 style={{ marginBottom: "var(--space-2)" }}>Developer-first design</h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Built by builders, for builders. Every decision filters through one question: does this let developers focus more on code and less on everything else?
              </p>
            </div>
            <div className="feature-card">
              <h3 style={{ marginBottom: "var(--space-2)" }}>Transparent incentives</h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                USDC earnings are direct. Token lockups are clear. Milestone governance is on-chain. No hidden terms, no surprise conditions.
              </p>
            </div>
            <div className="feature-card">
              <h3 style={{ marginBottom: "var(--space-2)" }}>Community without the burden</h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                Community management agents and human specialists handle the work that drains developer energy. Engagement, moderation, communication. Handled.
              </p>
            </div>
            <div className="feature-card">
              <h3 style={{ marginBottom: "var(--space-2)" }}>Clear separation from predecessors</h3>
              <p style={{ fontSize: "var(--text-sm)" }}>
                We learned from what went wrong. Bankr, Bags, and others caused real developer stress. Sigil exists because that was unacceptable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
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
            Start building.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "var(--text-xl)",
              maxWidth: 480,
              margin: "0 auto var(--space-10)",
            }}
          >
            Stamp your Sigil. Get funded. Let us handle the community and the crypto. You do what you do best.
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
