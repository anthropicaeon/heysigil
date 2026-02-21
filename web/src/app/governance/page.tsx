import { Suspense } from "react";

import GovernanceDashboard from "@/components/GovernanceDashboard";

function GovernanceLoading() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col items-center justify-center">
                <div className="size-8 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
                <p className="text-muted-foreground mt-4">Loading governance...</p>
            </div>
        </section>
    );
}

export default function GovernancePage() {
    return (
        <Suspense fallback={<GovernanceLoading />}>
            <GovernanceDashboard />
        </Suspense>
    );
}
