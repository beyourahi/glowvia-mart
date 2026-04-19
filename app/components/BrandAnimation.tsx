/**
 * @fileoverview BrandAnimation - Scroll-driven brand text transformation system
 *
 * @description
 * Provides context and components for animating the brand name from a large, full-width
 * text at the bottom of the hero to a smaller, centered text in the header on scroll.
 * Uses damped animation for smooth, decoupled movement independent of scroll speed.
 *
 * @features
 * - **Context Provider**: BrandAnimationProvider manages scroll progress and hero measurements
 * - **Damped Animation**: Frame-independent interpolation for smooth, natural movement
 * - **Binary Search Font Sizing**: Automatically calculates optimal font size to fill width
 * - **Responsive Positioning**: Adapts to viewport size and header layout
 * - **SSR-Safe**: Hydration guards prevent server/client mismatches
 *
 * @architecture
 * The animation works in two phases:
 * 1. **Measurement Phase**: Text renders naturally at bottom of hero, font size calculated
 * 2. **Animation Phase**: Text becomes fixed-position, transforms via CSS translate/scale
 *
 * The transformation maps scroll progress (0-1) to visual changes:
 * - Progress 0: Text at natural hero position (bottom, full-width, 20% opacity)
 * - Progress 1: Text at header center (top, header-sized, 100% opacity)
 *
 * @related
 * - VideoHero.tsx - Hosts the AnimatedBrandText component
 * - Header.tsx - Target destination for the animated text
 * - lib/useScrollProgress.ts - Provides raw scroll progress tracking
 * - types/index.ts - BrandAnimationContextValue, MeasuredPositions types
 */

import {createContext, useContext, useState, useEffect, useRef, type ReactNode} from "react";
import type {BrandAnimationContextValue, MeasuredPositions} from "types";
import {useScrollProgress} from "~/lib/useScrollProgress";
import {useSiteSettings} from "~/lib/site-content-context";
import {calculateBrandAnimationEndY} from "~/lib/brand-animation-layout";
import {BRAND_NAME_SIZES_PX, BRAND_NAME_SM_BREAKPOINT, BRAND_NAME_MD_BREAKPOINT} from "~/lib/brand-name-sizes";

// ============================================================================
// Constants
// ============================================================================

/**
 * Layout constants for AnimatedBrandText positioning
 *
 * These must stay in sync with the header styles for accurate animation.
 * Layout values that can change at runtime (for example, announcement visibility) are
 * read from CSS custom properties instead of being hardcoded in the component.
 *
 * Relevant CSS variables from tailwind.css / PageLayout:
 * - --announcement-height: 32px when visible, 0px when hidden
 * - --announcement-gap: 8px
 * - --header-height: 68px
 *
 * The endY calculation accounts for the full vertical stack:
 * live announcement height + gap + header padding (0px mobile / 8px sm+) + centering offset
 */
const DEFAULT_HEADER_HEIGHT = 68; // 4.25rem = 68px (matches --header-height in tailwind.css)
const DEFAULT_ANNOUNCEMENT_GAP = 8; // Matches --announcement-gap in tailwind.css (8px)
const HEADER_PADDING_TOP_SM = 8; // sm:pt-2 (0.5rem = 8px) - only applied at sm+ breakpoint
const HEADER_PADDING_TOP_MOBILE = 0; // No pt-* on mobile when scrolled (Header.tsx: "px-2 sm:px-3 sm:pt-2")
// Brand name end-state sizes — imported from shared token (brand-name-sizes.ts).
// These must stay in sync with the canonical values defined there.
const SM_BREAKPOINT = BRAND_NAME_SM_BREAKPOINT; // 640px
const MD_BREAKPOINT = BRAND_NAME_MD_BREAKPOINT; // 768px

// Animation damping - controls how quickly the visual progress catches up to scroll progress
// Lower values = slower, more decoupled animation (0.02-0.05 for very slow, 0.1-0.2 for moderate)
const ANIMATION_DAMPING_DOWN = 0.12; // Slow and elegant when scrolling down (to header)
const ANIMATION_DAMPING_UP = 0.12; // Faster when scrolling up (returning to hero)

// ============================================================================
// Context and Provider
// ============================================================================

const BrandAnimationContext = createContext<BrandAnimationContextValue | null>(null);

export function BrandAnimationProvider({children}: {children: ReactNode}) {
    const heroRef = useRef<HTMLElement>(null!);
    const [heroHeight, setHeroHeight] = useState(0);
    const [isHomePage, setIsHomePage] = useState(false);
    const [dampedProgress, setDampedProgress] = useState(0);
    const dampedProgressRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    // Measure hero height on mount and resize
    useEffect(() => {
        if (typeof window === "undefined") return;

        const measureHero = () => {
            if (heroRef.current) {
                setHeroHeight(heroRef.current.offsetHeight);
            }
        };

        // Defer to ensure layout is complete
        requestAnimationFrame(measureHero);

        window.addEventListener("resize", measureHero);
        return () => window.removeEventListener("resize", measureHero);
    }, []);

    // Animation spans the full hero height for a slower, more gradual feel
    const endOffset = Math.max(heroHeight, 100);

    const {progress: targetProgress, isComplete} = useScrollProgress({
        startOffset: 0,
        endOffset
    });

    // Damped progress animation - decouples visual animation from scroll speed
    useEffect(() => {
        if (typeof window === "undefined") return;

        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Smoothly interpolate toward target progress
            const diff = targetProgress - dampedProgressRef.current;

            // Use asymmetric damping: slower when scrolling down, faster when scrolling up
            const baseDamping = diff > 0 ? ANIMATION_DAMPING_DOWN : ANIMATION_DAMPING_UP;

            // Frame-rate independent damping (normalized to 60fps)
            const frameDamping = 1 - Math.pow(1 - baseDamping, deltaTime / 16.67);

            dampedProgressRef.current += diff * frameDamping;

            // Snap to target when very close to avoid endless tiny updates
            if (Math.abs(diff) < 0.0001) {
                dampedProgressRef.current = targetProgress;
            }

            setDampedProgress(dampedProgressRef.current);
            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [targetProgress]);

    const value = {progress: dampedProgress, isComplete, heroRef, isHomePage, setIsHomePage};

    return <BrandAnimationContext.Provider value={value}>{children}</BrandAnimationContext.Provider>;
}

/**
 * Custom hook to access brand animation context
 *
 * @returns BrandAnimationContextValue with progress, isComplete, heroRef, isHomePage
 * @throws Error if used outside BrandAnimationProvider
 */
export function useBrandAnimation() {
    const context = useContext(BrandAnimationContext);
    if (!context) {
        throw new Error("useBrandAnimation must be used within BrandAnimationProvider");
    }
    return context;
}

// ============================================================================
// Animation Utilities
// ============================================================================

/**
 * Easing function for smooth animation
 * @param t - Progress value from 0 to 1
 * @returns Eased progress (cubic easing out)
 */
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Linear interpolation between two values
 * @param start - Starting value
 * @param end - Ending value
 * @param progress - Interpolation progress (0-1)
 * @returns Interpolated value
 */
function lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}

/**
 * Binary search to find optimal font size that fills the container width
 *
 * Adjusts font size dynamically to maximize text width within container bounds.
 * More efficient than trial-and-error.
 *
 * @param element - Text element to measure
 * @param maxWidth - Maximum allowed width in pixels
 * @returns Optimal font size in pixels
 */
function calculateOptimalFontSize(element: HTMLElement, maxWidth: number): number {
    let min = 1;
    let max = 2500;

    while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        element.style.fontSize = mid + "px";

        if (element.offsetWidth <= maxWidth) {
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }

    return max;
}

// ============================================================================
// AnimatedBrandText Component
// ============================================================================

/**
 * AnimatedBrandText - Large brand text that transforms from hero to header on scroll
 *
 * Two-phase rendering:
 * 1. **Measurement Phase** (hasMeasured=false):
 *    - Renders text in natural position at bottom of hero
 *    - Binary search calculates optimal font size to fill container width
 *    - Measures position and dimensions for animation
 *
 * 2. **Animation Phase** (hasMeasured=true):
 *    - Renders as fixed-position element
 *    - Interpolates position, scale, and opacity based on scroll progress
 *    - Transforms from hero bottom to header center
 *
 * Performance optimizations:
 * - Uses CSS transform (GPU-accelerated)
 * - will-change and backface-visibility for compositing
 * - translate3d for hardware acceleration
 * - SSR guard prevents hydration mismatches
 */
export function AnimatedBrandText() {
    const {progress, heroRef} = useBrandAnimation();
    const {brandName, announcementBanner} = useSiteSettings();
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const [positions, setPositions] = useState<MeasuredPositions | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [hasMeasured, setHasMeasured] = useState(false);
    const [optimalFontSize, setOptimalFontSize] = useState<number | null>(null);

    // SSR hydration guard
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Calculate optimal font size using binary search
    useEffect(() => {
        if (!isClient || !containerRef.current || !textRef.current) return;

        const container = containerRef.current;
        const textElement = textRef.current;

        const updateFontSize = () => {
            // Use container width minus some padding for breathing room
            const containerWidth = container.offsetWidth;
            const newFontSize = calculateOptimalFontSize(textElement, containerWidth);
            setOptimalFontSize(newFontSize);
        };

        // Initial calculation after a brief delay for layout
        const timeoutId = setTimeout(updateFontSize, 50);

        // Use ResizeObserver for dynamic updates
        const resizeObserver = new ResizeObserver(updateFontSize);
        resizeObserver.observe(container);

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [isClient, brandName]);

    // Calculate start and end positions on mount and resize
    useEffect(() => {
        if (!isClient || optimalFontSize === null) return;

        const calculatePositions = () => {
            if (!textRef.current || !heroRef.current || optimalFontSize === null) return;

            const textRect = textRef.current.getBoundingClientRect();
            const fontSize = optimalFontSize;

            // Start position: where text currently is (bottom of hero)
            const startX = textRect.left;
            const startY = textRect.top + window.scrollY; // Document position
            const startWidth = textRect.width;
            const startHeight = textRect.height;

            // End position: centered in header
            const viewportWidth = window.innerWidth;

            // Scale end state matches canonical brand name sizes from brand-name-sizes.ts
            const targetTextSize =
                viewportWidth < SM_BREAKPOINT
                    ? BRAND_NAME_SIZES_PX.mobile // 14px — text-sm
                    : viewportWidth < MD_BREAKPOINT
                        ? BRAND_NAME_SIZES_PX.sm  // 18px — text-lg
                        : BRAND_NAME_SIZES_PX.md; // 20px — text-xl
            const endScale = targetTextSize / fontSize;

            const scaledWidth = startWidth * endScale;

            // Center horizontally in viewport, vertically centered in header
            const endX = (viewportWidth - scaledWidth) / 2;

            // Center vertically in the live header stack. The announcement banner is
            // conditional, so we read the resolved CSS variables instead of assuming
            // the banner is always visible.
            const scaledHeight = startHeight * endScale;
            const layoutStyles = getComputedStyle(textRef.current);
            const announcementHeight = announcementBanner.length > 0 ? 32 : 0;
            const announcementGap =
                Number.parseFloat(layoutStyles.getPropertyValue("--announcement-gap")) || DEFAULT_ANNOUNCEMENT_GAP;
            const headerHeight =
                Number.parseFloat(layoutStyles.getPropertyValue("--header-height")) || DEFAULT_HEADER_HEIGHT;
            const headerPaddingTop = viewportWidth < SM_BREAKPOINT ? HEADER_PADDING_TOP_MOBILE : HEADER_PADDING_TOP_SM;
            const endY = calculateBrandAnimationEndY({
                announcementHeight,
                announcementGap,
                headerHeight,
                headerPaddingTop,
                scaledHeight
            });

            setPositions({
                startX,
                startY,
                startWidth,
                startHeight,
                fontSize,
                endX,
                endY,
                endScale: Math.max(0.05, endScale)
            });
            setHasMeasured(true);
        };

        // Defer calculation to ensure layout is complete
        const timeoutId = setTimeout(() => {
            requestAnimationFrame(calculatePositions);
        }, 100);

        window.addEventListener("resize", calculatePositions);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", calculatePositions);
        };
    }, [announcementBanner.length, isClient, optimalFontSize, heroRef]);

    // Don't render on server
    if (!isClient) {
        return null;
    }

    // Phase 1: Render in natural position for measurement with dynamic font sizing
    // The container spans full width, and the binary search algorithm finds the
    // optimal font size that makes the text fill the available space
    if (!hasMeasured) {
        return (
            <div ref={containerRef} className="absolute inset-x-0 bottom-2 overflow-hidden">
                <p
                    ref={textRef}
                    className="font-serif text-light/20 uppercase tracking-wider whitespace-nowrap leading-none w-fit"
                    style={optimalFontSize ? {fontSize: `${optimalFontSize}px`} : {fontSize: "10vw"}}
                >
                    {brandName}
                </p>
            </div>
        );
    }

    // Phase 2: Animated fixed-position element
    if (!positions) {
        return null;
    }

    const easedProgress = easeOutCubic(progress);
    const scrollY = window.scrollY;

    // At progress 0: text is at its natural document position (bottom of hero)
    // At progress 1: text is fixed at header center

    // The start Y needs to account for scroll - when at progress 0, the text should
    // appear exactly where the original text was in the document
    const naturalViewportY = positions.startY - scrollY;

    const currentX = lerp(positions.startX, positions.endX, easedProgress);
    const currentY = lerp(naturalViewportY, positions.endY, easedProgress);
    const currentScale = lerp(1, positions.endScale, easedProgress);
    const currentOpacity = lerp(0.2, 1, easedProgress);

    return (
        <p
            className="fixed left-0 top-0 font-serif uppercase tracking-wider whitespace-nowrap leading-none pointer-events-none"
            style={{
                fontSize: `${positions.fontSize}px`,
                color: `rgba(255, 255, 255, ${currentOpacity})`,
                transform: `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`,
                transformOrigin: "left top",
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                zIndex: 100
            }}
        >
            {brandName}
        </p>
    );
}
