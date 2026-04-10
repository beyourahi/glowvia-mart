/**
 * @fileoverview Reading Progress Hook
 *
 * @description
 * Tracks the user's reading progress through a content element by measuring
 * how much of the referenced element has been scrolled past. Returns a 0-100
 * value suitable for progress bars or reading indicators.
 *
 * @architecture
 * - Uses scroll event listener with requestAnimationFrame for smooth updates
 * - SSR-safe: defaults to 0, attaches listeners only in useEffect
 * - Measures a specific ref element, not the entire page
 * - Progress = how much of the content area has scrolled past the viewport
 *
 * @dependencies
 * - React hooks (useEffect, useRef, useState)
 * - Browser scroll/resize events
 *
 * @related
 * - hooks/useInView.ts - Similar ref-based observation pattern
 * - routes/blogs.$blogHandle.$articleHandle.tsx - Primary consumer
 *
 * @example
 * ```tsx
 * const { contentRef, progress } = useReadingProgress();
 * return (
 *   <>
 *     <div style={{ width: `${progress}%` }} />
 *     <article ref={contentRef}>...</article>
 *   </>
 * );
 * ```
 */

import {useEffect, useRef, useState} from "react";

/**
 * Hook for tracking reading progress through a content element.
 *
 * Calculates progress based on how much of the referenced element
 * has been scrolled through relative to the viewport. The progress
 * starts at 0 when the element top enters the viewport and reaches
 * 100 when the element bottom has been scrolled past.
 *
 * @returns Object with:
 * - contentRef: Attach to the content container element
 * - progress: 0-100 number representing reading completion
 */
export function useReadingProgress() {
    const contentRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        const calculateProgress = () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const rect = element.getBoundingClientRect();
                const elementTop = rect.top + window.scrollY;
                const elementHeight = rect.height;
                const scrollPosition = window.scrollY + window.innerHeight;
                const start = elementTop;
                const end = elementTop + elementHeight;

                if (scrollPosition <= start) {
                    setProgress(0);
                } else if (scrollPosition >= end) {
                    setProgress(100);
                } else {
                    const pct = ((scrollPosition - start) / (end - start)) * 100;
                    setProgress(Math.min(100, Math.max(0, pct)));
                }
            });
        };

        window.addEventListener("scroll", calculateProgress, {passive: true});
        window.addEventListener("resize", calculateProgress, {passive: true});
        calculateProgress();

        return () => {
            window.removeEventListener("scroll", calculateProgress);
            window.removeEventListener("resize", calculateProgress);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return {contentRef, progress};
}
