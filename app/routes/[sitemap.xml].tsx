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
 * Generates the sitemap index XML using Hydrogen's utility, then injects a
 * custom entry for `/sitemap.custom.xml` before returning the response.
 *
 * The custom entry covers storefront-specific routes (FAQ, gallery, sale, etc.)
 * that Shopify's sitemap generator does not include automatically.
 *
 * @param request - HTTP request (used to derive the origin for the custom entry URL)
 * @param context - Hydrogen context; `context.storefront` is passed to `getSitemapIndex`
 *
 * @returns XML Response with the augmented sitemap index, cached for 24 hours
 */
export async function loader({request, context: {storefront}}: Route.LoaderArgs) {
    const shopifyResponse = await getSitemapIndex({storefront, request});

    // Inject custom sitemap entry for routes that Shopify does not include automatically.
    const url = new URL(request.url);
    const origin = url.origin;
    const body = await shopifyResponse.text();
    const customEntry = `  <sitemap><loc>${origin}/sitemap.custom.xml</loc></sitemap>\n`;
    const enhanced = body.replace("</sitemapindex>", `${customEntry}</sitemapindex>`);

    return new Response(enhanced, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": `max-age=${60 * 60 * 24}`
        }
    });
}
