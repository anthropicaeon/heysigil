/**
 * DetailsStep Component
 *
 * Step 2: Enter project ID and wallet address.
 * Border-centric design with proper section headers and divided lists.
 */

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PrivyContext } from "@/hooks/useOptionalPrivy";

import type { Method } from "../types";

interface DetailsStepProps {
    method: Method;
    projectId: string;
    walletAddress: string;
    connectedAddress: string | null;
    privy: PrivyContext | null;
    privyGithubUsername: string | null;
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
    privyGithubUsername,
    loading,
    error,
    onProjectIdChange,
    onWalletAddressChange,
    onBack,
    onSubmit,
    onClearError,
}: DetailsStepProps) {
    const isConnected = !!connectedAddress;
    const isGithubMethod = method.id === "github_oauth" || method.id === "github_file";
    const hasPrivyGithub = isGithubMethod && !!privyGithubUsername;

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Section Header */}
            <div className="px-6 py-3 lg:px-12 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step 2 — Project Details
                </span>
            </div>

            {/* Title Section */}
            <div className="px-6 py-6 lg:px-12 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground lowercase mb-1">
                    enter project information
                </h2>
                <p className="text-sm text-muted-foreground">
                    Provide your project identifier and fee routing address
                </p>
            </div>

            {/* GitHub Verified Badge */}
            {hasPrivyGithub && (
                <div className="px-6 py-3 lg:px-12 border-b border-border bg-sage/30">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-primary font-medium">✓</span>
                        <span className="text-foreground">
                            Signed in as <strong>{privyGithubUsername}</strong> on GitHub — your
                            identity is already verified
                        </span>
                    </div>
                </div>
            )}

            {/* Project Identifier Section */}
            <div className="px-6 py-2 lg:px-12 border-b border-border bg-sage/20">
                <label
                    htmlFor="project"
                    className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                    Project Identifier
                </label>
            </div>
            <div className="px-6 py-4 lg:px-12 border-b border-border">
                <Input
                    id="project"
                    placeholder={method.projectIdFormat}
                    value={projectId}
                    onChange={(e) => {
                        let val = e.target.value.trim();
                        // Auto-fix GitHub URLs → owner/repo
                        if (method.id === "github_oauth" || method.id === "github_file") {
                            val = val
                                .replace(/^https?:\/\/(www\.)?github\.com\//, "")
                                .replace(/\.git$/, "")
                                .replace(/\/+$/, "");
                        }
                        onProjectIdChange(val);
                    }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Format: <code className="bg-secondary/50 px-1.5 py-0.5">{method.projectIdFormat}</code>
                </p>
            </div>

            {/* Wallet Address Section */}
            <div className="px-6 py-2 lg:px-12 border-b border-border bg-sage/20">
                <label
                    htmlFor="wallet"
                    className="text-xs text-muted-foreground uppercase tracking-wider"
                >
                    Wallet Address
                </label>
            </div>
            <div className="px-6 py-4 lg:px-12 border-b border-border">
                <div className="space-y-3">
                    <Input
                        id="wallet"
                        placeholder="0x..."
                        value={walletAddress}
                        onChange={(e) => onWalletAddressChange(e.target.value)}
                        className="font-mono"
                    />
                    <div className="flex items-center gap-3">
                        {isConnected && connectedAddress && walletAddress !== connectedAddress && (
                            <button
                                type="button"
                                onClick={() => onWalletAddressChange(connectedAddress)}
                                className="text-xs text-primary hover:underline"
                            >
                                Reset to connected wallet
                            </button>
                        )}
                        {privy && !privy.authenticated && (
                            <Button variant="outline" size="sm" onClick={() => privy.login?.()}>
                                Sign In to Auto-fill
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Note */}
            <div className="px-6 py-3 lg:px-12 bg-cream/30 border-b border-border">
                <p className="text-xs text-muted-foreground">
                    Your wallet address is where USDC fees will be routed after verification
                </p>
            </div>

            {/* Error State */}
            {error && (
                <div className="px-6 py-4 lg:px-12 bg-red-50 border-b border-border">
                    <div className="flex items-start justify-between">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            type="button"
                            onClick={onClearError}
                            className="text-red-700 hover:text-red-900"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Actions - fills remaining space */}
            <div className="flex-1 flex flex-col px-6 py-6 lg:px-12 bg-sage/20">
                <div className="flex-1" />
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={!projectId || !walletAddress || loading}
                        className="flex-1"
                    >
                        {loading ? (
                            <>
                                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                Creating...
                            </>
                        ) : method.requiresOAuth ? (
                            "Authorize"
                        ) : (
                            "Get Instructions"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
