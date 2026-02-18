import { AlertTriangle, CheckCircle, FileSearch, Info, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

const findings = [
    {
        severity: "info",
        title: "Centralized Admin Functions",
        description:
            "Some admin functions are controlled by a single address. Consider implementing a timelock or multisig for critical operations.",
        contract: "SigilFeeVault.sol",
        status: "acknowledged",
    },
    {
        severity: "low",
        title: "Missing Zero Address Check",
        description: "The setBuilder function does not validate against zero address input.",
        contract: "SigilFactoryV3.sol",
        status: "fixed",
    },
    {
        severity: "info",
        title: "Gas Optimization Opportunity",
        description: "The claimFees function could be optimized by caching array length in loops.",
        contract: "SigilFeeVault.sol",
        status: "acknowledged",
    },
];

const contracts = [
    { name: "SigilFeeVault.sol", loc: 392, description: "Fee accumulation and claim logic" },
    { name: "SigilLPLocker.sol", loc: 290, description: "LP NFT position locking" },
    { name: "SigilFactoryV3.sol", loc: 352, description: "Token deployment factory" },
    { name: "SigilHook.sol", loc: 350, description: "Uniswap V4 swap hook" },
    { name: "SigilToken.sol", loc: 57, description: "Minimal ERC-20 implementation" },
    { name: "PoolReward.sol", loc: 194, description: "EAS-based reward claims" },
];

const severityBackgrounds = {
    critical: "bg-rose/30",
    high: "bg-rose/20",
    medium: "bg-cream/50",
    low: "bg-lavender/20",
    info: "bg-sage/10",
};

const severityIcons = {
    critical: AlertTriangle,
    high: AlertTriangle,
    medium: AlertTriangle,
    low: Info,
    info: Info,
};

const stats = [
    { count: "0", label: "Critical" },
    { count: "0", label: "High" },
    { count: "1", label: "Low" },
    { count: "2", label: "Informational" },
];

const securityPatterns = [
    "OpenZeppelin ReentrancyGuard on all external functions handling value",
    "Ownable2Step for two-step ownership transfers",
    "SafeERC20 for token transfers",
    "Proper access control with role-based permissions",
    "Event emission for all state changes",
    "Input validation on public functions",
];

export default function AuditPage() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                {/* Hero Header with PixelCard */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-lavender/20"
                >
                    <div className="flex flex-col lg:flex-row">
                        {/* Icon Cell */}
                        <div className="lg:w-32 px-6 py-8 lg:px-0 lg:py-0 flex items-center justify-center border-border border-b lg:border-b-0 lg:border-r">
                            <div className="size-20 bg-lavender/40 border border-border flex items-center justify-center">
                                <Shield className="size-10 text-primary" />
                            </div>
                        </div>

                        {/* Title Section */}
                        <div className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-2">
                                security audit
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground lowercase mb-3">
                                sigil protocol audit report
                            </h1>
                            <p className="text-muted-foreground">
                                Conducted by Claude Opus 4.6 [1m] | February 2026
                            </p>
                        </div>
                    </div>
                </PixelCard>

                {/* Summary Stats - Muted */}
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b bg-background">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex-1 px-6 py-6 lg:px-8 text-center"
                        >
                            <p className="text-3xl font-bold text-foreground mb-1">
                                {stat.count}
                            </p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Executive Summary */}
                <div className="bg-background border-border border-b">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-4 lg:px-8 border-border border-b lg:border-b-0 lg:border-r bg-sage/20">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-sage/40 border border-border flex items-center justify-center">
                                    <FileSearch className="size-5 text-muted-foreground" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    executive summary
                                </h2>
                            </div>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-8">
                            <p className="text-muted-foreground">
                                This audit covers the core Sigil Protocol smart contracts deployed
                                on Base. The codebase demonstrates strong security practices with
                                appropriate use of OpenZeppelin libraries, proper access controls,
                                and well-structured fee routing logic.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Audit Scope */}
                <div className="bg-sage/10">
                    <div className="px-6 py-3 lg:px-8 border-border border-b">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Audit Scope
                        </span>
                    </div>
                    <div className="divide-y divide-border border-border border-b">
                        {contracts.map((contract) => (
                            <div
                                key={contract.name}
                                className="flex items-center justify-between px-6 py-4 lg:px-8 hover:bg-sage/20 transition-colors"
                            >
                                <div>
                                    <p className="font-mono text-sm font-medium text-foreground">
                                        {contract.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {contract.description}
                                    </p>
                                </div>
                                <Badge variant="outline">{contract.loc} LOC</Badge>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-3 lg:px-8 border-border border-b bg-sage/20">
                        <p className="text-sm text-muted-foreground">
                            Total: ~1,635 lines of Solidity code
                        </p>
                    </div>
                </div>

                {/* Findings */}
                <div className="bg-background">
                    <div className="px-6 py-3 lg:px-8 border-border border-b bg-lavender/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Findings
                        </span>
                    </div>
                    <div className="divide-y divide-border border-border border-b">
                        {findings.map((finding, index) => {
                            const Icon =
                                severityIcons[finding.severity as keyof typeof severityIcons];
                            const bgStyle =
                                severityBackgrounds[finding.severity as keyof typeof severityBackgrounds];
                            return (
                                <div
                                    key={`finding-${finding.title.slice(0, 10)}-${index}`}
                                    className={cn("px-6 py-5 lg:px-8", bgStyle)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="size-8 bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
                                            <Icon className="size-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium text-foreground">
                                                    {finding.title}
                                                </h3>
                                                <Badge
                                                    variant={
                                                        finding.status === "fixed"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {finding.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {finding.description}
                                            </p>
                                            <p className="text-xs font-mono text-muted-foreground">
                                                {finding.contract}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Security Patterns */}
                <div className="bg-sage/10">
                    <div className="px-6 py-3 lg:px-8 border-border border-b">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Security Patterns Used
                        </span>
                    </div>
                    <div className="divide-y divide-border border-border border-b">
                        {securityPatterns.map((pattern) => (
                            <div
                                key={pattern}
                                className="flex items-center gap-3 px-6 py-3 lg:px-8 hover:bg-sage/20 transition-colors"
                            >
                                <div className="size-6 bg-sage/30 border border-border flex items-center justify-center shrink-0">
                                    <CheckCircle className="size-3.5 text-muted-foreground" />
                                </div>
                                <span className="text-sm text-muted-foreground">{pattern}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conclusion */}
                <div className="bg-background border-border border-b">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-4 lg:px-8 border-border border-b lg:border-b-0 lg:border-r bg-cream/30">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-cream/50 border border-border flex items-center justify-center">
                                    <CheckCircle className="size-5 text-muted-foreground" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    conclusion
                                </h2>
                            </div>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-8">
                            <p className="text-muted-foreground mb-4">
                                The Sigil Protocol demonstrates a mature approach to smart contract
                                security. No critical or high severity issues were identified. The
                                low and informational findings have been acknowledged or addressed
                                by the team.
                            </p>
                            <p className="text-muted-foreground">
                                The protocol is suitable for mainnet deployment with the
                                understanding that certain admin functions are centralized by
                                design. Users should be aware of the trust assumptions involved.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1 bg-cream/10" />

                {/* Footer */}
                <div className="border-border border-t px-6 py-4 lg:px-8 bg-sage/20">
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                        <Shield className="size-3" />
                        All contracts verified on Basescan. Audit does not guarantee absence of bugs.
                    </p>
                </div>
            </div>
        </section>
    );
}
