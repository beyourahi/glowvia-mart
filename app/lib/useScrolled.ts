/**
 * @fileoverview Boolean scroll threshold hook — returns `true` once scroll exceeds `threshold`.
 *
 * Subscribes to both the Lenis `scroll` event and the LenisProvider context value so
 * it stays accurate during animated scrolls and on initial mount.
 *
 * @related
 * - app/lib/LenisProvider.tsx - Provides Lenis instance and scroll value
 * - app/lib/useScrollProgress.ts - Continuous 0-1 progress variant
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
