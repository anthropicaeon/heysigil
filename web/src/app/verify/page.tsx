import VerifyFlow from "@/components/VerifyFlow";

export default function VerifyPage() {
  return (
    <div className="container-narrow" style={{ padding: "var(--space-12) var(--space-6)" }}>
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-3)" }}>
          Stamp Your Sigil
        </h1>
        <p style={{ fontSize: "var(--text-lg)", maxWidth: 520 }}>
          Prove you own a project. Your Sigil is your on-chain seal of approval. Earn USDC fees while your native tokens remain locked until the community unlocks them.
        </p>
      </div>
      <VerifyFlow />
    </div>
  );
}
