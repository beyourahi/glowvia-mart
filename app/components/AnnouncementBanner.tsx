/**
 * @fileoverview Fixed-position scrolling announcement banner with seamless infinite loop
 *
 * @description
 * AnnouncementBanner displays a horizontally scrolling marquee of announcement texts.
 * Fixed at the very top of the viewport (top: 0) on ALL pages, with the header positioned
 * below it. Uses the translateX(-50%) technique with dynamic content duplication for a
 * mathematically perfect infinite loop — zero visible seams at any viewport width.
 *
 * @features
 * - Fixed positioning at top: 0 (above floating navbar)
 * - Seamless infinite scroll via translateX(-50%) on 2 identical halves
 * - Dynamic content duplication: measures rendered width, repeats until >= viewport
 * - Duration scales proportionally to content width (consistent scroll speed)
 * - Dot separators between multiple announcements
 * - Respects prefers-reduced-motion for accessibility
 * - Prevents horizontal scroll leak on page level
 * - Auto-hides if no texts provided
 * - z-index 101 (above header z-100, below overlays z-110+)
 *
 * @animations
 * The animation uses a CSS @keyframes that translates from 0 to -50%. Because the
 * scrolling container holds two identical halves (Set A + Set B), when Set A scrolls
 * fully off-screen to the left, Set B is in the exact starting position — the browser
 * loops back to 0% with zero visual discontinuity.
 *
 * Duration is calculated dynamically based on content width:
 *   duration = contentWidth / scrollSpeed(px/s)
 * Scroll speed adapts responsively (slower on mobile for readability).
 *
 * @props
 * - texts: Array of announcement strings to display
 *
 * @architecture
 * - Fixed container: Positioned at top: 0 with z-101
 * - Outer wrapper: Prevents horizontal scroll leak (overflow-x-clip)
 * - Banner container: Provides styling and clips content (overflow-hidden)
 * - Measurement ref: Hidden div to measure one set of content
 * - Scrolling track: Two identical halves, animated with translateX(-50%)
 * - Content repeats calculated: Math.ceil(viewportWidth / singleSetWidth) ensures coverage
 *
 * @layout-integration
 * - PageLayout manages --announcement-height CSS variable (32px when visible, 0px when not)
 * - Header uses top-(--announcement-height) to position below banner
 * - Main content uses pt-[var(--total-header-height)] for proper spacing
 * - Compact design: ~32px total height (py-1.5 + text-sm leading-tight)
 *
 * @accessibility
 * - Respects prefers-reduced-motion (pauses animation)
 * - Uses semantic markup
 * - Text remains readable even without animation
 *
 * @related
 * - PageLayout.tsx - Renders announcement banner and manages height variables
 * - Header.tsx - Uses --announcement-height for dynamic top offset
 * - root.tsx - Fetches announcement texts from site_settings metaobject
 * - tailwind.css - Defines announcement-scroll animation keyframes
 *
 * @example
 * ```tsx
 * <AnnouncementBanner texts={[
 *   "Free shipping on orders over $50",
 *   "New collection launching soon",
 *   "Sign up for 10% off your first order"
 * ]} />
 * ```
 */

import {useEffect, useRef, useState} from "react";
import {Dot} from "lucide-react";

// ================================================================================
// Type Definitions
// ================================================================================

interface AnnouncementBannerProps {
    texts: string[];
}

/**
 * Scroll speed in pixels per second, by breakpoint.
 * Slower on mobile for readability, faster on desktop.
 */
const SCROLL_SPEED = {
    mobile: 50,
    tablet: 70,
    desktop: 90
} as const;

// ================================================================================
// Banner Component
// ================================================================================

/**
 * AnnouncementBanner - Seamless infinite scrolling announcement marquee
 *
 * Uses the translateX(-50%) technique for a perfect loop:
 * 1. Measures one "set" of announcements (all texts joined with dot separators)
 * 2. Repeats that set enough times so it fills at least the viewport width
 * 3. Duplicates the entire block once (creating two identical halves)
 * 4. Animates translateX(0) → translateX(-50%), which scrolls the first half
 *    off-screen while the second half takes its place — visually identical to start
 *
 * @param texts - Array of announcement messages to display
 * @returns null if no texts provided, otherwise banner element
 */
export function AnnouncementBanner({texts}: AnnouncementBannerProps) {
    const measureRef = useRef<HTMLDivElement>(null);
    const [repeatCount, setRepeatCount] = useState(3);
    const [duration, setDuration] = useState(20);

    /**
     * Measure content width and calculate optimal repeat count + duration.
     *
     * We measure the rendered width of a single announcement set, then figure out
     * how many times to repeat it so that one "half" of the track (which holds all
     * repeats) is at least as wide as the viewport. This guarantees that during the
     * animation from 0 → -50%, there's always content visible — no gaps.
     *
     * Duration scales with total content width so scroll speed stays perceptually
     * consistent regardless of how much text there is.
     */
    useEffect(() => {
        function calculate() {
            const el = measureRef.current;
            if (!el) return;

            const singleSetWidth = el.scrollWidth;
            const viewportWidth = window.innerWidth;

            // Need enough repeats so one half fills the viewport
            // Minimum 2 repeats to guarantee coverage even with very short text
            const needed = Math.max(2, Math.ceil(viewportWidth / Math.max(singleSetWidth, 1)));
            setRepeatCount(needed);

            // Total width of one half = singleSetWidth * needed
            // Animation scrolls this entire half, so duration = totalHalfWidth / speed
            const totalHalfWidth = singleSetWidth * needed;
            const speed =
                viewportWidth >= 1024
                    ? SCROLL_SPEED.desktop
                    : viewportWidth >= 768
                      ? SCROLL_SPEED.tablet
                      : SCROLL_SPEED.mobile;
            const calculatedDuration = totalHalfWidth / speed;

            // Clamp duration to reasonable bounds (3s min, 120s max)
            setDuration(Math.max(3, Math.min(120, calculatedDuration)));
        }

        calculate();
        window.addEventListener("resize", calculate);
        return () => window.removeEventListener("resize", calculate);
    }, [texts]);

    // Early return after all hooks (React rules-of-hooks requires stable hook order)
    if (!texts || texts.length === 0) {
        return null;
    }

    /**
     * Renders one "set" of announcements with dot separators.
     * Multiple announcements: "Text 1 · Text 2 · Text 3"
     * Single announcement: just the text (dots come from adjacent repeats)
     */
    const renderOneSet = (keyPrefix: string) => (
        <span className="inline-flex shrink-0 items-center">
            {texts.map((text, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <span key={`${keyPrefix}-${i}`} className="inline-flex shrink-0 items-center">
                    <span className="shrink-0 text-sm md:text-base font-medium leading-tight whitespace-nowrap">
                        {text}
                    </span>
                    {/* Dot separator — always shown (including after last item, since
                        the next repeat's first item follows immediately) */}
                    <Dot className="shrink-0 size-6 md:size-7 opacity-70" aria-hidden="true" />
                </span>
            ))}
        </span>
    );

    /**
     * Build the repeats for one "half" of the marquee track.
     * Each half contains `repeatCount` copies of the announcement set.
     */
    const renderHalf = (halfPrefix: string) =>
        Array.from({length: repeatCount}, (_, i) => (
            <span key={`${halfPrefix}-${i}`} className="inline-flex shrink-0 items-center">
                {renderOneSet(`${halfPrefix}-${i}`)}
            </span>
        ));

    return (
        // Fixed positioning at top of viewport — always visible on all pages
        // z-101 ensures it's above header (z-100) but below overlays (z-110+)
        <div className="fixed top-0 left-0 right-0 w-full z-101 overflow-x-clip">
            {/* Banner container — clips content and provides styling */}
            <div className="relative bg-primary text-primary-foreground py-1.5 md:py-2 lg:py-1 overflow-hidden">
                {/* Hidden measurement div — renders one set off-screen to get its width.
                    visibility:hidden keeps it in layout flow for accurate measurement but invisible */}
                <div
                    ref={measureRef}
                    className="absolute left-0 top-0 invisible inline-flex items-center whitespace-nowrap"
                    aria-hidden="true"
                >
                    {renderOneSet("measure")}
                </div>

                {/* Scrolling track — two identical halves animated with translateX(-50%)
                    The inline style sets the duration dynamically based on content width */}
                <div
                    className="inline-flex items-center animate-announcement-scroll will-change-transform motion-reduce:paused"
                    style={{"--announcement-scroll-duration": `${duration}s`} as React.CSSProperties}
                >
                    {/* First half (Set A) */}
                    {renderHalf("a")}
                    {/* Second half (Set B) — identical to first, creates the seamless loop */}
                    {renderHalf("b")}
                </div>
            </div>
        </div>
    );
}
