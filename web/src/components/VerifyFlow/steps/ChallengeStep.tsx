/**
 * ChallengeStep Component
 *
 * Step 3: Display challenge instructions and verify.
 */

import type { ChallengeResponse } from "../types";

interface ChallengeStepProps {
    challenge: ChallengeResponse;
    loading: boolean;
    error: string;
    onBack: () => void;
    onCheck: () => void;
}

export function ChallengeStep({ challenge, loading, error, onBack, onCheck }: ChallengeStepProps) {
    return (
        <div>
            <h2 style={{ marginBottom: "var(--space-4)" }}>Complete Verification</h2>
            <div className="card">
                <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
                    Follow these instructions, then click &quot;Check Verification&quot;:
                </p>
                <div className="instructions">{challenge.instructions}</div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                    Challenge code: <code style={{ fontFamily: "var(--font-mono)" }}>{challenge.challengeCode}</code>
                </p>
            </div>
            {error && (
                <div className="result-box result-error">
                    <p style={{ color: "var(--error)", fontSize: "var(--text-sm)" }}>{error}</p>
                </div>
            )}
            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <button type="button" className="btn-secondary" onClick={onBack}>
                    Back
                </button>
                <button
                    type="button"
                    className="btn-primary"
                    disabled={loading}
                    onClick={onCheck}
                    style={{ flex: 1 }}
                >
                    {loading ? "Checking..." : "Check Verification"}
                </button>
            </div>
        </div>
    );
}
