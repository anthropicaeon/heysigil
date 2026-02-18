import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getAllBlogPosts } from "@/lib/blog-posts";
import { cn } from "@/lib/utils";

export default function BlogPage() {
    const allPosts = getAllBlogPosts();
    const featuredPost = allPosts.find((post) => post.featured);
    const gridPosts = featuredPost
        ? allPosts.filter((post) => post.slug !== featuredPost.slug)
        : allPosts;

    return (
        <section className="min-h-screen bg-lavender relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <div className="max-w-xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            blog
                        </p>
                        <h1 className="text-foreground mb-2.5 text-3xl tracking-tight md:text-5xl lowercase">
                            protocol updates
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Builder guides, protocol announcements, governance proposals, and
                            insights on building the verification layer for the agentic economy.
                        </p>
                    </div>
                </div>

                {/* Featured Post */}
                {featuredPost && (
                    <div className="bg-secondary/30 border-border border-b">
                        <div className="flex flex-col md:flex-row md:items-stretch">
                            <div className="border-border w-full border-b md:w-1/2 md:border-b-0 md:border-r">
                                <div className="relative h-full min-h-[320px]">
                                    <Image
                                        src={featuredPost.coverImage}
                                        alt={featuredPost.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            </div>
                            <div className="text-foreground w-full px-6 py-12 md:w-1/2 md:px-12">
                                <p className="text-foreground mb-4 text-sm leading-relaxed">
                                    {featuredPost.tagline}
                                </p>
                                <h2 className="mb-2.5 text-3xl font-medium tracking-tight md:text-4xl">
                                    {featuredPost.title}
                                </h2>
                                <p className="text-muted-foreground mb-4 leading-relaxed">
                                    {featuredPost.description}
                                </p>
                                <Button
                                    asChild
                                    variant="link"
                                    size="link"
                                    className="gap-1 self-start"
                                >
                                    <Link href={`/blog/${featuredPost.slug}`}>
                                        Read more
                                        <ChevronRight className="size-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Separator */}
                <div className="border-border border-b px-6 py-3 lg:px-12 bg-lavender/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        All Posts
                    </p>
                </div>

                {/* Post Grid */}
                <div className="bg-background">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3">
                        {gridPosts.map((post, i) => {
                            const dateLabel = post.date
                                ? new Date(post.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                  })
                                : "";
                            const tagline =
                                post.tagline ||
                                (post.tags?.length ? `${post.tags[0]} · ${dateLabel}` : dateLabel);

                            return (
                                <div
                                    key={post.slug ?? i}
                                    className={cn(
                                        "relative",
                                        "border-border border-b",
                                        "sm:odd:border-r",
                                        "lg:border-r lg:[&:nth-child(3n)]:border-r-0",
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <div className="border-border relative aspect-video w-full overflow-hidden border-b">
                                            <Link href={`/blog/${post.slug}`}>
                                                <Image
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </Link>
                                        </div>

                                        <div className="flex flex-col gap-3 px-6 py-8">
                                            <p className="text-primary text-sm font-medium">
                                                {tagline}
                                            </p>
                                            <h3 className="text-foreground text-xl font-medium">
                                                {post.title}
                                            </h3>
                                            {post.description && (
                                                <p className="text-muted-foreground text-sm">
                                                    {post.description}
                                                </p>
                                            )}
                                            <Button
                                                asChild
                                                variant="link"
                                                size="link"
                                                className="gap-1 self-start"
                                            >
                                                <Link href={`/blog/${post.slug}`}>
                                                    Read more
                                                    <ChevronRight className="size-2" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
