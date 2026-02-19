"use client";

/**
 * Conversation Components
 *
 * Container for chat messages with border-centric design.
 */

import { ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConversationProps {
    children: ReactNode;
    className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
    return <div className={cn("relative flex flex-col", className)}>{children}</div>;
}

interface ConversationContentProps {
    children: ReactNode;
    className?: string;
}

export function ConversationContent({ children, className }: ConversationContentProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    });

    return (
        <div
            ref={ref}
            data-conversation-content
            className={cn(
                "flex-1 overflow-y-auto scrollbar-hide divide-y divide-border bg-[linear-gradient(180deg,hsl(var(--background)/0.75),hsl(var(--sage)/0.06))]",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function ConversationScrollButton() {
    const [visible, setVisible] = useState(false);

    const handleScroll = () => {
        const container = document.querySelector("[data-conversation-content]");
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        setVisible(scrollHeight - scrollTop - clientHeight > 100);
    };

    useEffect(() => {
        const container = document.querySelector("[data-conversation-content]");
        container?.addEventListener("scroll", handleScroll);
        return () => container?.removeEventListener("scroll", handleScroll);
    }, []);

    if (!visible) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 border-border bg-background"
            onClick={() => {
                const container = document.querySelector("[data-conversation-content]");
                container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
            }}
        >
            <ChevronDown className="size-4 mr-1" />
            Scroll to bottom
        </Button>
    );
}
