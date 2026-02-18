// Static blog post metadata - no fs required
export type BlogPostMeta = {
    slug: string;
    title: string;
    description: string;
    date: string;
    author: string;
    tagline: string;
    coverImage: string;
    featured: boolean;
    tags?: string[];
};

export const blogPosts: BlogPostMeta[] = [
    {
        slug: "introducing-sigil-protocol",
        tagline: "Announcement",
        title: "Introducing Sigil - The Verification Layer for the Agentic Economy",
        description:
            "Today we're launching Sigil, the verification infrastructure that connects builders to sustainable funding through multi-channel identity verification and milestone-based governance.",
        author: "Sigil Team",
        date: "2026-02-15",
        coverImage: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200&q=80",
        featured: true,
    },
    {
        slug: "verification-guide",
        tagline: "Guide",
        title: "Complete Guide to Multi-Channel Verification",
        description:
            "A step-by-step walkthrough of verifying your identity across all 5 Sigil channels, earning your onchain attestation, and maximizing your verification score.",
        author: "Sigil Team",
        date: "2026-02-10",
        coverImage: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80",
        featured: false,
    },
    {
        slug: "governance-deep-dive",
        tagline: "Governance",
        title: "Milestone Governance - How Community Validation Works",
        description:
            "Deep dive into Sigil's milestone governance system, where community token holders validate builder progress and control fund unlocks through transparent onchain voting.",
        author: "Sigil Team",
        date: "2026-02-05",
        coverImage: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80",
        featured: false,
    },
    {
        slug: "understanding-zktls",
        tagline: "Technical Deep Dive",
        title: "How zkTLS Powers Trustless Social Verification",
        description:
            "Understanding the cryptographic magic behind Sigil's X (Twitter) verification—how zkTLS proves you own an account without OAuth, APIs, or trusting anyone.",
        author: "Sigil Team",
        date: "2026-01-28",
        coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80",
        featured: false,
    },
];

export function getAllBlogPosts(limit?: number): BlogPostMeta[] {
    const sorted = [...blogPosts].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return limit ? sorted.slice(0, limit) : sorted;
}

export function getBlogPostBySlug(slug: string): BlogPostMeta | undefined {
    return blogPosts.find((post) => post.slug === slug);
}
