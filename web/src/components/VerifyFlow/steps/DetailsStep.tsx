/**
 * DetailsStep Component
 *
 * Step 2: Enter project ID and wallet address.
 */

import type { Method } from "../types";
import type { PrivyContext } from "@/hooks/useOptionalPrivy";

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
            {error && (
                <div className="result-box result-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: "var(--error)", fontSize: "var(--text-sm)", margin: 0 }}>{error}</p>
                    <button
                        type="button"
                        onClick={onClearError}
                        style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "1.2em", padding: "0 var(--space-1)" }}
                        aria-label="Dismiss error"
                    >
                        {"\u00D7"}
                    </button>
                </div>
            )}
            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <button type="button" className="btn-secondary" onClick={onBack}>
                    Back
                </button>
                <button
                    type="button"
                    className="btn-primary"
                    disabled={!projectId || !walletAddress || loading}
                    onClick={onSubmit}
                    style={{ flex: 1 }}
                >
                    {loading ? "Creating..." : method.requiresOAuth ? "Authorize" : "Get Instructions"}
                </button>
            </div>
        </div>
    );
}
