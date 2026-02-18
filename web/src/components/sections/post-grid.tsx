import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BlogPostMeta } from "@/lib/blog-posts";
import { cn } from "@/lib/utils";

type Props = { posts: BlogPostMeta[] };

export default function PostGrid({ posts }: Props) {
    return (
        <section className="bg-background overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border border-t-0 border-b px-0">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, i) => {
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
                                    "border-border border-b last:border-b-0",
                                    "sm:border-b-0",
                                    "sm:[&:nth-child(-n+2)]:border-border sm:[&:nth-child(-n+2)]:border-b",
                                    "sm:odd:border-border sm:odd:border-r",
                                    "lg:!border-b-0",
                                    "lg:border-border lg:border-r",
                                    "lg:[&:nth-child(3n)]:border-r-0",
                                    "lg:last:!border-r-0",
                                )}
                            >
                                <div className="flex flex-col">
                                    <div className="border-border relative square w-full overflow-hidden border-b">
                                        <a href={`/blog/${post.slug}`}>
                                            <Image
                                                src={post.coverImage}
                                                alt={post.title}
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        </a>
                                    </div>

                                    <div className="mt-6 flex flex-col gap-3 px-6 py-12">
                                        <p className="text-primary text-sm font-medium">
                                            {tagline}
                                        </p>
                                        <h3 className="text-foreground text-xl font-medium">
                                            {post.title}
                                        </h3>
                                        {post.description && (
                                            <p className="text-muted-foreground">
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
        </section>
    );
}
