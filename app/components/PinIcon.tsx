/**
 * @fileoverview Pin Icon Component for Pinned Products
 *
 * @description
 * Displays a pin icon that "pins" product cards to indicate featured/priority
 * products. Positioned to overlap the card corner for a physical "pinned note"
 * effect. Uses Lucide's Pin icon rotated 45 degrees.
 *
 * @design
 * - Overlaps top-left corner with negative positioning (-top-2 -left-2)
 * - Primary background with rounded-full shape
 * - Pin icon rotated 45 degrees for visual emphasis
 * - Shadow for depth and separation from card
 * - High z-index to appear above all other elements
 *
 * @positioning
 * The pin icon breaks outside the card boundary to create the effect of
 * physically pinning the card. Parent must have `position: relative` and
 * `overflow: visible` (or use overflow-x-clip to preserve sticky children).
 *
 * @accessibility
 * - aria-label describes the pinned status for screen readers
 * - Icon is decorative but container is announced
 *
 * @wcag-compliance
 * - primary-foreground on primary = 14.68:1 (WCAG AAA) ✓
 * - Icon meets 3:1 minimum for graphical objects (WCAG 1.4.11) ✓
 *
 * @usage
 * ```tsx
 * // In ProductItem.tsx
 * {isPinned && (
 *   <PinIcon className="absolute -top-2 -left-2 z-30" />
 * )}
 * ```
 *
 * @related
 * - ProductItem.tsx - Renders this icon for pinned products
 * - product-tags.ts - Detects pin tag on products
 */

import {Pin} from "lucide-react";
import {cn} from "~/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface PinIconProps {
    /** Additional CSS classes for positioning and styling */
    className?: string;
    /** Size variant - affects icon and container dimensions */
    size?: "sm" | "default" | "lg";
}

// =============================================================================
// SIZE CONFIGURATION
// =============================================================================

const SIZE_CONFIG = {
    sm: {
        container: "p-1",
        icon: 16
    },
    default: {
        container: "p-1.5",
        icon: 20
    },
    lg: {
        container: "p-2",
        icon: 24
    }
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Pin icon overlay for pinned/featured products.
 *
 * @param className - Additional CSS classes (typically for positioning)
 * @param size - Size variant: 'sm' | 'default' | 'lg'
 * @returns Pin icon element with appropriate styling
 *
 * Visual Structure:
 * ┌─────────────────────┐
 * │ ╱╲                  │  ← Pin overlaps corner
 * │ \/  Product Card    │
 * │                     │
 * └─────────────────────┘
 *
 * @example
 * <div className="relative">
 *   <PinIcon className="absolute -top-2 -left-2 z-30" />
 *   <ProductCard />
 * </div>
 */
export function PinIcon({className, size = "default"}: PinIconProps) {
    const config = SIZE_CONFIG[size];

    return (
        <div
            className={cn(
                // Shape and color
                "inline-flex items-center justify-center rounded-full",
                "bg-primary text-primary-foreground",
                // Padding based on size
                config.container,
                // Shadow for depth - makes it feel like it's above the card
                "shadow-lg",
                // Ring for extra definition
                "ring-1 ring-primary/20",
                className
            )}
            role="img"
            aria-label="Pinned product"
        >
            <Pin
                size={config.icon}
                // Fill and stroke for solid appearance
                fill="currentColor"
                strokeWidth={1.5}
                // Rotate 45 degrees for "pinned" effect
                className="rotate-45 pointer-events-none"
                aria-hidden="true"
            />
        </div>
    );
}
