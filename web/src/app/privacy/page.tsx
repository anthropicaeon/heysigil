import { PixelCard } from "@/components/ui/pixel-card";

const sections = [
    {
        title: "Information We Collect",
        content:
            "When you use Sigil, we may collect: wallet addresses you connect, verification data from channels you authorize (GitHub username, X handle, etc.), transaction data related to fee claims and governance votes, and technical data (IP address, browser type, device information).",
    },
    {
        title: "How We Use Information",
        content:
            "We use collected information to: process verification requests and create attestations, route fees to verified builders, enable governance participation, improve the Protocol and user experience, and prevent fraud and abuse.",
    },
    {
        title: "Onchain Data",
        content:
            "Sigil attestations are created onchain via EAS on Base. This data is public, permanent, and cannot be deleted. By verifying, you acknowledge that your verification status and associated data will be publicly visible onchain.",
    },
    {
        title: "Third-Party Services",
        content:
            "We integrate with third-party services for verification: GitHub (OAuth), Facebook/Instagram (OAuth), zkTLS providers for X verification, and DNS providers for domain verification. These services have their own privacy policies. We only receive the minimum information needed for verification.",
    },
    {
        title: "Data Retention",
        content:
            "Off-chain data is retained as long as necessary to provide the service. Onchain attestations are permanent by design. You may request deletion of off-chain data by contacting us, but this will not affect onchain records.",
    },
    {
        title: "Security",
        content:
            "We implement reasonable security measures to protect your information. However, no system is completely secure. Smart contracts are audited but may contain vulnerabilities.",
    },
    {
        title: "Your Rights",
        content:
            "Depending on your jurisdiction, you may have rights to access, correct, or delete your personal information. Contact privacy@heysigil.com for requests.",
    },
    {
        title: "Changes to This Policy",
        content:
            "We may update this policy periodically. Continued use after changes constitutes acceptance.",
    },
    {
        title: "Contact",
        content: "For privacy-related questions, contact privacy@heysigil.com.",
    },
];

export default function PrivacyPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-lavender/30"
                >
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                        legal
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground lowercase">
                        privacy policy
                    </h1>
                    <p className="text-muted-foreground mt-4">Last updated: February 2026</p>
                </PixelCard>

                {/* Sections */}
                <div className="bg-background">
                    {sections.map((section, index) => (
                        <div key={section.title} className="border-border border-b">
                            <div className="flex flex-col lg:flex-row">
                                {/* Section Number */}
                                <div className="px-6 py-4 lg:px-8 lg:py-6 lg:w-48 border-border border-b lg:border-b-0 lg:border-r bg-secondary/30">
                                    <span className="text-primary font-bold text-lg">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                </div>
                                {/* Section Content */}
                                <div className="flex-1 px-6 py-6 lg:px-8 lg:py-6">
                                    <h2 className="text-lg font-semibold text-foreground mb-3 lowercase">
                                        {section.title.toLowerCase()}
                                    </h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
