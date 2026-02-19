/**
 * VerifyFlow
 *
 * Multi-step wizard for project ownership verification.
 * Updated with pastel design system.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { PixelCard } from "@/components/ui/pixel-card";
import { useOptionalPrivy, useOptionalWallets } from "@/hooks/useOptionalPrivy";
import { ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { RECOMMENDED_METHODS } from "./constants";
import { type IVerificationService, useVerificationService } from "./hooks/useVerificationService";
import { ChallengeStep } from "./steps/ChallengeStep";
import { DetailsStep } from "./steps/DetailsStep";
import { MethodStep } from "./steps/MethodStep";
import { ResultStep } from "./steps/ResultStep";
import type { ChallengeResponse, CheckResult, Method, Step } from "./types";

// Mock data for dev mode
const MOCK_CHALLENGE: ChallengeResponse = {
    verificationId: "dev-mock-123",
    projectId: "heysigil/example-repo",
    challengeCode: "sigil-verify-abc123xyz",
    instructions: "1. Go to your repository settings\n2. Add the challenge code to your README.md\n3. Click 'Check Verification' below",
    method: "github_oauth",
    walletAddress: "0x1234567890123456789012345678901234567890",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
};

const MOCK_CHECK_RESULT: CheckResult = {
    verificationId: "dev-mock-123",
    status: "verified",
    success: true,
    attestationUid: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
};

const CHANNELS = [
    { name: "GitHub", method: "OAuth" },
    { name: "X", method: "zkTLS" },
    { name: "Facebook", method: "OAuth" },
    { name: "Instagram", method: "OAuth" },
    { name: "Domain", method: "DNS" },
];

const STEP_SEQUENCE: Step[] = ["method", "details", "challenge", "result"];

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
    const walletsData = useOptionalWallets();

    // Get wallet address from embedded wallet (works for all sign-in methods)
    const embeddedWallet =
        walletsData?.wallets?.find(
            (w: { walletClientType: string }) => w.walletClientType === "privy",
        ) ??
        walletsData?.wallets?.[0] ??
        null;
    const address = embeddedWallet?.address ?? privy?.user?.wallet?.address ?? null;

    // Detect if user signed in via GitHub through Privy
    const privyGithubUsername = privy?.user?.github?.username ?? null;

    const {
        createChallenge: apiCreateChallenge,
        checkVerification: apiCheckVerification,
        createAttestation: apiCreateAttestation,
    } = useVerificationService({ service: verificationService });

    const [step, setStep] = useState<Step>("method");
    const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
    const [projectId, setProjectId] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
    const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Auto-fill wallet address from connected/embedded wallet (only when empty)
    useEffect(() => {
        if (address && !walletAddress) setWalletAddress(address);
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

    const stepIndex = STEP_SEQUENCE.indexOf(step);

    // Dev mode: Shift+D to cycle through steps
    const cycleDevStep = useCallback(() => {
        const currentIndex = STEP_SEQUENCE.indexOf(step);
        const nextIndex = (currentIndex + 1) % STEP_SEQUENCE.length;
        const nextStep = STEP_SEQUENCE[nextIndex];

        // Set up mock data for each step
        if (nextStep === "details" && !selectedMethod) {
            setSelectedMethod(RECOMMENDED_METHODS[0]);
        }
        if (nextStep === "details" || nextStep === "challenge" || nextStep === "result") {
            if (!projectId) setProjectId("heysigil/example-repo");
            if (!walletAddress) setWalletAddress("0x1234567890123456789012345678901234567890");
        }
        if (nextStep === "challenge" && !challenge) {
            setChallenge(MOCK_CHALLENGE);
        }
        if (nextStep === "result") {
            if (!challenge) setChallenge(MOCK_CHALLENGE);
            if (!checkResult) setCheckResult(MOCK_CHECK_RESULT);
        }

        setStep(nextStep);
    }, [step, selectedMethod, projectId, walletAddress, challenge, checkResult]);

    useEffect(() => {
        if (process.env.NODE_ENV !== "development") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === "D") {
                e.preventDefault();
                cycleDevStep();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cycleDevStep]);

    async function handleCreateChallenge() {
        if (!selectedMethod || !projectId || !walletAddress) return;
        setLoading(true);
        setError("");

        try {
            // If user signed in via GitHub through Privy and using github_oauth method,
            // get the Privy access token to enable instant verification (no redirect)
            const isPrivyGithub = privyGithubUsername && selectedMethod.id === "github_oauth";
            let accessToken: string | undefined;
            if (isPrivyGithub && privy?.getAccessToken) {
                const token = await privy.getAccessToken();
                if (token) accessToken = token;
            }

            const data = await apiCreateChallenge(
                selectedMethod.id,
                projectId,
                walletAddress,
                accessToken,
            );
            setChallenge(data);

            // For Privy GitHub: skip OAuth redirect, immediately check
            if (isPrivyGithub && accessToken) {
                const checkData = await apiCheckVerification(data.verificationId, accessToken);
                setCheckResult(checkData);
                if (checkData.success) {
                    setStep("result");
                } else {
                    const errMsg =
                        typeof checkData.error === "string"
                            ? checkData.error
                            : "Verification failed — you may not have admin access to this repo.";
                    setError(errMsg);
                    setStep("challenge");
                }
                return;
            }

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
            // Pass Privy access token if available
            let accessToken: string | undefined;
            if (privy?.getAccessToken) {
                const token = await privy.getAccessToken();
                if (token) accessToken = token;
            }

            const data = await apiCheckVerification(challenge.verificationId, accessToken);
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
            setCheckResult((prev) => (prev ? { ...prev, ...data } : prev));
        } catch (err) {
            setError(mapVerifyError(err, "Failed to create attestation"));
        } finally {
            setLoading(false);
        }
    }

    const isDev = process.env.NODE_ENV === "development";

    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 flex flex-col">
                {/* Dev Mode Indicator */}
                {isDev && (
                    <div className="absolute top-2 right-2 z-50 px-2 py-1 bg-primary/90 text-primary-foreground text-xs font-mono">
                        Shift+D: cycle steps
                    </div>
                )}

                {/* Channels Bar */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="flex flex-col sm:flex-row bg-lavender/30 border-border border-b"
                >
                    {CHANNELS.map((channel) => (
                        <div
                            key={channel.name}
                            className={cn(
                                "flex-1 px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-center gap-2",
                                "border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                            )}
                        >
                            <span className="text-sm font-medium text-foreground">
                                {channel.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                                {channel.method}
                            </Badge>
                        </div>
                    ))}
                </PixelCard>

                {/* Flow Visualization */}
                <div className="border-border border-b px-6 py-8 lg:px-12 lg:py-12 bg-background">
                    <div className="max-w-3xl mx-auto">
                        <p className="mb-4 text-center text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                            verification pipeline
                        </p>
                        {/* Flow Diagram */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-0">
                            {/* Node 1: Select Channel */}
                            <div
                                className={cn(
                                    "flex flex-col items-center",
                                    stepIndex >= 0 ? "opacity-100" : "opacity-40",
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-28 h-20 sm:w-32 sm:h-24 border-2 flex flex-col items-center justify-center text-center px-2 gap-0.5",
                                        stepIndex === 0
                                            ? "border-primary bg-primary/10"
                                            : stepIndex > 0
                                                ? "border-primary/50 bg-sage/50"
                                                : "border-border bg-background",
                                    )}
                                >
                                    <span className="text-xs font-bold text-primary">01</span>
                                    <span className="text-[11px] font-semibold tracking-[0.12em] text-foreground uppercase">
                                        channel
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
                                        select source
                                    </span>
                                </div>
                            </div>

                            {/* Connector */}
                            <div
                                className={cn(
                                    "w-px h-6 sm:w-8 sm:h-px",
                                    stepIndex >= 1 ? "bg-primary" : "bg-border",
                                )}
                            />

                            {/* Node 2: Enter Details */}
                            <div
                                className={cn(
                                    "flex flex-col items-center",
                                    stepIndex >= 1 ? "opacity-100" : "opacity-40",
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-28 h-20 sm:w-32 sm:h-24 border-2 flex flex-col items-center justify-center text-center px-2 gap-0.5",
                                        stepIndex === 1
                                            ? "border-primary bg-primary/10"
                                            : stepIndex > 1
                                                ? "border-primary/50 bg-sage/50"
                                                : "border-border bg-background",
                                    )}
                                >
                                    <span className="text-xs font-bold text-primary">02</span>
                                    <span className="text-[11px] font-semibold tracking-[0.12em] text-foreground uppercase">
                                        details
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
                                        project + wallet
                                    </span>
                                </div>
                            </div>

                            {/* Connector */}
                            <div
                                className={cn(
                                    "w-px h-6 sm:w-8 sm:h-px",
                                    stepIndex >= 2 ? "bg-primary" : "bg-border",
                                )}
                            />

                            {/* Node 3: Verify */}
                            <div
                                className={cn(
                                    "flex flex-col items-center",
                                    stepIndex >= 2 ? "opacity-100" : "opacity-40",
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-28 h-20 sm:w-32 sm:h-24 border-2 flex flex-col items-center justify-center text-center px-2 gap-0.5",
                                        stepIndex === 2
                                            ? "border-primary bg-primary/10"
                                            : stepIndex > 2
                                                ? "border-primary/50 bg-sage/50"
                                                : "border-border bg-background",
                                    )}
                                >
                                    <span className="text-xs font-bold text-primary">03</span>
                                    <span className="text-[11px] font-semibold tracking-[0.12em] text-foreground uppercase">
                                        verify
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
                                        prove control
                                    </span>
                                </div>
                            </div>

                            {/* Connector */}
                            <div
                                className={cn(
                                    "w-px h-6 sm:w-8 sm:h-px",
                                    stepIndex >= 3 ? "bg-primary" : "bg-border",
                                )}
                            />

                            {/* Node 4: Stamp */}
                            <div
                                className={cn(
                                    "flex flex-col items-center",
                                    stepIndex >= 3 ? "opacity-100" : "opacity-40",
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-28 h-20 sm:w-32 sm:h-24 border-2 flex flex-col items-center justify-center text-center px-2 gap-0.5",
                                        stepIndex === 3
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-background",
                                    )}
                                >
                                    <span className="text-xs font-bold text-primary">04</span>
                                    <span className="text-[11px] font-semibold tracking-[0.12em] text-foreground uppercase">
                                        stamp
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
                                        mint onchain
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step Content - fills remaining space */}
                <div className="flex-1 flex flex-col bg-cream/30">
                    {step === "method" && (
                        <MethodStep
                            selectedMethod={selectedMethod}
                            onSelect={setSelectedMethod}
                            onContinue={() => setStep("details")}
                        />
                    )}

                    {step === "details" && selectedMethod && (
                        <DetailsStep
                            method={selectedMethod}
                            projectId={projectId}
                            walletAddress={walletAddress}
                            connectedAddress={address}
                            privy={privy}
                            privyGithubUsername={privyGithubUsername}
                            loading={loading}
                            error={error}
                            onProjectIdChange={setProjectId}
                            onWalletAddressChange={setWalletAddress}
                            onBack={() => setStep("method")}
                            onSubmit={handleCreateChallenge}
                            onClearError={() => setError("")}
                        />
                    )}

                    {step === "challenge" && challenge && (
                        <ChallengeStep
                            challenge={challenge}
                            loading={loading}
                            error={error}
                            onBack={() => setStep("details")}
                            onCheck={handleCheckVerification}
                        />
                    )}

                    {step === "result" && checkResult && challenge && (
                        <ResultStep
                            challenge={challenge}
                            checkResult={checkResult}
                            loading={loading}
                            onClaim={handleClaimAttestation}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

// Re-export types for external use
export type { ChallengeResponse, CheckResult, Method, Step } from "./types";
