/**
 * @fileoverview Product title component with two-part display support
 *
 * @description
 * Renders product titles with intelligent splitting - when a title contains " + ",
 * displays it as two separate lines with distinct visual hierarchy.
 *
 * @features
 * - Automatic title splitting by " + " delimiter
 * - Two-part visual hierarchy (primary + secondary)
 * - Responsive typography based on grid layout
 * - Semantic HTML (h3 elements for proper heading structure)
 * - Conditional rendering (second part only if exists)
 *
 * @usage_examples
 * // Simple title (no splitting)
 * <ProductTitle title="Organic Cotton T-Shirt" />
 *
 * // Two-part title (splits on " + ")
 * <ProductTitle title="Premium Hoodie + Free Tote Bag" />
 * // Renders:
 * // "Premium Hoodie" (larger, primary color)
 * // "Free Tote Bag" (smaller, muted color)
 *
 * @styling_rationale
 * - First part: Larger, primary color (text-foreground) - main product name
 * - Second part: Smaller, muted color (text-muted-foreground) - bonus/descriptor
 * - Font: font-sans font-medium for consistency with current ProductItem
 * - Responsive: Adjusts sizing based on grid column count (gridColumns prop)
 *
 * @related
 * - ProductItem.tsx - Main consumer of this component
 * - template-storefront ProductCardTitle.svelte - Original inspiration
 */

import {cn} from "~/lib/utils";
import type {GridColumns} from "~/lib/gridColumns";
import {parseProductTitle} from "~/lib/product";

interface ProductTitleProps {
    /** Full product title string (may contain " + " delimiter) */
    title: string;

    /**
     * Grid columns for dynamic font sizing.
     * - 2: Large fonts (spacious 2-column layout)
     * - 3: Medium fonts (balanced 3-column layout)
     * - 4: Smaller fonts (dense 4-column layout)
     * - undefined: Default sizing for pages without grid selector (carousels, related products)
     */
    gridColumns?: GridColumns;

    /**
     * Visual mode - card (vertical) or list (horizontal) or pdp (product detail page) or mobile-hero (mobile sticky hero) or cart (cart line item)
     * @default "card"
     */
    variant?: "card" | "list" | "pdp" | "mobile-hero" | "cart";

    /** Additional CSS classes for wrapper div */
    className?: string;

    /**
     * Compact mode - reduced font sizes and spacing
     * @default false
     */
    compactMode?: boolean;

    /**
     * Dark context mode - inverts colors for dark backgrounds (e.g., cart sheet)
     * Uses primary-foreground (light) instead of primary (dark) for text
     * @default false
     */
    darkContext?: boolean;
}

// =============================================================================
// PRODUCT TITLE
// =============================================================================

export function ProductTitle({
    title,
    gridColumns,
    variant = "card",
    className,
    compactMode = false,
    darkContext = false
}: ProductTitleProps) {
    const {primary, secondary} = parseProductTitle(title);

    // Get responsive font sizes
    const fontSizes = getFontSizes(gridColumns, variant, compactMode);

    // PDP variant renders as h1 (primary heading on product detail page); all other variants use h2
    const HeadingTag = variant === "pdp" ? "h1" : "h2";

    // Mobile hero uses serif font and different text colors (white on coral background)
    // Dark context mode also uses inverted colors (for dark backgrounds like cart sheet)
    const isMobileHero = variant === "mobile-hero";
    const useLightText = isMobileHero || darkContext;
    const fontFamily = isMobileHero ? "font-serif" : "font-sans";
    const primaryColor = useLightText ? "text-primary-foreground" : "text-primary";
    const secondaryColor = useLightText ? "text-primary-foreground/70" : "text-muted-foreground opacity-75";

    // PDP variant adds spacing between primary and secondary title parts
    const primaryMargin = variant === "pdp" ? "mb-2" : "";

    return (
        <div className={cn(className)}>
            {/* Primary title part */}
            <HeadingTag
                className={cn(
                    fontFamily,
                    "font-medium mb-0",
                    primaryColor,
                    fontSizes.primary,
                    primaryMargin,
                    "leading-tight"
                )}
            >
                {primary}
            </HeadingTag>

            {/* Secondary title part (conditional) */}
            {secondary && (
                <h2 className={cn(fontFamily, "font-medium leading-tight mb-2", secondaryColor, fontSizes.secondary)}>
                    {secondary}
                </h2>
            )}
        </div>
    );
}

// =============================================================================
// FONT SIZE CONFIGURATION
// =============================================================================

/**
 * Generate responsive font size classes based on grid columns and variant
 *
 * @param gridColumns - Grid column count (2-4 or undefined)
 * @param variant - Layout variant (card, list, pdp, mobile-hero, or cart)
 * @param compactMode - Use compact sizing
 * @returns Object with primary and secondary font size classes
 */
function getFontSizes(
    gridColumns: GridColumns | undefined,
    variant: "card" | "list" | "pdp" | "mobile-hero" | "cart",
    compactMode: boolean
) {
    // Compact mode - reduced sizes across all variants
    if (compactMode) {
        if (variant === "list") {
            return {
                primary: "text-base md:text-lg",
                secondary: "text-sm sm:text-sm"
            };
        }

        // Card compact mode (cart suggestions context)
        return {
            primary: "text-xs sm:text-sm",
            secondary: "text-xs"
        };
    }

    // List variant - optimized for horizontal layout
    if (variant === "list") {
        return {
            primary: "text-lg md:text-xl 2xl:text-2xl",
            secondary: "text-sm sm:text-sm md:text-sm"
        };
    }

    // Cart variant - one scale down from list variant for cart line items
    // Primary: 16px → 18px → 20px (one scale smaller than list)
    // Secondary: 14px (same as list for consistency)
    if (variant === "cart") {
        return {
            primary: "text-base md:text-lg 2xl:text-xl",
            secondary: "text-sm sm:text-sm md:text-sm"
        };
    }

    // PDP variant - hero title sizing for product detail page
    // Bold, prominent visual anchor that scales proportionally across breakpoints.
    // Mobile (full-width container): 30px → Desktop (half-width grid column): 36px → 44px → 48px
    // Secondary maintains ~1.6–2.0x ratio with primary for cohesive title treatment.
    if (variant === "pdp") {
        return {
            primary: "text-3xl md:text-4xl xl:text-fluid-h1 2xl:text-5xl tracking-wide",
            secondary: "text-lg md:text-xl xl:text-2xl"
        };
    }

    // Mobile hero variant - serif font, compact spacing, mobile-optimized sizing
    // Used in ProductHeroMobile sticky section with coral background
    // Matches PDP mobile sizing for consistency (mobile-only context, no md+ breakpoints needed)
    if (variant === "mobile-hero") {
        return {
            primary: "text-3xl",
            secondary: "text-lg"
        };
    }

    // Card variant with grid-based sizing
    // Mobile (<640px) primary sizes are intentionally one Tailwind scale step smaller than
    // tablet/desktop to keep titles compact on small screens; sm:/lg: preserve original sizing.
    switch (gridColumns) {
        case 2:
            // 2-col: 16px (mobile) → 20px → 24px
            return {
                primary: "text-base sm:text-xl lg:text-2xl",
                secondary: "text-sm sm:text-base lg:text-lg"
            };
        case 3:
            // 3-col: 14px (mobile) → 16px
            return {
                primary: "text-sm sm:text-base lg:text-base",
                secondary: "text-xs lg:text-sm"
            };
        case 4:
            // 4-col: 12px (mobile) → 16px → 16px
            return {
                primary: "text-xs sm:text-base lg:text-base",
                secondary: "text-xs lg:text-xs"
            };
        case 1:
        case undefined:
        default:
            // Default sizing for carousels, related products (matches 3-col collection default)
            // 14px (mobile) → 16px — cohesive with collection page
            return {
                primary: "text-sm sm:text-base lg:text-base",
                secondary: "text-xs lg:text-sm"
            };
    }
}
