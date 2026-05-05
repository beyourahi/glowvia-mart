/**
 * @fileoverview Custom Sitemap
 *
 * @description
 * Provides a sitemap for storefront routes that Shopify's generated sitemap
 * index does not include: `/faq`, `/gallery`, `/sale`, `/changelog`, `/wishlist`.
 * Injected into `/sitemap.xml` as an additional `<sitemap>` entry.
 *
 * @route GET /sitemap.custom.xml
 *
 * @caching Cached for 24 hours — custom URL list rarely changes.
 *
 * @related
 * - [sitemap.xml].tsx - Injects this URL into the sitemap index
 */

import type {Route} from "./+types/sitemap[.]custom[.]xml";

/**
 * Renders the custom sitemap XML with static storefront URLs.
 * Uses `request.url` origin so the sitemap works correctly across all deployment
 * environments (dev, Cloudflare Workers, Oxygen).
 */
export const loader = async ({request}: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const origin = url.origin;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/faq</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${origin}/gallery</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>
  <url><loc>${origin}/sale</loc><changefreq>daily</changefreq><priority>0.7</priority></url>
  <url><loc>${origin}/changelog</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>
  <url><loc>${origin}/wishlist</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>
</urlset>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": `max-age=${60 * 60 * 24}`
        }
    });
};
