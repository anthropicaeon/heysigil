import { Rocket } from "lucide-react";

import { LaunchesList } from "@/components/Launches/LaunchesList";

export default function LaunchesPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream flex flex-col">
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            launches
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase flex items-center gap-3">
                            <Rocket className="size-8 text-primary" />
                            sigil token launch registry
                        </h1>
                        <p className="text-muted-foreground">
                            Public list of all tokens launched onchain through Sigil. Browse by platform,
                            search by project, and jump directly to explorer, market, and governance views.
                        </p>
                    </div>
                </div>

                <LaunchesList />
            </div>
        </section>
    );
}
