import { ArrowRight, Check, Code2, Copy, ExternalLink, Package, Terminal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

// Official brand logos as SVG components
function BaseLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 111 111"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z"
                fill="#0052FF"
            />
        </svg>
    );
}

function EASLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="50" cy="50" r="45" stroke="#10B981" strokeWidth="6" fill="none" />
            <path
                d="M30 52L45 67L72 35"
                stroke="#10B981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

function PrivyLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="100" height="100" rx="12" fill="#8B5CF6" />
            <path
                d="M30 75V25H50C55.304 25 60.391 27.107 64.142 30.858C67.893 34.609 70 39.696 70 45C70 50.304 67.893 55.391 64.142 59.142C60.391 62.893 55.304 65 50 65H30"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <line x1="30" y1="45" x2="50" y2="45" stroke="white" strokeWidth="8" />
        </svg>
    );
}

function UniswapLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="50" cy="50" r="50" fill="#FF007A" />
            <path
                d="M35 30C35 30 32 40 35 50C38 60 45 65 50 65C55 65 60 60 60 50C60 40 55 35 50 35C45 35 42 38 40 42"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="42" cy="38" r="3" fill="white" />
            <path
                d="M50 65C50 65 55 70 65 70C75 70 78 62 78 55C78 48 72 45 65 48"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
            <path d="M55 25L60 20L65 28L55 25Z" fill="white" />
        </svg>
    );
}

function TheGraphLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="50" cy="50" r="45" fill="#6747ED" />
            <circle cx="50" cy="35" r="8" fill="white" />
            <circle cx="35" cy="60" r="6" fill="white" />
            <circle cx="65" cy="60" r="6" fill="white" />
            <line x1="50" y1="43" x2="38" y2="55" stroke="white" strokeWidth="3" />
            <line x1="50" y1="43" x2="62" y2="55" stroke="white" strokeWidth="3" />
        </svg>
    );
}

function ChainlinkLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <polygon
                points="50,10 90,30 90,70 50,90 10,70 10,30"
                fill="#375BD2"
            />
            <polygon
                points="50,25 75,38 75,62 50,75 25,62 25,38"
                fill="white"
            />
            <polygon
                points="50,35 65,43 65,57 50,65 35,57 35,43"
                fill="#375BD2"
            />
        </svg>
    );
}

const logoComponents: Record<string, React.FC<{ className?: string }>> = {
    Base: BaseLogo,
    EAS: EASLogo,
    Privy: PrivyLogo,
    "Uniswap V4": UniswapLogo,
    "The Graph": TheGraphLogo,
    Chainlink: ChainlinkLogo,
};

const sdks = [
    {
        name: "JavaScript/TypeScript",
        package: "@sigil/sdk",
        version: "1.2.0",
        install: "npm install @sigil/sdk",
        docs: "/docs/sdk/javascript",
    },
    {
        name: "Python",
        package: "sigil-sdk",
        version: "1.1.0",
        install: "pip install sigil-sdk",
        docs: "/docs/sdk/python",
    },
    {
        name: "Solidity",
        package: "@sigil/contracts",
        version: "1.0.0",
        install: "forge install sigil-protocol/contracts",
        docs: "/docs/sdk/solidity",
    },
];

const integrations = [
    {
        name: "Privy",
        description: "Embedded wallets and authentication",
        status: "live",
    },
    {
        name: "EAS",
        description: "Ethereum Attestation Service",
        status: "live",
    },
    {
        name: "Base",
        description: "L2 deployment and transactions",
        status: "live",
    },
    {
        name: "Uniswap V4",
        description: "LP hooks and fee routing",
        status: "live",
    },
    {
        name: "The Graph",
        description: "Indexing and querying",
        status: "coming",
    },
    {
        name: "Chainlink",
        description: "Price feeds and automation",
        status: "coming",
    },
];

const codeExample = `import { SigilClient } from '@sigil/sdk';

// Initialize client
const sigil = new SigilClient({
  chainId: 8453, // Base
  apiKey: process.env.SIGIL_API_KEY
});

// Verify a builder's attestation
const attestation = await sigil.getAttestation({
  address: '0x1234...abcd'
});

console.log(attestation.score); // 1-5
console.log(attestation.channels); // ['github', 'x', ...]
console.log(attestation.verified); // true`;

export default function IntegrationsPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-lavender/30"
                >
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            integrations
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            build with sigil
                        </h1>
                        <p className="text-muted-foreground">
                            SDKs, APIs, and integrations to add verification to your protocol. Query
                            attestations, verify builders, and integrate fee routing.
                        </p>
                    </div>
                </PixelCard>

                {/* SDK Cards */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            official sdks
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                        {sdks.map((sdk) => (
                            <div key={sdk.name} className="px-6 py-6 lg:px-8">
                                {/* Briefing Card: Package Info */}
                                <SDKBriefingCard sdk={sdk} />
                                <h3 className="font-medium text-foreground mt-4">{sdk.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="text-xs text-muted-foreground">
                                        {sdk.package}
                                    </code>
                                    <Badge variant="outline" className="text-xs">
                                        v{sdk.version}
                                    </Badge>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-3 py-2 border border-border">
                                    <Terminal className="size-3" />
                                    <code className="flex-1">{sdk.install}</code>
                                    <button type="button" className="hover:text-foreground">
                                        <Copy className="size-3" />
                                    </button>
                                </div>
                                <Link
                                    href={sdk.docs}
                                    className="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline"
                                >
                                    Documentation
                                    <ArrowRight className="size-3" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Code Example */}
                <div className="border-border border-b bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            quick start
                        </h2>
                    </div>
                    <div className="grid lg:grid-cols-[1fr,auto] divide-y lg:divide-y-0 lg:divide-x divide-border">
                        {/* Code Block - Full Width in Container */}
                        <div className="bg-background">
                            <div className="px-6 py-2 lg:px-12 border-border border-b bg-secondary/30 flex items-center gap-2">
                                <Code2 className="size-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">example.ts</span>
                                <button
                                    type="button"
                                    className="ml-auto text-muted-foreground hover:text-foreground"
                                >
                                    <Copy className="size-4" />
                                </button>
                            </div>
                            <pre className="px-6 py-6 lg:px-12 text-sm overflow-x-auto">
                                <code className="text-foreground">{codeExample}</code>
                            </pre>
                        </div>
                        {/* Description Sidebar */}
                        <div className="lg:w-80 px-6 py-6 lg:px-8 bg-sage/50">
                            <p className="text-sm text-muted-foreground mb-4">
                                The SDK handles all attestation queries, signature verification, and
                                onchain interactions.
                            </p>
                            <Link
                                href="/developers"
                                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                View full API reference
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Ecosystem Integrations */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            ecosystem
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3">
                        {integrations.map((integration, i) => (
                            <div
                                key={integration.name}
                                className={cn(
                                    "px-6 py-6 border-border",
                                    i < 3 && "border-b",
                                    i % 3 !== 2 && "lg:border-r",
                                    i % 2 === 0 && "sm:border-r lg:border-r-0",
                                    i < 4 && "sm:border-b lg:border-b-0",
                                    i < 3 && "lg:border-b",
                                )}
                            >
                                {/* Briefing Card: Integration Status */}
                                <IntegrationBriefingCard integration={integration} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* API Endpoints */}
                <div className="bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            api endpoints
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        <APIEndpointRow
                            method="GET"
                            endpoint="/v1/attestation/:address"
                            description="Get verification attestation for an address"
                        />
                        <APIEndpointRow
                            method="GET"
                            endpoint="/v1/builder/:address"
                            description="Get builder profile and stats"
                        />
                        <APIEndpointRow
                            method="GET"
                            endpoint="/v1/project/:id"
                            description="Get project verification details"
                        />
                        <APIEndpointRow
                            method="POST"
                            endpoint="/v1/verify/initiate"
                            description="Start a new verification flow"
                        />
                        <APIEndpointRow
                            method="GET"
                            endpoint="/v1/fees/:address"
                            description="Get claimable fees for an address"
                        />
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-t">
                        <Link
                            href="/developers"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            View full API reference
                            <ExternalLink className="size-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

interface SDK {
    name: string;
    package: string;
    version: string;
    install: string;
    docs: string;
}

function SDKBriefingCard({ sdk }: { sdk: SDK }) {
    const versionNum = parseFloat(sdk.version);
    const progressWidth = Math.min(versionNum * 20, 100);
    return (
        <div className="h-20 border border-border bg-secondary/20 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <div className="flex-1 h-2 bg-primary/20">
                    <div className="h-full bg-primary" style={{ width: `${progressWidth}%` }} />
                </div>
            </div>
            <div className="flex items-center gap-1">
                {[1, 2, 3].map((n) => (
                    <div key={n} className="flex-1 h-1.5 bg-primary/30" />
                ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{sdk.package}</span>
                <span>v{sdk.version}</span>
            </div>
        </div>
    );
}

interface Integration {
    name: string;
    description: string;
    status: string;
}

function IntegrationBriefingCard({ integration }: { integration: Integration }) {
    const isLive = integration.status === "live";
    const LogoComponent = logoComponents[integration.name];

    return (
        <div className="flex items-start gap-4">
            <div
                className={cn(
                    "size-12 flex items-center justify-center overflow-hidden",
                    isLive ? "bg-white" : "bg-secondary",
                )}
            >
                {LogoComponent ? (
                    <LogoComponent className={cn("size-10", !isLive && "opacity-50 grayscale")} />
                ) : (
                    <span className="font-bold text-lg text-muted-foreground">
                        {integration.name.charAt(0)}
                    </span>
                )}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{integration.name}</h3>
                    <Badge
                        variant={isLive ? "default" : "outline"}
                        className={cn("text-xs", isLive && "bg-green-100 text-green-700")}
                    >
                        {isLive ? (
                            <>
                                <Check className="size-3 mr-1" />
                                Live
                            </>
                        ) : (
                            "Coming Soon"
                        )}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                {isLive && (
                    <div className="mt-3 flex items-center gap-1">
                        <div className="size-2 bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-600">Connected</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function APIEndpointRow({
    method,
    endpoint,
    description,
}: {
    method: string;
    endpoint: string;
    description: string;
}) {
    const methodColors: Record<string, string> = {
        GET: "bg-green-100 text-green-700",
        POST: "bg-blue-100 text-blue-700",
        PUT: "bg-yellow-100 text-yellow-700",
        DELETE: "bg-red-100 text-red-700",
    };

    return (
        <div className="px-6 py-4 lg:px-12 flex items-center gap-4">
            <Badge className={cn("text-xs font-mono", methodColors[method])}>{method}</Badge>
            <code className="text-sm font-mono text-foreground flex-1">{endpoint}</code>
            <span className="text-sm text-muted-foreground hidden md:block">{description}</span>
        </div>
    );
}
