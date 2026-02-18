import { CheckCircle, Info } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

const channels = [
    {
        abbr: "GH",
        name: "GitHub",
        method: "OAuth",
        icon: "/icons/git-branch-01.svg",
        color: "text-gray-700",
        bg: "bg-gray-50",
    },
    {
        abbr: "X",
        name: "X / Twitter",
        method: "zkTLS",
        icon: "/icons/at-sign.svg",
        color: "text-blue-600",
        bg: "bg-blue-50",
        highlight: true,
    },
    {
        abbr: "FB",
        name: "Facebook",
        method: "OAuth",
        icon: "/icons/users-01.svg",
        color: "text-blue-700",
        bg: "bg-blue-50",
    },
    {
        abbr: "IG",
        name: "Instagram",
        method: "OAuth",
        icon: "/icons/fingerprint-04.svg",
        color: "text-pink-600",
        bg: "bg-pink-50",
    },
    {
        abbr: "◎",
        name: "Domain",
        method: "DNS / File",
        icon: "/icons/browser.svg",
        color: "text-green-600",
        bg: "bg-green-50",
    },
];

export default function SigilTrustLayer() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Header - Enhanced with PixelCard */}
                <PixelCard
                    variant="sage"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-sage/20"
                >
                    <div className="px-6 py-12 lg:px-12 lg:py-16">
                        <div className="max-w-2xl mx-auto text-center">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                                trust layer
                            </p>
                            <h2 className="text-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                five channels.
                                <br />
                                <span className="text-primary">no single point of failure.</span>
                            </h2>
                            <p className="text-muted-foreground">
                                the verification standard for the agentic economy can&apos;t depend on
                                one platform&apos;s API. builder legitimacy is confirmed across five
                                independent channels — resilient by architecture.
                            </p>
                        </div>
                    </div>
                </PixelCard>

                {/* Channels Grid - Enhanced */}
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
                    {channels.map((channel) => (
                        <div
                            key={channel.abbr}
                            className={cn(
                                "flex-1 flex flex-col",
                                channel.highlight && "bg-blue-50/30",
                            )}
                        >
                            {/* Channel Header */}
                            <div className="px-6 py-4 lg:px-8 border-border border-b flex items-center justify-center gap-2">
                                <div className={cn("size-8 flex items-center justify-center border border-border", channel.bg)}>
                                    <Image
                                        src={channel.icon}
                                        alt=""
                                        width={16}
                                        height={16}
                                    />
                                </div>
                                <CheckCircle className="size-4 text-green-500" />
                            </div>

                            {/* Channel Content */}
                            <div className="flex-1 p-6 lg:p-8 text-center">
                                <p className="text-foreground text-sm font-medium mb-2">
                                    {channel.name}
                                </p>
                                <Badge
                                    variant={channel.highlight ? "default" : "outline"}
                                    className={cn(
                                        "text-xs",
                                        channel.highlight && "bg-primary",
                                    )}
                                >
                                    {channel.method}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Note - Enhanced */}
                <div className="border-border border-t bg-lavender/10">
                    <div className="px-6 py-6 lg:px-12 flex items-start gap-3 max-w-2xl mx-auto">
                        <div className="size-8 bg-amber-50 border border-border flex items-center justify-center shrink-0">
                            <Info className="size-4 text-amber-600" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            <strong className="text-foreground">X verification via zkTLS</strong> — cryptographic proof of account ownership without
                            touching X&apos;s API. no bot. no automation. nothing to revoke.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
