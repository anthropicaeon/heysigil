/**
 * VerifyFlow
 *
 * Multi-step wizard for project ownership verification.
 */

"use client";

import { useState, useEffect } from "react";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { getErrorMessage } from "@/lib/errors";

import type { Method, Step, ChallengeResponse, CheckResult } from "./types";
import { STEP_LABELS } from "./constants";
import { apiClient } from "@/lib/api-client";
import { MethodStep } from "./steps/MethodStep";
import { DetailsStep } from "./steps/DetailsStep";
import { ChallengeStep } from "./steps/ChallengeStep";
import { ResultStep } from "./steps/ResultStep";

export default function VerifyFlow() {
    const privy = useOptionalPrivy();
    const address = privy?.user?.wallet?.address ?? null;

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

    async function createChallenge() {
        if (!selectedMethod || !projectId || !walletAddress) return;
        setLoading(true);
        setError("");

        try {
            const data = await apiClient.verify.createChallenge(selectedMethod.id, projectId, walletAddress);
            setChallenge(data);

            if (data.authUrl) {
                window.location.href = data.authUrl;
                return;
            }

            setStep("challenge");
        } catch (err) {
            setError(getErrorMessage(err, "Failed to create challenge"));
        } finally {
            setLoading(false);
        }
    }

    async function checkVerification() {
        if (!challenge) return;
        setLoading(true);
        setError("");

        try {
            const data = await apiClient.verify.checkVerification(challenge.verificationId);
            setCheckResult(data);

            if (data.success) {
                setStep("result");
            } else if (data.error) {
                setError(data.error);
            }
        } catch (err) {
            setError(getErrorMessage(err, "Failed to check verification"));
        } finally {
            setLoading(false);
        }
    }

    async function claimAttestation() {
        if (!challenge) return;
        setLoading(true);
        setError("");

        try {
            const data = await apiClient.claim.createAttestation(challenge.verificationId);
            setCheckResult((prev) => prev ? { ...prev, ...data } : prev);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to create attestation"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            {/* Progress steps */}
            <div className="steps">
                {STEP_LABELS.map((label, i) => (
                    <div
                        key={label}
                        className={`step ${i === stepIndex ? "active" : ""} ${i < stepIndex ? "completed" : ""}`}
                    >
                        {i + 1}. {label}
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
                    onSubmit={createChallenge}
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
                    onCheck={checkVerification}
                />
            )}

            {/* Step 4: Result */}
            {step === "result" && checkResult && challenge && (
                <ResultStep
                    challenge={challenge}
                    checkResult={checkResult}
                    loading={loading}
                    onClaim={claimAttestation}
                />
            )}
        </div>
    );
}

// Re-export types for external use
export type { Method, Step, ChallengeResponse, CheckResult } from "./types";
