/**
 * SocialProof Component
 *
 * Displays verification statistics and recent activity to build trust.
 * Based on Cialdini's principle: people follow the actions of others.
 * Updated with pastel design system.
 */

"use client";

import { Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface VerificationStats {
    totalVerified: number;
    thisMonth: number;
    recentActivity: Array<{
        method: string;
        timeAgo: string;
    }>;
}

// Mock stats - replace with API call in production
const MOCK_STATS: VerificationStats = {
    totalVerified: 847,
    thisMonth: 127,
    recentActivity: [
        { method: "GitHub OAuth", timeAgo: "2 min ago" },
        { method: "DNS Record", timeAgo: "8 min ago" },
        { method: "Tweet zkTLS", timeAgo: "14 min ago" },
        { method: "GitHub OAuth", timeAgo: "23 min ago" },
    ],
};

export function SocialProof() {
    const [stats, setStats] = useState<VerificationStats | null>(null);
    const [currentActivity, setCurrentActivity] = useState(0);

    useEffect(() => {
        // Simulate loading stats
        const timer = setTimeout(() => setStats(MOCK_STATS), 300);
        return () => clearTimeout(timer);
    }, []);

    // Rotate recent activity indicator
    useEffect(() => {
        if (!stats) return;
        const interval = setInterval(() => {
            setCurrentActivity((prev) => (prev + 1) % stats.recentActivity.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [stats]);

    if (!stats) return null;

    const activity = stats.recentActivity[currentActivity];

    return (
        <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
            {/* Trust badge */}
            <div className="flex items-center gap-2 text-sm">
                <Shield className="size-4 text-primary" />
                <span className="text-muted-foreground">
                    Trusted by{" "}
                    <strong className="text-foreground">
                        {stats.totalVerified.toLocaleString()}
                    </strong>{" "}
                    developers
                </span>
            </div>

            {/* Live activity pulse */}
            <div className="flex items-center gap-2 text-sm">
                <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                </span>
                <span className="text-muted-foreground">
                    A developer verified via{" "}
                    <strong className="text-foreground">{activity?.method}</strong> ·{" "}
                    {activity?.timeAgo}
                </span>
            </div>

            {/* Monthly counter */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
                <span className="text-lg font-bold text-primary">{stats.thisMonth}</span>
                <span className="text-sm text-muted-foreground">verifications this month</span>
            </div>
        </div>
    );
}
