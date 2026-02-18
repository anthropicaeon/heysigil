import React from "react";

import Faq from "@/components/sections/faq";
import { Features } from "@/components/sections/features";
import Separator from "@/components/sections/separator";
import SplitSection from "@/components/sections/split-section";
import SupportHero from "@/components/sections/support-hero";

const page = () => {
    return (
        <>
            <SupportHero />
            <SplitSection
                header="Dedicated Experts on Call"
                description="Prefer a conversation? Tap the phone icon and you’ll reach a live FinSight advisor—no call centers, no scripts. From onboarding to complex reconciliations, our team is ready to walk you through every step so you can keep your finances moving smoothly."
                image="/images/about/split-section/3.webp"
                side="R"
            />
            <Faq />
            <Separator />
            <Features />
            <Separator />
        </>
    );
};

export default page;
