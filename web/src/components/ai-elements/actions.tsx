"use client";

/**
 * Actions Components
 *
 * Action buttons for messages (retry, copy, etc.) with border-centric design.
 */

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionsProps {
    children: ReactNode;
    className?: string;
}

export function Actions({ children, className }: ActionsProps) {
    return (
        <div className={cn("flex items-center gap-2 px-6 pb-3 lg:px-12", className)}>
            {children}
        </div>
    );
}

interface ActionProps {
    children: ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
}

export function Action({ children, label, onClick, className }: ActionProps) {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                "h-7 gap-1 border border-border bg-background/70 px-2 text-xs text-muted-foreground hover:bg-sage/20 hover:text-foreground",
                className,
            )}
            title={label}
        >
            {children}
            <span className="sr-only">{label}</span>
        </Button>
    );
}
