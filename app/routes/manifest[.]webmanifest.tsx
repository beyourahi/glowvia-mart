/**
 * @fileoverview PWA Web App Manifest Generator
 *
 * @description
 * Generates a dynamic Web App Manifest for Progressive Web App (PWA)
 * functionality. Data is pulled from Shopify metaobjects (site_settings
 * and theme_settings) only.
 *
 * @route GET /manifest.webmanifest
 *
 * @pwa-features
 * - App icon definitions (192x192, 512x512)
 * - Theme and background colors
 * - App name and description
 * - Standalone display mode
 * - "Install to Home Screen" support
 *
 * @data-sources
 * | Field             | Source                          |
 * |-------------------|---------------------------------|
 * | name, short_name  | site_settings.brandName         |
 * | description       | site_settings.missionStatement  |
 * | icons             | site_settings.icon192/icon512   |
 * | theme_color       | theme_settings.colors.primary   |
 * | background_color  | theme_settings.colors.background|
 *
 * @hardcoded-values (PWA best practices)
 * - display: "standalone"
 * - start_url: "/"
 * - orientation: "any"
 * - scope: "/"
 * - categories: ["shopping"]
 *
 * @caching
 * - Browser: 1 hour (max-age=3600)
 * - CDN: 24 hours (s-maxage=86400)
 *
 * @error-handling
 * - Missing icons: Returns a minimal manifest with an empty icons array
 * - Query failure: Returns minimal fallback manifest
 *
 * @color-conversion
 * OKLCH colors from theme_settings are converted to HEX
 * for browser compatibility.
 *
 * @related
 * - lib/pwa-queries.ts - GraphQL query
 * - lib/pwa-parsers.ts - Manifest building logic
 * - root.tsx - Manifest link tag
 * - ServiceWorkerRegistration.tsx - SW registration
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest
 */

import type {Route} from "./+types/manifest[.]webmanifest";
import {PWA_MANIFEST_QUERY} from "~/lib/pwa-queries";
import {buildWebAppManifest, getThemeColor} from "~/lib/pwa-parsers";
import {parseSiteSettings, parseThemeSettings} from "~/lib/metaobject-parsers";

export async function loader({context, request}: Route.LoaderArgs) {
    const {dataAdapter} = context;

    // Get the manifest URL from the request for related_applications
    const url = new URL(request.url);
    const manifestUrl = `${url.origin}/manifest.webmanifest`;

    try {
        // Query site_settings and theme_settings
        const data = await dataAdapter.query(PWA_MANIFEST_QUERY, {
            cache: dataAdapter.CacheLong() // Brand settings rarely change
        });

        // Parse metaobjects
        const siteSettings = parseSiteSettings(data?.siteSettings);
        const themeConfig = parseThemeSettings(data?.themeSettings);

        // Build the Web App Manifest with manifest URL for getInstalledRelatedApps()
        const manifest = buildWebAppManifest(siteSettings, themeConfig, manifestUrl);

        // If icons are missing entirely, still serve a valid manifest so the route never hard-fails.
        if (!manifest) {
            console.error("[PWA Manifest] Missing PWA icons in site_settings; serving minimal manifest");
            return new Response(
                JSON.stringify(
                    {
                        name: siteSettings.brandName || "Store",
                        short_name: (() => {
                            const name = siteSettings.brandName || "Store";
                            if (name.length <= 12) return name;
                            const truncated = name.slice(0, 12);
                            const lastSpace = truncated.lastIndexOf(" ");
                            return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
                        })(),
                        description: siteSettings.missionStatement || `Shop at ${siteSettings.brandName || "Store"}`,
                        start_url: "/",
                        scope: "/",
                        display: "standalone",
                        orientation: "any",
                        theme_color: getThemeColor(themeConfig),
                        background_color: "#ffffff",
                        categories: ["shopping"],
                        icons: [],
                        related_applications: [
                            {
                                platform: "webapp",
                                url: manifestUrl
                            }
                        ],
                        prefer_related_applications: false,
                        id: "/"
                    },
                    null,
                    2
                ),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/manifest+json; charset=utf-8",
                        "X-Content-Type-Options": "nosniff",
                        "Cache-Control": "public, max-age=300"
                    }
                }
            );
        }

        // Return valid manifest with proper caching
        return new Response(JSON.stringify(manifest, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/manifest+json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
                // Cache for 1 hour in browser, 24 hours at CDN edge
                "Cache-Control": "public, max-age=3600, s-maxage=86400"
            }
        });
    } catch (error) {
        console.error("[PWA Manifest] Error generating manifest:", error);

        // Return a minimal fallback manifest on error
        const fallbackManifest = {
            name: "Store",
            short_name: "Store",
            start_url: "/",
            scope: "/",
            display: "standalone",
            orientation: "any",
            background_color: "#ffffff",
            theme_color: "#000000",
            categories: ["shopping"],
            icons: [],
            id: "/",
            related_applications: [{platform: "webapp", url: manifestUrl}],
            prefer_related_applications: false
        };

        return new Response(JSON.stringify(fallbackManifest, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/manifest+json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
                // Short cache on error to allow recovery
                "Cache-Control": "public, max-age=300"
            }
        });
    }
}
