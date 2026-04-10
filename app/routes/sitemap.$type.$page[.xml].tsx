/**
 * @fileoverview Individual Sitemap XML Route
 *
 * @description
 * Generates individual sitemap XML files for different content types.
 * Search engines use these to discover all pages of a specific type.
 * Uses Hydrogen's built-in getSitemap utility for Shopify integration.
 *
 * @route GET /sitemap/:type/:page.xml
 *
 * @url-examples
 * - /sitemap/products/1.xml
 * - /sitemap/collections/1.xml
 * - /sitemap/pages/1.xml
 * - /sitemap/blogs/1.xml
 *
 * @supported-types
 * - products: All products in the store
 * - collections: All collections
 * - pages: Custom pages
 * - blogs: Blog posts and articles
 *
 * @i18n
 * Generates URLs for the storefront's single locale:
 * - EN-BD (English, Bangladesh)
 *
 * @url-structure
 * URLs follow the pattern: /{locale}/{type}/{handle}
 * Example: /EN-BD/products/blue-shirt
 *
 * @pagination
 * Large catalogs are split across multiple pages:
 * - /sitemap/products/1.xml (items 1-50000)
 * - /sitemap/products/2.xml (items 50001-100000)
 *
 * @caching
 * Cached for 24 hours (86400 seconds) to balance:
 * - Reduced API calls and server load
 * - Reasonable content freshness for new products
 *
 * @related
 * - [sitemap.xml].tsx - Sitemap index that lists these files
 * - [robots.txt].tsx - References the sitemap index
 *
 * @see https://shopify.dev/docs/api/hydrogen/utilities/getsitemap
 */

import type {Route} from "./+types/sitemap.$type.$page[.xml]";
import {getSitemap} from "@shopify/hydrogen";
import {STORE_SITEMAP_LOCALE} from "~/lib/store-locale";

// =============================================================================
// LOADER
// =============================================================================

/**
 * Generates sitemap XML for a specific content type and page.
 *
 * @param request - HTTP request
 * @param params - Route params (type: products|collections|etc, page: number)
 * @param storefront - Storefront API client
 *
 * @returns XML Response with sitemap content, cached for 24 hours
 */
export async function loader({request, params, context: {storefront}}: Route.LoaderArgs) {
    const response = await getSitemap({
        storefront,
        request,
        params,
        // Supported locale for URL generation
        locales: [STORE_SITEMAP_LOCALE],
        // Custom URL builder for locale-prefixed URLs
        getLink: ({type, baseUrl, handle, locale}) => {
            if (!locale) return `${baseUrl}/${type}/${handle}`;
            return `${baseUrl}/${locale}/${type}/${handle}`;
        }
    });

    // Cache for 24 hours - product catalog doesn't change frequently
    response.headers.set("Cache-Control", `max-age=${60 * 60 * 24}`);

    return response;
}
