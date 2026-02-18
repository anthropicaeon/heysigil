/**
 * Countdown Component
 *
 * Displays remaining time until deadline.
 * Updated with pastel design system.
 */

import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

import { useCountdown } from "../hooks/useCountdown";

interface CountdownProps {
    deadline: number;
}

export function Countdown({ deadline }: CountdownProps) {
    const label = useCountdown(deadline);
    const isUrgent = deadline - Date.now() / 1000 < 86400 && deadline - Date.now() / 1000 > 0;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-sm",
                isUrgent ? "text-orange-600 font-medium" : "text-muted-foreground",
            )}
        >
            <Clock className="size-3" />
            {label}
        </span>
    );
}
