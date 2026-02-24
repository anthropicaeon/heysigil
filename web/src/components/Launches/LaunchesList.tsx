"use client";

import { Filter, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { LaunchCard } from "@/components/Launches/LaunchCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import type { LaunchListItem } from "@/types";

const PAGE_SIZE = 20;
const PLATFORM_OPTIONS = ["all", "github", "twitter", "facebook", "instagram", "domain"] as const;

type PlatformFilter = (typeof PLATFORM_OPTIONS)[number];
type SortFilter = "newest" | "oldest" | "marketCap";

export function LaunchesList() {
    const [launches, setLaunches] = useState<LaunchListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    const [queryInput, setQueryInput] = useState("");
    const [query, setQuery] = useState("");
    const [platform, setPlatform] = useState<PlatformFilter>("all");
    const [sort, setSort] = useState<SortFilter>("newest");

    const fetchLaunches = useCallback(
        async (offset: number, append: boolean) => {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const data = await apiClient.launch.list({
                    limit: PAGE_SIZE,
                    offset,
                    q: query || undefined,
                    platform: platform === "all" ? undefined : platform,
                    sort,
                });

                setLaunches((prev) => (append ? [...prev, ...data.launches] : data.launches));
                setHasMore(data.pagination.hasMore);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load launches");
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [platform, query, sort],
    );

    useEffect(() => {
        void fetchLaunches(0, false);
    }, [fetchLaunches]);

    return (
        <>
            <div className="border-border border-b bg-background">
                <div className="px-6 py-3 lg:px-12 border-border border-b bg-sage/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="size-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Registry Controls
                        </span>
                    </div>
                    <Badge variant="outline">{launches.length} loaded</Badge>
                </div>

                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <div className="flex flex-col lg:flex-row gap-3">
                            <div className="flex-1 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        value={queryInput}
                                        onChange={(e) => setQueryInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") setQuery(queryInput.trim());
                                        }}
                                        className="pl-9"
                                        placeholder="Search project, id, or token address"
                                    />
                                </div>
                                <Button size="sm" onClick={() => setQuery(queryInput.trim())}>
                                    Apply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setQueryInput("");
                                        setQuery("");
                                    }}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 lg:px-12 bg-cream/30">
                        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                {PLATFORM_OPTIONS.map((opt) => (
                                    <Button
                                        key={opt}
                                        size="sm"
                                        variant={platform === opt ? "default" : "outline"}
                                        onClick={() => setPlatform(opt)}
                                        className="capitalize"
                                    >
                                        {opt}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={sort === "marketCap" ? "default" : "outline"}
                                    onClick={() => setSort("marketCap")}
                                >
                                    Market Cap
                                </Button>
                                <Button
                                    size="sm"
                                    variant={sort === "newest" ? "default" : "outline"}
                                    onClick={() => setSort("newest")}
                                >
                                    Newest
                                </Button>
                                <Button
                                    size="sm"
                                    variant={sort === "oldest" ? "default" : "outline"}
                                    onClick={() => setSort("oldest")}
                                >
                                    Oldest
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-background divide-y divide-border border-border border-b">
                {loading && (
                    <div className="px-6 py-10 lg:px-12 text-muted-foreground flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Loading launched tokens...
                    </div>
                )}

                {!loading && error && (
                    <div className="px-6 py-10 lg:px-12 text-destructive bg-rose/10">
                        Failed to load launches: {error}
                    </div>
                )}

                {!loading && !error && launches.length === 0 && (
                    <div className="px-6 py-10 lg:px-12 text-muted-foreground">
                        No launched tokens match your filters.
                    </div>
                )}

                {!loading &&
                    !error &&
                    launches.map((launch) => <LaunchCard key={launch.projectId} launch={launch} />)}
            </div>

            <div className="border-border border-t bg-background px-6 py-4 lg:px-12 flex justify-center">
                {hasMore ? (
                    <Button
                        variant="outline"
                        onClick={() => void fetchLaunches(launches.length, true)}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Loading...
                            </>
                        ) : (
                            "Load more"
                        )}
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        End of launches
                    </span>
                )}
            </div>
        </>
    );
}
