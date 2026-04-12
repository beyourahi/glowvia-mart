/**
 * @fileoverview GraphQL Queries for Shopify Metaobjects
 *
 * @description
 * Defines GraphQL queries for fetching site-wide configuration from Shopify metaobjects.
 * Provides two separate queries for site content and theme customization, both used
 * globally throughout the application via React Context.
 *
 * @architecture
 * Two-Query System (Simplified):
 * 1. SITE_CONTENT_QUERY - Fetches site_settings metaobject (brand, content, SEO)
 * 2. THEME_SETTINGS_QUERY - Fetches theme_settings metaobject (fonts, colors)
 *
 * Note: UI content (product, cart, account, search, etc.) uses fallback constants
 * directly from fallback-data.ts. This follows the 80/20 rule - only high-value,
 * frequently-changed content (brand, hero, promotions, theme) needs Shopify Admin control.
 * Standard UI labels and messages stay in code as they rarely change.
 *
 * Integration with Hydrogen:
 * - Both queries are executed in root.tsx loader
 * - Results are provided via SiteContentContext to all routes/components
 * - Uses @inContext directive for country/language localization
 * - Fragments defined in metaobject-fragments.ts for reusability
 *
 * @dependencies
 * - GraphQL fragments from ./metaobject-fragments
 * - Shopify Storefront API 2025-07
 * - Hydrogen context for country/language
 *
 * @related
 * - app/lib/metaobject-fragments.ts - GraphQL fragments for metaobject fields
 * - app/lib/metaobject-parsers.ts - Parse query results into TypeScript types
 * - app/lib/site-content-context.tsx - React Context provider for site content
 * - app/lib/fallback-data.ts - Fallback values for all UI content
 * - app/root.tsx - Executes queries and provides context to all routes
 */

import {SITE_SETTINGS_FRAGMENT, THEME_SETTINGS_FRAGMENT} from "./metaobject-fragments";

/**
 * Query for site settings (singleton metaobject)
 * Contains site-wide configuration:
 * - Brand identity, hero, SEO, contact, section headings
 * - Promotional banners, shipping threshold
 * - Social links, testimonials, FAQs, Instagram images (as JSON arrays)
 *
 * Use in root.tsx for global site content
 */
export const SITE_CONTENT_QUERY = `#graphql
  query SiteContent(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      ...SiteSettings
    }
    shop {
      name
      description
      primaryDomain {
        url
      }
      brand {
        logo {
          image {
            url
            altText
            width
            height
          }
        }
        coverImage {
          image {
            url
            altText
            width
            height
          }
        }
        shortDescription
      }
    }
  }
  ${SITE_SETTINGS_FRAGMENT}
` as const;

/**
 * Query for theme settings (singleton metaobject)
 * Contains brand theming configuration:
 * - Fonts: body_font, heading_font, price_font (Google Font names)
 * - Colors: color_primary, color_secondary, color_background, color_foreground, color_accent
 *
 * Separate from site_settings to allow independent theme customization
 * Use in root.tsx to generate dynamic CSS variables
 */
export const THEME_SETTINGS_QUERY = `#graphql
  query ThemeSettings(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    themeSettings: metaobject(handle: {type: "theme_settings", handle: "main"}) {
      ...ThemeSettings
    }
  }
  ${THEME_SETTINGS_FRAGMENT}
` as const;
