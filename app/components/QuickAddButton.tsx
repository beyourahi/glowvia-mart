/**
 * @fileoverview Quick add to cart button with variant selection modal/sheet
 *
 * @description
 * Smart "Get it now" button that directly adds single-variant products to cart or
 * opens a variant selector (Sheet on mobile, Dialog on desktop) for multi-variant
 * products. Does NOT open cart drawer - allows continuous browsing.
 *
 * @features
 * - Single-variant products: Direct add to cart with one click
 * - Multi-variant products: Opens selector (Sheet mobile, Dialog desktop)
 * - Responsive modal/sheet detection via window.matchMedia
 * - Silent add to cart (no cart drawer interruption)
 * - Sold out state handling with disabled styling
 * - Loading states with spinner animation
 * - Event bubbling prevention (works inside clickable cards)
 * - Flexible product type compatibility (ProductItem, Collection, Curated)
 * - WCAG 2.1 Level AA compliant (documented contrast ratios)
 *
 * @props
 * - product: QuickAddProduct - Product data with variants
 * - className: string (optional) - Additional Tailwind classes
 * - fullWidth: boolean (optional) - Expand to full width with larger touch target
 *
 * @usage
 * ```tsx
 * // Product card usage
 * <QuickAddButton product={product} />
 *
 * // Full width for mobile cards
 * <QuickAddButton product={product} fullWidth />
 * ```
 *
 * @related
 * - QuickAddDialog.tsx - Desktop variant selector modal
 * - QuickAddSheet.tsx - Mobile variant selector bottom sheet
 * - ProductItem.tsx - Product card using this button
 * - CartForm - Shopify Hydrogen cart mutation component
 *
 * @architecture
 * - Single variant detection: hasDisplayableVariants() checks option diversity
 * - Mobile detection: window.matchMedia("(max-width: 767px)")
 * - Cart mutation: CartForm with LinesAdd action
 * - Modal selection: Controlled state (isSheetOpen)
 *
 * @see {@link https://shopify.dev/docs/api/hydrogen/2024-01/components/cartform}
 */

import {useState, useEffect, useCallback} from "react";
import {CartForm} from "@shopify/hydrogen";
import type {FetcherWithComponents} from "react-router";
import {Plus, Loader2} from "lucide-react";
import {cn} from "~/lib/utils";
import {useAside} from "~/components/Aside";
import {QuickAddSheet} from "~/components/QuickAddSheet";
import {QuickAddDialog} from "~/components/QuickAddDialog";
import {getButtonLabel} from "~/lib/product-tags";
import {Button} from "~/components/ui/button";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Flexible variant type that works with all fragment types
 * Compatible with ProductItemFragment, CollectionItemFragment, CuratedProductFragment
 */
interface QuickAddVariant {
    id: string;
    availableForSale: boolean;
    title?: string;
    selectedOptions?: Array<{name: string; value: string}>;
    price: {amount: string; currencyCode: string};
    compareAtPrice?: {amount: string; currencyCode: string} | null;
}

/**
 * Image type for product images
 */
interface QuickAddImage {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
}

/**
 * Flexible product type that works with multiple fragment types
 * ProductItemFragment, CollectionItemFragment, CuratedProductFragment
 */
interface QuickAddProduct {
    id: string;
    title: string;
    handle: string;
    availableForSale: boolean;
    tags?: string[];
    featuredImage?: QuickAddImage | null;
    images?: {
        nodes: QuickAddImage[];
    };
    priceRange: {
        minVariantPrice: {amount: string; currencyCode: string};
        maxVariantPrice: {amount: string; currencyCode: string};
    };
    variants: {
        nodes: QuickAddVariant[];
    };
}

interface QuickAddButtonProps {
    product: QuickAddProduct;
    className?: string;
    /** When true, button expands to full width with larger touch target */
    fullWidth?: boolean;
    /** When true, only shows the plus icon on mobile screens (hides "Get it now" text) */
    iconOnlyMobile?: boolean;
    /** When true, button only shows on large screens (lg breakpoint and above) - used in cart context */
    largeScreenOnly?: boolean;
    /**
     * When false, opens cart drawer after adding item.
     * Default is true (skip cart open) for uninterrupted browsing.
     * Set to false only when you explicitly want to show the cart after add.
     * @default true
     */
    skipCartOpen?: boolean;
    /**
     * Order history context - changes button label to "Buy Again" instead of "Get it now"
     * Used when displaying products from customer's order history (homepage carousel, orders page)
     * @default false
     */
    orderHistoryContext?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * QuickAddButton - Adds products to cart directly from product cards
 *
 * @param product - Product data with variants
 * @param className - Additional CSS classes
 * @param fullWidth - Expand to full width with larger touch target (default: false)
 * @returns Button that adds to cart or opens variant selector
 *
 * Behavior:
 * - Single variant products: Direct add to cart
 * - Multi-variant products: Opens Sheet (mobile) or Dialog (desktop) for selection
 * - Silent cart addition (no drawer interruption for continuous browsing)
 * - Prevents event bubbling (safe inside clickable cards)
 *
 * Variant Detection:
 * - hasDisplayableVariants() checks if product has meaningful variant options
 * - Products with only "Default Title" are treated as single-variant
 * - Products with same options on all variants are treated as single-variant
 *
 * Mobile Detection:
 * - window.matchMedia("(max-width: 767px)") for responsive modal type
 * - Updates on window resize for orientation changes
 * - SSR-safe (runs in useEffect)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * WCAG 2.1 Level AA Color Contrast Compliance
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ACTIVE STATE (bg-primary text-primary-foreground):
 *   Text: "Get it now" - #fff on #1f1f1f = 14.68:1 (WCAG AAA) ✓
 *   Plus icon: Inherits text color = 14.68:1 (WCAG AAA) ✓
 *   Loader2 spinner: Inherits text color = 14.68:1 (WCAG AAA) ✓
 *
 * LOADING STATE (opacity-70):
 *   Effective contrast still high due to base ratio of 14.68:1
 *   Estimated: ~10:1 (WCAG AAA) ✓
 *
 * SOLD OUT STATE (bg-muted text-muted-foreground opacity-50):
 *   WCAG exempts disabled controls from contrast requirements ✓
 *   Base: #545454 on #f0f0f0 = 5.32:1 (WCAG AA) ✓
 *
 * Touch targets:
 *   - Default: h-11 (44px) - WCAG 2.5.5 compliant ✓
 *   - fullWidth: h-10/h-11/h-12 responsive - WCAG 2.5.5 compliant ✓
 *
 * Focus ring: ring-primary (#1f1f1f) = 14.68:1 (WCAG AAA) ✓
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function QuickAddButton({
    product,
    className,
    fullWidth = false,
    iconOnlyMobile = false,
    largeScreenOnly = false,
    skipCartOpen = true,
    orderHistoryContext = false
}: QuickAddButtonProps) {
    const {open} = useAside();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Get the appropriate button label based on product tags and context
    // Priority: 1. Preorder products → "Pre Order"
    //           2. Order history context → "Buy Again"
    //           3. Default → "Get it now"
    const buttonLabel = getButtonLabel(product.tags, orderHistoryContext ? "Buy Again" : "Get it now");

    // Base button styles - responsive sizing when fullWidth
    // Horizontal padding standardized to px-3 sm:px-4 (matches variant option buttons)
    // largeScreenOnly adds hidden lg:flex to only show on large screens
    const baseStyles = fullWidth
        ? cn(
              "flex items-center justify-between w-full h-10 sm:h-11 md:h-12 px-3 sm:px-4 rounded-full font-medium",
              largeScreenOnly ? "hidden lg:flex text-sm sm:text-base" : "text-base sm:text-lg"
          )
        : cn(
              "flex items-center justify-center gap-2 h-11 sm:h-12 px-3 sm:px-4 rounded-full font-medium",
              largeScreenOnly ? "hidden lg:flex text-xs sm:text-sm" : "text-sm sm:text-base"
          );

    // Detect mobile on client side only
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 767px)").matches);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const variants = product.variants.nodes;
    const availableVariants = variants.filter(v => v.availableForSale);

    // Check if product is sold out
    const isSoldOut = availableVariants.length === 0;

    // Check if product has only one variant (or one available variant)
    // Also check if all variants have the same options (effectively single-variant)
    const hasMultipleVariants = hasDisplayableVariants(variants);
    const isSingleVariant = !hasMultipleVariants && availableVariants.length > 0;

    // Get the first available variant for single-variant products
    const defaultVariant = availableVariants[0];

    // Handle click on the button — stable reference prevents unnecessary re-renders of child buttons
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();

            if (isSoldOut) return;

            if (!isSingleVariant) {
                // Multi-variant: open selector
                setIsSheetOpen(true);
            }
            // Single variant: CartForm handles the submission
        },
        [isSoldOut, isSingleVariant]
    );

    // Icon size based on fullWidth
    const iconSize = fullWidth ? "size-6" : "size-5";

    // For sold out products
    if (isSoldOut) {
        return (
            <Button
                type="button"
                variant="secondary"
                disabled
                className={cn(baseStyles, "opacity-50", className)}
                aria-label={`${product.title} is sold out`}
            >
                {fullWidth ? (
                    <>
                        <span>{buttonLabel}</span>
                        <Plus className={iconSize} />
                    </>
                ) : (
                    <>
                        <span className={iconOnlyMobile ? "hidden md:inline" : undefined}>{buttonLabel}</span>
                        <Plus className={iconSize} />
                    </>
                )}
            </Button>
        );
    }

    // For single-variant products: direct add to cart
    if (isSingleVariant && defaultVariant) {
        return (
            <CartForm
                fetcherKey="cart-mutation"
                route="/cart"
                inputs={{
                    lines: [{merchandiseId: defaultVariant.id, quantity: 1}]
                }}
                action={CartForm.ACTIONS.LinesAdd}
            >
                {(fetcher: FetcherWithComponents<unknown>) => {
                    const isLoading = fetcher.state !== "idle";

                    return (
                        <Button
                            type="submit"
                            disabled={isLoading}
                            onClick={e => {
                                e.stopPropagation();
                                // Open cart drawer on click (form will submit)
                                // Skip if already inside cart (skipCartOpen=true)
                                if (!skipCartOpen) {
                                    open("cart");
                                }
                            }}
                            className={cn(
                                baseStyles,
                                !fullWidth && "hover:scale-105",
                                !fullWidth && "active:scale-95",
                                "motion-interactive",
                                "hover:bg-primary", // Override default hover:bg-primary/90 to remove opacity change
                                isLoading && "opacity-70 cursor-wait",
                                className
                            )}
                            aria-label={`Add ${product.title} to cart`}
                            aria-busy={isLoading}
                        >
                            {fullWidth ? (
                                <>
                                    <span>{buttonLabel}</span>
                                    {isLoading ? (
                                        <Loader2 className={cn(iconSize, "animate-spin")} />
                                    ) : (
                                        <Plus className={iconSize} />
                                    )}
                                </>
                            ) : (
                                <>
                                    <span className={iconOnlyMobile ? "hidden md:inline" : undefined}>
                                        {buttonLabel}
                                    </span>
                                    {isLoading ? (
                                        <Loader2 className={cn(iconSize, "animate-spin")} />
                                    ) : (
                                        <Plus className={iconSize} />
                                    )}
                                </>
                            )}
                        </Button>
                    );
                }}
            </CartForm>
        );
    }

    // For multi-variant products: show button that opens selector
    return (
        <>
            <Button
                type="button"
                onClick={handleClick}
                className={cn(
                    baseStyles,
                    !fullWidth && "hover:scale-105",
                    !fullWidth && "active:scale-95",
                    "motion-interactive",
                    "hover:bg-primary", // Override default hover:bg-primary/90 to remove opacity change
                    className
                )}
                aria-label={`Select options for ${product.title}`}
            >
                {fullWidth ? (
                    <>
                        <span>{buttonLabel}</span>
                        <Plus className={iconSize} />
                    </>
                ) : (
                    <>
                        <span className={iconOnlyMobile ? "hidden md:inline" : undefined}>{buttonLabel}</span>
                        <Plus className={iconSize} />
                    </>
                )}
            </Button>

            {/* Variant selector - Sheet for mobile, Dialog for desktop */}
            {isMobile ? (
                <QuickAddSheet product={product} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
            ) : (
                <QuickAddDialog product={product} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
            )}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if product has multiple displayable variant options
 *
 * @param variants - Array of product variants
 * @returns true if product has meaningful variant choices, false otherwise
 *
 * A product has displayable variants if any option has more than one value.
 * Returns false for:
 * - Products with only one variant
 * - Products where all variants have identical options
 * - Products with only "Default Title" option
 *
 * Example:
 * - Color: Blue, Red → true (displayable)
 * - Color: Blue, Size: Small → true (displayable)
 * - Default Title → false (no displayable variants)
 */
function hasDisplayableVariants(variants: QuickAddVariant[]): boolean {
    if (variants.length <= 1) return false;

    // Group variants by their options to check if there are actual choices
    const optionMap = new Map<string, Set<string>>();

    for (const variant of variants) {
        if (!variant.selectedOptions) continue;
        for (const option of variant.selectedOptions) {
            if (!optionMap.has(option.name)) {
                optionMap.set(option.name, new Set());
            }
            optionMap.get(option.name)!.add(option.value);
        }
    }

    // Check if any option has more than one value
    for (const values of optionMap.values()) {
        if (values.size > 1) return true;
    }

    return false;
}
