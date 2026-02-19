import {
    CalendarClock,
    ExternalLink,
    GitCommitHorizontal,
    Github,
    ShieldCheck,
    Sparkles,
    Trophy,
    Users,
} from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import {
    type ChangelogEntry,
    getChangelogData,
    getContributorShareData,
    groupChangelogByWeek,
} from "@/lib/changelog";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<ChangelogEntry["type"], string> = {
    feature: "bg-sage/35",
    fix: "bg-lavender/40",
    refactor: "bg-secondary/60",
    security: "bg-cream",
    chore: "bg-secondary/40",
    ui: "bg-lavender/35",
    docs: "bg-sage/25",
};

export const revalidate = 3600;
const SIGIL_REPO_URL = "https://github.com/anthropicaeon/heysigil";
const SIGIL_FORK_URL = `${SIGIL_REPO_URL}/fork`;
const SIGIL_GH_DESKTOP_URL = `x-github-client://openRepo/${SIGIL_REPO_URL}`;

function formatDateTime(value: string): string {
    const date = new Date(value);
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });
}

function formatDate(value: string): string {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatPercentage(value: number): string {
    return value % 1 === 0 ? `${value.toFixed(0)}%` : `${value.toFixed(1)}%`;
}

export default async function ChangelogPage() {
    const { data, error, filePath } = await getChangelogData();
    const contributionShare = data ? await getContributorShareData(data.entries) : null;
    const topContributor = contributionShare?.contributors[0] ?? null;
    const weeklyGroups = data ? groupChangelogByWeek(data.entries) : [];
    const defaultOpenWeeks = weeklyGroups.slice(0, 1).map((group) => group.key);

    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 flex flex-col bg-cream">
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-lavender/30"
                >
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            changelog
                        </p>
                        <h1 className="text-3xl lg:text-5xl font-semibold text-foreground mb-4 lowercase">
                            product and protocol updates
                        </h1>
                        <p className="text-muted-foreground text-base lg:text-lg">
                            Real release notes rendered from <code>.changelog.json</code>. Manual edits in
                            that file are reflected here on deploy.
                        </p>
                        <div className="mt-6 border border-border bg-background/70 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.14em] text-primary">
                                build on sigil
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Open this repo in GitHub Desktop and fork it for your own build track.
                            </p>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <Button asChild variant="soft" size="sm" className="gap-2">
                                    <a href={SIGIL_GH_DESKTOP_URL}>
                                        <Github className="size-3.5" />
                                        Build on Sigil
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="gap-2">
                                    <a href={SIGIL_FORK_URL} target="_blank" rel="noreferrer">
                                        Fork on GitHub
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                </Button>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                GitHub Desktop opens/clones first, then prompts fork on push if you do not have
                                write access.
                            </p>
                        </div>
                    </div>
                </PixelCard>

                <div className="grid border-border border-b bg-background sm:grid-cols-3">
                    <div className="border-border border-b px-6 py-4 sm:border-b-0 sm:border-r lg:px-12">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">
                            <Sparkles className="size-3.5" />
                            total updates
                        </div>
                        <p className="mt-2 text-xl font-semibold text-foreground">{data?.entries.length ?? 0}</p>
                    </div>
                    <div className="border-border border-b px-6 py-4 sm:border-b-0 sm:border-r lg:px-12">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">
                            <CalendarClock className="size-3.5" />
                            latest update
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground">
                            {data?.entries[0] ? formatDateTime(data.entries[0].date) : "-"}
                        </p>
                    </div>
                    <div className="px-6 py-4 lg:px-12">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">
                            <ShieldCheck className="size-3.5" />
                            source
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground break-all">
                            {filePath || ".changelog.json not found"}
                        </p>
                    </div>
                </div>

                {!error && data && contributionShare && (
                    <div className="border-border border-b bg-background">
                        <div className="grid border-border border-b sm:grid-cols-[1.1fr_1.9fr]">
                            <div className="border-border border-b px-6 py-4 sm:border-b-0 sm:border-r lg:px-12">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">
                                    <Users className="size-3.5" />
                                    contribution share
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {contributionShare.source === "github"
                                        ? `Live from ${contributionShare.repository}@${contributionShare.branch} (hourly cache)`
                                        : "From changelog author totals"}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {contributionShare.metric === "weighted_lines"
                                        ? "Ranked by lines changed, with commits still shown per author."
                                        : "Ranked by commit count."}
                                </p>
                                {contributionShare.warning && (
                                    <p className="mt-2 text-xs text-amber-700">{contributionShare.warning}</p>
                                )}
                            </div>
                            <div className="px-6 py-4 lg:px-12">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">
                                        <Trophy className="size-3.5" />
                                        leading contributor
                                    </div>
                                    {topContributor && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] uppercase tracking-[0.12em] bg-lavender/40 border-border"
                                        >
                                            {formatPercentage(topContributor.percentage)}
                                        </Badge>
                                    )}
                                </div>
                                <p className="mt-2 text-base font-semibold text-foreground">
                                    {topContributor?.author ?? "-"}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {contributionShare.totalCommits.toLocaleString()} commits counted from
                                    branch start
                                    {contributionShare.metric === "weighted_lines" &&
                                        ` | ${contributionShare.totalUnits.toLocaleString()} ${contributionShare.unitLabel}`}
                                </p>
                            </div>
                        </div>

                        <div className="divide-y divide-border">
                            {contributionShare.contributors.slice(0, 8).map((contributor) => (
                                <div
                                    key={contributor.author}
                                    className="flex items-center justify-between gap-3 px-6 py-3 lg:px-12"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{contributor.author}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {contributor.commits.toLocaleString()} commits
                                            {contributionShare.metric === "weighted_lines" &&
                                                ` | ${contributor.units.toLocaleString()} ${contributionShare.unitLabel}`}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-[11px] bg-background/90 border-border"
                                    >
                                        {formatPercentage(contributor.percentage)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="border-border border-b bg-background px-6 py-6 lg:px-12">
                        <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                            Failed to load changelog: {error}
                        </div>
                    </div>
                )}

                {!error && data && (
                    <div className="bg-background flex-1">
                        <Accordion type="multiple" defaultValue={defaultOpenWeeks}>
                            {weeklyGroups.map((group) => (
                                <AccordionItem key={group.key} value={group.key} className="border-border">
                                    <AccordionTrigger className="hover:no-underline px-6 py-4 lg:px-12 bg-[linear-gradient(180deg,hsl(var(--lavender)/0.16),hsl(var(--background)/0.92))] border-border border-b">
                                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                                                    {group.label}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatDate(group.rangeStart)} - {formatDate(group.rangeEnd)}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] uppercase tracking-[0.12em] bg-background/80 border-border"
                                            >
                                                {group.entries.length} updates
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-0">
                                        {group.entries.map((entry) => (
                                            <article key={entry.id} className="border-border border-b">
                                                <div className="px-6 py-5 lg:px-12 border-border border-b bg-secondary/30">
                                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "text-[10px] uppercase tracking-[0.12em]",
                                                                        TYPE_STYLES[entry.type],
                                                                    )}
                                                                >
                                                                    {entry.type}
                                                                </Badge>
                                                                {entry.area.length > 0 && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {entry.area.join(" | ")}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <h2 className="mt-2 text-lg lg:text-xl font-semibold text-foreground">
                                                                {entry.title}
                                                            </h2>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground lg:text-right">
                                                            <p>{formatDateTime(entry.date)}</p>
                                                            <p className="mt-1">by {entry.author}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid lg:grid-cols-[1.15fr_1fr_1.15fr]">
                                                    <div className="border-border border-b px-6 py-5 lg:border-b-0 lg:border-r lg:px-12">
                                                        <p className="text-xs uppercase tracking-[0.12em] text-primary mb-3">
                                                            features
                                                        </p>
                                                        <ul className="space-y-2 text-sm text-foreground">
                                                            {entry.features.map((feature) => (
                                                                <li
                                                                    key={feature}
                                                                    className="flex items-start gap-2"
                                                                >
                                                                    <span className="mt-1 block size-1.5 bg-primary" />
                                                                    <span>{feature}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="border-border border-b px-6 py-5 lg:border-b-0 lg:border-r lg:px-12">
                                                        <p className="text-xs uppercase tracking-[0.12em] text-primary mb-3">
                                                            reason
                                                        </p>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {entry.reason}
                                                        </p>
                                                        <div className="mt-4 border border-border bg-background/80 px-3 py-2">
                                                            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                                                                commit
                                                            </p>
                                                            <p className="text-xs text-foreground flex items-center gap-1.5 break-all">
                                                                <GitCommitHorizontal className="size-3.5 shrink-0 text-primary" />
                                                                {entry.commit}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="px-6 py-5 lg:px-12">
                                                        <p className="text-xs uppercase tracking-[0.12em] text-primary mb-3">
                                                            details
                                                        </p>
                                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                                            {entry.details.map((detail) => (
                                                                <li
                                                                    key={detail}
                                                                    className="flex items-start gap-2"
                                                                >
                                                                    <span className="mt-1 block size-1.5 bg-border" />
                                                                    <span>{detail}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}
            </div>
        </section>
    );
}

