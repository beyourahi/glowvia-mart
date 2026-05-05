/**
 * @fileoverview Lenis smooth scrolling configuration and initialization
 *
 * Provides a single `initSmoothScroll()` factory used by LenisProvider.
 * Configuration: 1.2s duration, exponential ease-out, lerp 0.1, autoRaf enabled.
 *
 * @related
 * - app/lib/LenisProvider.tsx - React provider that wraps app with Lenis
 * - app/lib/useScrolled.ts - Detects scroll position using Lenis
 * - app/lib/useScrollProgress.ts - Tracks scroll progress using Lenis
 */

import Lenis from "lenis";

/** Smooth scroll configuration constants */
export const SMOOTH_SCROLL = {
    DURATION: 1.2,
    WHEEL_MULTIPLIER: 1,
    TOUCH_MULTIPLIER: 2,
    LERP: 0.1
} as const;

/**
 * Custom exponential ease-out function for natural deceleration
 */
const expoEaseOut = (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t));

/** Initialize Lenis smooth scrolling and return the instance */
export const initSmoothScroll = (): Lenis => {
    const lenis = new Lenis({
        duration: SMOOTH_SCROLL.DURATION,
        easing: expoEaseOut,
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: SMOOTH_SCROLL.WHEEL_MULTIPLIER,
        touchMultiplier: SMOOTH_SCROLL.TOUCH_MULTIPLIER,
        lerp: SMOOTH_SCROLL.LERP,
        autoResize: true,
        anchors: true,
        autoRaf: true
    });

    return lenis;
};
