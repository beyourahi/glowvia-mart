/**
 * @fileoverview Apple Touch Icon Route for iOS
 *
 * @description
 * Serves the Apple Touch Icon used when iOS users add the site to their
 * home screen. Dynamically fetches from site_settings.
 *
 * @route GET /apple-touch-icon.png
 *
 * @ios-integration
 * iOS Safari looks for this file when users:
 * - Add to Home Screen
 * - Save as web clip
 * - Bookmark with icon
 *
 * @icon-priority
 * 1. site_settings.icon_180_apple (180x180 iOS-specific)
 * 2. site_settings.icon_192 (standard PWA icon as fallback)
 * 3. site_settings.brand_logo
 *
 * @icon-requirements
 * Apple recommends 180x180 PNG for iPhone 6 Plus and later.
 * Smaller devices will scale down automatically.
 *
 * @caching
 * - Success: 1 hour browser, 24 hours CDN
 * - Not found: 5 minutes (allows quick recovery)
 * - Error: No cache
 *
 * @related
 * - manifest[.]webmanifest.tsx - PWA manifest with icons
 * - favicon[.]ico.tsx - Site favicon
 * - root.tsx - Apple touch icon link tag
 *
 * @see https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
 */

import type {Route} from "./+types/apple-touch-icon[.]png";
import {redirect} from "react-router";
import {parseSiteSettings} from "~/lib/metaobject-parsers";
import {buildLettermarkIconSvg, getAppleTouchIconUrl} from "~/lib/pwa-parsers";

// Simple query for apple touch icon sources
const APPLE_ICON_QUERY = `#graphql
  query AppleTouchIcon(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      brandLogo: field(key: "brand_logo") {
        reference {
          ... on MediaImage {
            __typename
            image { url altText width height }
          }
        }
      }
      icon180Apple: field(key: "icon_180_apple") {
        reference {
          ... on MediaImage {
            __typename
            image { url altText width height }
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
  }
` as const;

export async function loader({context}: Route.LoaderArgs) {
    const {dataAdapter} = context;

    try {
        const data = await dataAdapter.query(APPLE_ICON_QUERY, {
            cache: dataAdapter.CacheLong() // Icon rarely changes
        });

        const siteSettings = parseSiteSettings(data?.siteSettings);
        const iconUrl = getAppleTouchIconUrl(siteSettings);

        if (iconUrl) {
            // Redirect to the actual icon URL with caching
            return redirect(iconUrl, {
                status: 302,
                headers: {
                    "Cache-Control": "public, max-age=3600, s-maxage=86400"
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
        console.error("[Apple Touch Icon] Error:", error);
        return new Response("Error loading icon", {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "no-store"
            }
        });
    }
}
