/**
 * @fileoverview Dynamic Favicon Route
 *
 * @description
 * Serves the site favicon dynamically based on site_settings.
 * Uses 302 redirect to actual favicon URL for efficient caching.
 *
 * @route GET /favicon.ico
 *
 * @favicon-priority
 * 1. site_settings.favicon (metaobject file reference)
 * 2. site_settings.brand_logo
 * 3. site_settings.icon_192
 *
 * @caching
 * - Browser: 24 hours (max-age=86400)
 * - CDN: 7 days (s-maxage=604800)
 * - Error: 5 minutes (quick recovery)
 *
 * @why-redirect
 * Using 302 redirect instead of proxying because:
 * - CDN can cache the actual favicon at edge
 * - Reduces origin server load
 * - Shopify CDN serves images efficiently
 * - Favicon changes are reflected after cache expires
 *
 * @related
 * - root.tsx - Links to /favicon.ico
 * - apple-touch-icon[.]png.tsx - iOS icon route
 * - manifest[.]webmanifest.tsx - PWA icons
 */

import type {Route} from "./+types/favicon[.]ico";
import {redirect} from "react-router";
import {parseSiteSettings, parseShopBrand} from "~/lib/metaobject-parsers";
import {buildLettermarkIconSvg} from "~/lib/pwa-parsers";

// Query for favicon from site_settings metaobject
const FAVICON_QUERY = `#graphql
  query Favicon(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      favicon: field(key: "favicon") {
        reference {
          ... on MediaImage {
            __typename
            image { url }
          }
        }
      }
      icon192: field(key: "icon_192") {
        reference {
          ... on MediaImage {
            __typename
            image { url altText width height }
          }
        }
      }
    }
    shop {
      name
      brand {
        logo {
          image { url }
        }
      }
    }
  }
` as const;

export async function loader({context}: Route.LoaderArgs) {
    const {dataAdapter} = context;

    try {
        const data = await dataAdapter.query(FAVICON_QUERY, {
            cache: dataAdapter.CacheLong() // Favicon changes rarely
        });

        const siteSettings = {...parseSiteSettings(data?.siteSettings), ...parseShopBrand(data?.shop)};
        const faviconUrl = siteSettings.faviconUrl || siteSettings.brandLogo?.url || siteSettings.icon192Url;

        if (faviconUrl) {
            return redirect(faviconUrl, {
                status: 302,
                headers: {
                    "Cache-Control": "public, max-age=86400, s-maxage=604800" // 1 day browser, 7 days edge
                }
            });
        }

        return new Response(buildLettermarkIconSvg(siteSettings.brandName || "Store"), {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=300"
            }
        });
    } catch (error) {
        console.error("[Favicon] Error:", error);
        return new Response("Error loading favicon", {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "no-store"
            }
        });
    }
}
