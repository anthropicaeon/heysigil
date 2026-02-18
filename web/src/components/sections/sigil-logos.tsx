import { Blocks } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const logos = [
    { name: "Base", src: "/images/logos/base.svg" },
    { name: "EAS", src: "/images/logos/eas.svg" },
    { name: "Privy", src: "/images/logos/privy.svg" },
    { name: "Uniswap", src: "/images/logos/uniswap.svg" },
];

export default function SigilLogos() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                <div className="flex flex-col sm:flex-row">
                    {/* Label - Enhanced */}
                    <div className="px-6 py-4 lg:px-8 border-border border-b sm:border-b-0 sm:border-r flex items-center gap-2 bg-cream/30">
                        <Blocks className="size-4 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm whitespace-nowrap font-medium">
                            Built on
                        </p>
                    </div>
                    {/* Logos - Enhanced */}
                    {logos.map((logo) => (
                        <div
                            key={logo.name}
                            className={cn(
                                "flex-1 px-6 py-5 lg:px-8 flex items-center justify-center",
                                "border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                                "hover:bg-sage/10 transition-colors group",
                            )}
                        >
                            <Image
                                src={logo.src}
                                alt={logo.name}
                                width={100}
                                height={32}
                                className="h-6 w-auto object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
