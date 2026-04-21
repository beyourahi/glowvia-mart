/**
 * @fileoverview Dynamic robots.txt Generation Route
 *
 * @description
 * Generates a robots.txt file dynamically based on Shopify store configuration.
 * The file instructs search engine crawlers which URLs they can access.
 * This follows Shopify's standard robots.txt rules with custom extensions.
 *
 * @route GET /robots.txt
 *
 * @seo
 * The robots.txt file is critical for SEO:
 * - Controls which pages search engines can crawl
 * - Prevents indexing of checkout, cart, and admin pages
 * - Points crawlers to the sitemap for efficient discovery
 * - Sets crawl delays for aggressive bots
 *
 * @caching
 * Cached for 24 hours (max-age=86400) as rules rarely change.
 * This reduces server load while allowing reasonable update frequency.
 *
 * @security
 * Disallows sensitive paths:
 * - /admin - Shopify admin
 * - /checkouts - Customer checkout process
 * - /account - Customer account area
 * - /orders - Order information
 *
 * @bot-specific-rules
 * - adsbot-google: Special rules (ignores general User-agent: *)
 * - Nutch: Completely blocked (spam crawler)
 * - AhrefsBot: 10 second crawl delay (SEO tool)
 * - MJ12bot: 10 second crawl delay (Majestic crawler)
 * - Pinterest: 1 second crawl delay
 *
 * @related
 * - [sitemap.xml].tsx - XML sitemap referenced in robots.txt
 * - sitemap.$type.$page[.xml].tsx - Individual sitemap pages
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots/intro
 */

import type {Route} from "./+types/[robots.txt]";
import {parseGid} from "@shopify/hydrogen";

// =============================================================================
// LOADER
// =============================================================================

/**
 * Generates robots.txt content as a plain text response.
 *
 * @param request - HTTP request (used for origin URL)
 * @param context - Hydrogen context with storefront client
 *
 * @returns Plain text Response with robots.txt content, cached for 24 hours
 */
export async function loader({request, context}: Route.LoaderArgs) {
    const url = new URL(request.url);

    // Fetch shop ID for shop-specific path blocking (cached: shop ID never changes)
    const {shop} = await context.dataAdapter.query(ROBOTS_QUERY, {
        cache: context.dataAdapter.CacheLong()
    });

    const shopId = parseGid(shop.id).id;
    const body = robotsTxtData({url: url.origin, shopId});

    return new Response(body, {
        status: 200,
        headers: {
            "Content-Type": "text/plain",
            // Cache for 24 hours - robots.txt rules rarely change
            "Cache-Control": `max-age=${60 * 60 * 24}`
        }
    });
}

// =============================================================================
// ROBOTS.TXT GENERATION
// =============================================================================

/**
 * Generates the complete robots.txt content.
 *
 * @param url - Site origin URL (for sitemap reference)
 * @param shopId - Shopify shop ID (for shop-specific paths)
 *
 * @returns Formatted robots.txt string
 *
 * @structure
 * The file contains sections for:
 * 1. General rules (User-agent: *)
 * 2. Google Ads bot (requires explicit naming)
 * 3. Blocked crawlers (Nutch)
 * 4. Rate-limited crawlers (Ahrefs, MJ12, Pinterest)
 */
function robotsTxtData({url, shopId}: {shopId?: string; url?: string}) {
    const sitemapUrl = url ? `${url}/sitemap.xml` : undefined;

    return `
User-agent: *
${generalDisallowRules({sitemapUrl, shopId})}

${aiCrawlerRules({shopId})}

# Google adsbot ignores robots.txt unless specifically named!
User-agent: adsbot-google
Disallow: /checkouts/
Disallow: /checkout
Disallow: /carts
Disallow: /orders
${shopId ? `Disallow: /${shopId}/checkouts` : ""}
${shopId ? `Disallow: /${shopId}/orders` : ""}
Disallow: /*?*oseid=*
Disallow: /*preview_theme_id*
Disallow: /*preview_script_id*

User-agent: Nutch
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10
${generalDisallowRules({sitemapUrl, shopId})}

User-agent: AhrefsSiteAudit
Crawl-delay: 10
${generalDisallowRules({sitemapUrl, shopId})}

User-agent: MJ12bot
Crawl-Delay: 10
Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkout
Disallow: /carts

User-agent: Pinterest
Crawl-delay: 1
`.trim();
}

/**
 * Generates common disallow rules following Shopify Online Store defaults.
 *
 * @param shopId - Shopify shop ID for shop-specific paths
 * @param sitemapUrl - Full sitemap URL to include at end of rules
 *
 * @returns Multi-line string with Disallow/Allow directives
 *
 * @note These rules match Shopify's default robots.txt behavior,
 *       preventing crawlers from indexing duplicate content and
 *       sensitive areas like checkout and account pages.
 */
function generalDisallowRules({shopId, sitemapUrl}: {shopId?: string; sitemapUrl?: string}) {
    return `Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkouts/
Disallow: /checkout
${shopId ? `Disallow: /${shopId}/checkouts` : ""}
${shopId ? `Disallow: /${shopId}/orders` : ""}
Disallow: /carts
Allow: /account/wishlist
Disallow: /account
Disallow: /collections/*sort_by*
Disallow: /*/collections/*sort_by*
Disallow: /collections/*+*
Disallow: /collections/*%2B*
Disallow: /collections/*%2b*
Disallow: /*/collections/*+*
Disallow: /*/collections/*%2B*
Disallow: /*/collections/*%2b*
Disallow: */collections/*filter*&*filter*
Disallow: /blogs/*+*
Disallow: /blogs/*%2B*
Disallow: /blogs/*%2b*
Disallow: /*/blogs/*+*
Disallow: /*/blogs/*%2B*
Disallow: /*/blogs/*%2b*
Disallow: /*?*oseid=*
Disallow: /*preview_theme_id*
Disallow: /*preview_script_id*
Disallow: /*/*?*ls=*&ls=*
Disallow: /*/*?*ls%3D*%3Fls%3D*
Disallow: /*/*?*ls%3d*%3fls%3d*
Disallow: /search
Disallow: /search/?*
Disallow: /apple-app-site-association
Disallow: /.well-known/shopify/monorail
${sitemapUrl ? `Sitemap: ${sitemapUrl}` : ""}`;
}

/**
 * Generates explicit allow rules for major AI crawlers.
 *
 * All named bots are permitted to index public storefront content (products,
 * collections, blogs, pages, policies) while private paths remain blocked.
 * Explicit rules override the general User-agent: * block for these agents,
 * signalling clear opt-in intent to AI search and retrieval systems.
 */
function aiCrawlerRules({shopId}: {shopId?: string}) {
    return `# AI crawlers — explicitly permitted to index all public storefront content
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: Claude-Web
User-agent: Google-Extended
User-agent: PerplexityBot
User-agent: YouBot
User-agent: Applebot-Extended
User-agent: cohere-ai
User-agent: CCBot
User-agent: Bytespider
Allow: /products
Allow: /collections
Allow: /blogs
Allow: /pages
Allow: /policies
Disallow: /admin
Disallow: /cart
Disallow: /checkout
Disallow: /checkouts/
Disallow: /carts
Disallow: /orders
Disallow: /account
${shopId ? `Disallow: /${shopId}/checkouts` : ""}
${shopId ? `Disallow: /${shopId}/orders` : ""}`;
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fetches the shop ID for robots.txt path generation.
 *
 * The shop ID is embedded in certain Shopify URLs (checkout, orders)
 * and needs to be blocked in robots.txt to prevent crawling of
 * customer-specific paths.
 */
const ROBOTS_QUERY = `#graphql
  query StoreRobots($country: CountryCode, $language: LanguageCode)
   @inContext(country: $country, language: $language) {
    shop {
      id
    }
  }
` as const;

