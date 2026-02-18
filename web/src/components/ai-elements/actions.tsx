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
        <div className={cn("flex items-center gap-2 px-6 py-2 lg:px-12", className)}>
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
                "gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-foreground",
                className,
            )}
            title={label}
        >
            {children}
            <span className="sr-only">{label}</span>
        </Button>
    );
}
