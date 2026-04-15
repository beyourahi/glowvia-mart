/**
 * @fileoverview Site Content React Context Provider and Hooks
 *
 * @description
 * React Context system for providing site-wide content from Shopify metaobjects (site_settings
 * and theme_settings) throughout the application. Offers specialized hooks for accessing
 * specific content sections with type safety and fallback defaults.
 *
 * @architecture
 * Context Provider Pattern (Simplified - 80/20 Rule):
 * - SiteContentProvider wraps app in root.tsx
 * - Data fetched in root.tsx loader from 2 metaobjects (site_settings + theme_settings)
 * - Provides SiteSettings + ThemeConfig to all routes/components
 * - Hooks offer typed access to specific content sections
 *
 * Note: UI content hooks (useProductContent, useCartContent, etc.) have been removed.
 * Components now import FALLBACK_* constants directly from fallback-data.ts.
 * This follows the 80/20 rule - only high-value, frequently-changed content
 * (brand, hero, promotions, theme) needs Shopify Admin control.
 *
 * Data Structure:
 * - SiteSettings: Brand, hero, SEO, contact, sections, promotions, collections
 * - ThemeConfig: Fonts (sans, serif, mono) + Colors (primary, secondary, background, foreground, accent)
 *
 * Hook Variants:
 * - useSiteContent(): Full content (throws if outside provider)
 * - useSiteContentSafe(): Full content with fallback defaults
 * - useSiteSettings(): Only site settings
 * - useThemeConfig(): Only theme configuration
 * - useContactInfo(): Derived contact info object
 * - useSocialLinks(): Social media links array
 * - useSectionHeadings(): Section heading strings
 * - useTestimonials(), useFaqItems(), useInstagramMedia(): Collections
 * - useGeneratedTheme(): Complete theme with CSS variables and fonts
 *
 * @dependencies
 * - React (createContext, useContext)
 * - TypeScript types from types/index.ts
 * - Default values from ./metaobject-parsers.ts
 * - Theme generation from ./theme-utils.ts
 *
 * @related
 * - app/root.tsx - Fetches data and wraps app with SiteContentProvider
 * - app/lib/metaobject-queries.ts - GraphQL queries for site content
 * - app/lib/metaobject-parsers.ts - Parses query results into typed objects
 * - app/lib/theme-utils.ts - Generates CSS variables from theme config
 * - app/lib/fallback-data.ts - FALLBACK_* constants for UI content (import directly)
 * - app/components/* - All components can use hooks to access site content
 */

import {createContext, useContext, useMemo, type ReactNode} from "react";
import type {
    SiteContent,
    SiteSettings,
    ContactInfo,
    SocialLink,
    SectionHeadings,
    Testimonial,
    FAQItem,
    InstagramMedia,
    HeroMedia,
    ThemeFonts,
    ThemeCoreColors,
    ThemeConfig,
    GeneratedTheme
} from "types";
import {DEFAULT_SITE_SETTINGS, DEFAULT_THEME_CONFIG} from "./metaobject-parsers";
import {generateTheme} from "./theme-utils";
import {getSwatchBorderColor, getSmartSwatchBorderColor} from "./color";

// =============================================================================
// CONTEXT
// =============================================================================

/**
 * Context provides SiteContent (site_settings + theme_settings)
 * UI content uses FALLBACK_* constants directly from fallback-data.ts
 */
const SiteContentContext = createContext<SiteContent | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface SiteContentProviderProps {
    children: ReactNode;
    siteContent: SiteContent;
}

/**
 * Provider component that wraps the application to provide site content
 * Use at the root level (in root.tsx) to make content available everywhere
 */
export function SiteContentProvider({children, siteContent}: SiteContentProviderProps) {
    return <SiteContentContext.Provider value={siteContent}>{children}</SiteContentContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the full site content
 * Throws an error if used outside of SiteContentProvider
 */
export function useSiteContent(): SiteContent {
    const context = useContext(SiteContentContext);
    if (!context) {
        throw new Error("useSiteContent must be used within a SiteContentProvider");
    }
    return context;
}

/**
 * Hook to access site content with fallback defaults
 * Safe to use even if provider is not set up (returns defaults)
 */
export function useSiteContentSafe(): SiteContent {
    const context = useContext(SiteContentContext);
    if (!context) {
        return {
            siteSettings: DEFAULT_SITE_SETTINGS,
            themeConfig: DEFAULT_THEME_CONFIG
        };
    }
    return context;
}

/**
 * Hook to access theme configuration
 * Returns the theme config from site content (fonts and colors)
 */
export function useThemeConfig(): ThemeConfig {
    return useSiteContentSafe().themeConfig;
}

/**
 * Hook to access site settings (contains ALL site configuration)
 */
export function useSiteSettings(): SiteSettings {
    return useSiteContentSafe().siteSettings;
}

/**
 * Hook to access contact info (derived from siteSettings)
 * Provides backward compatibility for components expecting ContactInfo shape
 */
export function useContactInfo(): ContactInfo {
    const settings = useSiteSettings();
    return {
        email: settings.contactEmail,
        phone: settings.contactPhone,
        businessHours: settings.businessHours,
        address: settings.address
    };
}

/**
 * Hook to access social links (now stored in siteSettings)
 */
export function useSocialLinks(): SocialLink[] {
    return useSiteSettings().socialLinks;
}

/**
 * Hook to access section headings (derived from siteSettings)
 * Provides backward compatibility for components expecting SectionHeadings shape
 */
export function useSectionHeadings(): SectionHeadings {
    const settings = useSiteSettings();
    return {
        blogSectionTitle: settings.blogSectionTitle,
        collectionsTitle: settings.collectionsTitle,
        relatedProductsTitle: settings.relatedProductsTitle,
        recommendedTitle: settings.recommendedTitle,
        instagramTitle: settings.instagramTitle
    };
}

/**
 * Hook to access brand marquee words
 * Returns the brandWords array from site settings
 */
export function useBrandMarquee(): {words: string[]} {
    const {brandWords} = useSiteSettings();
    return {words: brandWords};
}

// =============================================================================
// HOOKS FOR PROMOTIONAL CONTENT
// =============================================================================

/**
 * Hook to access promotional banner content
 * Returns announcement texts as array (list of single line texts from Shopify)
 */
export function usePromotionalBanners(): {
    announcement: string[];
    bannerOneMedia?: HeroMedia;
    bannerTwoMedia?: HeroMedia;
} {
    const settings = useSiteSettings();
    return {
        announcement: settings.announcementBanner,
        bannerOneMedia: settings.promotionalBannerOneMedia,
        bannerTwoMedia: settings.promotionalBannerTwoMedia
    };
}

// =============================================================================
// HOOKS FOR COLLECTIONS (JSON arrays stored in site_settings)
// =============================================================================

/**
 * Hook to access testimonials
 * Returns the testimonials array from site settings
 */
export function useTestimonials(): Testimonial[] {
    return useSiteSettings().testimonials;
}

/**
 * Hook to access FAQ items
 * Returns the faqItems array from site settings
 */
export function useFaqItems(): FAQItem[] {
    return useSiteSettings().faqItems;
}

/**
 * Hook to access Instagram media (images and videos)
 * Returns the instagramMedia array from site settings
 */
export function useInstagramMedia(): InstagramMedia[] {
    return useSiteSettings().instagramMedia;
}

/**
 * Hook to access shop location data (Google Maps embeds + share links).
 * Returns index-paired arrays — consumers zip them and skip incomplete pairs.
 * Both arrays are empty when no locations are configured in Shopify Admin.
 */
export function useShopLocations(): {embedUrls: string[]; shareLinks: string[]} {
    const settings = useSiteSettings();
    return {
        embedUrls: settings.googleMapsEmbedUrls,
        shareLinks: settings.googleMapsLinks
    };
}

// =============================================================================
// HOOKS FOR THEME CUSTOMIZATION
// =============================================================================

/**
 * Hook to access theme fonts configuration
 * Returns fonts from theme config (sans, serif, mono)
 */
export function useThemeFonts(): ThemeFonts {
    return useThemeConfig().fonts;
}

/**
 * Hook to access core theme colors
 * Returns the 5 core brand colors (primary, secondary, background, foreground, accent)
 */
export function useThemeColors(): ThemeCoreColors {
    return useThemeConfig().colors;
}

/**
 * Hook to generate complete theme from theme config
 * Returns generated CSS variables, Google Fonts URL, and font config
 */
export function useGeneratedTheme(): GeneratedTheme | null {
    const themeConfig = useThemeConfig();

    return useMemo(
        () => generateTheme(themeConfig.colors, themeConfig.fonts, themeConfig.borderRadius),
        [themeConfig.colors, themeConfig.fonts, themeConfig.borderRadius]
    );
}

// =============================================================================
// HOOKS FOR WCAG-COMPLIANT SWATCH STYLING
// =============================================================================

/**
 * Hook to calculate WCAG-compliant border color for product color swatches
 *
 * This hook ensures color swatches have visible borders that meet WCAG 2.1 Level AA
 * requirements for non-text contrast (3:1 minimum). The border color is dynamically
 * calculated based on both the swatch color and the theme's background color.
 *
 * @param swatchColor - The swatch color from Shopify (HEX format like "#FF6B6B")
 * @param customBackground - Optional override for background color (defaults to theme background)
 * @returns HEX color string for the border that provides sufficient contrast
 *
 * @example
 * ```tsx
 * function ProductSwatch({ color }: { color: string }) {
 *   const borderColor = useSwatchBorderColor(color);
 *   return (
 *     <div
 *       style={{
 *         backgroundColor: color,
 *         borderColor: borderColor,
 *         borderWidth: '1px',
 *         borderStyle: 'solid'
 *       }}
 *     />
 *   );
 * }
 * ```
 *
 * @see getSwatchBorderColor in wcag-contrast.ts for the algorithm details
 */
export function useSwatchBorderColor(swatchColor: string | null | undefined, customBackground?: string): string {
    const themeColors = useThemeColors();

    // Use custom background if provided, otherwise use theme background
    const backgroundColor = customBackground || themeColors.background;
    return getSwatchBorderColor(swatchColor, backgroundColor);
}

/**
 * Hook to calculate swatch border color for mobile product hero (coral background)
 *
 * Mobile product hero uses the primary color as background (coral/orange).
 * This hook automatically uses the theme's primary color as the background
 * context for border calculation.
 *
 * @param swatchColor - The swatch color from Shopify (HEX format)
 * @returns HEX color string for the border optimized for primary background
 *
 * @example
 * ```tsx
 * function MobileSwatch({ color }: { color: string }) {
 *   const borderColor = useSwatchBorderColorOnPrimary(color);
 *   // Border will contrast well against both the swatch AND the coral background
 * }
 * ```
 */
export function useSwatchBorderColorOnPrimary(swatchColor: string | null | undefined): string {
    const themeColors = useThemeColors();

    return getSwatchBorderColor(swatchColor, themeColors.primary);
}

/**
 * Smart hook for dynamic swatch border color based on full context
 *
 * This is the most intelligent swatch border calculation that considers:
 * 1. The swatch color itself
 * 2. Whether the option is currently selected (changes button background)
 * 3. Whether on a primary-colored page section (mobile hero)
 * 4. Theme colors from the site content
 *
 * The algorithm determines the effective background the swatch is visually
 * sitting on (which changes based on button selection state), then finds
 * a border color that provides WCAG 3:1 contrast against both the swatch
 * color AND the effective background.
 *
 * Use this hook when the swatch is inside a button that changes background
 * on selection (like variant option pills).
 *
 * @param swatchColor - The swatch color (HEX format)
 * @param isSelected - Whether the parent button is in selected state
 * @param onPrimaryBackground - Whether on a primary-colored page section
 * @returns HEX color string for the border with optimal contrast
 *
 * @example
 * ```tsx
 * function VariantSwatch({ color, selected }: { color: string; selected: boolean }) {
 *   const borderColor = useSmartSwatchBorderColor(color, selected, false);
 *   // Border dynamically adapts when selection state changes
 * }
 * ```
 *
 * @example
 * ```tsx
 * // On mobile hero (coral background)
 * function MobileVariantSwatch({ color, selected }: { color: string; selected: boolean }) {
 *   const borderColor = useSmartSwatchBorderColor(color, selected, true);
 *   // Border adapts to coral bg context AND selection state
 * }
 * ```
 */
export function useSmartSwatchBorderColor(
    swatchColor: string | null | undefined,
    isSelected: boolean,
    onPrimaryBackground: boolean = false
): string {
    const themeColors = useThemeColors();

    return getSmartSwatchBorderColor({
        swatchColor,
        backgroundColor: themeColors.background,
        isSelected,
        onPrimaryBackground,
        themeColors
    });
}

// =============================================================================
// UI CONTENT MIGRATION NOTE
// =============================================================================
// The following hooks were removed as part of the 80/20 simplification:
// - useProductContent() - import FALLBACK_PRODUCT_CONTENT from fallback-data.ts
// - useCartContent() - import FALLBACK_CART_CONTENT from fallback-data.ts
// - useAccountContent() - import FALLBACK_ACCOUNT_CONTENT from fallback-data.ts
// - useSearchContent() - import FALLBACK_SEARCH_CONTENT from fallback-data.ts
// - useUIMessages() - import FALLBACK_UI_MESSAGES from fallback-data.ts
// - useErrorContent() - import FALLBACK_ERROR_CONTENT from fallback-data.ts
// - useWishlistContent() - import FALLBACK_WISHLIST_CONTENT from fallback-data.ts
//
// Components should now import these constants directly from '~/lib/fallback-data'
// This simplifies the architecture while maintaining the same functionality.
