/**
 * DetailsStep Component
 *
 * Step 2: Enter project ID and wallet address.
 */

import type { Method } from "../types";
import type { PrivyContext } from "@/hooks/useOptionalPrivy";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { LoadingButton } from "@/components/common/LoadingButton";

interface DetailsStepProps {
    method: Method;
    projectId: string;
    walletAddress: string;
    connectedAddress: string | null;
    privy: PrivyContext | null;
    loading: boolean;
    error: string;
    onProjectIdChange: (value: string) => void;
    onWalletAddressChange: (value: string) => void;
    onBack: () => void;
    onSubmit: () => void;
    onClearError: () => void;
}

export function DetailsStep({
    method,
    projectId,
    walletAddress,
    connectedAddress,
    privy,
    loading,
    error,
    onProjectIdChange,
    onWalletAddressChange,
    onBack,
    onSubmit,
    onClearError,
}: DetailsStepProps) {
    const isConnected = !!connectedAddress;

    return (
        <div>
            <h2 style={{ marginBottom: "var(--space-4)" }}>Project Details</h2>
            <div className="card">
                <div className="form-group">
                    <label>Project Identifier</label>
                    <input
                        type="text"
                        placeholder={method.projectIdFormat}
                        value={projectId}
                        onChange={(e) => onProjectIdChange(e.target.value)}
                    />
                    <span
                        style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--text-tertiary)",
                            marginTop: "var(--space-1)",
                            display: "block",
                        }}
                    >
                        Format: {method.projectIdFormat}
                    </span>
                </div>
                <div className="form-group">
                    <label>Wallet Address</label>
                    {isConnected && connectedAddress ? (
                        <div style={{
                            padding: "var(--space-3)",
                            background: "var(--bg-tertiary)",
                            borderRadius: "var(--radius-md)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-sm)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border)",
                        }}>
                            {connectedAddress}
                        </div>
                    ) : (
                        <div>
                            <input
                                type="text"
                                placeholder="0x... (or sign in to auto-fill)"
                                value={walletAddress}
                                onChange={(e) => onWalletAddressChange(e.target.value)}
                            />
                            {privy && !privy.authenticated && (
                                <div style={{ marginTop: "var(--space-2)" }}>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => privy.login?.()}
                                        style={{ fontSize: "var(--text-xs)", padding: "var(--space-1) var(--space-3)" }}
                                    >
                                        Sign In to Auto-fill
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {error && <ErrorAlert error={error} onDismiss={onClearError} />}
            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <button type="button" className="btn-secondary" onClick={onBack}>
                    Back
                </button>
                <LoadingButton
                    loading={loading}
                    disabled={!projectId || !walletAddress}
                    onClick={onSubmit}
                    loadingText="Creating..."
                    style={{ flex: 1 }}
                >
                    {method.requiresOAuth ? "Authorize" : "Get Instructions"}
                </LoadingButton>
            </div>
        </div>
    );
}
