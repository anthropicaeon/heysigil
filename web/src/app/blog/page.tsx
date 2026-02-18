import BlogHero from "@/components/sections/blog-header";
import FeaturedPost from "@/components/sections/featured-post";
import PostGrid from "@/components/sections/post-grid";
import Separator from "@/components/sections/separator";
import { getAllBlogPosts } from "@/lib/blog-posts";

export default function BlogPage() {
    const allPosts = getAllBlogPosts();

    const featuredPost = allPosts.find((post) => post.featured);

    const gridPosts = featuredPost
        ? allPosts.filter((post) => post.slug !== featuredPost.slug)
        : allPosts;

    return (
        <>
            <BlogHero />

            {featuredPost && (
                <FeaturedPost
                    tagline={featuredPost.tagline}
                    header={featuredPost.title}
                    description={featuredPost.description}
                    link={`/blog/${featuredPost.slug}`}
                    side="L"
                    image={featuredPost.coverImage}
                />
            )}

            <Separator />

            <PostGrid posts={gridPosts} />
        </>
    );
}
