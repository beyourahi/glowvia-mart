/**
 * @fileoverview SEO Utilities and Schema.org Generator
 *
 * @description
 * Provides comprehensive SEO functionality including:
 * - Site-wide SEO configuration with fallback values
 * - Schema.org JSON-LD generators for rich snippets
 * - URL canonicalization and text formatting utilities
 *
 * @architecture
 * SEO Data Sources (priority order):
 * 1. Shopify metaobjects (site_settings + theme_settings) - Dynamic brand data
 * 2. Fallback values in this module - Static defaults
 *
 * Schema.org Types Generated:
 * - Organization: Homepage (brand identity)
 * - WebSite: Homepage (search action)
 * - Product: Product detail pages
 * - ItemList: Collection pages
 * - BlogPosting: Blog article pages
 * - FAQPage: FAQ pages
 *
 * @seo-impact
 * Rich snippets improve:
 * - Click-through rates from search results
 * - Search engine understanding of content
 * - Featured snippet eligibility
 *
 * @dependencies
 * - schema-dts - TypeScript types for schema.org
 * - fallback-data.ts - Default SEO values
 *
 * @related
 * - root.tsx - Uses getSeoMeta for base meta tags
 * - products.$handle.tsx - Product schema generation
 * - blogs.$blogHandle.$articleHandle.tsx - Article schema
 * - collections.$handle.tsx - Collection schema
 *
 * @example
 * ```tsx
 * // In route meta function
 * export const meta: Route.MetaFunction = ({data}) => {
 *   const schema = generateProductSchema(data.product, data.selectedVariant);
 *   return [
 *     { title: data.product.title },
 *     { 'script:ld+json': schema }
 *   ];
 * };
 * ```
 */

/**
 * schema-dts types (WithContext<Product>, etc.) are deeply recursive unions that
 * can cause TypeScript "Maximum call stack size exceeded" errors during type
 * checking. We import them only for JSDoc documentation; runtime return objects
 * conform to Schema.org spec without formal type annotations on the return
 * position. If TypeScript is upgraded or the issue is resolved upstream, the
 * return types can be restored.
 */
import type {WithContext, Organization, WebSite, Product, ItemList, BlogPosting, FAQPage} from "schema-dts";
import type {SiteSettings, ThemeConfig} from "types";
import {STORE_LOCALE} from "~/lib/store-locale";
import {toHex} from "./color";

/** Lightweight stand-in for schema-dts WithContext — avoids TS stack overflow on deep union resolution */
type JsonLdSchema = Record<string, unknown>;

type SeoSiteSettings = Partial<Pick<SiteSettings, "brandName" | "brandLogo" | "ogImage" | "missionStatement" | "siteUrl">>;

const FALLBACK_BRAND_NAME = "Store";
const FALLBACK_SITE_URL = "";
const FALLBACK_SEO_TITLE_SUFFIX = "Quality Products";
const FALLBACK_SEO_TITLE = `${FALLBACK_BRAND_NAME} | ${FALLBACK_SEO_TITLE_SUFFIX}`;
const FALLBACK_SEO_DESCRIPTION =
    "Your store. Your story. Built to sell.";

// Site-wide SEO configuration (uses centralized fallbacks, can be overridden with metaobject data)
export const SEO_CONFIG = {
    siteName: FALLBACK_BRAND_NAME,
    siteUrl: FALLBACK_SITE_URL,
    defaultTitle: FALLBACK_SEO_TITLE,
    defaultDescription: FALLBACK_SEO_DESCRIPTION,
    locale: STORE_LOCALE,
    twitterCardType: "summary_large_image" as const
} as const;

/**
 * Get SEO config with dynamic brand name from metaobjects
 * Call this to get SEO values that include the dynamic brand name
 */
export function getSeoConfig(brandName?: string) {
    const name = brandName || FALLBACK_BRAND_NAME;
    return {
        ...SEO_CONFIG,
        siteName: name,
        defaultTitle: `${name} - ${FALLBACK_SEO_TITLE_SUFFIX}`
    };
}

// Type for media in getSeoMeta
export interface SeoMedia {
    url: string;
    type?: "image" | "video";
    width?: number;
    height?: number;
    altText?: string;
}

export function getSeoDefaults(
    siteSettings?: SeoSiteSettings | null,
    themeConfig?: Pick<ThemeConfig, "colors"> | null,
    fallbackSiteUrl?: string
) {
    const brandName = siteSettings?.brandName?.trim() || SEO_CONFIG.siteName;
    const description = truncateDescription(siteSettings?.missionStatement?.trim() || SEO_CONFIG.defaultDescription);
    const siteUrl = siteSettings?.siteUrl?.trim() || fallbackSiteUrl || SEO_CONFIG.siteUrl;
    const themeColor = toHex(themeConfig?.colors.primary ?? "") ?? "#000000";
    const media = getDefaultOgImage(siteSettings);

    return {
        brandName,
        description,
        siteUrl,
        themeColor,
        media,
        ogType: "website" as const,
        ogSiteName: brandName,
        twitterCard: "summary_large_image" as const
    };
}

/**
 * Build canonical URL from path.
 * When siteUrl is empty (no site URL configured), returns path-only to avoid
 * generating URLs like "/products/foo" with no origin prefix.
 */
export function buildCanonicalUrl(path: string, siteUrl: string = SEO_CONFIG.siteUrl): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (!siteUrl) {
        // siteUrl not configured — returning path-only canonical
        // Set website_url in site_settings metaobject to generate absolute URLs
        if (typeof console !== "undefined") console.warn("[SEO] buildCanonicalUrl: siteUrl is empty, returning path-only URL. Configure website_url in site_settings.");
        return cleanPath;
    }
    return `${siteUrl}${cleanPath}`;
}

/**
 * Truncate description to SEO-friendly length
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default 152 for meta descriptions — leaves headroom for "..." and display variance)
 */
export function truncateDescription(text: string | null | undefined, maxLength = 152): string {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    // Truncate at word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
}

/**
 * Strip HTML tags from text
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Format price for schema.org
 */
export function formatSchemaPrice(amount: string | number): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return num.toFixed(2);
}

/**
 * Format date to ISO 8601 for schema.org
 */
export function formatSchemaDate(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString();
}

// ============================================
// JSON-LD Schema Generators
// ============================================

/**
 * Generate Organization schema for the homepage
 * @param socialLinks - Array of social media URLs from site settings
 */
export function generateOrganizationSchema(
    siteSettings?: SeoSiteSettings | null,
    socialLinks?: Array<{url: string}>
): JsonLdSchema {
    const defaults = getSeoDefaults(siteSettings);
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: defaults.brandName,
        url: defaults.siteUrl,
        logo: siteSettings?.brandLogo?.url,
        description: defaults.description,
        sameAs: socialLinks?.map(link => link.url).filter(Boolean) || []
    };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebsiteSchema(
    siteSettings?: SeoSiteSettings | null
): JsonLdSchema {
    const defaults = getSeoDefaults(siteSettings);
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: defaults.brandName,
        url: defaults.siteUrl,
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${defaults.siteUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        } as any
    };
}

/**
 * Generate Product schema for product pages
 * @param siteUrl - Optional absolute site URL for generating absolute offer URLs (e.g. https://example.com)
 */
export function generateProductSchema(
    product: {
        title: string;
        description?: string | null;
        handle: string;
        vendor?: string | null;
        images?: {nodes: Array<{url: string; altText?: string | null}>};
    },
    variant?: {
        sku?: string | null;
        price?: {amount: string; currencyCode: string};
        compareAtPrice?: {amount: string; currencyCode: string} | null;
        availableForSale?: boolean;
    } | null,
    siteUrl?: string
): JsonLdSchema {
    const images = product.images?.nodes?.map(img => img.url) || [];

    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: stripHtml(product.description) || undefined,
        image: images.length > 0 ? images : undefined,
        sku: variant?.sku || undefined,
        brand: product.vendor
            ? {
                  "@type": "Brand",
                  name: product.vendor
              }
            : undefined,
        offers: variant?.price
            ? {
                  "@type": "Offer",
                  url: buildCanonicalUrl(`/products/${product.handle}`, siteUrl),
                  priceCurrency: variant.price.currencyCode,
                  price: formatSchemaPrice(variant.price.amount),
                  availability: variant.availableForSale
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                  priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // 30 days
              }
            : undefined
    };
}

/**
 * Generate ItemList schema for collection pages
 * @param siteUrl - Optional absolute site URL for generating absolute item URLs (e.g. https://example.com)
 */
export function generateCollectionSchema(
    collection: {
        title: string;
        description?: string | null;
        handle: string;
    },
    products?: Array<{
        title: string;
        handle: string;
    }> | null,
    siteUrl?: string
): JsonLdSchema {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: collection.title,
        description: stripHtml(collection.description) || undefined,
        numberOfItems: products?.length || 0,
        itemListElement: products?.slice(0, 20).map((product, index) => ({
            "@type": "ListItem" as const,
            position: index + 1,
            url: buildCanonicalUrl(`/products/${product.handle}`, siteUrl),
            name: product.title
        }))
    };
}

/**
 * Generate BlogPosting schema for article pages
 * @param brandName - Optional brand name from metaobjects (defaults to SEO_CONFIG.siteName)
 */
export function generateBlogPostingSchema(
    article: {
        title: string;
        excerpt?: string | null;
        content?: string | null;
        publishedAt?: string | null;
        author?: {name?: string | null} | null;
        image?: {url: string; width?: number | null; height?: number | null} | null;
        handle: string;
    },
    blogHandle: string,
    brandName?: string
): JsonLdSchema {
    const siteName = brandName || SEO_CONFIG.siteName;
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.excerpt || undefined,
        image: article.image?.url || undefined,
        datePublished: article.publishedAt ? formatSchemaDate(article.publishedAt) : undefined,
        // dateModified = datePublished: Shopify only exposes `publishedAt` on articles, not a separate `updatedAt`
        dateModified: article.publishedAt ? formatSchemaDate(article.publishedAt) : undefined,
        author: article.author?.name
            ? {
                  "@type": "Person",
                  name: article.author.name
              }
            : {
                  "@type": "Organization",
                  name: siteName
              },
        publisher: {
            "@type": "Organization",
            name: siteName,
            ...(SEO_CONFIG.siteUrl ? {url: SEO_CONFIG.siteUrl} : {})
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": buildCanonicalUrl(`/blogs/${blogHandle}/${article.handle}`)
        }
    };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQPageSchema(faqs: Array<{question: string; answer: string}>): JsonLdSchema {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(faq => ({
            "@type": "Question" as const,
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer" as const,
                text: faq.answer
            }
        }))
    };
}

/**
 * Extract brand name from root loader matches (for use in meta functions)
 * This is a type-safe way to get the brand name from the root loader data
 *
 * @example
 * export const meta: Route.MetaFunction = ({matches}) => {
 *   const brandName = getBrandNameFromMatches(matches);
 *   return [{ title: `Page Title | ${brandName}` }];
 * };
 */
export function getBrandNameFromMatches(matches: Array<{id: string; data?: unknown} | undefined>): string {
    const rootMatch = matches.find(m => m?.id === "root");
    const rootData = rootMatch?.data as {siteContent?: {siteSettings?: {brandName?: string}}} | undefined;
    return rootData?.siteContent?.siteSettings?.brandName || SEO_CONFIG.siteName;
}

export function getSiteUrlFromMatches(matches: Array<{id: string; data?: unknown} | undefined>): string {
    const rootMatch = matches.find(m => m?.id === "root");
    const rootData = rootMatch?.data as {siteContent?: {siteSettings?: {siteUrl?: string}}} | undefined;
    return rootData?.siteContent?.siteSettings?.siteUrl || SEO_CONFIG.siteUrl;
}

/**
 * Get default OG image from site_settings.
 * Priority: ogImage (dedicated social share image) → brandLogo → undefined.
 * ogImage should be a landscape 1200×630 crop; brandLogo is a UI asset and may be the wrong aspect ratio.
 */
export function getDefaultOgImage(
    siteSettings?: SeoSiteSettings | null
): SeoMedia | undefined {
    const og = siteSettings?.ogImage;
    if (og?.url) {
        return {url: og.url, width: og.width ?? undefined, height: og.height ?? undefined, type: "image"};
    }

    const logo = siteSettings?.brandLogo;
    if (logo?.url) {
        return {url: logo.url, width: logo.width ?? undefined, height: logo.height ?? undefined, type: "image"};
    }

    return undefined;
}

/**
 * Build meta array for private account pages (should not be indexed)
 * Returns title + robots:noindex,nofollow
 */
export function getAccountMeta(label: string): Array<Record<string, string>> {
    return [
        {title: label},
        {name: "robots", content: "noindex, nofollow"}
    ];
}
