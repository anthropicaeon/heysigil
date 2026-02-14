import VerifyFlow from "@/components/VerifyFlow";

export default function VerifyPage() {
  return (
    <div className="container">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Verify Project Ownership</h1>
        <p style={{ marginTop: "0.35rem" }}>
          Prove you own a project to claim pool rewards.
        </p>
      </div>
      <VerifyFlow />
    </div>
  );
}
