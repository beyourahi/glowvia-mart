/**
 * @fileoverview AnimatedSection - Scroll-triggered animation wrapper components
 *
 * @description
 * Provides reusable components for adding entrance animations to sections and elements.
 * Uses Intersection Observer via useInView hook to trigger animations when elements
 * enter the viewport. Supports multiple animation types and stagger effects.
 *
 * @features
 * - **Multiple Animation Types**: slide-up, slide-down, slide-left, slide-right, fade, scale, blur, hero, section
 * - **Stagger Support**: Built-in delay increments for sequential reveals
 * - **Threshold Control**: Configurable viewport intersection threshold
 * - **Accessibility**: Respects prefers-reduced-motion via CSS
 * - **One-time Trigger**: Animations fire once when entering viewport (triggerOnce: true)
 *
 * @components
 * - AnimatedSection: Main wrapper for animated content
 * - StaggeredList: Container for staggered child animations
 *
 * @props
 * AnimatedSection:
 * - animation: Animation type (default: 'slide-up')
 * - threshold: Intersection threshold 0-1 (default: 0.1)
 * - delay: Base delay in ms before animation starts
 * - staggerIndex: Index for stagger calculation (0-based)
 * - staggerIncrement: Delay increment per stagger index (default: 40ms)
 * - disabled: Skip animation entirely
 *
 * @related
 * - hooks/useInView.ts - Intersection Observer hook for viewport detection
 * - app/styles/tailwind.css - Animation keyframes and classes
 */

import type {ReactNode, HTMLAttributes} from "react";
import {useInView} from "~/hooks/useInView";
import {cn} from "~/lib/utils";

// ============================================================================
// Types
// ============================================================================

type AnimationType =
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "fade"
    | "scale"
    | "blur"
    | "hero"
    | "section";

interface AnimatedSectionProps extends HTMLAttributes<HTMLDivElement> {
    /** Animation type (default: 'slide-up') */
    animation?: AnimationType;
    /** Trigger threshold 0-1 (default: 0.1) */
    threshold?: number;
    /** Delay before animation starts in ms */
    delay?: number;
    /** Index for stagger animation (optional) */
    staggerIndex?: number;
    /** Custom stagger delay increment in ms (default: 40) */
    staggerIncrement?: number;
    /** Children to render */
    children: ReactNode;
    /** Disable animation */
    disabled?: boolean;
}

const animationClasses: Record<AnimationType, string> = {
    "slide-up": "animate-slide-up-fade",
    "slide-down": "animate-slide-down-fade",
    "slide-left": "animate-slide-left-fade",
    "slide-right": "animate-slide-right-fade",
    fade: "animate-fade-in-simple",
    scale: "animate-scale-fade",
    blur: "animate-blur-fade",
    hero: "animate-hero-text",
    section: "animate-section-reveal"
};

/**
 * Animated section wrapper for scroll-triggered animations.
 * Automatically triggers animation when element enters viewport.
 *
 * @example
 * <AnimatedSection animation="slide-up" threshold={0.2}>
 *   <h2>Section Title</h2>
 *   <p>Content that animates in</p>
 * </AnimatedSection>
 *
 * @example With stagger for list items
 * {items.map((item, index) => (
 *   <AnimatedSection key={item.id} staggerIndex={index} animation="slide-up">
 *     <ProductCard product={item} />
 *   </AnimatedSection>
 * ))}
 */
export const AnimatedSection = ({
    animation = "slide-up",
    threshold = 0.1,
    delay = 0,
    staggerIndex,
    staggerIncrement = 40,
    children,
    className,
    disabled = false,
    style,
    ...props
}: AnimatedSectionProps) => {
    const totalDelay = staggerIndex !== undefined ? delay + Math.min(staggerIndex, 11) * staggerIncrement : delay;

    const {ref, inView, mounted} = useInView({
        threshold,
        delay: totalDelay,
        triggerOnce: true,
        disabled,
        rootMargin: "200px 0px"
    });

    const staggerStyle =
        staggerIndex !== undefined ? {animationDelay: `${Math.min(staggerIndex, 11) * staggerIncrement}ms`} : undefined;

    // Only apply hidden/animation classes after client mount — SSR output is fully visible
    return (
        <div
            ref={ref as React.RefObject<HTMLDivElement>}
            className={cn(
                "will-change-[transform,opacity]",
                mounted && !inView && "opacity-0",
                mounted && inView && animationClasses[animation],
                "motion-reduce:!opacity-100",
                className
            )}
            style={{...style, ...staggerStyle}}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * Staggered list wrapper - automatically applies stagger delays to children.
 * Use with AnimatedSection children for coordinated reveals.
 */
export const StaggeredList = ({
    children,
    className,
    delayIncrement = 40,
    maxItems = 12
}: {
    children: ReactNode;
    className?: string;
    delayIncrement?: number;
    maxItems?: number;
}) => {
    return (
        <div
            className={className}
            style={
                {
                    "--stagger-increment": `${delayIncrement}ms`,
                    "--stagger-max": maxItems
                } as React.CSSProperties
            }
        >
            {children}
        </div>
    );
};

export default AnimatedSection;
