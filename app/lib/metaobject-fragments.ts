/**
 * @fileoverview GraphQL Fragments for Shopify Metaobject Fields
 *
 * @description
 * Defines reusable GraphQL fragments for querying Shopify metaobjects with comprehensive
 * field selection. Supports two metaobject types (site_settings and theme_settings) with
 * diverse field types including text, JSON, file references, and media objects.
 *
 * @architecture
 * Fragment Organization (Simplified - 80/20 Rule):
 * - SITE_SETTINGS_FRAGMENT - High-value site content fields (39 fields)
 * - THEME_SETTINGS_FRAGMENT - Theme customization fields (8 fields)
 *
 * Note: UI content fragments (product, cart, account, search, etc.) have been removed.
 * These use fallback constants from metaobject-parsers.ts instead, as they represent standard
 * UI patterns that rarely need merchant customization. This follows the 80/20 rule:
 * only high-value, frequently-changed content needs Shopify Admin control.
 *
 * Field Naming Convention:
 * - snake_case keys match Shopify Admin metaobject field definitions
 * - Self-explanatory names (e.g., brand_name, hero_main_heading)
 * - Grouped by category (brand, hero, SEO, etc.)
 *
 * Field Types Supported:
 * - Single line text: brand_name, hero_main_heading, etc.
 * - Multi-line text: hero_description, mission_statement
 * - JSON: testimonials_data, faq_items_data (stored as JSON strings)
 * - File references: hero_background_media, favicon, PWA icons
 * - List of file references: instagram_images_data (multiple media items)
 *
 * Media Handling:
 * - Supports both MediaImage and Video types
 * - Extracts url, altText, width, height for images
 * - Extracts sources[], previewImage for videos
 *
 * @dependencies
 * - Shopify Storefront API 2025-07
 * - GraphQL type system
 *
 * @related
 * - app/lib/metaobject-queries.ts - Uses these fragments in queries
 * - app/lib/metaobject-parsers.ts - Parses fields into TypeScript types
 * - app/lib/metaobject-parsers.ts - Fallback values for all UI content
 * - app/lib/site-content-context.tsx - Provides parsed data via React Context
 */

// =============================================================================
// SITE SETTINGS FRAGMENT
// Contains ALL site-wide configuration in one metaobject
// =============================================================================
export const SITE_SETTINGS_FRAGMENT = `#graphql
  fragment SiteSettings on Metaobject {
    id
    handle

    # ─────────────────────────────────────────────────────────────────────────
    # BRAND IDENTITY
    # ─────────────────────────────────────────────────────────────────────────
    # List of single line text - Shopify returns JSON array of strings
    brandWords: field(key: "words_to_describe_your_brand") { value }

    # ─────────────────────────────────────────────────────────────────────────
    # HERO SECTION
    # ─────────────────────────────────────────────────────────────────────────
    heroHeading: field(key: "hero_main_heading") { value }
    heroDescription: field(key: "hero_description_text") { value }
    featuredProductSection: field(key: "featured_product_section") {
      reference {
        ... on Product {
          __typename
          id
          handle
          title
          vendor
          description
          availableForSale
          featuredImage {
            url
            altText
            width
            height
          }
          media(first: 5) {
            nodes {
              __typename
              ... on MediaImage {
                id
                image {
                  id
                  url
                  altText
                  width
                  height
                }
              }
              ... on Video {
                id
                alt
                sources {
                  url
                  mimeType
                  width
                  height
                }
                previewImage {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          tags
          selectedOrFirstAvailableVariant(
            selectedOptions: []
            ignoreUnknownOptions: true
            caseInsensitiveMatch: true
          ) {
            id
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            image {
              url
              altText
              width
              height
            }
          }
          variants(first: 100) {
            nodes {
              id
              title
              availableForSale
              selectedOptions {
                name
                value
              }
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
    heroMediaMobile: field(key: "hero_background_media_mobile") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          __typename
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
          }
          alt
        }
      }
    }
    heroMediaLargeScreen: field(key: "hero_background_media_large_screen") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          __typename
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
          }
          alt
        }
      }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # SHOP LOCATIONS (Google Maps)
    # Index-paired list fields: embed URLs zipped with share links.
    # ─────────────────────────────────────────────────────────────────────────
    googleMapsEmbed: field(key: "google_maps_embed") { value }
    googleMapsLink: field(key: "google_maps_link") { value }

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION HEADINGS
    # ─────────────────────────────────────────────────────────────────────────
    blogSectionTitle: field(key: "blog_section_heading") { value }
    collectionsTitle: field(key: "collections_section_heading") { value }
    relatedProductsTitle: field(key: "related_products_heading") { value }
    recommendedTitle: field(key: "recommended_products_heading") { value }
    instagramTitle: field(key: "instagram_section_heading") { value }

    # ─────────────────────────────────────────────────────────────────────────
    # PAGE HEADINGS (Gallery & Blog)
    # ─────────────────────────────────────────────────────────────────────────
    galleryPageHeading: field(key: "gallery_page_heading") { value }
    galleryPageDescription: field(key: "gallery_page_description") { value }
    blogPageHeading: field(key: "blog_page_heading") { value }
    blogPageDescription: field(key: "blog_page_description") { value }

    # ─────────────────────────────────────────────────────────────────────────
    # PROMOTIONAL BANNERS
    # ─────────────────────────────────────────────────────────────────────────
    # announcement_banner_text is now a "List of single line text" field in Shopify
    # Returns JSON array of strings: ["text1", "text2", ...]
    announcementBanner: field(key: "announcement_banner_text") { value }
    promotionalBannerOneMedia: field(key: "promotional_banner_one_media") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          __typename
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
          }
          alt
        }
      }
    }
    promotionalBannerTwoMedia: field(key: "promotional_banner_two_media") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          __typename
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
          }
          alt
        }
      }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # COLLECTIONS
    # ─────────────────────────────────────────────────────────────────────────

    # Messenger Page ID for Facebook Customer Chat plugin
    messengerId: field(key: "messenger_page_id") { value }

    # WhatsApp phone number (digits only, or international format)
    whatsappNumber: field(key: "whatsapp_number") { value }

    # ─────────────────────────────────────────────────────────────────────────
    # CONTACT INFORMATION
    # ─────────────────────────────────────────────────────────────────────────
    contactEmail: field(key: "contact_email") { value }
    contactPhone: field(key: "contact_phone") { value }
    businessHours: field(key: "business_hours") { value }
    streetAddress: field(key: "street_address") { value }
    city: field(key: "city") { value }
    state: field(key: "state_province") { value }
    zipCode: field(key: "postal_code") { value }

    # List of links field - Shopify returns [{text, url}, ...] where text is the platform name
    socialLinksData: field(key: "social_links_data") { value }

    # JSON array: [{customerName, location, rating, text, avatarUrl}, ...]
    testimonialsData: field(key: "testimonials_data") { value }

    # JSON array: [{question, answer}, ...]
    faqItemsData: field(key: "faq_items_data") { value }

    # List of file references (images/videos)
    instagramMediaData: field(key: "instagram_images_data") {
      references(first: 20) {
        nodes {
          ... on MediaImage {
            __typename
            id
            image {
              url
              altText
              width
              height
            }
          }
          ... on Video {
            __typename
            id
            sources {
              url
              mimeType
            }
            previewImage {
              url
              altText
            }
            alt
          }
        }
      }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # FAVICON (File reference - MediaImage only)
    # Dynamic favicon served from /favicon.ico route
    # ─────────────────────────────────────────────────────────────────────────
    favicon: field(key: "favicon") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
          }
        }
      }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # PWA ICONS (File references - MediaImage only)
    # Required for Progressive Web App installability
    # ─────────────────────────────────────────────────────────────────────────
    icon192: field(key: "icon_192") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
    icon512: field(key: "icon_512") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
    icon180Apple: field(key: "icon_180_apple") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
      }
    }

    # ─────────────────────────────────────────────────────────────────────────
    # AGENTIC COMMERCE FIELDS (Phase 1 — agent-discoverability foundation)
    # All optional — storefronts without these fields return null/empty values.
    # Fields are surfaced via MCP tools starting in Phase 2+
    # ─────────────────────────────────────────────────────────────────────────

    # Brand voice / tone description for AI agents (single_line_text_field)
    agentPersona: field(key: "agent_persona") { value }

    # JSON array: [{key, value, context?}, ...] — extended machine-readable policies
    policyExtension: field(key: "policy_extension") { value }

    # JSON array: [{id, question, answer}, ...] — additional FAQ entries for MCP
    faqExtension: field(key: "faq_extension") { value }

    # Multi-line text: agent-only promotional message (not shown to human visitors)
    agentOnlyPromo: field(key: "agent_only_promo") { value }

    # Decimal: minimum order amount in store currency to qualify for free shipping (e.g. "50.00")
    freeShippingMinimumOrder: field(key: "free_shipping_minimum_order") { value }

    # JSON array: [{source, heading?, text?, ctaLabel?, ctaUrl?}, ...] — utm_source banners
    trafficSourceBanners: field(key: "traffic_source_banners") { value }

    # JSON array: [{id, segment?, heroHeading?, heroDescription?, ctaLabel?, ctaUrl?}, ...]
    homepageVariants: field(key: "homepage_variants") { value }

    # JSON array: [{id, tier?, title, description, iconUrl?}, ...] — VIP perks
    vipPerks: field(key: "vip_perks") { value }

    # JSON array: [{id, title, description?, discountCode?, expiresAt?, badgeText?}, ...]
    limitedOffers: field(key: "limited_offers") { value }
  }
` as const;

// =============================================================================
// THEME SETTINGS FRAGMENT
// Separate metaobject for brand theming (fonts & colors)
// Stored separately to allow theme customization independent of site content
// =============================================================================
export const THEME_SETTINGS_FRAGMENT = `#graphql
  fragment ThemeSettings on Metaobject {
    id
    handle

    # ─────────────────────────────────────────────────────────────────────────
    # FONTS (Google Font family names)
    # These semantic names map to CSS variable roles:
    # - body_font → --font-sans (paragraphs, buttons, labels, UI text)
    # - heading_font → --font-serif (h1-h6, hero text, section titles)
    # - price_font → --font-mono (prices, quantities, codes, tabular data)
    # ─────────────────────────────────────────────────────────────────────────
    fontBody: field(key: "body_font") { value }
    fontHeading: field(key: "heading_font") { value }
    fontPrice: field(key: "price_font") { value }
    borderRadius: field(key: "border_radius") { value }

    # ─────────────────────────────────────────────────────────────────────────
    # COLORS (OKLCH or HEX format)
    # 5 core colors that derive 25+ CSS variables via theme-utils.ts
    # ─────────────────────────────────────────────────────────────────────────
    colorPrimary: field(key: "color_primary") { value }
    colorSecondary: field(key: "color_secondary") { value }
    colorBackground: field(key: "color_background") { value }
    colorForeground: field(key: "color_foreground") { value }
    colorAccent: field(key: "color_accent") { value }
  }
` as const;
