import { ArrowRight, Check, Code2, Copy, ExternalLink, Package, Terminal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        logo: "P",
    },
    {
        name: "EAS",
        description: "Ethereum Attestation Service",
        status: "live",
        logo: "E",
    },
    {
        name: "Base",
        description: "L2 deployment and transactions",
        status: "live",
        logo: "B",
    },
    {
        name: "Uniswap V4",
        description: "LP hooks and fee routing",
        status: "live",
        logo: "U",
    },
    {
        name: "The Graph",
        description: "Indexing and querying",
        status: "coming",
        logo: "G",
    },
    {
        name: "Chainlink",
        description: "Price feeds and automation",
        status: "coming",
        logo: "C",
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
        <section className="min-h-screen bg-lavender/50 relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
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
                </div>

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
                    <div className="px-6 py-6 lg:px-12">
                        {/* Briefing Card: Code Block */}
                        <div className="max-w-3xl">
                            <div className="border border-border bg-background">
                                <div className="px-4 py-2 border-border border-b bg-secondary/30 flex items-center gap-2">
                                    <Code2 className="size-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        example.ts
                                    </span>
                                    <button
                                        type="button"
                                        className="ml-auto text-muted-foreground hover:text-foreground"
                                    >
                                        <Copy className="size-4" />
                                    </button>
                                </div>
                                <pre className="px-4 py-4 text-sm overflow-x-auto">
                                    <code className="text-foreground">{codeExample}</code>
                                </pre>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                The SDK handles all attestation queries, signature verification, and
                                onchain interactions. See the{" "}
                                <Link href="/developers" className="text-primary hover:underline">
                                    developer docs
                                </Link>{" "}
                                for the full API reference.
                            </p>
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
    logo: string;
}

function IntegrationBriefingCard({ integration }: { integration: Integration }) {
    const isLive = integration.status === "live";
    return (
        <div className="flex items-start gap-4">
            <div
                className={cn(
                    "size-12 flex items-center justify-center font-bold text-lg",
                    isLive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
                )}
            >
                {integration.logo}
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
