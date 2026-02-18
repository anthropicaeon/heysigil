"use client";

import { ArrowRight, CheckCircle, Shield, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
    return (
        <section className="min-h-screen bg-lavender relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
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
                            welcome back
                        </h1>
                        <p className="text-muted-foreground">
                            Connect your wallet to access your dashboard, governance, and
                            verifications
                        </p>
                    </div>
                </div>

                {/* Connect Section */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/2 px-6 py-10 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <div className="max-w-sm mx-auto lg:mx-0">
                                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <Wallet className="size-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2 lowercase">
                                    connect wallet
                                </h2>
                                <p className="text-muted-foreground text-sm mb-6">
                                    Use your existing wallet to sign in instantly. Your wallet is
                                    your identity in the Sigil ecosystem.
                                </p>
                                <Button className="w-full gap-2" size="lg">
                                    <Wallet className="size-5" />
                                    Connect Wallet
                                </Button>
                            </div>
                        </div>
                        <div className="lg:w-1/2 px-6 py-10 lg:px-12 border-border border-b">
                            <div className="max-w-sm mx-auto lg:mx-0">
                                <div className="size-12 rounded-lg bg-sage flex items-center justify-center mb-4">
                                    <Shield className="size-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2 lowercase">
                                    new to sigil?
                                </h2>
                                <p className="text-muted-foreground text-sm mb-6">
                                    Start by verifying your project across multiple channels. Get
                                    your on-chain attestation and unlock the ecosystem.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    size="lg"
                                    asChild
                                >
                                    <Link href="/verify">
                                        Get Verified
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="border-border border-b bg-cream/50">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            why connect?
                        </p>
                    </div>
                    <div className="flex flex-col lg:flex-row">
                        {[
                            { text: "Claim USDC fees from LP activity" },
                            { text: "Vote on project proposals" },
                            { text: "Track your verification status" },
                        ].map((item) => (
                            <div
                                key={item.text}
                                className="flex-1 px-6 py-4 lg:px-8 border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0"
                            >
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <CheckCircle className="size-4 text-green-600" />
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-6 lg:px-12 bg-background">
                    <p className="text-xs text-muted-foreground text-center">
                        By connecting, you agree to our{" "}
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
