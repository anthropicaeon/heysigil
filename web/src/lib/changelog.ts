import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

const changelogEntrySchema = z.object({
    id: z.string().min(1),
    commit: z.string().min(7),
    date: z.string().datetime({ offset: true }),
    title: z.string().min(1),
    type: z.enum(["feature", "fix", "refactor", "security", "chore", "ui", "docs"]),
    area: z.array(z.string().min(1)).default([]),
    features: z.array(z.string().min(1)).min(1),
    reason: z.string().min(1),
    details: z.array(z.string().min(1)).min(1),
    author: z.string().min(1),
});

const changelogSchema = z.object({
    version: z.number().int().positive(),
    generatedAt: z.string().datetime({ offset: true }),
    entries: z.array(changelogEntrySchema),
});

export type ChangelogEntry = z.infer<typeof changelogEntrySchema>;
export type ChangelogDocument = z.infer<typeof changelogSchema>;
export interface ChangelogWeekGroup {
    key: string;
    label: string;
    rangeStart: string;
    rangeEnd: string;
    entries: ChangelogEntry[];
}
export interface ContributorShare {
    author: string;
    commits: number;
    units: number;
    percentage: number;
}
export type ContributorShareMetric = "weighted_lines" | "commit_count";
export interface ContributorShareData {
    source: "github" | "changelog";
    metric: ContributorShareMetric;
    unitLabel: string;
    repository: string;
    branch: string;
    totalCommits: number;
    totalUnits: number;
    refreshedAt: string;
    contributors: ContributorShare[];
    warning: string | null;
}

function resolveChangelogPath(): string | null {
    const candidates = [
        path.resolve(process.cwd(), ".changelog.json"),
        path.resolve(process.cwd(), "..", ".changelog.json"),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }

    return null;
}

function parseAndSortChangelog(raw: string): ChangelogDocument {
    const parsed = changelogSchema.parse(JSON.parse(raw));
    const sortedEntries = [...parsed.entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
        ...parsed,
        entries: sortedEntries,
    };
}

function getChangelogRemoteUrl(): string {
    const explicitUrl = process.env.CHANGELOG_PUBLIC_URL?.trim();
    if (explicitUrl) return explicitUrl;

    const repository = process.env.CHANGELOG_GITHUB_REPO || "anthropicaeon/heysigil";
    const rawBranch =
        process.env.CHANGELOG_GITHUB_BRANCH ||
        process.env.RAILWAY_GIT_BRANCH ||
        process.env.VERCEL_GIT_COMMIT_REF ||
        "main";
    const branch = rawBranch.startsWith("refs/heads/")
        ? rawBranch.slice("refs/heads/".length)
        : rawBranch;

    return `https://raw.githubusercontent.com/${repository}/${encodeURIComponent(branch)}/.changelog.json`;
}

export async function getChangelogData(): Promise<{
    data: ChangelogDocument | null;
    error: string | null;
    filePath: string | null;
}> {
    const filePath = resolveChangelogPath();
    const remoteUrl = getChangelogRemoteUrl();

    try {
        if (filePath) {
            const raw = await fs.promises.readFile(filePath, "utf8");
            const data = parseAndSortChangelog(raw);
            return {
                data,
                error: null,
                filePath,
            };
        }

        const response = await fetch(remoteUrl, { next: { revalidate: 3600 } });
        if (!response.ok) {
            throw new Error(`Failed to fetch changelog source (${response.status} ${response.statusText}).`);
        }
        const raw = await response.text();
        const data = parseAndSortChangelog(raw);
        return {
            data,
            error: null,
            filePath: remoteUrl,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid changelog format.";
        return {
            data: null,
            error: message,
            filePath: filePath || remoteUrl,
        };
    }
}

function getWeekStartUtc(input: Date): Date {
    const date = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
    const day = date.getUTCDay();
    const offsetToMonday = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + offsetToMonday);
    return date;
}

function addDaysUtc(input: Date, days: number): Date {
    const date = new Date(input);
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

function formatWeekLabel(start: Date): string {
    return `Week of ${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    })}`;
}

export function groupChangelogByWeek(entries: ChangelogEntry[]): ChangelogWeekGroup[] {
    const buckets = new Map<string, ChangelogWeekGroup>();

    for (const entry of entries) {
        const date = new Date(entry.date);
        const start = getWeekStartUtc(date);
        const end = addDaysUtc(start, 6);
        const key = start.toISOString().slice(0, 10);

        const existing = buckets.get(key);
        if (existing) {
            existing.entries.push(entry);
            continue;
        }

        buckets.set(key, {
            key,
            label: formatWeekLabel(start),
            rangeStart: start.toISOString(),
            rangeEnd: end.toISOString(),
            entries: [entry],
        });
    }

    return Array.from(buckets.values()).sort(
        (a, b) => new Date(b.rangeStart).getTime() - new Date(a.rangeStart).getTime(),
    );
}

function normalizeAuthorName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
}

interface ContributorAggregate {
    author: string;
    commits: number;
    units: number;
}

interface RepositoryConfig {
    repository: string;
    branch: string;
    maxPages: number;
    metric: ContributorShareMetric;
}

function getRepositoryConfig(): RepositoryConfig {
    const repository = process.env.CHANGELOG_GITHUB_REPO || "anthropicaeon/heysigil";
    const branch =
        process.env.CHANGELOG_GITHUB_BRANCH ||
        process.env.RAILWAY_GIT_BRANCH ||
        process.env.VERCEL_GIT_COMMIT_REF ||
        "main";
    const maxPagesValue = Number(process.env.CHANGELOG_GITHUB_MAX_PAGES || "20");
    const maxPages = Number.isFinite(maxPagesValue) && maxPagesValue > 0 ? maxPagesValue : 20;
    const metricEnv = (process.env.CHANGELOG_SHARE_METRIC || "weighted_lines").toLowerCase();
    const metric: ContributorShareMetric = metricEnv === "commit_count" ? "commit_count" : "weighted_lines";

    return { repository, branch, maxPages, metric };
}

function getMetricUnitLabel(metric: ContributorShareMetric): string {
    return metric === "weighted_lines" ? "lines changed" : "commits";
}

function parseOwnerRepo(repository: string): { owner: string; repo: string } {
    const [owner, repo] = repository.split("/");
    if (!owner || !repo) {
        throw new Error(`Invalid repository format: "${repository}". Expected "owner/repo".`);
    }

    return { owner, repo };
}

function normalizeBranchRef(branch: string): string {
    if (branch.startsWith("refs/heads/")) return branch;
    return `refs/heads/${branch}`;
}

function buildGithubHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "heysigil-changelog-contributors",
    };

    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

function buildContributorShares(
    aggregates: ContributorAggregate[],
    metric: ContributorShareMetric,
): { contributors: ContributorShare[]; totalCommits: number; totalUnits: number } {
    const buckets = new Map<string, ContributorAggregate>();

    for (const aggregate of aggregates) {
        const normalized = normalizeAuthorName(aggregate.author);
        if (!normalized) continue;
        const key = normalized.toLowerCase();
        const existing = buckets.get(key);
        if (existing) {
            existing.commits += aggregate.commits;
            existing.units += aggregate.units;
            continue;
        }
        buckets.set(key, { author: normalized, commits: aggregate.commits, units: aggregate.units });
    }

    const merged = Array.from(buckets.values());
    const totalCommits = merged.reduce((sum, item) => sum + item.commits, 0);
    const totalUnits = merged.reduce((sum, item) => sum + item.units, 0);
    const denominator = totalUnits > 0 ? totalUnits : totalCommits;
    if (denominator === 0) {
        return { contributors: [], totalCommits: 0, totalUnits: 0 };
    }

    const contributors = merged
        .map((item) => {
            const unitsForMetric = metric === "weighted_lines" ? item.units : item.commits;
            return {
                author: item.author,
                commits: item.commits,
                units: unitsForMetric,
                percentage: Number(((unitsForMetric / denominator) * 100).toFixed(1)),
            };
        })
        .sort((a, b) => b.units - a.units || b.commits - a.commits || a.author.localeCompare(b.author));

    return { contributors, totalCommits, totalUnits };
}

async function fetchGithubWeightedAggregates(
    repository: string,
    branch: string,
    maxPages: number,
    token: string,
): Promise<ContributorAggregate[]> {
    if (!token) {
        throw new Error(
            "Weighted contribution share requires GITHUB_TOKEN or CHANGELOG_GITHUB_TOKEN for GitHub GraphQL.",
        );
    }

    const { owner, repo } = parseOwnerRepo(repository);
    const ref = normalizeBranchRef(branch);
    const headers = buildGithubHeaders(token);
    headers["Content-Type"] = "application/json";

    const query = `
        query CommitHistory($owner: String!, $repo: String!, $ref: String!, $after: String) {
            repository(owner: $owner, name: $repo) {
                ref(qualifiedName: $ref) {
                    target {
                        ... on Commit {
                            history(first: 100, after: $after) {
                                pageInfo {
                                    hasNextPage
                                    endCursor
                                }
                                nodes {
                                    additions
                                    deletions
                                    author {
                                        name
                                        user {
                                            login
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    let after: string | null = null;
    const aggregates: ContributorAggregate[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
        const response = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers,
            body: JSON.stringify({
                query,
                variables: { owner, repo, ref, after },
            }),
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error(`GitHub GraphQL request failed (${response.status} ${response.statusText}).`);
        }

        const payload = (await response.json()) as {
            errors?: Array<{ message?: string }>;
            data?: {
                repository?: {
                    ref?: {
                        target?: {
                            history?: {
                                pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
                                nodes?: Array<{
                                    additions?: number | null;
                                    deletions?: number | null;
                                    author?: {
                                        name?: string | null;
                                        user?: { login?: string | null } | null;
                                    } | null;
                                }> | null;
                            } | null;
                        } | null;
                    } | null;
                } | null;
            };
        };

        if (Array.isArray(payload.errors) && payload.errors.length > 0) {
            const message = payload.errors.map((err) => err.message).filter(Boolean).join("; ");
            throw new Error(message || "Unknown GitHub GraphQL error.");
        }

        const history = payload.data?.repository?.ref?.target?.history;
        if (!history) break;
        const nodes = Array.isArray(history.nodes) ? history.nodes : [];

        for (const node of nodes) {
            const login = node.author?.user?.login;
            const name = node.author?.name;
            const author = normalizeAuthorName(login || name || "");
            if (!author) continue;
            const additions = typeof node.additions === "number" ? Math.max(node.additions, 0) : 0;
            const deletions = typeof node.deletions === "number" ? Math.max(node.deletions, 0) : 0;
            aggregates.push({
                author,
                commits: 1,
                units: additions + deletions,
            });
        }

        if (!history.pageInfo?.hasNextPage || !history.pageInfo.endCursor) break;
        after = history.pageInfo.endCursor;
    }

    return aggregates;
}

async function fetchGithubCommitAggregates(
    repository: string,
    branch: string,
    maxPages: number,
    token?: string,
): Promise<ContributorAggregate[]> {
    const { owner, repo } = parseOwnerRepo(repository);
    const headers = buildGithubHeaders(token);
    const perPage = 100;
    const aggregates: ContributorAggregate[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
        const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
        url.searchParams.set("sha", branch);
        url.searchParams.set("per_page", String(perPage));
        url.searchParams.set("page", String(page));
        const response = await fetch(url.toString(), {
            headers,
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error(`GitHub API request failed (${response.status} ${response.statusText}).`);
        }

        const payload: unknown = await response.json();
        if (!Array.isArray(payload) || payload.length === 0) break;

        for (const item of payload) {
            if (!item || typeof item !== "object") continue;

            const withLogin = item as { author?: { login?: unknown } | null };
            if (typeof withLogin.author?.login === "string" && withLogin.author.login.trim().length > 0) {
                aggregates.push({
                    author: withLogin.author.login.trim(),
                    commits: 1,
                    units: 1,
                });
                continue;
            }

            const withCommitAuthor = item as { commit?: { author?: { name?: unknown } } };
            if (
                typeof withCommitAuthor.commit?.author?.name === "string" &&
                withCommitAuthor.commit.author.name.trim().length > 0
            ) {
                aggregates.push({
                    author: withCommitAuthor.commit.author.name.trim(),
                    commits: 1,
                    units: 1,
                });
            }
        }

        if (payload.length < perPage) break;
    }

    return aggregates;
}

function createContributorShareData(
    source: "github" | "changelog",
    metric: ContributorShareMetric,
    repository: string,
    branch: string,
    aggregates: ContributorAggregate[],
    warning: string | null,
): ContributorShareData {
    const { contributors, totalCommits, totalUnits } = buildContributorShares(aggregates, metric);
    return {
        source,
        metric,
        unitLabel: getMetricUnitLabel(metric),
        repository,
        branch,
        totalCommits,
        totalUnits,
        refreshedAt: new Date().toISOString(),
        contributors,
        warning,
    };
}

function buildChangelogContributorFallback(
    entries: ChangelogEntry[],
    warning: string | null,
): ContributorShareData {
    const aggregates = entries.map((entry) => ({
        author: entry.author,
        commits: 1,
        units: 1,
    }));
    return createContributorShareData(
        "changelog",
        "commit_count",
        "local .changelog.json",
        "n/a",
        aggregates,
        warning,
    );
}

export async function getContributorShareData(entries: ChangelogEntry[]): Promise<ContributorShareData> {
    const { repository, branch, maxPages, metric } = getRepositoryConfig();
    const token = process.env.GITHUB_TOKEN || process.env.CHANGELOG_GITHUB_TOKEN;

    if (metric === "weighted_lines") {
        try {
            const weightedAggregates = await fetchGithubWeightedAggregates(
                repository,
                branch,
                maxPages,
                token || "",
            );
            if (weightedAggregates.length > 0) {
                return createContributorShareData(
                    "github",
                    "weighted_lines",
                    repository,
                    branch,
                    weightedAggregates,
                    null,
                );
            }
        } catch (weightedError) {
            const weightedMessage =
                weightedError instanceof Error ? weightedError.message : "Weighted GitHub fetch failed.";
            try {
                const commitAggregates = await fetchGithubCommitAggregates(
                    repository,
                    branch,
                    maxPages,
                    token,
                );
                if (commitAggregates.length > 0) {
                    return createContributorShareData(
                        "github",
                        "commit_count",
                        repository,
                        branch,
                        commitAggregates,
                        `${weightedMessage} Showing commit-count share instead.`,
                    );
                }
            } catch (commitError) {
                const commitMessage =
                    commitError instanceof Error ? commitError.message : "Commit-count GitHub fetch failed.";
                return buildChangelogContributorFallback(
                    entries,
                    `${weightedMessage} ${commitMessage} Using changelog fallback.`,
                );
            }

            return buildChangelogContributorFallback(
                entries,
                `${weightedMessage} GitHub returned no commits; using changelog fallback.`,
            );
        }

        return buildChangelogContributorFallback(
            entries,
            "GitHub weighted fetch returned no commits; using changelog fallback.",
        );
    }

    try {
        const commitAggregates = await fetchGithubCommitAggregates(repository, branch, maxPages, token);
        if (commitAggregates.length > 0) {
            return createContributorShareData(
                "github",
                "commit_count",
                repository,
                branch,
                commitAggregates,
                null,
            );
        }
        return buildChangelogContributorFallback(
            entries,
            "GitHub returned no commits for contributor share; using changelog fallback.",
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch GitHub contributor share.";
        return buildChangelogContributorFallback(entries, `${message} Using changelog fallback.`);
    }
}
