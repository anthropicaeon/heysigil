/**
 * Countdown Component
 *
 * Displays remaining time until deadline.
 */

import Image from "next/image";
import { useCountdown } from "../hooks/useCountdown";

interface CountdownProps {
    deadline: number;
}

export function Countdown({ deadline }: CountdownProps) {
    const label = useCountdown(deadline);
    const isUrgent = deadline - Date.now() / 1000 < 86400 && deadline - Date.now() / 1000 > 0;

    return (
        <span className={`countdown ${isUrgent ? "urgent" : ""}`}>
            <Image
                src="/icons/target-04.svg"
                alt=""
                width={12}
                height={12}
                style={{ display: "inline", verticalAlign: "middle", marginRight: 3, opacity: 0.5 }}
            />
            {label}
        </span>
    );
}
