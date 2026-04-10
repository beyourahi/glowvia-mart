/**
 * @fileoverview XML Sitemap Index Route
 *
 * @description
 * Generates the main sitemap index file that lists all individual sitemaps.
 * Search engines use this to discover all pages on the site efficiently.
 * Uses Hydrogen's built-in getSitemapIndex for Shopify integration.
 *
 * @route GET /sitemap.xml
 *
 * @seo
 * The sitemap index is crucial for SEO:
 * - Lists all child sitemaps (products, collections, pages, blogs)
 * - Helps search engines discover content faster
 * - Required for large sites with many pages
 * - Referenced in robots.txt for crawler discovery
 *
 * @structure
 * The index points to individual sitemaps:
 * - /sitemap/products/1.xml
 * - /sitemap/collections/1.xml
 * - /sitemap/pages/1.xml
 * - /sitemap/blogs/1.xml
 *
 * @caching
 * Cached for 24 hours (86400 seconds) to reduce API calls
 * while allowing reasonable content freshness.
 *
 * @related
 * - sitemap.$type.$page[.xml].tsx - Individual sitemap pages
 * - [robots.txt].tsx - References this sitemap
 *
 * @see https://shopify.dev/docs/api/hydrogen/utilities/getsitemapindex
 */

import type {Route} from "./+types/[sitemap.xml]";
import {getSitemapIndex} from "@shopify/hydrogen";

// =============================================================================
// LOADER
// =============================================================================

/**
 * Generates the sitemap index XML using Hydrogen's utility.
 *
 * @param request - HTTP request
 * @param storefront - Storefront API client
 *
 * @returns XML Response with sitemap index, cached for 24 hours
 */
export async function loader({request, context: {storefront}}: Route.LoaderArgs) {
    const response = await getSitemapIndex({
        storefront,
        request
    });

    // Cache for 24 hours - sitemap structure rarely changes
    response.headers.set("Cache-Control", `max-age=${60 * 60 * 24}`);

    return response;
}

