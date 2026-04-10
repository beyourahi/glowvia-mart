/**
 * @fileoverview Scroll Position Detection Hook
 *
 * @description
 * React hook for detecting if the page has been scrolled past a threshold using Lenis smooth
 * scroll values. Provides boolean state for conditional rendering based on scroll position
 * (e.g., header styling, scroll-to-top button visibility).
 *
 * @architecture
 * Scroll Detection Strategy:
 * - Subscribes to Lenis scroll events
 * - Compares current scroll position to threshold
 * - Updates boolean state when crossing threshold
 * - Uses both Lenis event listener and context scroll value
 *
 * Use Cases:
 * - Header background on scroll
 * - Sticky navigation appearance
 * - Scroll-to-top button visibility
 * - Progress indicators
 *
 * Performance:
 * - Efficient: Only updates when threshold crossing occurs
 * - Synced with Lenis smooth scroll values
 * - Automatic cleanup on unmount
 *
 * @dependencies
 * - React (useState, useEffect)
 * - ./LenisProvider (useLenis hook)
 *
 * @related
 * - app/lib/LenisProvider.tsx - Provides Lenis instance and scroll value
 * - app/components/Header.tsx - Uses for header background on scroll
 * - app/lib/useScrollProgress.ts - Related hook for scroll progress
 */

import {useState, useEffect} from "react";
import {useLenis} from "./LenisProvider";

/**
 * Hook to detect if the page has been scrolled past a threshold
 * Uses Lenis smooth scroll values for consistency
 * @param threshold - Scroll position in pixels to trigger the scrolled state (default: 0)
 * @returns boolean indicating if scrolled past threshold
 */
export function useScrolled(threshold = 0): boolean {
    const {lenis, scroll} = useLenis();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (!lenis) return;

        const handleScroll = () => {
            setIsScrolled(lenis.scroll > threshold);
        };

        // Check initial scroll position
        handleScroll();

        lenis.on("scroll", handleScroll);
        return () => {
            lenis.off("scroll", handleScroll);
        };
    }, [lenis, threshold]);

    // Also update when scroll changes via context
    useEffect(() => {
        setIsScrolled(scroll > threshold);
    }, [scroll, threshold]);

    return isScrolled;
}
