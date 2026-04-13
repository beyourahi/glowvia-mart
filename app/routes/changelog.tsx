/**
 * @fileoverview Changelog Page
 *
 * @description
 * Public-facing changelog surfacing hand-curated product update entries.
 * Static entry data comes from `app/lib/changelog-data.ts`. The loader also
 * fetches the all-time commit count from the GitHub API (Link header strategy)
 * to display a live total in the hero. Requires GITHUB_TOKEN env var for
 * private repos; gracefully omits the count if the API call fails.
 *
 * @route GET /changelog
 *
 * @features
 * - Server-side rendering (all entries returned in a single loader call)
 * - Client-side category filter (no extra network requests)
 * - Client-side "Load more" pagination (no URL changes)
 * - Graceful empty state when filter returns no results
 *
 * @related
 * - app/lib/changelog-data.ts  - Curated entry data (add new entries here)
 * - app/lib/types/changelog.ts - ChangelogEntry type
 * - app/components/changelog/ChangelogPage.tsx - Page layout
 */

import type {Route} from "./+types/changelog";
import {getSeoMeta} from "@shopify/hydrogen";
import {ChangelogPage} from "~/components/changelog/ChangelogPage";
import {CHANGELOG_ENTRIES} from "~/lib/changelog-data";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";

// =============================================================================
// META
// =============================================================================

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);

    return (
        getSeoMeta({
            title: "Changelog",
            titleTemplate: `%s | ${brandName}`,
            description: `What's new at ${brandName} — a running record of features, fixes, and improvements we've shipped.`,
            url: buildCanonicalUrl("/changelog", siteUrl)
        }) ?? []
    );
};

// =============================================================================
// LOADER
// =============================================================================

export async function loader({context}: Route.LoaderArgs) {
    const token = context.env.GITHUB_TOKEN as string | undefined;
    const totalCommits = await fetchTotalCommits(token);
    return {entries: CHANGELOG_ENTRIES, totalCommits};
}

/** Fetches the all-time commit count by parsing the rel="last" page number from the Link header. */
async function fetchTotalCommits(token?: string): Promise<number | null> {
    try {
        const headers: Record<string, string> = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "storefront-002"
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(
            "https://api.github.com/repos/beyourahi/storefront_002/commits?per_page=1",
            {headers}
        );
        if (!res.ok) return null;
        const link = res.headers.get("Link");
        if (!link) return 1;
        // Link: <...?per_page=1&page=N>; rel="last" — page N equals total commit count
        const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
        return match ? parseInt(match[1], 10) : null;
    } catch {
        return null;
    }
}

// =============================================================================
// ROUTE COMPONENT
// =============================================================================

export default function Changelog({loaderData}: Route.ComponentProps) {
    return <ChangelogPage {...loaderData} />;
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
