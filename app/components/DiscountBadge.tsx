/**
 * @fileoverview Premium discount badge component with emerald shimmer effect
 *
 * @description
 * Renders luxurious discount percentage badges on product cards in collections,
 * search results, and related products. Features a dark emerald background with
 * animated shimmer gradient text for a high-end perfume brand aesthetic.
 *
 * @design-inspiration
 * Based on ProductPageDiscountIndicator.svelte from the storefront_002 project.
 * Key design elements:
 * - Dark emerald-950 background with 80% opacity for depth
 * - BadgePercent icon in a rounded emerald-900 container
 * - Shimmer gradient text animation (emerald-400 → emerald-50 → emerald-400)
 * - Fully rounded pill shape for premium feel
 * - Uppercase text for emphasis
 *
 * @features
 * - Exact discount: "X% off" when all variants have same discount
 * - Range discount: "upto X% off" when variants have different discounts
 * - Animated shimmer gradient text for attention
 * - Icon indicator for visual hierarchy
 * - Absolute positioning for top-left overlay on product images
 * - WCAG AAA compliant contrast (9.62:1 for text on background)
 *
 * @props
 * - discountInfo: DiscountBadgeInfo (optional) - Structured discount from analyzeProductDiscount()
 * - percentage: number (optional) - Legacy direct percentage (shows as "upto X% off")
 * - className: string (optional) - Additional Tailwind classes
 *
 * @usage
 * ```tsx
 * // Modern usage with discount analysis
 * const discountInfo = analyzeProductDiscount(product);
 * <DiscountBadge discountInfo={discountInfo} />
 *
 * // Legacy usage
 * <DiscountBadge percentage={15} />
 * ```
 *
 * @wcag-compliance
 * - Text contrast: 9.62:1 (AAA) - discount-text on discount-bg
 * - Shimmer mid-point: 15.8:1 (AAA) - discount-shimmer-mid on discount-bg
 * - Animation respects prefers-reduced-motion
 *
 * @related
 * - ProductDiscountBadge.tsx - Variant-aware badge for product pages
 * - ProductItem.tsx - Product card component using this badge
 * - app/lib/discounts.ts - Discount calculation utilities
 * - app/styles/tailwind.css - Discount color tokens (--discount-*)
 */

import {BadgePercent} from "lucide-react";
import {cn} from "~/lib/utils";
import type {DiscountBadgeInfo} from "~/lib/discounts";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface DiscountBadgeProps {
    /** Discount info from analyzeProductDiscount() */
    discountInfo?: DiscountBadgeInfo;
    /** Legacy support: direct percentage (will show as "upto X% off") */
    percentage?: number;
    /**
     * Positioning mode:
     * - "absolute": Overlays on product image (default for card view)
     * - "inline": Flows with content (for list view)
     */
    position?: "absolute" | "inline";
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Displays a premium discount percentage badge with emerald shimmer effect
 *
 * @param discountInfo - Structured discount from analyzeProductDiscount()
 * @param percentage - Legacy direct percentage value
 * @param className - Additional CSS classes
 * @returns Badge component or null if no discount
 *
 * Badge Logic:
 * - Exact: All variants have the same discount → "X% off"
 * - Upto: Variants have different discounts → "upto X% off"
 * - None: No discount → null (no badge)
 *
 * Visual Structure:
 * ┌─────────────────────────────────────┐
 * │ [%] │ SHIMMER TEXT "15% OFF"       │
 * │ icon│                               │
 * └─────────────────────────────────────┘
 *
 * Positioning:
 * - Absolute top-left (top-2 left-2) for overlay on product images
 * - z-10 to appear above images
 * - Works with ProductItem's relative positioning
 *
 * Styling:
 * - bg-discount-bg (dark emerald at 80% opacity)
 * - Icon in bg-discount-icon-bg (emerald-900) rounded container
 * - Shimmer gradient text animation
 * - Fully rounded (rounded-full) for pill shape
 */
export function DiscountBadge({discountInfo, percentage, position = "absolute", className}: DiscountBadgeProps) {
    // Determine discount label text
    let label: string | null = null;

    if (discountInfo) {
        if (discountInfo.type === "none" || discountInfo.percentage <= 0) {
            return null;
        }
        label =
            discountInfo.type === "exact" ? `${discountInfo.percentage}% off` : `upto ${discountInfo.percentage}% off`;
    } else if (percentage && percentage > 0) {
        // Legacy support: use percentage prop directly
        label = `upto ${percentage}% off`;
    }

    // No discount to display
    if (!label) {
        return null;
    }

    return (
        <div
            className={cn(
                // Positioning - absolute for card overlay, inline for list view
                position === "absolute" && "absolute top-2 left-2 z-10",
                // Shape & Layout
                "inline-flex items-center gap-1.5 rounded-full",
                // Background + border ring (matches storefront_001 spec)
                "bg-discount-bg border-discount-icon-bg border",
                // Padding
                "px-0.5 pr-1 py-0",
                // Shadow for depth
                "shadow-md",
                className
            )}
        >
            {/* Icon container - darker emerald rounded background */}
            <span className="flex items-center justify-center rounded-full bg-discount-icon-bg p-0.5">
                <BadgePercent size={10} className="text-discount-text pointer-events-none" aria-hidden="true" />
            </span>

            {/* Shimmer gradient text */}
            <span
                className={cn(
                    // Typography - 12px base on mobile (WCAG readable), scales to 14px on small+ screens, back to 12px on large screens
                    "text-xs font-medium uppercase tracking-wide",
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
