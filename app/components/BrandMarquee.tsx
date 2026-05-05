/**
 * @fileoverview BrandMarquee - Infinite scrolling brand values display
 *
 * @description
 * Horizontal auto-scrolling marquee displaying brand values/keywords from CMS.
 * Uses CSS animation with duplicate tracks for seamless infinite loop.
 *
 * @features
 * - **Infinite Scroll**: Duplicate tracks create seamless loop effect
 * - **Auto-scroll**: CSS animation, continuous (no pause on hover)
 * - **Responsive Typography**: 48px → 72px → 96px across breakpoints
 * - **Accessibility**: Respects prefers-reduced-motion
 * - **CMS Integration**: Brand words from site_settings metaobject
 *
 * @props
 * None - BrandMarquee is self-contained and pulls data from site settings context
 *
 * @related
 * - lib/site-content-context.ts - Provides brandMarquee.words array
 * - app/styles/tailwind.css - Marquee animation keyframes
 */

import {useBrandMarquee} from "~/lib/site-content-context";

export function BrandMarquee() {
    const {words} = useBrandMarquee();
    if (!words || words.length === 0) return null;
    return (
        <section className="-mx-2 md:-mx-4 py-8 md:py-12 overflow-hidden" aria-label="Brand values">
            <div className="relative flex cursor-default select-none">
                {/* First marquee track */}
                <div
                    className="flex shrink-0 animate-marquee will-change-transform
                        motion-reduce:paused"
                >
                    {words.map(word => (
                        <span
                            key={`first-${word}`}
                            className="mx-8 md:mx-14 text-4xl sm:text-5xl md:text-6xl font-sans font-medium text-primary uppercase whitespace-nowrap"
                        >
                            {word}
                        </span>
                    ))}
                </div>

                {/* Duplicate track for seamless loop */}
                <div
                    className="flex shrink-0 animate-marquee will-change-transform
                        motion-reduce:paused"
                    aria-hidden="true"
                >
                    {words.map(word => (
                        <span
                            key={`second-${word}`}
                            className="mx-8 md:mx-14 text-4xl sm:text-5xl md:text-6xl font-sans font-medium text-primary uppercase whitespace-nowrap"
                        >
                            {word}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
