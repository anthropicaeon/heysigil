/**
 * ResultStep Component
 *
 * Step 4: Display verification result and claim attestation.
 */

import type { ChallengeResponse, CheckResult } from "../types";
import { LoadingButton } from "@/components/common/LoadingButton";

interface ResultStepProps {
    challenge: ChallengeResponse;
    checkResult: CheckResult;
    loading: boolean;
    onClaim: () => void;
}

export function ResultStep({ challenge, checkResult, loading, onClaim }: ResultStepProps) {
    return (
        <div>
            <h2 style={{ marginBottom: "var(--space-4)" }}>Sigil Stamped</h2>
            <div className="result-box result-success">
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                    <span className="status-badge status-verified">Verified</span>
                </div>
                <p style={{ color: "var(--success)", fontSize: "var(--text-sm)" }}>
                    Project ownership verified for <strong>{challenge.projectId}</strong>
                </p>
            </div>
            <div className="card" style={{ marginTop: "var(--space-4)" }}>
                <h3 style={{ marginBottom: "var(--space-2)" }}>
                    Stamp Your Sigil On-Chain
                </h3>
                <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
                    Create an EAS attestation on Base. Your on-chain stamp of approval starts
                    USDC fee earnings from LP activity. Native tokens remain locked until
                    community milestone votes.
                </p>
                <LoadingButton
                    loading={loading}
                    onClick={onClaim}
                    loadingText="Stamping..."
                    style={{ width: "100%" }}
                >
                    Stamp Sigil
                </LoadingButton>
            </div>
            {checkResult.attestationUid && (
                <div className="result-box result-success" style={{ marginTop: "var(--space-4)" }}>
                    <p style={{ color: "var(--success)", fontSize: "var(--text-sm)" }}>
                        Sigil stamped. UID: <code style={{ fontFamily: "var(--font-mono)" }}>{checkResult.attestationUid}</code>
                    </p>
                    <p style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-2)", color: "var(--text-secondary)" }}>
                        Your stamp is on-chain. USDC fees from LP activity will flow to your
                        wallet. Native tokens remain locked until community milestone votes pass.
                    </p>
                </div>
            )}
        </div>
    );
}
