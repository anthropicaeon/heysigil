import VerifyFlow from "@/components/VerifyFlow";

export default function VerifyPage() {
  return (
    <div className="container">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Stamp Your Sigil</h1>
        <p style={{ marginTop: "0.35rem" }}>
          Prove you own a project. Your Sigil is your stamp of approval — earn
          USDC fees from LPs while your native tokens remain locked until the
          community unlocks them via milestones.
        </p>
      </div>
      <VerifyFlow />
    </div>
  );
}
