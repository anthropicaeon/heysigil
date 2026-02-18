import { Github, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream">
                {/* Hero */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
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
                </div>

                {/* Contact Options */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {contactOptions.map((option) => (
                            <Card key={option.title} className="bg-secondary/20 text-center">
                                <CardContent className="p-6">
                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <option.icon className="size-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-2">
                                        {option.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        {option.description}
                                    </p>
                                    {option.isLink ? (
                                        <Link
                                            href={`https://${option.action}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-sm hover:underline"
                                        >
                                            {option.action}
                                        </Link>
                                    ) : (
                                        <a
                                            href={`mailto:${option.action}`}
                                            className="text-primary text-sm hover:underline"
                                        >
                                            {option.action}
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Contact Form */}
                <div className="px-6 py-12 lg:px-12 lg:py-16">
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8">
                            <h2 className="text-xl font-semibold text-foreground mb-6">
                                Send a Message
                            </h2>
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" placeholder="Your name" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        placeholder="What's this about?"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Tell us more..."
                                        rows={5}
                                        className="mt-1"
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
