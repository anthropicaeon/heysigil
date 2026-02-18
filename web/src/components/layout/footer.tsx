import { Github, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const navigation = [
    {
        title: "Protocol",
        links: [
            { name: "Verify", href: "/verify" },
            { name: "Dashboard", href: "/dashboard" },
            { name: "Chat", href: "/chat" },
            { name: "Governance", href: "/governance" },
        ],
    },
    {
        title: "Resources",
        links: [
            { name: "Developers", href: "/developers" },
            { name: "Features", href: "/features" },
            { name: "FAQ", href: "/faq" },
            { name: "Blog", href: "/blog" },
        ],
    },
];

const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/HeySigil", label: "Twitter" },
    { icon: Github, href: "https://github.com/heysigil", label: "GitHub" },
];

const legal = [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Audit", href: "/audit" },
];

export const Footer = () => {
    return (
        <footer id="site-footer" className="bg-background text-foreground px-2.5 lg:px-0">
            <div className="container p-0">
                <div className="bg-secondary/30 border-dark-gray grid border-r border-l p-0 lg:grid-cols-3">
                    {navigation.map((section) => (
                        <div
                            key={section.title}
                            className="lg:border-r-dark-gray border-b-dark-gray border-r-0 border-b px-6 py-10 lg:border-r lg:px-8 lg:py-12"
                        >
                            <h3 className="mb-4 text-xl font-semibold">{section.title}</h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="hover:text-primary transition-colors lg:text-base"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div className="border-b-dark-gray border-b px-6 py-10 lg:px-8 lg:py-12">
                        <h3 className="mb-4 text-xl font-semibold">Connect</h3>
                        <div className="flex items-center gap-6">
                            {socialLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-label={link.label}
                                    className="hover:text-primary transition-colors"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <link.icon size={24} />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-secondary/30 border-dark-gray grid border-r border-b border-l lg:grid-cols-2">
                    <div className="border-b-dark-gray flex flex-col justify-center border-b px-6 py-10 lg:max-w-md lg:border-b-0 lg:px-8 lg:py-12">
                        <div className="max-w-md">
                            <p className="text-foreground text-sm font-medium mb-1">
                                Onchain Verification
                            </p>
                            <p className="text-muted-foreground text-xs">
                                Sigil is verification infrastructure for the agentic economy. All
                                attestations are onchain via EAS on Base. Smart contracts are open
                                source and audited.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end px-6 py-10 lg:px-8 lg:py-12">
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/logo-sage.png"
                                alt="Sigil"
                                width={40}
                                height={40}
                                className="rounded"
                            />
                            <span className="text-2xl font-semibold text-foreground">Sigil</span>
                        </Link>
                    </div>
                </div>
                <div className="bg-secondary/30 border-dark-gray grid gap-2 border-r border-l px-6 py-4 sm:grid-cols-2 lg:px-8">
                    <div>
                        <p className="text-muted-foreground text-xs">
                            &copy; {new Date().getFullYear()} Sigil. Built on Base.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        {legal.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="hover:text-primary text-muted-foreground text-xs underline"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};
