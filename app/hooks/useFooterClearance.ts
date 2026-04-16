/**
 * @fileoverview useFooterClearance hook
 *
 * @description
 * Observes the footer's bottom bar element (`#footer-bottom-bar`) via
 * IntersectionObserver and returns the number of CSS pixels by which
 * floating action buttons should be lifted so they never overlap the
 * visible portion of that element.
 *
 * The returned offset equals the visible height (`intersectionRect.height`)
 * of the target element at any given scroll position — computed dynamically,
 * never hardcoded.
 *
 * @behaviour
 * - Returns 0 when the footer bar is fully below the viewport (default state).
 * - Returns the visible height (> 0, ≤ element height) as the footer bar
 *   scrolls into view; consumers apply this as `translateY(-Xpx)`.
 * - Handles deferred footer rendering via a MutationObserver that watches for
 *   the element to appear in the DOM before attaching the IntersectionObserver.
 * - Updates on element resize (e.g. responsive reflow) via ResizeObserver,
 *   recalculating intersection from getBoundingClientRect without reconnecting IO.
 * - Disconnects all observers on unmount — no leaks.
 *
 * @performance
 * - IntersectionObserver fires off the main thread — zero scroll-handler cost.
 * - Fine-grained thresholds (5% steps) fire ~20 callbacks per full traversal;
 *   CSS transition on the consumer bridges the visual gaps for smoothness.
 * - ResizeObserver replaces the need for a window resize listener.
 *
 * @related
 * - app/components/Footer.tsx — target element: `div#footer-bottom-bar`
 * - app/root.tsx — FloatingButtonStack consumer
 */

import {useEffect, useState} from "react";

// 21 thresholds from 0→1 in 5% increments.
// Fires each time the intersection crosses a 5% boundary, giving enough
// resolution for a CSS transition to animate smoothly between steps.
const THRESHOLDS = Array.from({length: 21}, (_, i) => i / 20);

/**
 * Returns the pixel height of `#footer-bottom-bar` currently visible in the
 * viewport (0 when fully off-screen). Consumers should apply this as an upward
 * `translateY` offset so floating buttons clear the element.
 */
export function useFooterClearance(): number {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        let io: IntersectionObserver | null = null;
        let ro: ResizeObserver | null = null;
        let mo: MutationObserver | null = null;

        /**
         * Attach IO + ResizeObserver to the target element.
         * Called once the element is available in the DOM.
         */
        function observe(el: Element): void {
            // IntersectionObserver: tracks visible portion as user scrolls
            io = new IntersectionObserver(
                entries => {
                    const entry = entries[0];
                    if (!entry) return;
                    // intersectionRect.height = rendered pixels of el visible in viewport
                    const visibleHeight = entry.isIntersecting ? entry.intersectionRect.height : 0;
                    setOffset(Math.round(visibleHeight));
                },
                {threshold: THRESHOLDS}
            );
            io.observe(el);

            // ResizeObserver: if the element's own size changes (responsive reflow,
            // font load, etc.) recalculate visible height directly from the DOM
            // rather than reconnecting IO (which would cause a momentary offset reset).
            ro = new ResizeObserver(() => {
                const rect = el.getBoundingClientRect();
                const vh = window.innerHeight;
                const visibleHeight = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
                setOffset(Math.round(visibleHeight));
            });
            ro.observe(el);
        }

        const el = document.getElementById("footer-bottom-bar");
        if (el) {
            observe(el);
        } else {
            // Footer data is deferred (<Await>) — the element may not be in the DOM
            // at mount time. MutationObserver watches for it to appear, then hands
            // off to the IO/ResizeObserver pair and disconnects itself.
            mo = new MutationObserver(() => {
                const target = document.getElementById("footer-bottom-bar");
                if (target) {
                    mo?.disconnect();
                    mo = null;
                    observe(target);
                }
            });
            mo.observe(document.body, {childList: true, subtree: true});
        }

        return () => {
            io?.disconnect();
            ro?.disconnect();
            mo?.disconnect();
        };
    }, []);

    return offset;
}
