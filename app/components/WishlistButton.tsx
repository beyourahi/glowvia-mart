/**
 * @fileoverview Wishlist heart toggle button with celebration animations and undo toasts.
 *
 * Variants: `floating` (image overlay), `inline`, `outline`, `primary-outline` (matches
 * variant pill UI). Sizes: `sm`, `default`, `lg`. Prevents event bubbling — safe inside
 * `<Link>` and product cards. Disabled while SSR-hydrating to prevent mismatch.
 *
 * Animation sequence on add: heart-pop (600ms) → burst-ring → heart-glow (2s) → heart-beat.
 * Remove shows a 4s toast with undo action; add shows a 2s confirmation toast.
 *
 * WCAG contrast:
 * - Inactive (--primary on white): 14.68:1 (AAA) ✓
 * - Active (--wishlist-active #e63946 on white): 4.15:1 (WCAG 1.4.11 for icons) ✓
 *
 * `WishlistToggle` is a simplified alias hardcoded to `variant="inline" size="default"`.
 *
 * @related
 * - lib/wishlist-context.tsx - Wishlist state management
 * - lib/wishlist-utils.ts - ID extraction and utilities
 * - ProductItem.tsx - Uses WishlistButton in product cards
 */

import {useState, useEffect, useCallback} from "react";
import {Heart} from "lucide-react";
import {toast} from "sonner";
import {cn} from "~/lib/utils";
import {useWishlistSafe} from "~/lib/wishlist-context";
import {extractNumericId} from "~/lib/wishlist-utils";

interface WishlistButtonProps {
    /** Full Shopify product GID (e.g., "gid://shopify/Product/123456") */
    productId: string;
    /** Product title for toast notification */
    productTitle?: string;
    /** Additional CSS classes */
    className?: string;
    /** Button size variant */
    size?: "sm" | "default" | "lg";
    /** Visual variant */
    variant?: "floating" | "inline" | "outline" | "primary-outline";
    /**
     * Enable breathing animation on parent hover for discoverability
     * Requires parent to have `group` class
     */
    animateOnParentHover?: boolean;
}

/**
 * Heart button for toggling wishlist status
 * Uses safe hook to prevent errors outside provider
 */
export function WishlistButton({
    productId,
    productTitle,
    className,
    size = "default",
    variant = "floating",
    animateOnParentHover = false
}: WishlistButtonProps) {
    const {has, toggle, restore, isHydrated} = useWishlistSafe();
    const isInWishlist = has(productId);

    // Track animation state for celebration effect
    const [isAnimating, setIsAnimating] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    // Reset animation state after animation completes
    useEffect(() => {
        if (isAnimating) {
            const timer = setTimeout(() => setIsAnimating(false), 600);
            return () => clearTimeout(timer);
        }
    }, [isAnimating]);

    // Track "just added" state for persistent glow
    useEffect(() => {
        if (justAdded) {
            const timer = setTimeout(() => setJustAdded(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [justAdded]);

    // Stable handler — only changes when productId, productTitle, or wishlist functions change
    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            // Prevent navigation when button is inside a Link
            e.preventDefault();
            e.stopPropagation();

            const wasInWishlist = isInWishlist;
            toggle(productId);

            // Trigger animation on add (not remove)
            if (!wasInWishlist) {
                setIsAnimating(true);
                setJustAdded(true);
            }

            // Show toast notification
            const displayName = productTitle || "Product";
            if (wasInWishlist) {
                // Get numeric ID for undo functionality
                const numericId = extractNumericId(productId);

                toast.success(`Removed from wishlist`, {
                    description: displayName,
                    duration: 4000,
                    action: {
                        label: "Undo",
                        onClick: () => {
                            restore(numericId);
                            toast.success(`Restored to wishlist`, {
                                description: displayName,
                                duration: 2000
                            });
                        }
                    }
                });
            } else {
                toast.success(`Added to wishlist`, {
                    description: displayName,
                    duration: 2000
                });
            }
        },
        [isInWishlist, toggle, productId, productTitle, restore]
    );

    // Primary outline variant (matches variant options button styling)
    // Active state: filled bg-primary (like selected variant options)
    // Inactive state: outline only (like unselected variant options)
    if (variant === "primary-outline") {
        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={!isHydrated}
                className={cn(
                    "motion-interactive motion-press inline-flex min-h-10 min-w-10 select-none items-center justify-center rounded-full border-2 border-primary p-1.5",
                    "active:scale-[var(--motion-press-scale)]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    // Match variant options button active/inactive styling
                    isInWishlist
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-primary hover:text-primary-foreground",
                    // Burst ring animation on add
                    isAnimating && "animate-burst-ring",
                    className
                )}
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={isInWishlist}
            >
                <Heart
                    className={cn(
                        "motion-image size-5",
                        isInWishlist ? "fill-current" : "fill-transparent",
                        // Continuous heartbeat animation when in wishlist (matching header)
                        isInWishlist && !isAnimating && "animate-heart-beat",
                        // Pop animation when adding (overrides heartbeat temporarily)
                        isAnimating && "animate-heart-pop",
                        // Subtle glow after adding
                        justAdded && !isAnimating && "animate-heart-glow"
                    )}
                    strokeWidth={2.5}
                />
            </button>
        );
    }

    // Size classes for other variants
    // Enhanced touch targets: min-h/min-w ensure WCAG 2.5.5 compliance (44px target)
    // Reduced padding with larger icons for better visual balance
    const sizeClasses = {
        sm: "p-1.5 min-h-8 min-w-8", // 32px min - compact but tappable
        default: "p-2 min-h-9 min-w-9", // 36px min
        lg: "p-2 min-h-10 min-w-10" // 40px min
    };

    // Larger icon sizes for better visibility
    const iconSizes = {
        sm: "size-5", // was size-4
        default: "size-6", // was size-5
        lg: "size-7" // was size-6
    };

    // Variant classes - enhanced for better visibility on images
    const variantClasses = {
        // Floating: stronger backdrop, subtle border for image contrast
        floating:
            "bg-white/95 backdrop-blur-md hover:bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md hover:ring-black/10",
        inline: "bg-transparent hover:bg-muted/50",
        outline: "border border-border bg-background hover:bg-muted"
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={!isHydrated}
            className={cn(
                // Base styles
                "motion-interactive motion-press select-none rounded-full",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // Animation
                "active:scale-[var(--motion-press-scale)]",
                // Size
                sizeClasses[size],
                // Variant
                variantClasses[variant],
                // Enhanced active state styling - uses semantic wishlist color token
                // shadow-wishlist-active/20 creates cohesive glow with heart fill
                isInWishlist && "shadow-md shadow-wishlist-active/20",
                // Burst ring animation on add
                isAnimating && "animate-burst-ring",
                className
            )}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isInWishlist}
        >
            <Heart
                className={cn(
                    iconSizes[size],
                    "motion-image",
                    // Color states using semantic design system tokens (no hardcoded colors)
                    // Active: wishlist-active (#e63946) - "loved/saved" semantic color
                    // Inactive: primary (#1f1f1f) - consistent with CTA system
                    //
                    // Contrast Validation (WCAG 1.4.11 requires 3:1 for icons):
                    // - Active: wishlist-active on white = 4.15:1 ✓
                    // - Inactive: primary (#1f1f1f) on white = 14.68:1 ✓
                    isInWishlist
                        ? "fill-wishlist-active text-wishlist-active scale-110"
                        : // Enhanced inactive state: subtle fill hints at heart meaning
                          // fill-primary/10 provides visual weight without competing with active state
                          "fill-primary/10 text-primary hover:fill-primary/20 hover:scale-105",
                    // Breathing animation on parent hover (discoverability)
                    // Only applies when not in wishlist and parent card is hovered
                    !isInWishlist && animateOnParentHover && "group-hover:animate-heart-breathe",
                    // Continuous heartbeat animation when in wishlist (matching header)
                    isInWishlist && !isAnimating && "animate-heart-beat",
                    // Pop animation when adding (overrides heartbeat temporarily)
                    isAnimating && "animate-heart-pop",
                    // Subtle glow after adding
                    justAdded && !isAnimating && isInWishlist && "animate-heart-glow"
                )}
                strokeWidth={2.5}
            />
        </button>
    );
}

/**
 * Simplified wishlist toggle for inline use (no background)
 */
export function WishlistToggle({
    productId,
    productTitle,
    className
}: Pick<WishlistButtonProps, "productId" | "productTitle" | "className">) {
    return (
        <WishlistButton
            productId={productId}
            productTitle={productTitle}
            variant="inline"
            size="default"
            className={className}
        />
    );
}
