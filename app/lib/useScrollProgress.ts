/**
 * @fileoverview Scroll Progress Tracking Hook
 *
 * @description
 * React hook for tracking scroll progress as a 0-1 ratio between start and end offsets using
 * Lenis smooth scroll values. Provides buttery-smooth scroll progress for animations, progress
 * bars, and scroll-based transitions.
 *
 * @architecture
 * Progress Calculation:
 * - Subscribes to Lenis scroll events
 * - Calculates progress as (scrollY - startOffset) / (endOffset - startOffset)
 * - Clamps result to 0-1 range
 * - Updates on every scroll frame for smooth animations
 *
 * Return Value:
 * - progress: 0-1 ratio of scroll progress
 * - scrollY: Current scroll position
 * - isComplete: True when progress reaches 1
 *
 * Use Cases:
 * - Scroll progress bars
 * - Parallax animations
 * - Scroll-triggered transitions
 * - Reading progress indicators
 *
 * Performance:
 * - Efficient: Uses Lenis RAF loop
 * - Smooth: Updates on every animation frame
 *
 * @dependencies
 * - React (useState, useEffect)
 * - types (ScrollProgressOptions, ScrollProgressResult)
 * - ./LenisProvider (useLenis hook)
 *
 * @related
 * - app/lib/LenisProvider.tsx - Provides Lenis instance
 * - app/lib/useScrolled.ts - Related hook for threshold detection
 * - app/components/* - Components using scroll progress for animations
 */

import {useState, useEffect} from "react";
import type {ScrollProgressOptions, ScrollProgressResult} from "types";
import {useLenis} from "./LenisProvider";

/**
 * Hook to track scroll progress as a 0-1 ratio
 * Uses Lenis smooth scroll values for buttery-smooth animation
 */
export function useScrollProgress({startOffset = 0, endOffset}: ScrollProgressOptions): ScrollProgressResult {
    const {lenis} = useLenis();
    const [state, setState] = useState<ScrollProgressResult>({
        progress: 0,
        scrollY: 0,
        isComplete: false
    });

    useEffect(() => {
        if (!lenis) return;

        // updateProgress defined inside useEffect to avoid dependency warning
        const updateProgress = (scrollY: number) => {
            const range = endOffset - startOffset;
            const rawProgress = range > 0 ? (scrollY - startOffset) / range : 0;
            const progress = Math.max(0, Math.min(1, rawProgress));

            setState({
                progress,
                scrollY,
                isComplete: progress >= 1
            });
        };

        const handleScroll = () => {
            updateProgress(lenis.scroll);
        };

        // Initial calculation
        handleScroll();

        lenis.on("scroll", handleScroll);
        return () => {
            lenis.off("scroll", handleScroll);
        };
    }, [lenis, startOffset, endOffset]);

    return state;
}
