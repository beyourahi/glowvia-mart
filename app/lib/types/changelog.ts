/**
 * @fileoverview Changelog type definitions
 *
 * @description
 * Shared types for the changelog feature. ChangelogEntry contains only
 * user-facing fields — raw commit SHAs, author names, and file paths are
 * never included.
 */

export type ChangelogCategory =
    | "New Feature"
    | "Improvement"
    | "Fix"
    | "Performance"
    | "Design";

/** A single user-facing changelog entry. */
export type ChangelogEntry = {
    date: string; // ISO 8601 YYYY-MM-DD
    headline: string; // ≤80 chars, plain language
    summary: string; // 2–3 sentences, user-facing
    category?: ChangelogCategory;
};

export type ChangelogLoaderData = {
    entries: ChangelogEntry[];
};
