/**
 * @fileoverview Lenis Smooth Scrolling Configuration
 *
 * @description
 * Initializes and configures Lenis smooth scrolling library with custom easing function
 * and optimized parameters for buttery-smooth scroll experience. Provides consistent
 * smooth scrolling across the entire storefront.
 *
 * @architecture
 * Smooth Scroll Setup:
 * - Library: Lenis (modern smooth scroll with physics-based animations)
 * - Easing: Custom exponential ease-out for natural deceleration
 * - Duration: 1.2s scroll animations
 * - LERP: 0.1 (linear interpolation factor for smoothness)
 * - Auto RAF: Automatic requestAnimationFrame integration
 *
 * Configuration Parameters:
 * - duration: 1.2s (scroll animation duration)
 * - wheelMultiplier: 1 (mouse wheel sensitivity)
 * - touchMultiplier: 2 (touch scroll sensitivity)
 * - lerp: 0.1 (smoothness factor, lower = smoother)
 * - autoResize: true (handles window resize)
 * - anchors: true (supports #hash navigation)
 * - autoRaf: true (automatic animation frame loop)
 *
 * @dependencies
 * - lenis package (smooth scroll library)
 *
 * @related
 * - app/lib/LenisProvider.tsx - React provider that wraps app with Lenis
 * - app/lib/useScrolled.ts - Detects scroll position using Lenis
 * - app/lib/useScrollProgress.ts - Tracks scroll progress using Lenis
 * - app/root.tsx - LenisProvider wraps entire app
 */

import Lenis from "lenis";

/**
 * Smooth scroll configuration constants
 * Matching the exact values from mindframe-media
 */
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

/**
 * Initialize Lenis smooth scrolling
 * Configuration matches mindframe-media project exactly
 */
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
