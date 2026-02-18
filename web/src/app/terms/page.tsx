const sections = [
    {
        title: "Acceptance of Terms",
        content:
            'By accessing or using Sigil ("the Protocol"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Protocol.',
    },
    {
        title: "Description of Service",
        content:
            "Sigil provides verification infrastructure for builders, including multi-channel identity verification, onchain attestations via EAS, USDC fee routing, and milestone governance functionality.",
    },
    {
        title: "Eligibility",
        content:
            "You must be at least 18 years old and capable of forming a binding contract to use the Protocol. By using Sigil, you represent that you meet these requirements.",
    },
    {
        title: "Verification Process",
        content:
            "When you verify through Sigil, you authorize us to verify your identity through the channels you select (GitHub, X, Facebook, Instagram, Domain). You represent that you own or control the accounts you verify.",
    },
    {
        title: "Onchain Attestations",
        content:
            "Sigil attestations are created onchain via the Ethereum Attestation Service (EAS) on Base. These attestations are permanent and cannot be deleted. You acknowledge that verification creates a permanent public record.",
    },
    {
        title: "Fees and Payments",
        content:
            "Verification is free; you only pay network gas fees. Fee routing to builders is automated via smart contracts. Unclaimed fees may expire according to protocol parameters.",
    },
    {
        title: "Disclaimer of Warranties",
        content:
            'THE PROTOCOL IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE UNINTERRUPTED ACCESS, SECURITY, OR THAT THE PROTOCOL WILL MEET YOUR REQUIREMENTS.',
    },
    {
        title: "Limitation of Liability",
        content:
            "TO THE MAXIMUM EXTENT PERMITTED BY LAW, SIGIL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PROTOCOL.",
    },
    {
        title: "Changes to Terms",
        content:
            "We may modify these terms at any time. Continued use of the Protocol after changes constitutes acceptance of the modified terms.",
    },
    {
        title: "Contact",
        content: "Questions about these terms should be sent to legal@heysigil.com.",
    },
];

export default function TermsPage() {
    return (
        <section className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                        legal
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground lowercase">
                        terms of service
                    </h1>
                    <p className="text-muted-foreground mt-4">Last updated: February 2026</p>
                </div>

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
