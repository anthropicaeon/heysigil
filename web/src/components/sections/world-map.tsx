import { Button } from "@/components/ui/button";

import { WorldMap } from "../ui/world-map";

const WorldMapSection = () => {
    return (
        <section id="dashboard" className="bg-obsidian relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-r-dark-gray border-l-dark-gray relative container border px-0">
                <div className="border-b-dark-gray grid grid-cols-1 gap-4 border-b px-6 pt-20 pb-6 lg:px-8 lg:pt-32 lg:pb-12">
                    <h1 className="text-foreground text-3xl tracking-tight">
                        Global Reach, Local Clarity
                    </h1>
                    <p className="font-inter-tight text-mid-gray text-base">
                        Every dot on the map marks a secure, real-time connection to one of your
                        banks or subsidiaries. Live data streams across borders and currencies—35+
                        and counting—so FinSight can unify balances in seconds and give you the
                        global context you need to act with confidence.
                    </p>
                </div>
                <div className="relative min-h-96 w-full overflow-x-auto overflow-y-hidden">
                    <div className="absolute right-0 bottom-0 left-0 z-20 flex flex-col items-center pb-8">
                        <div className="flex max-w-lg flex-col items-center justify-center px-5">
                            <p className="text-foreground mb-4 text-center text-2xl lg:text-4xl">
                                Ready to Gain Complete Financial Clarity?
                            </p>
                            <Button aria-label="Get started" size="sm">
                                Start My Free Trial
                            </Button>
                        </div>
                    </div>
                    <div className="z-10 h-full w-auto overflow-hidden lg:h-auto lg:w-full">
                        <WorldMap
                            dots={[
                                {
                                    start: {
                                        lat: 64.2008,
                                        lng: -149.4937,
                                    },
                                    end: {
                                        lat: 34.0522,
                                        lng: -118.2437,
                                    },
                                },
                                {
                                    start: { lat: 64.2008, lng: -149.4937 },
                                    end: { lat: -15.7975, lng: -47.8919 },
                                },
                                {
                                    start: { lat: -15.7975, lng: -47.8919 },
                                    end: { lat: 38.7223, lng: -9.1393 },
                                },
                                {
                                    start: { lat: 51.5074, lng: -0.1278 },
                                    end: { lat: 28.6139, lng: 77.209 },
                                },
                                {
                                    start: { lat: 28.6139, lng: 77.209 },
                                    end: { lat: 43.1332, lng: 131.9113 },
                                },
                                {
                                    start: { lat: 28.6139, lng: 77.209 },
                                    end: { lat: -1.2921, lng: 36.8219 },
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WorldMapSection;
