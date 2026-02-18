"use client";

import CookiePolicy from "./cookie-policy.mdx";

const Page = () => {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-4 py-16 md:px-28 md:py-28 lg:px-32 lg:py-32 bg-cream">
                <article className="prose prose-lg prose-h1:!text-foreground prose-h2:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary">
                    <CookiePolicy />
                </article>
            </div>
        </section>
    );
};

export default Page;
