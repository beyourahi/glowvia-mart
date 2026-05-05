/**
 * @fileoverview Responsive Container Component - Edge-to-Edge Design
 *
 * @description
 * Provides minimal responsive padding for edge-to-edge content that spans full viewport width.
 * All size variants now behave identically - content spans 100vw with minimal breathing room.
 *
 * @architecture
 * Edge-to-Edge Strategy:
 * - All sizes (default/wide/full): Full viewport width (100vw)
 * - Minimal padding prevents content from touching viewport edges
 * - Size prop maintained for backwards compatibility but has no effect
 *
 * Padding scales minimally using CSS clamp():
 * - Mobile (320px): 4px horizontal padding
 * - Tablet (768px): ~6px horizontal padding
 * - Desktop (1440px): ~11px horizontal padding
 * - Ultrawide (2560px): 12px horizontal padding (capped)
 *
 * @usage
 * - Wrap page content in Container for minimal padding
 * - Size prop is now vestigial (all sizes behave identically)
 * - Use noPadding={true} for true edge-to-edge (0px padding)
 *
 * @dependencies
 * - ~/lib/utils - cn() for class merging
 * - CSS variables from tailwind.css (--content-max-width, --container-padding)
 *
 * @related
 * - app/components/PageLayout.tsx - Should wrap main content
 * - app/routes/_index.tsx - Homepage sections use Container
 * - app/styles/tailwind.css - Defines CSS variables
 *
 * @example
 * ```tsx
 * // Standard edge-to-edge container with minimal padding
 * <Container>
 *   <h1>Page Title</h1>
 *   <p>Content spans full viewport with 4-12px padding...</p>
 * </Container>
 *
 * // True edge-to-edge (0px padding)
 * <Container noPadding>
 *   <FullWidthImage />
 * </Container>
 *
 * // Size prop has no effect (backwards compatibility)
 * <Container size="wide">
 *   <ProductGrid products={products} />
 * </Container>
 * ```
 */

import {cn} from "~/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Container size variants (maintained for backwards compatibility)
 *
 * NOTE: All sizes now behave identically with edge-to-edge design.
 * The size prop has no effect on layout - kept to avoid breaking existing code.
 *
 * @property default - Full viewport width (100vw) with minimal padding
 * @property wide - Full viewport width (100vw) with minimal padding (same as default)
 * @property full - Full viewport width (100vw) with minimal padding (same as default)
 */
type ContainerSize = "default" | "wide" | "full";

/**
 * Valid HTML elements for Container
 *
 * Supports semantic elements for proper document structure.
 */
type ContainerElement = "div" | "section" | "main" | "article" | "header" | "footer" | "aside" | "nav";

interface ContainerProps {
    /** Content to render inside the container */
    children: React.ReactNode;

    /**
     * Container size variant (no effect — all sizes behave identically)
     * @default "default"
     */
    size?: ContainerSize;

    /**
     * Additional CSS classes to apply
     * Will be merged with container classes using cn()
     */
    className?: string;

    /**
     * HTML element to render
     * @default "div"
     */
    as?: ContainerElement;

    /**
     * Whether to disable horizontal padding
     * Useful when nesting containers or for edge-to-edge content
     * @default false
     */
    noPadding?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Container - Edge-to-edge content wrapper with minimal padding
 *
 * Provides full viewport width (100vw) layout with minimal responsive padding.
 * No centering, no max-width constraints - content spans edge-to-edge.
 * Uses CSS variables for responsive padding that scales minimally from mobile to ultrawide.
 *
 * @param props - ContainerProps
 *
 * @returns Container element with edge-to-edge styling
 *
 * @example
 * ```tsx
 * <Container>
 *   <h1>Content spans full viewport with minimal padding</h1>
 * </Container>
 *
 * <Container as="section">
 *   <ProductGrid />
 * </Container>
 *
 * <Container noPadding>
 *   <FullBleedImage />
 * </Container>
 * ```
 */
export function Container({
    children,
    size = "default",
    className,
    as: Component = "div",
    noPadding = false
}: ContainerProps) {
    return (
        <Component
            className={cn(
                // Base styles - full width, edge-to-edge (no centering)
                "w-full",

                // Minimal responsive horizontal padding (unless disabled)
                // Uses CSS variable that scales: 4px → 12px
                !noPadding && "px-container",

                // Size variants have no effect (all sizes = 100vw)
                // Kept for backwards compatibility but no classes applied

                // Allow custom classes to override
                className
            )}
        >
            {children}
        </Component>
    );
}

// =============================================================================
// UTILITY CLASSES
// =============================================================================

/**
 * CSS classes for breaking out of minimal Container padding
 *
 * Use on child elements that need to span full viewport width (0px padding)
 * while inside a Container with minimal padding. Applies negative margins
 * to counteract the minimal container padding (4-12px).
 *
 * NOTE: With edge-to-edge design, this is rarely needed since padding is already minimal.
 *
 * @example
 * ```tsx
 * <Container>
 *   <p>Content with minimal padding</p>
 *   <div className={breakoutClasses}>
 *     <FullWidthImage />
 *   </div>
 *   <p>Back to minimal padding</p>
 * </Container>
 * ```
 */
export const breakoutClasses = "-mx-[var(--container-padding)] px-[var(--container-padding)]";

/**
 * CSS classes for full-bleed breakout (no padding, touches edges)
 *
 * Use when you want content to truly touch viewport edges (0px padding).
 * Counteracts the minimal 4-12px padding from Container.
 *
 * @example
 * ```tsx
 * <Container>
 *   <p>Content with minimal padding</p>
 *   <div className={fullBleedClasses}>
 *     <VideoHero />
 *   </div>
 * </Container>
 * ```
 */
export const fullBleedClasses = "-mx-[var(--container-padding)]";

export default Container;
