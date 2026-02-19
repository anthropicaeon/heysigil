import React from "react";

import { cn } from "@/lib/utils";

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
    as?: T;
    className?: string;
    innerClassName?: string;
    children?: React.ReactNode;
    color?: string;
    speed?: React.CSSProperties["animationDuration"];
    thickness?: number;
};

export const StarBorder = <T extends React.ElementType = "button">({
    as,
    className,
    innerClassName,
    children,
    color = "hsl(var(--primary) / 0.7)",
    speed = "5s",
    thickness = 1,
    ...rest
}: StarBorderProps<T>) => {
    const Component = as || "button";

    return (
        <Component
            className={cn(
                "group relative inline-flex overflow-hidden rounded-none bg-transparent",
                "disabled:pointer-events-none disabled:opacity-50",
                className,
            )}
            style={{
                padding: `${thickness}px`,
                ...((rest as any).style ?? {}),
            }}
            {...(rest as any)}
        >
            <span
                className="pointer-events-none absolute bottom-[-10px] right-[-240%] z-0 h-[56%] w-[300%] opacity-25 animate-star-movement-bottom"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animationDuration: speed,
                }}
            />
            <span
                className="pointer-events-none absolute top-[-10px] left-[-240%] z-0 h-[56%] w-[300%] opacity-45 animate-star-movement-top"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animationDuration: speed,
                }}
            />
            <span
                className={cn(
                    "relative z-[1] inline-flex w-full items-center justify-center border border-border",
                    "bg-background px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground",
                    "transition-colors duration-200 group-hover:bg-lavender/35",
                    innerClassName,
                )}
            >
                {children}
            </span>
        </Component>
    );
};
