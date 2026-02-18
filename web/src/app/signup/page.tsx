import { ArrowRight, CheckCircle, Shield, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";

export default function SignupPage() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                {/* Hero Header */}
                <PixelCard
                    variant="sage"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-sage/30"
                >
                    <div className="max-w-2xl mx-auto text-center">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6">
                            <Image
                                src="/logo-sage.png"
                                alt="Sigil"
                                width={40}
                                height={40}
                                className="rounded"
                            />
                            <span className="text-2xl font-semibold text-foreground">Sigil</span>
                        </Link>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            get started
                        </h1>
                        <p className="text-muted-foreground">
                            Verify your identity to start earning USDC fees
                        </p>
                    </div>
                </PixelCard>

                {/* Main Content Section */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        {/* Wallet Auth Info */}
                        <div className="lg:w-1/2 px-6 py-10 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <div className="max-w-sm mx-auto lg:mx-0">
                                <div className="size-12 bg-lavender/50 border border-border flex items-center justify-center mb-4">
                                    <Wallet className="size-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2 lowercase">
                                    wallet-based auth
                                </h2>
                                <p className="text-muted-foreground text-sm mb-6">
                                    Sigil uses wallet-based authentication. No email signups—connect your
                                    wallet and verify your identity across multiple channels to receive your
                                    onchain attestation.
                                </p>
                                <Link href="/verify">
                                    <Button className="w-full gap-2" size="lg">
                                        Start Verification
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Already Verified */}
                        <div className="lg:w-1/2 px-6 py-10 lg:px-12 border-border border-b">
                            <div className="max-w-sm mx-auto lg:mx-0">
                                <div className="size-12 bg-sage border border-border flex items-center justify-center mb-4">
                                    <Shield className="size-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2 lowercase">
                                    already verified?
                                </h2>
                                <p className="text-muted-foreground text-sm mb-6">
                                    Connect your wallet to access your dashboard, claim fees, and participate
                                    in governance.
                                </p>
                                <Link href="/login">
                                    <Button variant="outline" className="w-full gap-2" size="lg">
                                        Sign In
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="bg-lavender/20">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            what you get
                        </p>
                    </div>
                </div>
                <div className="border-border border-b flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border bg-background">
                    {[
                        { text: "Free multi-channel verification" },
                        { text: "Permanent onchain attestation" },
                        { text: "USDC fee routing from LP activity" },
                    ].map((item) => (
                        <div
                            key={item.text}
                            className="flex-1 px-6 py-4 lg:px-8"
                        >
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="size-4 text-green-600 shrink-0" />
                                {item.text}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer - fills remaining space */}
                <div className="flex-1 flex flex-col justify-end px-6 py-6 lg:px-12 bg-sage/10">
                    <p className="text-xs text-muted-foreground text-center">
                        By continuing, you agree to our{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
