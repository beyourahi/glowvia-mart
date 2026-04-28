/**
 * @fileoverview Product page discount badge with variant-aware discount calculation
 *
 * @description
 * Displays premium discount percentage badges on product detail pages that update
 * dynamically when users switch between product variants. Features the same
 * luxurious emerald shimmer design as DiscountBadge for brand consistency.
 *
 * @design-inspiration
 * Based on ProductPageDiscountIndicator.svelte from the storefront_002 project.
 * Uses identical visual treatment as DiscountBadge.tsx:
 * - Dark emerald-950 background with 80% opacity
 * - BadgePercent icon in emerald-900 container
 * - Shimmer gradient text animation
 * - Fully rounded pill shape
 *
 * @features
 * - Real-time discount updates when variant selection changes
 * - Exact percentage for selected variants with compareAtPrice
 * - Fallback to product-level discount analysis (shows "upto X% off")
 * - Premium emerald shimmer styling
 * - Null return when no discounts available
 *
 * @props
 * - selectedVariant: VariantWithPrice | null - Currently selected product variant
 * - product: ProductWithVariants (optional) - Full product for fallback analysis
 * - className: string (optional) - Additional Tailwind classes
 *
 * @usage
 * ```tsx
 * <ProductDiscountBadge
 *   selectedVariant={selectedVariant}
 *   product={product}
 * />
 * ```
 *
 * @wcag-compliance
 * - Text contrast: 9.62:1 (AAA) - discount-text on discount-bg
 * - Shimmer mid-point: 15.8:1 (AAA) - discount-shimmer-mid on discount-bg
 * - Animation respects prefers-reduced-motion
 *
 * @related
 * - DiscountBadge.tsx - Generic discount badge for product cards (same design)
 * - app/lib/discounts.ts - Discount calculation utilities
 * - ProductPage.tsx - Product detail page implementation
 * - app/styles/tailwind.css - Discount color tokens (--discount-*)
 */

import {BadgePercent} from "lucide-react";
import {cn} from "~/lib/utils";
import {
    calculateVariantDiscountPercentage,
    analyzeProductDiscount,
    type ProductWithVariants,
    type VariantWithPrice
} from "~/lib/discounts";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface ProductDiscountBadgeProps {
    /** The currently selected variant */
    selectedVariant: VariantWithPrice | null | undefined;
    /** The full product for fallback analysis when no variant selected */
    product?: ProductWithVariants;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Displays a premium discount badge on the product page with variant awareness
 *
 * @param selectedVariant - Currently selected variant (null if none selected)
 * @param product - Full product object for fallback analysis
 * @param className - Additional CSS classes
 * @returns Badge component or null if no discount
 *
 * Behavior:
 * - Shows the discount % for the currently selected variant
 * - Updates dynamically when switching between variants
 * - Falls back to product-level discount analysis if no variant provided
 * - Returns null when there's no discount
 *
 * Badge Logic:
 * 1. Check selected variant for compareAtPrice
 * 2. Calculate exact discount percentage for variant
 * 3. If variant has no discount, check product-level discounts
 * 4. Show "upto X% off" if product has mixed discounts
 * 5. Show "X% off" if all variants have same discount
 *
 * Visual Structure (same as DiscountBadge):
 * ┌─────────────────────────────────────┐
 * │ [%] │ SHIMMER TEXT "15% OFF"       │
 * │ icon│                               │
 * └─────────────────────────────────────┘
 *
 * Note: Unlike DiscountBadge, this component is NOT absolutely positioned
 * since it's used inline within the product page layout.
 */
export function ProductDiscountBadge({selectedVariant, product, className}: ProductDiscountBadgeProps) {
    // Calculate discount for the selected variant
    const variantDiscount = calculateVariantDiscountPercentage(selectedVariant);

    // Determine discount label text
    let label: string | null = null;

    if (variantDiscount > 0) {
        // Selected variant has a discount - show exact percentage
        label = `${variantDiscount}% off`;
    } else if (product) {
        // Fall back to product-level analysis
        const productDiscount = analyzeProductDiscount(product);

        if (productDiscount.type !== "none" && productDiscount.percentage > 0) {
            label =
                productDiscount.type === "exact"
                    ? `${productDiscount.percentage}% off`
                    : `upto ${productDiscount.percentage}% off`;
        }
    }

    // No discount to display
    if (!label) {
        return null;
    }

    return (
        <div
            className={cn(
                // Shape & Layout (inline, not absolute positioned)
                "inline-flex items-center gap-1.5 rounded-full",
                // Background
                "bg-discount-bg",
                // Padding - slightly larger for product page prominence
                "px-0.5 pr-1 py-0.5",
                // Shadow for depth
                "shadow-md",
                className
            )}
        >
            {/* Icon container - darker emerald rounded background */}
            <span className="flex items-center justify-center rounded-full bg-discount-icon-bg p-1">
                <BadgePercent size={12} className="text-discount-text pointer-events-none" aria-hidden="true" />
            </span>

            {/* Shimmer gradient text */}
            <span
                className={cn(
                    // Typography - 12px base on mobile (WCAG readable), scales to 14px on small+ screens
                    "text-[12px] sm:text-sm font-medium uppercase tracking-wide",
                    // Shimmer gradient effect
                    "animate-shimmer bg-linear-to-r",
                    "from-discount-shimmer-start via-discount-shimmer-mid to-discount-shimmer-start",
                    "bg-size-[200%_100%] bg-clip-text text-transparent"
                )}
            >
                {label}
            </span>
        </div>
    );
}
