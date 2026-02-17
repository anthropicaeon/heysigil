/**
 * SocialProof Component
 *
 * Displays verification statistics and recent activity to build trust.
 * Based on Cialdini's principle: people follow the actions of others.
 */

"use client";

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
        <div className="social-proof">
            {/* Trust badge */}
            <div className="social-proof-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
                <span>Trusted by <strong>{stats.totalVerified.toLocaleString()}</strong> developers</span>
            </div>

            {/* Live activity pulse */}
            <div className="social-proof-activity">
                <span className="activity-pulse" />
                <span className="activity-text">
                    A developer verified via <strong>{activity?.method}</strong> · {activity?.timeAgo}
                </span>
            </div>

            {/* Monthly counter */}
            <div className="social-proof-monthly">
                <span className="monthly-count">{stats.thisMonth}</span>
                <span className="monthly-label">verifications this month</span>
            </div>
        </div>
    );
}
