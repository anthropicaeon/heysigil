import { AlertTriangle, CheckCircle, Info, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

const severityBorders = {
    critical: "border-l-4 border-l-red-500",
    high: "border-l-4 border-l-orange-500",
    medium: "border-l-4 border-l-yellow-500",
    low: "border-l-4 border-l-blue-500",
    info: "border-l-4 border-l-gray-400",
};

const severityIcons = {
    critical: AlertTriangle,
    high: AlertTriangle,
    medium: AlertTriangle,
    low: Info,
    info: Info,
};

const severityIconColors = {
    critical: "text-red-500",
    high: "text-orange-500",
    medium: "text-yellow-500",
    low: "text-blue-500",
    info: "text-gray-500",
};

export default function AuditPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            security audit
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            sigil protocol audit report
                        </h1>
                        <p className="text-muted-foreground">
                            Conducted by Claude Opus 4.6 [1m] | February 2026
                        </p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="border-border border-b flex flex-col sm:flex-row">
                    {[
                        { count: "0", label: "Critical", color: "text-red-500" },
                        { count: "0", label: "High", color: "text-orange-500" },
                        { count: "1", label: "Low", color: "text-blue-500" },
                        { count: "2", label: "Informational", color: "text-muted-foreground" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="flex-1 px-6 py-6 lg:px-8 text-center border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0"
                        >
                            <p className={cn("text-3xl font-bold mb-1", stat.color)}>
                                {stat.count}
                            </p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Executive Summary */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-6 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <h2 className="text-lg font-semibold text-foreground lowercase">
                                executive summary
                            </h2>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-12 border-border border-b">
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
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            audit scope
                        </h2>
                    </div>
                    <div className="divide-y divide-border border-border border-b">
                        {contracts.map((contract) => (
                            <div
                                key={contract.name}
                                className="flex items-center justify-between px-6 py-4 lg:px-12"
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
                    <div className="px-6 py-3 lg:px-12 border-border border-b">
                        <p className="text-sm text-muted-foreground">
                            Total: ~1,635 lines of Solidity code
                        </p>
                    </div>
                </div>

                {/* Findings */}
                <div className="bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            findings
                        </h2>
                    </div>
                    <div className="divide-y divide-border border-border border-b">
                        {findings.map((finding, index) => {
                            const Icon =
                                severityIcons[finding.severity as keyof typeof severityIcons];
                            const iconColor =
                                severityIconColors[
                                    finding.severity as keyof typeof severityIconColors
                                ];
                            const borderStyle =
                                severityBorders[finding.severity as keyof typeof severityBorders];
                            return (
                                <div
                                    key={`finding-${finding.title.slice(0, 10)}-${index}`}
                                    className={cn("px-6 py-5 lg:px-12", borderStyle)}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon className={cn("size-5 mt-0.5 shrink-0", iconColor)} />
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
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            security patterns used
                        </h2>
                    </div>
                    <div className="divide-y divide-border border-border border-b">
                        {[
                            "OpenZeppelin ReentrancyGuard on all external functions handling value",
                            "Ownable2Step for two-step ownership transfers",
                            "SafeERC20 for token transfers",
                            "Proper access control with role-based permissions",
                            "Event emission for all state changes",
                            "Input validation on public functions",
                        ].map((pattern) => (
                            <div
                                key={pattern}
                                className="flex items-center gap-3 px-6 py-3 lg:px-12"
                            >
                                <CheckCircle className="size-4 text-green-600 shrink-0" />
                                <span className="text-sm text-muted-foreground">{pattern}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conclusion */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-6 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <h2 className="text-lg font-semibold text-foreground lowercase">
                                conclusion
                            </h2>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-12 border-border border-b">
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

                {/* Footer */}
                <div className="px-6 py-4 lg:px-12 bg-cream/50">
                    <p className="text-xs text-muted-foreground text-center">
                        <Shield className="size-3 inline mr-1" />
                        All contracts verified on Basescan. Audit does not guarantee absence of
                        bugs.
                    </p>
                </div>
            </div>
        </section>
    );
}
