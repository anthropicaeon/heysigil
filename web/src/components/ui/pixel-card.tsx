"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

class Pixel {
    width: number;
    height: number;
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number;
    color: string;
    speed: number;
    size: number;
    sizeStep: number;
    minSize: number;
    maxSizeInteger: number;
    maxSize: number;
    delay: number;
    counter: number;
    counterStep: number;
    isIdle: boolean;
    isReverse: boolean;
    isShimmer: boolean;

    constructor(
        canvas: HTMLCanvasElement,
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        color: string,
        speed: number,
        delay: number,
    ) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = context;
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = this.getRandomValue(0.1, 0.9) * speed;
        this.size = 0;
        this.sizeStep = Math.random() * 0.4;
        this.minSize = 0.5;
        this.maxSizeInteger = 2;
        this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
        this.delay = delay;
        this.counter = 0;
        this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
        this.isIdle = false;
        this.isReverse = false;
        this.isShimmer = false;
    }

    getRandomValue(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    draw() {
        const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
    }

    appear() {
        this.isIdle = false;
        if (this.counter <= this.delay) {
            this.counter += this.counterStep;
            return;
        }
        if (this.size >= this.maxSize) {
            this.isShimmer = true;
        }
        if (this.isShimmer) {
            this.shimmer();
        } else {
            this.size += this.sizeStep;
        }
        this.draw();
    }

    disappear() {
        this.isShimmer = false;
        this.counter = 0;
        if (this.size <= 0) {
            this.isIdle = true;
            return;
        } else {
            this.size -= 0.1;
        }
        this.draw();
    }

    shimmer() {
        if (this.size >= this.maxSize) {
            this.isReverse = true;
        } else if (this.size <= this.minSize) {
            this.isReverse = false;
        }
        if (this.isReverse) {
            this.size -= this.speed;
        } else {
            this.size += this.speed;
        }
    }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
    const min = 0;
    const max = 100;
    const throttle = 0.001;

    if (value <= min || reducedMotion) {
        return min;
    } else if (value >= max) {
        return max * throttle;
    } else {
        return value * throttle;
    }
}

// Border-centric variants using sage, lavender, cream palette
const VARIANTS = {
    default: {
        activeColor: null,
        gap: 5,
        speed: 35,
        colors: "#f8fafc,#f1f5f9,#cbd5e1",
        noFocus: false,
    },
    sage: {
        activeColor: "#d4e5de",
        gap: 6,
        speed: 30,
        colors: "#d4e5de,#a8c5b8,#7ba393",
        noFocus: false,
    },
    lavender: {
        activeColor: "#e8e0f0",
        gap: 6,
        speed: 25,
        colors: "#e8e0f0,#d4c4e8,#b8a4d4",
        noFocus: false,
    },
    cream: {
        activeColor: "#faf8f5",
        gap: 5,
        speed: 20,
        colors: "#faf8f5,#f5f0e8,#e8e0d4",
        noFocus: false,
    },
    primary: {
        activeColor: "#3DDC84",
        gap: 8,
        speed: 40,
        colors: "#3DDC84,#2db86e,#1f9456",
        noFocus: true,
    },
};

interface PixelCardProps {
    variant?: keyof typeof VARIANTS;
    gap?: number;
    speed?: number;
    colors?: string;
    noFocus?: boolean;
    className?: string;
    children?: React.ReactNode;
}

interface VariantConfig {
    activeColor: string | null;
    gap: number;
    speed: number;
    colors: string;
    noFocus: boolean;
}

export function PixelCard({
    variant = "default",
    gap,
    speed,
    colors,
    noFocus,
    className = "",
    children,
}: PixelCardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pixelsRef = useRef<Pixel[]>([]);
    const animationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
    const timePreviousRef = useRef(0);
    const reducedMotionRef = useRef(false);

    const variantCfg: VariantConfig = VARIANTS[variant] || VARIANTS.default;
    const finalGap = gap ?? variantCfg.gap;
    const finalSpeed = speed ?? variantCfg.speed;
    const finalColors = colors ?? variantCfg.colors;
    const finalNoFocus = noFocus ?? variantCfg.noFocus;

    useEffect(() => {
        reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        timePreviousRef.current = performance.now();
    }, []);

    const initPixels = () => {
        if (!containerRef.current || !canvasRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);
        const ctx = canvasRef.current.getContext("2d");

        canvasRef.current.width = width;
        canvasRef.current.height = height;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;

        const colorsArray = finalColors.split(",");
        const pxs: Pixel[] = [];
        for (let x = 0; x < width; x += finalGap) {
            for (let y = 0; y < height; y += finalGap) {
                const color = colorsArray[Math.floor(Math.random() * colorsArray.length)];

                const dx = x - width / 2;
                const dy = y - height / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const delay = reducedMotionRef.current ? 0 : distance;
                if (!ctx) return;
                pxs.push(
                    new Pixel(
                        canvasRef.current,
                        ctx,
                        x,
                        y,
                        color,
                        getEffectiveSpeed(finalSpeed, reducedMotionRef.current),
                        delay,
                    ),
                );
            }
        }
        pixelsRef.current = pxs;
    };

    const doAnimate = (fnName: "appear" | "disappear") => {
        animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
        const timeNow = performance.now();
        const timePassed = timeNow - timePreviousRef.current;
        const timeInterval = 1000 / 60;

        if (timePassed < timeInterval) return;
        timePreviousRef.current = timeNow - (timePassed % timeInterval);

        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        let allIdle = true;
        for (let i = 0; i < pixelsRef.current.length; i++) {
            const pixel = pixelsRef.current[i];
            pixel[fnName]();
            if (!pixel.isIdle) {
                allIdle = false;
            }
        }
        if (allIdle && animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    const handleAnimation = (name: "appear" | "disappear") => {
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(() => doAnimate(name));
    };

    const onMouseEnter = () => handleAnimation("appear");
    const onMouseLeave = () => handleAnimation("disappear");
    const onFocus: React.FocusEventHandler<HTMLDivElement> = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        handleAnimation("appear");
    };
    const onBlur: React.FocusEventHandler<HTMLDivElement> = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        handleAnimation("disappear");
    };

    useEffect(() => {
        initPixels();
        const observer = new ResizeObserver(() => {
            initPixels();
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => {
            observer.disconnect();
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalGap, finalSpeed, finalColors, finalNoFocus]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative overflow-hidden isolate transition-colors duration-200 ease-[cubic-bezier(0.5,1,0.89,1)]",
                className,
            )}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onFocus={finalNoFocus ? undefined : onFocus}
            onBlur={finalNoFocus ? undefined : onBlur}
            tabIndex={finalNoFocus ? -1 : 0}
        >
            <canvas className="absolute inset-0 w-full h-full pointer-events-none" ref={canvasRef} />
            {children}
        </div>
    );
}
