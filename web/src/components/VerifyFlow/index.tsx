/**
 * VerifyFlow
 *
 * Multi-step wizard for project ownership verification.
 */

"use client";

import { useState, useEffect } from "react";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { getErrorMessage } from "@/lib/errors";
import { ApiError } from "@/lib/api-client";

import type { Method, Step, ChallengeResponse, CheckResult } from "./types";
import { STEP_LABELS } from "./constants";
import { useVerificationService, type IVerificationService } from "./hooks/useVerificationService";
import { MethodStep } from "./steps/MethodStep";
import { DetailsStep } from "./steps/DetailsStep";
import { ChallengeStep } from "./steps/ChallengeStep";
import { ResultStep } from "./steps/ResultStep";

interface VerifyFlowProps {
    /** Optional service for testing/DI */
    verificationService?: IVerificationService;
}

function mapVerifyError(err: unknown, fallback: string): string {
    const message = getErrorMessage(err, fallback);

    if (err instanceof ApiError && err.status === 503) {
        if (message.includes("Authentication service unavailable")) {
            return "Backend auth is not configured (set PRIVY_APP_ID and PRIVY_APP_SECRET in backend .env).";
        }
        if (message.includes("Database not configured")) {
            return "Backend database is not configured (set DATABASE_URL in backend .env).";
        }
    }

    return message;
}

export default function VerifyFlow({ verificationService }: VerifyFlowProps = {}) {
    const privy = useOptionalPrivy();
    const isPrivyConfigured = privy !== null;
    const isApiConfigured = !!process.env.NEXT_PUBLIC_API_URL;
    const address = privy?.user?.wallet?.address ?? null;

    const { createChallenge: apiCreateChallenge, checkVerification: apiCheckVerification, createAttestation: apiCreateAttestation } =
        useVerificationService({ service: verificationService });

    const [step, setStep] = useState<Step>("method");
    const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
    const [projectId, setProjectId] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
    const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Auto-fill wallet address from connected wallet
    useEffect(() => {
        if (address) setWalletAddress(address);
    }, [address]);

    const stepIndex = ["method", "details", "challenge", "result"].indexOf(step);

    async function handleCreateChallenge() {
        if (!selectedMethod || !projectId || !walletAddress) return;
        setLoading(true);
        setError("");

        try {
            const data = await apiCreateChallenge(selectedMethod.id, projectId, walletAddress);
            setChallenge(data);

            if (data.authUrl) {
                window.location.href = data.authUrl;
                return;
            }

            setStep("challenge");
        } catch (err) {
            setError(mapVerifyError(err, "Failed to create challenge"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckVerification() {
        if (!challenge) return;
        setLoading(true);
        setError("");

        try {
            const data = await apiCheckVerification(challenge.verificationId);
            setCheckResult(data);

            if (data.success) {
                setStep("result");
            } else if (data.error) {
                setError(data.error);
            }
        } catch (err) {
            setError(mapVerifyError(err, "Failed to check verification"));
        } finally {
            setLoading(false);
        }
    }

    async function handleClaimAttestation() {
        if (!challenge) return;
        setLoading(true);
        setError("");

        try {
            const data = await apiCreateAttestation(challenge.verificationId);
            setCheckResult((prev) => prev ? { ...prev, ...data } : prev);
        } catch (err) {
            setError(mapVerifyError(err, "Failed to create attestation"));
        } finally {
            setLoading(false);
        }
    }

    // Zeigarnik Effect: Calculate progress percentage
    // Start at 20% (endowed progress) to increase completion motivation
    const progressPercent = 20 + (stepIndex / (STEP_LABELS.length - 1)) * 80;

    return (
        <div className="verify-flow">
            {/* Local-dev fallback notices */}
            {!isPrivyConfigured && (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--warning)", marginBottom: "var(--space-4)" }}>
                    Sign-in not configured (set NEXT_PUBLIC_PRIVY_APP_ID). Wallet address auto-fill is disabled — enter it manually.
                </p>
            )}
            {!isApiConfigured && (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--warning)", marginBottom: "var(--space-4)" }}>
                    Backend not configured (set NEXT_PUBLIC_API_URL). Using http://localhost:3001 — start the backend locally.
                </p>
            )}

            {/* Zeigarnik Effect: Visual progress bar */}
            <div className="progress-container">
                <div className="progress-header">
                    <span className="progress-label">Step {stepIndex + 1} of {STEP_LABELS.length}</span>
                    <span className="progress-percent">{Math.round(progressPercent)}% complete</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Step indicators */}
            <div className="steps">
                {STEP_LABELS.map((label, i) => (
                    <div
                        key={label}
                        className={`step ${i === stepIndex ? "active" : ""} ${i < stepIndex ? "completed" : ""}`}
                    >
                        <span className="step-number">{i < stepIndex ? "✓" : i + 1}</span>
                        <span className="step-label">{label}</span>
                    </div>
                ))}
            </div>

            {/* Step 1: Choose method */}
            {step === "method" && (
                <MethodStep
                    selectedMethod={selectedMethod}
                    onSelect={setSelectedMethod}
                    onContinue={() => setStep("details")}
                />
            )}

            {/* Step 2: Enter details */}
            {step === "details" && selectedMethod && (
                <DetailsStep
                    method={selectedMethod}
                    projectId={projectId}
                    walletAddress={walletAddress}
                    connectedAddress={address}
                    privy={privy}
                    loading={loading}
                    error={error}
                    onProjectIdChange={setProjectId}
                    onWalletAddressChange={setWalletAddress}
                    onBack={() => setStep("method")}
                    onSubmit={handleCreateChallenge}
                    onClearError={() => setError("")}
                />
            )}

            {/* Step 3: Follow instructions */}
            {step === "challenge" && challenge && (
                <ChallengeStep
                    challenge={challenge}
                    loading={loading}
                    error={error}
                    onBack={() => setStep("details")}
                    onCheck={handleCheckVerification}
                />
            )}

            {/* Step 4: Result */}
            {step === "result" && checkResult && challenge && (
                <ResultStep
                    challenge={challenge}
                    checkResult={checkResult}
                    loading={loading}
                    onClaim={handleClaimAttestation}
                />
            )}
        </div>
    );
}

// Re-export types for external use
export type { Method, Step, ChallengeResponse, CheckResult } from "./types";
