/**
 * @fileoverview Intersection Observer Hook for Scroll-Triggered Animations
 *
 * @description
 * Provides a React hook for detecting when elements enter the viewport,
 * enabling scroll-triggered animations and lazy loading patterns.
 * Respects user accessibility preferences (reduced motion) and provides
 * utilities for staggered animation timing in grids and lists.
 *
 * @architecture
 * - Uses IntersectionObserver API for efficient viewport detection
 * - SSR-safe: handles server-side rendering gracefully
 * - Accessibility-first: automatically disables animations for reduced motion
 * - Performance-optimized: disconnects observer after trigger (triggerOnce mode)
 *
 * @dependencies
 * - React hooks (useEffect, useRef, useState)
 * - Browser IntersectionObserver API
 * - prefers-reduced-motion media query
 *
 * @related
 * - AnimatedSection.tsx - Main consumer for section animations
 * - ProductItem.tsx - Uses stagger utilities for grid animations
 * - InfiniteScrollGrid.tsx - Uses for lazy loading detection
 *
 * @example
 * ```tsx
 * // Basic usage for scroll animation
 * const { ref, inView } = useInView({ threshold: 0.2 });
 * return <div ref={ref} className={inView ? 'animate-slide-up' : 'opacity-0'} />;
 *
 * // Staggered grid animation
 * {items.map((item, i) => (
 *   <div style={getStaggerStyle(i)} className="animate-fade-in" />
 * ))}
 * ```
 */

import {useEffect, useRef, useState} from "react";

type UseInViewOptions = {
    /** Trigger threshold - 0 to 1 (default: 0.1 = 10% visible) */
    threshold?: number;
    /** Root margin for triggering earlier/later (default: '0px') */
    rootMargin?: string;
    /** Only trigger once (default: true) */
    triggerOnce?: boolean;
    /** Initial delay before animation starts in ms (default: 0) */
    delay?: number;
    /** Disable animation entirely (useful for reduced motion) */
    disabled?: boolean;
};

type UseInViewReturn = {
    /** Ref to attach to the target element */
    ref: React.RefObject<HTMLElement | null>;
    /** Whether the element is in view */
    inView: boolean;
    /** Manually trigger the in-view state */
    triggerInView: () => void;
    /** Whether the component has mounted on the client */
    mounted: boolean;
};

/**
 * Hook for detecting when an element enters the viewport.
 * Perfect for scroll-triggered animations.
 *
 * @example
 * const { ref, inView } = useInView({ threshold: 0.2 });
 * return <div ref={ref} className={inView ? 'animate-slide-up-fade' : 'opacity-0'} />;
 */
export const useInView = (options: UseInViewOptions = {}): UseInViewReturn => {
    const {threshold = 0.1, rootMargin = "0px", triggerOnce = true, delay = 0, disabled = false} = options;

    const ref = useRef<HTMLElement | null>(null);
    // Start visible (SSR-safe) — content is visible by default,
    // animations are a progressive enhancement applied after mount
    const [inView, setInView] = useState(true);
    const [mounted, setMounted] = useState(false);

    const triggerInView = () => {
        setInView(true);
    };

    useEffect(() => {
        if (disabled) {
            setInView(true);
            return;
        }

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) {
            setInView(true);
            setMounted(true);
            return;
        }

        const element = ref.current;
        if (!element) return;

        // After mount, hide element so IntersectionObserver can animate it in
        setInView(false);
        setMounted(true);

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (delay > 0) {
                            setTimeout(() => setInView(true), delay);
                        } else {
                            setInView(true);
                        }

                        if (triggerOnce) {
                            observer.disconnect();
                        }
                    } else if (!triggerOnce) {
                        setInView(false);
                    }
                });
            },
            {
                threshold,
                rootMargin
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin, triggerOnce, delay, disabled]);

    return {ref, inView, triggerInView, mounted};
};

/**
 * Helper to calculate stagger delay for grid/list items
 * Caps at maxItems to prevent excessive delays
 *
 * @param index - Item index in the list
 * @param delayIncrement - Delay between items in ms (default: 40)
 * @param maxItems - Maximum items to stagger (default: 12)
 * @returns Delay in milliseconds
 */
export const getStaggerDelay = (index: number, delayIncrement = 40, maxItems = 12): number => {
    return Math.min(index, maxItems - 1) * delayIncrement;
};

/**
 * CSS style object for stagger animation delay
 *
 * @param index - Item index
 * @param delayIncrement - Delay increment in ms
 * @param maxItems - Max items to stagger
 * @returns Style object with animationDelay
 */
export const getStaggerStyle = (index: number, delayIncrement = 40, maxItems = 12): React.CSSProperties => ({
    animationDelay: `${getStaggerDelay(index, delayIncrement, maxItems)}ms`
});

export default useInView;
