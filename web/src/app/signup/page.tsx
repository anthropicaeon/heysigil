import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SignupPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 flex items-center justify-center bg-sage">
                <Card className="w-full max-w-md bg-background border-border">
                    <CardHeader className="text-center space-y-4 pb-2">
                        <Link href="/" className="flex items-center justify-center gap-2">
                            <Image
                                src="/logo-sage.png"
                                alt="Sigil"
                                width={40}
                                height={40}
                                className="rounded"
                            />
                            <span className="text-2xl font-semibold text-foreground">Sigil</span>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Get Started</h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Verify your identity to start earning
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-lavender/50 rounded-lg p-4 text-center">
                            <p className="text-foreground text-sm mb-2">
                                Sigil uses wallet-based authentication
                            </p>
                            <p className="text-muted-foreground text-xs">
                                No email signups. Connect your wallet and verify your identity
                                across multiple channels to receive your onchain attestation.
                            </p>
                        </div>

                        <Button className="w-full gap-2" size="lg" asChild>
                            <Link href="/verify">
                                Start Verification
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>

                        <div className="text-center">
                            <p className="text-muted-foreground text-sm">
                                Already verified?{" "}
                                <Link href="/login" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            By continuing, you agree to our{" "}
                            <Link href="/terms" className="text-primary hover:underline">
                                Terms
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
