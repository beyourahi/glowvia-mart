/**
 * @fileoverview Changelog Page
 *
 * @description
 * Public-facing changelog surfacing hand-curated product update entries.
 * Data comes from the static `app/lib/changelog-data.ts` file — no external
 * API calls, no server-side caching required.
 *
 * @route GET /changelog
 *
 * @features
 * - Server-side rendering (all entries returned in a single loader call)
 * - Client-side category filter + search (no extra network requests)
 * - Client-side "Load more" pagination (no URL changes)
 * - Graceful empty state when search/filter returns no results
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

export async function loader() {
    return {entries: CHANGELOG_ENTRIES};
}

// =============================================================================
// ROUTE COMPONENT
// =============================================================================

export default function Changelog({loaderData}: Route.ComponentProps) {
    return <ChangelogPage {...loaderData} />;
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
