/**
 * @fileoverview GraphQL Query for PWA Manifest Data
 *
 * @description
 * Defines the GraphQL query for fetching all data needed to generate a Web App Manifest
 * for Progressive Web App installability. The manifest is derived exclusively from
 * site_settings and theme_settings.
 *
 * @architecture
 * Data Source Strategy:
 * - Primary: site_settings metaobject (brand name, mission, PWA icons)
 * - Secondary: theme_settings metaobject (colors for theme_color/background_color)
 *
 * Single Source of Truth:
 * - Eliminates need for separate pwa_settings metaobject
 * - Brand identity consistent across web and PWA
 * - Automatic inheritance of brand colors and identity
 *
 * Manifest Data Mapping:
 * - name/short_name: site_settings.brandName
 * - description: site_settings.missionStatement
 * - theme_color/background_color: theme_settings.colors (converted to HEX)
 * - icons: site_settings.icon_192, icon_512, icon_180_apple
 *
 * @dependencies
 * - GraphQL fragments from ./metaobject-fragments
 * - Shopify Storefront API 2025-07
 *
 * @related
 * - app/lib/pwa-parsers.ts - Parses query results into Web App Manifest
 * - app/routes/manifest[.]webmanifest.tsx - Serves the manifest dynamically
 * - app/routes/apple-touch-icon[.]png.tsx - Serves Apple touch icon
 * - app/lib/metaobject-queries.ts - Related site/theme queries
 */

import {SITE_SETTINGS_FRAGMENT, THEME_SETTINGS_FRAGMENT} from "./metaobject-fragments";

/**
 * Query for PWA manifest data
 *
 * Fetches:
 * - site_settings metaobject (brand name, mission, PWA icons)
 * - theme_settings metaobject (colors for theme_color/background_color)
 */
export const PWA_MANIFEST_QUERY = `#graphql
  query PwaManifest(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    # Site settings for brand identity and PWA icons
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      ...SiteSettings
    }
    # Theme settings for colors (converted to HEX for manifest)
    themeSettings: metaobject(handle: {type: "theme_settings", handle: "main"}) {
      ...ThemeSettings
    }
  }
  ${SITE_SETTINGS_FRAGMENT}
  ${THEME_SETTINGS_FRAGMENT}
` as const;
