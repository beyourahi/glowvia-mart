/**
 * @fileoverview Screen Size Detection Hook Aligned with Tailwind Breakpoints
 *
 * @description
 * SSR-safe hook for detecting the current screen size category (mobile/tablet/desktop).
 * Uses Tailwind v4 breakpoints to ensure consistency between JS logic and CSS styling.
 * Essential for conditional rendering and responsive behavior that can't be achieved
 * with CSS media queries alone.
 *
 * @architecture
 * - Defaults to "desktop" during SSR to match typical server render output
 * - Updates on window resize (no debounce - resize events are already throttled by browsers)
 * - Provides isHydrated flag to handle client-side transitions gracefully
 * - Exposes exact pixel width for precise calculations when needed
 *
 * @breakpoints (Tailwind v4 standard)
 * - mobile: < 640px (sm breakpoint)
 * - tablet: 640px - 1023px (sm to lg)
 * - desktop: >= 1024px (lg and above)
 *
 * @dependencies
 * - React hooks (useState, useEffect)
 * - Browser window.innerWidth and resize events
 *
 * @related
 * - gridColumns.ts - Uses breakpoints for grid layout calculations
 * - Header.tsx - Conditional mobile/desktop navigation rendering
 * - ProductHeroMobile.tsx - Mobile-specific product display
 * - FullScreenMenu.tsx - Mobile menu component
 *
 * @example
 * ```tsx
 * const { screenSize, isHydrated } = useScreenSize();
 *
 * // Conditional rendering after hydration
 * if (isHydrated && screenSize === 'mobile') {
 *   return <MobileLayout />;
 * }
 *
 * // Using width for precise calculations
 * const { width } = useScreenSize();
 * const columns = width && width < 768 ? 2 : 4;
 * ```
 */

import {useState, useEffect} from "react";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Tailwind v4 breakpoints - MUST stay in sync with tailwind.css
 *
 * These values are the minimum widths for each breakpoint.
 * Keep this in sync with @media queries in the stylesheet.
 *
 * @see https://tailwindcss.com/docs/responsive-design
 */
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536
} as const;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Screen size categories.
 * Aligned with common responsive design patterns.
 */
export type ScreenSize = "mobile" | "tablet" | "desktop";

/**
 * Return type for useScreenSize hook.
 */
interface UseScreenSizeReturn {
    /** Current screen size category */
    screenSize: ScreenSize;
    /** Exact viewport width in pixels (null during SSR) */
    width: number | null;
    /** True after client-side hydration completes */
    isHydrated: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * SSR-safe hook for detecting current screen size category.
 *
 * Why this exists:
 * CSS media queries handle most responsive design, but some scenarios require
 * JavaScript-based responsive logic (conditional rendering, different component
 * trees, calculations based on width). This hook provides that capability while
 * staying SSR-safe.
 *
 * SSR Strategy:
 * Returns "desktop" during SSR to match the most common server render.
 * After hydration, updates to the actual screen size. Use isHydrated
 * to conditionally render client-only responsive content.
 *
 * @returns Screen size info and hydration state
 *
 * @example
 * ```tsx
 * const { screenSize, isHydrated } = useScreenSize();
 *
 * // Wait for hydration before rendering size-specific content
 * if (!isHydrated) return <LoadingSkeleton />;
 *
 * return screenSize === 'mobile' ? <MobileNav /> : <DesktopNav />;
 * ```
 */
export function useScreenSize(): UseScreenSizeReturn {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    // SSR-safe default: "desktop" matches most server renders
    // This minimizes layout shift on hydration for desktop users
    const [screenSize, setScreenSize] = useState<ScreenSize>("desktop");
    const [width, setWidth] = useState<number | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // -------------------------------------------------------------------------
    // INITIALIZATION & RESIZE LISTENER
    // -------------------------------------------------------------------------
    useEffect(() => {
        /**
         * Updates screen size state based on current window width.
         * Uses Tailwind breakpoints for category determination.
         * (Defined inside useEffect to avoid dependency warning)
         */
        const updateScreenSize = () => {
            const w = window.innerWidth;
            setWidth(w);

            if (w < BREAKPOINTS.sm) {
                setScreenSize("mobile");
            } else if (w < BREAKPOINTS.lg) {
                setScreenSize("tablet");
            } else {
                setScreenSize("desktop");
            }
        };

        // Initial measurement - runs once on mount
        updateScreenSize();
        setIsHydrated(true);

        // Listen for viewport changes (orientation change, resize)
        // Note: No debounce needed - browser throttles resize events
        window.addEventListener("resize", updateScreenSize);
        return () => window.removeEventListener("resize", updateScreenSize);
    }, []);

    return {screenSize, width, isHydrated};
}
