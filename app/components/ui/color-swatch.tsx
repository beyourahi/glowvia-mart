/**
 * @fileoverview Unified Color Swatch Component for Product Variant Selection
 *
 * @description
 * A reusable, WCAG-compliant color swatch component for displaying and selecting
 * product color variants. Used consistently across product pages, quick add dialogs,
 * and quick add sheets to ensure a unified swatch experience.
 *
 * @features
 * - WCAG 2.1 Level AA compliant borders (3:1 contrast for UI components)
 * - Dynamic border color calculation based on swatch and background colors
 * - Support for color hex values and image swatches
 * - Multiple size variants (sm, md, lg)
 * - Hover, active, and focus states with accessible styling
 * - Support for different background contexts (normal vs primary/coral)
 * - Graceful fallback to text when no swatch data available
 *
 * @accessibility
 * - aria-label with color name for screen readers
 * - Focus ring for keyboard navigation (WCAG 2.4.7)
 * - 3:1 minimum contrast for swatch borders (WCAG 1.4.11)
 * - Touch targets meet 44x44px minimum on mobile
 *
 * @usage
 * ```tsx
 * // Basic usage
 * <ColorSwatch color="#FF6B6B" name="Coral" />
 *
 * // With selection state
 * <ColorSwatch color="#000000" name="Black" selected />
 *
 * // On primary background (mobile hero)
 * <ColorSwatch color="#FFFFFF" name="White" onPrimaryBackground />
 *
 * // As button for selection
 * <ColorSwatchButton
 *   swatch={{ color: "#FF6B6B" }}
 *   name="Coral"
 *   selected={isSelected}
 *   onClick={handleSelect}
 * />
 * ```
 *
 * @related
 * - ProductForm.tsx - Desktop product variant selection
 * - ProductHeroMobile.tsx - Mobile product hero with coral background
 * - QuickAddDialog.tsx - Desktop quick add modal
 * - QuickAddSheet.tsx - Mobile quick add bottom sheet
 * - wcag-contrast.ts - WCAG contrast calculation utilities
 *
 * @architecture
 * - Uses useSmartSwatchBorderColor hook for intelligent, context-aware border colors
 * - Border color adapts to: swatch color, selection state, background context, theme colors
 * - Leverages Tailwind CSS for consistent styling
 * - Integrates with shadcn design system patterns
 */

import {forwardRef} from "react";
import type {Maybe, ProductOptionValueSwatch} from "@shopify/hydrogen/storefront-api-types";
import {cn} from "~/lib/utils";
import {useSmartSwatchBorderColor} from "~/lib/site-content-context";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Size variants for the color swatch
 * - sm: 24px (1.5rem) - compact displays (inside pill buttons)
 * - md: 28px (1.75rem) - standard display, default
 * - lg: 36px (2.25rem) - prominent display, mobile hero
 */
type SwatchSize = "sm" | "md" | "lg";

interface ColorSwatchProps {
    /** Swatch color in HEX format (e.g., "#FF6B6B") - alternative to swatch prop */
    color?: string | null;
    /** Image URL for image-based swatches - alternative to swatch prop */
    image?: string | null;
    /** Shopify swatch data (contains color and/or image) - alternative to color/image props */
    swatch?: Maybe<ProductOptionValueSwatch> | undefined;
    /** Display name of the color (used for accessibility) */
    name: string;
    /** Size variant: sm (20px), md (24px), lg (32px) */
    size?: SwatchSize;
    /** Whether the swatch is currently selected */
    selected?: boolean;
    /** Whether the swatch is on a primary/coral background (affects border calculation) */
    onPrimaryBackground?: boolean;
    /** Additional CSS classes */
    className?: string;
}

interface ColorSwatchButtonProps extends Omit<ColorSwatchProps, "color" | "image"> {
    /** Shopify swatch data containing color or image */
    swatch?: Maybe<ProductOptionValueSwatch> | undefined;
    /** Click handler for selection */
    onClick?: () => void;
    /** Whether the option is available for selection */
    disabled?: boolean;
}

// =============================================================================
// SIZE CONFIGURATION
// =============================================================================

/**
 * Size mapping for swatch dimensions
 * Includes both swatch size and selection ring offset
 *
 * Increased sizes for better visibility and touch targets:
 * - sm: 24px (was 20px) - still compact but more visible
 * - md: 28px (was 24px) - comfortable default size
 * - lg: 36px (was 32px) - prominent mobile hero size
 */
const sizeClasses: Record<SwatchSize, {swatch: string; ring: string}> = {
    sm: {
        swatch: "size-6", // 24px - increased from size-5 (20px)
        ring: "ring-offset-1"
    },
    md: {
        swatch: "size-7", // 28px - increased from size-6 (24px)
        ring: "ring-offset-2"
    },
    lg: {
        swatch: "size-9", // 36px - increased from size-8 (32px)
        ring: "ring-offset-2"
    }
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * ColorSwatch - Display-only color swatch element
 *
 * Renders a circular color swatch with WCAG-compliant border.
 * Used for display purposes; for interactive swatches, use ColorSwatchButton.
 *
 * Uses smart border color calculation that considers:
 * - The swatch color itself
 * - Whether the parent button is selected (changes effective background)
 * - Whether on a primary/coral page section
 * - Theme colors for accurate contrast calculation
 *
 * @param color - HEX color value
 * @param image - Image URL for image swatches
 * @param name - Accessible name for the color
 * @param size - Size variant (sm, md, lg)
 * @param selected - Whether currently selected (affects border + adds ring)
 * @param onPrimaryBackground - Whether on coral/primary background
 * @param className - Additional CSS classes
 */
export const ColorSwatch = forwardRef<HTMLSpanElement, ColorSwatchProps>(function ColorSwatch(
    {
        color: colorProp,
        image: imageProp,
        swatch,
        name,
        size = "md",
        selected = false,
        onPrimaryBackground = false,
        className
    },
    ref
) {
    // Extract color and image from swatch prop or use direct props
    const color = colorProp ?? swatch?.color ?? null;
    const image = imageProp ?? swatch?.image?.previewImage?.url ?? null;

    // Smart WCAG-compliant border color that adapts to:
    // - The swatch color
    // - Selection state (selected buttons have primary bg, changing effective background)
    // - Page context (normal vs primary background)
    // - Theme colors for accurate contrast calculation
    const borderColor = useSmartSwatchBorderColor(color, selected, onPrimaryBackground);

    const sizeConfig = sizeClasses[size];

    // If no color or image, this is not a swatch-type option
    if (!color && !image) {
        return null;
    }

    return (
        <span
            ref={ref}
            aria-label={name}
            role="img"
            className={cn(
                // Base swatch styles
                "flex items-center justify-center overflow-hidden rounded-full",
                // Size
                sizeConfig.swatch,
                // Selection ring (visible when selected)
                selected && [
                    "ring-2",
                    sizeConfig.ring,
                    onPrimaryBackground
                        ? "ring-primary-foreground ring-offset-primary"
                        : "ring-primary ring-offset-background"
                ],
                className
            )}
            style={{
                backgroundColor: color || "transparent",
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor
            }}
        >
            {image && <img src={image} alt={name} className="size-full object-cover" />}
        </span>
    );
});

/**
 * ColorSwatchButton - Interactive color swatch for variant selection
 *
 * Wraps ColorSwatch in an accessible button with hover, focus, and active states.
 * Use this for clickable swatches in product forms and quick add interfaces.
 *
 * @param swatch - Shopify swatch data (color and/or image)
 * @param name - Option value name
 * @param size - Size variant
 * @param selected - Whether currently selected
 * @param onPrimaryBackground - Background context for border calculation
 * @param onClick - Selection handler
 * @param disabled - Whether option is unavailable
 * @param className - Additional CSS classes
 */
export const ColorSwatchButton = forwardRef<HTMLButtonElement, ColorSwatchButtonProps>(function ColorSwatchButton(
    {swatch, name, size = "md", selected = false, onPrimaryBackground = false, onClick, disabled = false, className},
    ref
) {
    const color = swatch?.color;
    const image = swatch?.image?.previewImage?.url;

    // If no swatch data, this option doesn't use swatches
    if (!color && !image) {
        return null;
    }

    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={`${selected ? "Selected: " : ""}${name}`}
            aria-pressed={selected}
            className={cn(
                // Base button styles - circular, focusable
                "inline-flex select-none items-center justify-center rounded-full p-0.5",
                // Transition
                "transition-all duration-200",
                // Hover effect - slight scale and shadow
                "hover:scale-110 hover:shadow-md",
                // Active/pressed effect
                "active:scale-95",
                // Focus ring for accessibility (keyboard navigation)
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                onPrimaryBackground
                    ? "focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
                    : "focus-visible:ring-primary focus-visible:ring-offset-background",
                // Disabled state
                disabled && "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none",
                className
            )}
        >
            <ColorSwatch
                color={color}
                image={image}
                name={name}
                size={size}
                selected={selected}
                onPrimaryBackground={onPrimaryBackground}
            />
        </button>
    );
});

/**
 * Helper function to check if an option has swatch data
 * Useful for conditionally rendering swatches vs text
 *
 * @param swatch - Shopify swatch data
 * @returns true if the option has color or image swatch data
 */
export function hasSwatch(swatch?: Maybe<ProductOptionValueSwatch> | undefined): boolean {
    return !!(swatch?.color || swatch?.image?.previewImage?.url);
}

/**
 * Helper function to extract swatch color
 *
 * @param swatch - Shopify swatch data
 * @returns color hex string or undefined
 */
export function getSwatchColor(swatch?: Maybe<ProductOptionValueSwatch> | undefined): string | undefined {
    return swatch?.color ?? undefined;
}

/**
 * Helper function to extract swatch image URL
 *
 * @param swatch - Shopify swatch data
 * @returns image URL or undefined
 */
export function getSwatchImage(swatch?: Maybe<ProductOptionValueSwatch> | undefined): string | undefined {
    return swatch?.image?.previewImage?.url ?? undefined;
}
