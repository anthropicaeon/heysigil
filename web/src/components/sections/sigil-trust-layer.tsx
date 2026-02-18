import Image from "next/image";

import { cn } from "@/lib/utils";

const channels = [
    { abbr: "GH", name: "GitHub", method: "OAuth", icon: "/icons/git-branch-01.svg" },
    { abbr: "X", name: "X / Twitter", method: "zkTLS", icon: "/icons/at-sign.svg" },
    { abbr: "FB", name: "Facebook", method: "OAuth", icon: "/icons/users-01.svg" },
    { abbr: "IG", name: "Instagram", method: "OAuth", icon: "/icons/fingerprint-04.svg" },
    { abbr: "◎", name: "Domain", method: "DNS / File", icon: "/icons/browser.svg" },
];

export default function SigilTrustLayer() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            trust layer
                        </p>
                        <h2 className="text-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                            five channels.
                            <br />
                            no single point of failure.
                        </h2>
                        <p className="text-muted-foreground">
                            the verification standard for the agentic economy can&apos;t depend on
                            one platform&apos;s API. builder legitimacy is confirmed across five
                            independent channels — resilient by architecture.
                        </p>
                    </div>
                </div>

                {/* Channels Grid */}
                <div className="flex flex-col sm:flex-row">
                    {channels.map((channel) => (
                        <div
                            key={channel.abbr}
                            className={cn(
                                "flex-1 p-6 lg:p-8 text-center",
                                "border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                            )}
                        >
                            <Image
                                src={channel.icon}
                                alt=""
                                width={24}
                                height={24}
                                className="mx-auto mb-3 opacity-80"
                            />
                            <p className="text-foreground text-sm font-medium mb-2">
                                {channel.name}
                            </p>
                            <span className="text-primary text-xs font-medium bg-primary/10 px-2 py-0.5 border border-primary/20">
                                {channel.method}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <div className="border-border border-t px-6 py-8 lg:px-12">
                    <p className="text-muted-foreground text-sm text-center max-w-xl mx-auto">
                        X verification via zkTLS — cryptographic proof of account ownership without
                        touching X&apos;s API. no bot. no automation. nothing to revoke.
                    </p>
                </div>
            </div>
        </section>
    );
}
