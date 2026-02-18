import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const Hero = () => {
    return (
        <section id="hero" className="bg-obsidian relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-r-dark-gray border-l-dark-gray relative container border px-5">
                <div className="group pointer-events-none absolute inset-0 flex size-full flex-col items-center justify-center self-start">
                    <Image
                        src="/images/homepage/hero-background.webp"
                        alt={`hero background`}
                        fill
                        className="size-full object-cover"
                    />
                </div>
                <div className="grid gap-12 py-12 lg:grid-cols-[1fr_auto] lg:py-20 lg:pl-12">
                    <div className="flex flex-col items-start justify-center gap-5 lg:gap-8">
                        <h1 className="text-foreground text-3xl tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                            All Your Financial Accounts in One Unified Dashboard
                        </h1>

                        <p className="font-inter-tight text-mid-gray text-base md:text-lg lg:text-xl">
                            Aggregate every bank, subsidiary, and currency in real time. Monitor
                            balances, track cash flow, and gain actionable insights—all without
                            juggling multiple logins.
                        </p>

                        <div className="flex flex-wrap items-start gap-4">
                            <Button aria-label="Get started">
                                <Link href="/pricing">Try for free</Link>
                            </Button>
                            <Button aria-label="Get started" variant={"secondary"}>
                                <Link href="/pricing">Book a demo</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="bg-overlay-gray rounded-sm p-2 sm:p-3 md:p-4 lg:rounded-md">
                        <div className="relative [522/572] size-full overflow-hidden rounded-sm lg:min-h-[572px] lg:min-w-[522px] lg:rounded-md">
                            <Image
                                src="/images/homepage/hero-image.webp"
                                alt={`Aspect product interface showing connected banks`}
                                fill
                                className="object-cover object-left-top"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
