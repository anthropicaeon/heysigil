import { ArrowRight, Github, Mail, MessageSquare, Send } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PixelCard } from "@/components/ui/pixel-card";
import { Textarea } from "@/components/ui/textarea";

const contactOptions = [
    {
        icon: MessageSquare,
        title: "General Inquiries",
        description: "Questions about Sigil, verification, or the protocol.",
        action: "hello@heysigil.com",
    },
    {
        icon: Mail,
        title: "Partnerships",
        description: "Integration partnerships and enterprise solutions.",
        action: "partners@heysigil.com",
    },
    {
        icon: Github,
        title: "Bug Reports",
        description: "Found an issue? Report it on GitHub.",
        action: "github.com/heysigil",
        isLink: true,
    },
];

export default function ContactPage() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                {/* Hero */}
                <PixelCard
                    variant="sage"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-sage/30"
                >
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            contact
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            get in touch
                        </h1>
                        <p className="text-muted-foreground">
                            Have questions about Sigil? We&apos;re here to help.
                        </p>
                    </div>
                </PixelCard>

                {/* Contact Options Section Header */}
                <div className="bg-lavender/20">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            reach out directly
                        </h2>
                    </div>
                </div>

                {/* Contact Options - Border Grid */}
                <div className="border-border border-b flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border bg-background">
                    {contactOptions.map((option) => (
                        <div key={option.title} className="flex-1 px-6 py-6 lg:px-8">
                            <div className="flex items-start gap-4">
                                <div className="size-12 bg-primary/10 border border-border flex items-center justify-center shrink-0">
                                    <option.icon className="size-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">
                                        {option.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        {option.description}
                                    </p>
                                    {option.isLink ? (
                                        <Link
                                            href={`https://${option.action}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-sm hover:underline inline-flex items-center gap-1"
                                        >
                                            {option.action}
                                            <ArrowRight className="size-3" />
                                        </Link>
                                    ) : (
                                        <a
                                            href={`mailto:${option.action}`}
                                            className="text-primary text-sm hover:underline"
                                        >
                                            {option.action}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Form Section Header */}
                <div className="bg-sage/20">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            send a message
                        </h2>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="border-border border-b bg-background">
                    <form>
                        {/* Name & Email Row */}
                        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border border-border border-b">
                            <div className="flex-1 px-6 py-5 lg:px-12">
                                <Label htmlFor="name" className="text-sm text-muted-foreground">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Your name"
                                    className="mt-2 border-border"
                                />
                            </div>
                            <div className="flex-1 px-6 py-5 lg:px-12">
                                <Label htmlFor="email" className="text-sm text-muted-foreground">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    className="mt-2 border-border"
                                />
                            </div>
                        </div>

                        {/* Subject Row */}
                        <div className="px-6 py-5 lg:px-12 border-border border-b">
                            <Label htmlFor="subject" className="text-sm text-muted-foreground">
                                Subject
                            </Label>
                            <Input
                                id="subject"
                                placeholder="What's this about?"
                                className="mt-2 border-border"
                            />
                        </div>

                        {/* Message Row */}
                        <div className="px-6 py-5 lg:px-12 border-border border-b">
                            <Label htmlFor="message" className="text-sm text-muted-foreground">
                                Message
                            </Label>
                            <Textarea
                                id="message"
                                placeholder="Tell us more..."
                                rows={5}
                                className="mt-2 border-border"
                            />
                        </div>

                        {/* Submit */}
                        <div className="px-6 py-5 lg:px-12 bg-sage/10">
                            <Button type="submit" size="lg">
                                <Send className="size-4 mr-2" />
                                Send Message
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Footer - fills remaining space */}
                <div className="flex-1 flex flex-col lg:flex-row border-border border-t">
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-lavender/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Quick Links
                            </span>
                        </div>
                        <div className="space-y-3">
                            <Link
                                href="/faq"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowRight className="size-4" />
                                Frequently Asked Questions
                            </Link>
                            <Link
                                href="/developers"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowRight className="size-4" />
                                Developer Documentation
                            </Link>
                        </div>
                        <div className="flex-1" />
                    </div>
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 bg-sage/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Get Started
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                            ready to verify?
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Start verifying your identity. It&apos;s free—you only pay gas.
                        </p>
                        <div className="flex-1" />
                        <Link href="/verify">
                            <Button size="lg">
                                Stamp Your Sigil
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
