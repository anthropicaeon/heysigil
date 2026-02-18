/**
 * Countdown Hook
 *
 * Returns a formatted countdown string for a deadline timestamp.
 */

import { useEffect, useState } from "react";

export function useCountdown(deadline: number): string {
    const [now, setNow] = useState(Date.now() / 1000);

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now() / 1000), 1000);
        return () => clearInterval(t);
    }, []);

    const diff = deadline - now;
    if (diff <= 0) return "Ended";

    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);

    if (d > 0) return `${d}d ${h}h remaining`;
    if (h > 0) return `${h}h ${m}m remaining`;
    return `${m}m remaining`;
}
