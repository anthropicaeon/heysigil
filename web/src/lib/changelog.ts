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

export async function getChangelogData(): Promise<{
    data: ChangelogDocument | null;
    error: string | null;
    filePath: string | null;
}> {
    const filePath = resolveChangelogPath();
    if (!filePath) {
        return {
            data: null,
            error: "Could not find .changelog.json in repo root.",
            filePath: null,
        };
    }

    try {
        const raw = await fs.promises.readFile(filePath, "utf8");
        const parsed = changelogSchema.parse(JSON.parse(raw));
        const sortedEntries = [...parsed.entries].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        return {
            data: {
                ...parsed,
                entries: sortedEntries,
            },
            error: null,
            filePath,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid changelog format.";
        return {
            data: null,
            error: message,
            filePath,
        };
    }
}
