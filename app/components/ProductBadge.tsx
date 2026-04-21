/**
 * @fileoverview Product Badge Component for Special Tags
 *
 * @description
 * Displays subtle, neutral-styled badges for special product tags (Premium,
 * Pre-Order, New, Clearance). Designed to complement rather than compete
 * with the emerald discount badge. Uses existing CSS variables for consistency.
 *
 * @design-philosophy
 * - Subtle neutrals: Badges don't overwhelm the product image
 * - Consistent with design system: Uses existing color tokens
 * - Discount badge is the hero: These badges are secondary
 * - Vertical stacking: Multiple badges stack cleanly
 *
 * @badge-types
 * - Premium: Secondary background (sophisticated, muted)
 * - Pre-Order: Muted background (informational)
 * - New: Accent background (slight highlight)
 * - Clearance: Destructive tint (soft red, not alarming)
 *
 * @accessibility
 * - WCAG AA compliant contrast ratios
 * - aria-label for screen readers
 * - Respects prefers-reduced-motion
 *
 * @usage
 * ```tsx
 * // Single badge
 * <ProductBadge type="premium" />
 *
 * // Multiple badges (stacked)
 * <ProductBadgeStack types={['premium', 'newArrival']} />
 * ```
 *
 * @related
 * - DiscountBadge.tsx - Primary discount badge (emerald shimmer)
 * - ProductItem.tsx - Uses badges on product cards
 * - product-tags.ts - Tag detection utilities
 */

import {cn} from "~/lib/utils";
import {BADGE_CONFIG, type SpecialTagType} from "~/lib/product-tags";

// =============================================================================
// TYPES
// =============================================================================

type BadgeType = Exclude<SpecialTagType, "pin">;

interface ProductBadgeProps {
    /** Type of badge to display */
    type: BadgeType;
    /** Additional CSS classes */
    className?: string;
}

interface ProductBadgeStackProps {
    /** Array of badge types to display */
    types: BadgeType[];
    /** Additional CSS classes for the container */
    className?: string;
}

// =============================================================================
// SINGLE BADGE COMPONENT
// =============================================================================

/**
 * Single product badge for special tags.
 *
 * @param type - Badge type: 'premium' | 'preorder' | 'newArrival' | 'clearance'
 * @param className - Additional CSS classes
 * @returns Styled badge element
 *
 * Visual Structure:
 * ┌──────────────┐
 * │  PREMIUM     │  ← Small, compact badge
 * └──────────────┘
 *
 * Styling:
 * - Small text (text-sm), uppercase, medium weight
 * - Compact padding (px-2 py-0.5)
 * - Rounded corners (rounded-md)
 * - Uses CSS variable colors for consistency
 */
export function ProductBadge({type, className}: ProductBadgeProps) {
    const config = BADGE_CONFIG[type];

    return (
        <span
            className={cn(
                "text-xs font-medium uppercase tracking-wide",
                "inline-flex items-center justify-center",
                "px-2 py-0.5",
                // Shape - matches DiscountBadge rounded-full
                "rounded-full",
                // Shadow - matches DiscountBadge depth
                "shadow-md",
                // Badge-specific colors
                config.className,
                // Additional classes
                className
            )}
            role="status"
            aria-label={config.ariaLabel}
        >
            {config.label}
        </span>
    );
}

// =============================================================================
// BADGE STACK COMPONENT
// =============================================================================

/**
 * Vertically stacked badges for products with multiple special tags.
 *
 * @param types - Array of badge types to display
 * @param className - Additional CSS classes for container
 * @returns Stack of badges or null if no types provided
 *
 * Visual Structure (vertical stack):
 * ┌──────────────┐
 * │  PREMIUM     │
 * ├──────────────┤
 * │  NEW         │
 * └──────────────┘
 *
 * Badge priority order (top to bottom):
 * 1. Premium - Most important status
 * 2. Pre-Order - Purchase behavior modification
 * 3. New - Marketing highlight
 * 4. Clearance - Sale status
 */
export function ProductBadgeStack({types, className}: ProductBadgeStackProps) {
    if (!types || types.length === 0) return null;

    // Sort badges by priority for consistent display order
    const priorityOrder: BadgeType[] = ["premium", "preorder", "newArrival", "clearance"];
    const sortedTypes = types.sort((a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b));

    return (
        <div className={cn("flex flex-col items-start gap-1", className)}>
            {sortedTypes.map(type => (
                <ProductBadge key={type} type={type} />
            ))}
        </div>
    );
}
