"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Toaster } from "sonner";

import ModelViewer from "@/components/ModelViewer";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

import { Footer } from "./footer";
import Navbar from "./navbar";

const MIN_LOADER_MS = 2000;
const MAX_MODEL_WAIT_MS = 12000;
const ATMOSPHERE_FADE_MS = 420;
const HANDOFF_SLIDE_MS = 950;
const HOME_TARGET_SELECTOR = '[data-home-loader-target="sigil-hero-model"]';

type ModelFrame = {
    top: number | string;
    left: number | string;
    width: number;
    height: number;
    opacity: number;
};

const getTargetRect = () => {
    if (typeof window === "undefined") return null;
    const targetElement = document.querySelector<HTMLElement>(HOME_TARGET_SELECTOR);
    const targetRect = targetElement?.getBoundingClientRect();
    if (!targetRect || targetRect.width === 0 || targetRect.height === 0) {
        return null;
    }
    return targetRect;
};

const getCenteredFrame = (targetRect: DOMRect | null = null): ModelFrame => {
    if (typeof window === "undefined") {
        return { top: "50%", left: "50%", width: 340, height: 340, opacity: 1 };
    }

    let width = Math.max(260, Math.min(window.innerWidth * 0.32, 420));
    let height = width;

    if (targetRect) {
        const targetAspect = targetRect.width / targetRect.height;
        width = Math.max(320, Math.min(targetRect.width * 1.08, window.innerWidth * 0.62));
        height = width / targetAspect;

        const maxWidth = window.innerWidth * 0.72;
        const maxHeight = window.innerHeight * 0.68;

        if (height > maxHeight) {
            height = maxHeight;
            width = height * targetAspect;
        }

        if (width > maxWidth) {
            width = maxWidth;
            height = width / targetAspect;
        }
    }

    return {
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        width: Math.round(width),
        height: Math.round(height),
        opacity: 1,
    };
};

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const [contentVisible, setContentVisible] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const [atmosphereHidden, setAtmosphereHidden] = useState(false);
    const [minDelayDone, setMinDelayDone] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [fallbackDone, setFallbackDone] = useState(false);
    const [modelFrame, setModelFrame] = useState<ModelFrame>(getCenteredFrame);
    const handleLoaderModelLoaded = useCallback(() => {
        setModelLoaded(true);
    }, []);

    const dismissStartedRef = useRef(false);

    useEffect(() => {
        const minTimer = window.setTimeout(() => setMinDelayDone(true), MIN_LOADER_MS);
        const fallbackTimer = window.setTimeout(() => setFallbackDone(true), MAX_MODEL_WAIT_MS);

        return () => {
            window.clearTimeout(minTimer);
            window.clearTimeout(fallbackTimer);
        };
    }, []);

    useEffect(() => {
        if (!overlayVisible) {
            setContentVisible(true);
        }
    }, [overlayVisible]);

    useLayoutEffect(() => {
        document.body.dataset.loaderActive = overlayVisible ? "true" : "false";
        return () => {
            delete document.body.dataset.loaderActive;
        };
    }, [overlayVisible]);

    useLayoutEffect(() => {
        if (!overlayVisible || atmosphereHidden) return;

        const syncCenterFrame = () => {
            setModelFrame((previous) => {
                const centered = getCenteredFrame(pathname === "/" ? getTargetRect() : null);
                return { ...centered, opacity: previous.opacity };
            });
        };

        syncCenterFrame();
        window.addEventListener("resize", syncCenterFrame);
        return () => window.removeEventListener("resize", syncCenterFrame);
    }, [atmosphereHidden, overlayVisible, pathname]);

    useEffect(() => {
        if (dismissStartedRef.current || !overlayVisible) return;
        if (!minDelayDone || (!modelLoaded && !fallbackDone)) return;

        dismissStartedRef.current = true;

        const finishFadeOnly = () => {
            setAtmosphereHidden(true);
            setModelFrame((previous) => ({ ...previous, opacity: 0 }));

            window.setTimeout(() => {
                setContentVisible(true);
                setOverlayVisible(false);
            }, ATMOSPHERE_FADE_MS + 120);
        };

        if (pathname !== "/") {
            finishFadeOnly();
            return;
        }

        const targetRect = getTargetRect();

        if (!targetRect) {
            finishFadeOnly();
            return;
        }

        setAtmosphereHidden(true);

        window.setTimeout(() => {
            setContentVisible(true);
            setModelFrame((previous) => {
                return {
                    ...previous,
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.left + targetRect.width / 2,
                    width: targetRect.width,
                    height: targetRect.height,
                    opacity: 1,
                };
            });
        }, ATMOSPHERE_FADE_MS);

        window.setTimeout(() => {
            setOverlayVisible(false);
        }, ATMOSPHERE_FADE_MS + HANDOFF_SLIDE_MS);
    }, [fallbackDone, minDelayDone, modelLoaded, overlayVisible, pathname]);

    return (
        <>
            <div
                className={cn(
                    "transition-opacity duration-500",
                    contentVisible ? "opacity-100" : "pointer-events-none opacity-0",
                )}
            >
                <Navbar />
                <main>{children}</main>
                <Footer />
                <Toaster position="bottom-right" />
            </div>

            {overlayVisible && (
                <div className="fixed inset-0 z-[120]">
                    <div
                        className={cn(
                            "absolute inset-0 bg-background transition-opacity duration-500",
                            atmosphereHidden && "opacity-0",
                        )}
                    />
                    <div
                        className={cn(
                            "absolute inset-0 transition-opacity duration-500",
                            atmosphereHidden && "opacity-0",
                        )}
                    >
                        <PixelCard
                            variant="lavender"
                            active
                            centerFade
                            noFocus
                            className="[&>canvas]:opacity-35 size-full bg-lavender/10"
                        >
                            <div className="size-full" />
                        </PixelCard>
                    </div>
                    <div
                        className={cn(
                            "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,hsl(var(--primary)/0.14),transparent_62%)] transition-opacity duration-500",
                            atmosphereHidden && "opacity-0",
                        )}
                    />

                    <div
                        className="pointer-events-none fixed z-[121] transition-[top,left,width,height,opacity] duration-[950ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                            top: modelFrame.top,
                            left: modelFrame.left,
                            width: modelFrame.width,
                            height: modelFrame.height,
                            opacity: modelFrame.opacity,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <div
                            className={cn(
                                "relative size-full",
                                !atmosphereHidden && "animate-loader-drift",
                            )}
                        >
                            <ModelViewer
                                url="/3D/logo_min.glb"
                                width="100%"
                                height="100%"
                                modelXOffset={-0.09}
                                modelYOffset={0.14}
                                defaultRotationX={10}
                                defaultRotationY={-6}
                                defaultZoom={1.1}
                                enableMouseParallax={false}
                                enableHoverRotation={false}
                                enableManualRotation={false}
                                enableManualZoom={false}
                                ambientIntensity={0.2}
                                keyLightIntensity={1.25}
                                fillLightIntensity={0.45}
                                rimLightIntensity={1.05}
                                environmentPreset="studio"
                                autoFrame
                                autoFramePadding={1.1}
                                fadeIn={false}
                                autoRotate
                                autoRotateSpeed={0.16}
                                autoRotateSyncKey="sigil-hero-main"
                                showContactShadows={false}
                                showLoader={false}
                                showScreenshotButton={false}
                                onModelLoaded={handleLoaderModelLoaded}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
