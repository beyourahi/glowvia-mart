/**
 * @fileoverview Scroll progress hook — returns 0-1 ratio between `startOffset` and `endOffset`.
 *
 * Subscribes to Lenis scroll events and clamps progress to [0, 1]. Returns
 * `{ progress, scrollY, isComplete }`. Suitable for parallax, progress bars, and
 * scroll-triggered transitions.
 *
 * @related
 * - app/lib/LenisProvider.tsx - Provides the Lenis instance
 * - app/lib/useScrolled.ts - Simpler boolean threshold detection
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
