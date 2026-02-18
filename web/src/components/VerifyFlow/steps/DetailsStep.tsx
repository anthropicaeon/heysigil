/**
 * DetailsStep Component
 *
 * Step 2: Enter project ID and wallet address.
 * Updated with pastel design system.
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
        <div className="bg-background">
            <div className="border-border border-b px-6 py-6 lg:px-12">
                <h2 className="text-lg font-semibold text-foreground lowercase">project details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Enter your project information and fee routing address
                </p>
            </div>

            {/* GitHub Verified Badge */}
            {hasPrivyGithub && (
                <div className="border-border border-b px-6 py-3 lg:px-12 bg-sage/50">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-primary font-medium">✓</span>
                        <span className="text-foreground">
                            Signed in as <strong>{privyGithubUsername}</strong> on GitHub — your
                            identity is already verified
                        </span>
                    </div>
                </div>
            )}

            {/* Project Identifier */}
            <div className="border-border border-b">
                <div className="px-6 py-3 lg:px-12 border-border border-b bg-secondary/30">
                    <label
                        htmlFor="project"
                        className="text-xs text-muted-foreground uppercase tracking-wider"
                    >
                        Project Identifier
                    </label>
                </div>
                <div className="px-6 py-4 lg:px-12">
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
                        Format: {method.projectIdFormat}
                    </p>
                </div>
            </div>

            {/* Wallet Address */}
            <div className="border-border border-b">
                <div className="px-6 py-3 lg:px-12 border-border border-b bg-secondary/30">
                    <label
                        htmlFor="wallet"
                        className="text-xs text-muted-foreground uppercase tracking-wider"
                    >
                        Wallet Address
                    </label>
                </div>
                <div className="px-6 py-4 lg:px-12">
                    {isConnected && connectedAddress ? (
                        <div className="py-2.5 px-3 border border-border bg-sage/30 font-mono text-sm text-foreground">
                            {connectedAddress}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Input
                                id="wallet"
                                placeholder="0x..."
                                value={walletAddress}
                                onChange={(e) => onWalletAddressChange(e.target.value)}
                                className="font-mono"
                            />
                            {privy && !privy.authenticated && (
                                <Button variant="outline" size="sm" onClick={() => privy.login?.()}>
                                    Sign In to Auto-fill
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 py-4 lg:px-12 bg-sage/30 border-border border-b">
                <p className="text-xs text-muted-foreground">
                    Your wallet address is where USDC fees will be routed after verification
                </p>
            </div>

            {error && (
                <div className="px-6 py-4 lg:px-12 bg-rose/30 border-border border-t">
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

            <div className="border-border border-t px-6 py-6 lg:px-12 flex gap-3">
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
    );
}
