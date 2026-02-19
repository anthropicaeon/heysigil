"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Toaster } from "sonner";

import ModelViewer from "@/components/ModelViewer";
import { PixelCard } from "@/components/ui/pixel-card";
import {
    HERO_MODEL_FRAME,
    HERO_MODEL_LOADER_CENTER,
    HERO_MODEL_LOADER_TIMING,
    HERO_MODEL_STAGE_SELECTOR,
    HERO_MODEL_VIEWER,
} from "@/lib/hero-model-frame";
import { cn } from "@/lib/utils";

import { Footer } from "./footer";
import Navbar from "./navbar";

type ModelFrame = {
    top: number | string;
    left: number | string;
    width: number;
    height: number;
    opacity: number;
};

const getHomeStageRect = () => {
    if (typeof window === "undefined") return null;
    const targetElement = document.querySelector<HTMLElement>(HERO_MODEL_STAGE_SELECTOR);
    const targetRect = targetElement?.getBoundingClientRect();
    if (!targetRect || targetRect.width === 0 || targetRect.height === 0) {
        return null;
    }
    return targetRect;
};

const getHomeTargetFrameFromStage = (): ModelFrame | null => {
    const stageRect = getHomeStageRect();
    if (!stageRect) return null;

    return {
        top: stageRect.top + stageRect.height * HERO_MODEL_FRAME.centerY,
        left: stageRect.left + stageRect.width * HERO_MODEL_FRAME.centerX,
        width: stageRect.width * HERO_MODEL_FRAME.widthScale,
        height: stageRect.height * HERO_MODEL_FRAME.heightScale,
        opacity: 1,
    };
};

const getCenteredFrame = (targetRect: DOMRect | null = null): ModelFrame => {
    if (typeof window === "undefined") {
        return { top: "50%", left: "50%", width: 340, height: 340, opacity: 1 };
    }

    let width = Math.max(260, Math.min(window.innerWidth * 0.32, 420));
    let height = width;

    if (targetRect) {
        const targetAspect = targetRect.width / targetRect.height;
        width = Math.max(
            320,
            Math.min(targetRect.width * HERO_MODEL_FRAME.widthScale, window.innerWidth * 0.62),
        );
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
        top: window.innerHeight / 2 + height * HERO_MODEL_LOADER_CENTER.yCompFactor,
        left: window.innerWidth / 2 + width * HERO_MODEL_LOADER_CENTER.xCompFactor,
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
        const minTimer = window.setTimeout(
            () => setMinDelayDone(true),
            HERO_MODEL_LOADER_TIMING.minLoaderMs,
        );
        const fallbackTimer = window.setTimeout(
            () => setFallbackDone(true),
            HERO_MODEL_LOADER_TIMING.maxModelWaitMs,
        );

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
                const centered = getCenteredFrame(pathname === "/" ? getHomeStageRect() : null);
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
            }, HERO_MODEL_LOADER_TIMING.atmosphereFadeMs + 120);
        };

        if (pathname !== "/") {
            finishFadeOnly();
            return;
        }

        if (!getHomeTargetFrameFromStage()) {
            finishFadeOnly();
            return;
        }

        setAtmosphereHidden(true);

        window.setTimeout(() => {
            setContentVisible(true);
            const targetFrame = getHomeTargetFrameFromStage();
            if (!targetFrame) return;

            setModelFrame((previous) => {
                return {
                    ...previous,
                    top: targetFrame.top,
                    left: targetFrame.left,
                    width: targetFrame.width,
                    height: targetFrame.height,
                    opacity: 1,
                };
            });
        }, HERO_MODEL_LOADER_TIMING.atmosphereFadeMs);

        window.setTimeout(() => {
            const targetFrame = getHomeTargetFrameFromStage();
            if (targetFrame) {
                flushSync(() => {
                    setModelFrame((previous) => ({
                        ...previous,
                        top: targetFrame.top,
                        left: targetFrame.left,
                        width: targetFrame.width,
                        height: targetFrame.height,
                        opacity: 1,
                    }));
                });
            }

            window.requestAnimationFrame(() => setOverlayVisible(false));
        }, HERO_MODEL_LOADER_TIMING.atmosphereFadeMs + HERO_MODEL_LOADER_TIMING.handoffSlideMs);
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
                        className="loader-model-shell pointer-events-none fixed z-[121] transition-[top,left,width,height,opacity] ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                            top: modelFrame.top,
                            left: modelFrame.left,
                            width: modelFrame.width,
                            height: modelFrame.height,
                            opacity: modelFrame.opacity,
                            transitionDuration: `${HERO_MODEL_LOADER_TIMING.handoffSlideMs}ms`,
                        }}
                    >
                        <div className="relative size-full">
                            <ModelViewer
                                {...HERO_MODEL_VIEWER}
                                width="100%"
                                height="100%"
                                enableMouseParallax={false}
                                enableHoverRotation={false}
                                enableManualRotation={false}
                                enableManualZoom={false}
                                fadeIn={false}
                                autoRotate
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
