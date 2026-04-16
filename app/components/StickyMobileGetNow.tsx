/**
 * @fileoverview Sticky Mobile "Get it Now" Button Component
 *
 * @description
 * Mobile-only sticky CTA button that appears at the bottom of the screen when the
 * main product purchase section scrolls out of view. Uses Intersection Observer to
 * detect visibility and smoothly scrolls back to the purchase section when tapped.
 *
 * @component
 * StickyMobileGetNow - Fixed bottom button with visibility detection
 *
 * @features
 * - Intersection Observer-based visibility detection
 * - Shows only when target section (ProductHeroMobile) is NOT in viewport
 * - Smooth scroll to target section on click
 * - Accounts for fixed header height in scroll calculation
 * - Safe area inset support for notched phones
 * - Smooth show/hide transitions with translate + opacity
 * - Mobile-only (hidden on md breakpoint and above)
 * - Customizable target ID and button text
 *
 * @props
 * - targetId?: string - ID of element to observe (default: "product-hero-mobile")
 * - buttonText?: string - Button label text (default: "Get it Now")
 *
 * @behavior
 * Visibility Logic:
 * 1. Intersection Observer watches targetId element
 * 2. When element NOT intersecting viewport: button slides up (visible)
 * 3. When element intersecting viewport: button slides down (hidden)
 * 4. threshold: 0 means any pixel triggers state change
 * 5. rootMargin: "0px" for exact viewport boundaries
 *
 * Scroll Behavior:
 * 1. Click triggers smooth scroll to targetId
 * 2. Calculates scroll target: elementTop - HEADER_HEIGHT (80px)
 * 3. Accounts for fixed header so target isn't hidden
 * 4. Uses smooth behavior for animated scroll
 *
 * @constants
 * - HEADER_HEIGHT: 80px (matches --header-height CSS variable)
 *
 * @styling
 * Position:
 * - fixed bottom-0 left-0 right-0 z-[103]
 * - Full width with bottom safe area padding
 * - Above all content: z-[103] > OpenInAppButton mobile (z-[102]) so purchase CTA takes priority
 *
 * Button:
 * - Full width with min-h-14 (56px touch target)
 * - bg-primary text-primary-foreground
 * - Horizontal flex with space-between (text left, icon right)
 * - ChevronUp icon (size-6) on right
 * - Focus: outline suppressed, white ring-offset on keyboard focus (:focus-visible)
 *
 * Transitions:
 * - translate-y-full when hidden (below screen)
 * - translate-y-0 when visible (at bottom)
 * - opacity-0 to opacity-100
 * - pointer-events-none when hidden
 * - duration-300 ease-out
 *
 * @accessibility
 * - aria-label: "Scroll to product purchase section"
 * - Semantic button element with proper type
 * - Clear visual indicator (ChevronUp icon)
 * - Touch target exceeds WCAG minimum (56px > 44px)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * WCAG 2.1 Level AA Color Contrast Compliance
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * BUTTON STYLING (bg-primary text-primary-foreground):
 *   Text: button label - #fff on #1f1f1f = 14.68:1 (WCAG AAA) ✓
 *   ChevronUp icon: Inherits text color = 14.68:1 (WCAG AAA) ✓
 *
 * BUTTON VISIBILITY:
 *   bg-primary (#1f1f1f) against page content = high contrast edge ✓
 *   Button is rendered full-width with solid background, no transparency issues.
 *
 * Touch target:
 *   min-h-14 (56px) - exceeds WCAG 2.5.5 minimum of 44px ✓
 *   Full-width ensures easy tap target on mobile ✓
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * @responsive
 * - Mobile only: visible on screens < md (768px)
 * - Hidden on tablet/desktop (md:hidden)
 * - Safe area insets for modern phones with notches
 *
 * @dependencies
 * - react: useEffect, useState for intersection observer
 * - lucide-react: ChevronUp icon
 * - ~/lib/utils: cn utility for className merging
 * - Intersection Observer API (browser native)
 *
 * @related
 * - ProductHeroMobile.tsx - Default target section for button
 * - routes/products.$handle.tsx - Uses component on product pages
 * - Header.tsx - Fixed header height constant (80px)
 *
 * @usage_example
 * ```tsx
 * // On product page (mobile only)
 * <StickyMobileGetNow
 *   targetId="product-hero-mobile"
 *   buttonText="Get it Now"
 * />
 *
 * // In target section
 * <section id="product-hero-mobile">
 *   <ProductForm />
 * </section>
 * ```
 *
 * @architecture
 * This component enhances mobile UX by providing quick access to the purchase section
 * after the user scrolls past it. It's a mobile-specific enhancement that doesn't
 * interfere with desktop layouts. The Intersection Observer pattern ensures efficient
 * visibility detection without scroll event listeners.
 */
import {useEffect, useState} from "react";
import {ChevronUp} from "lucide-react";
import {cn} from "~/lib/utils";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {calculateVariantDiscountPercentage} from "~/lib/discounts";

interface StickyVariantPricing {
    price: {amount: string; currencyCode: string};
    compareAtPrice?: {amount: string; currencyCode: string} | null;
}

// Header height in pixels (4rem = 64px, from --header-height CSS variable)
const HEADER_HEIGHT = 80;
export function StickyMobileGetNow({
    targetId = "product-hero-mobile",
    buttonText = "Get it Now",
    selectedVariant
}: {
    targetId?: string;
    buttonText?: string;
    selectedVariant?: StickyVariantPricing | null;
}) {
    const [isVisible, setIsVisible] = useState(false);

    // Set up Intersection Observer to track ProductHeroMobile visibility
    useEffect(() => {
        const targetElement = document.getElementById(targetId);

        if (!targetElement) {
            return;
        }

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    // Show sticky button when target is NOT intersecting (not visible)
                    setIsVisible(!entry.isIntersecting);
                });
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0
            }
        );

        observer.observe(targetElement);

        return () => {
            observer.disconnect();
        };
    }, [targetId]);

    // Smooth scroll to the target section
    const handleClick = () => {
        const targetElement = document.getElementById(targetId);

        if (!targetElement) return;

        // Get element position and calculate scroll target
        const elementTop = targetElement.getBoundingClientRect().top + window.scrollY;
        const scrollTarget = elementTop - HEADER_HEIGHT;

        window.scrollTo({
            top: scrollTarget,
            behavior: "smooth"
        });
    };

    const price = selectedVariant?.price;
    const compareAtPrice = selectedVariant?.compareAtPrice;
    const discountPct = calculateVariantDiscountPercentage(selectedVariant);
    const hasDiscount = discountPct > 0 && !!compareAtPrice;

    return (
        <div
            className={cn(
                // Mobile only
                "md:hidden",
                // Fixed at bottom
                "fixed bottom-0 left-0 right-0 z-[103]",
                // Safe area for notch phones
                "pb-[env(safe-area-inset-bottom)]",
                // Transition for show/hide
                "transition-all duration-300 ease-out",
                // Visibility state
                isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
            )}
        >
            <button
                type="button"
                onClick={handleClick}
                className={cn(
                    "w-full inline-flex select-none items-center px-6 gap-5",
                    "bg-primary text-primary-foreground",
                    "border-t border-primary-foreground/[0.07]",
                    "outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                    price ? "min-h-16" : "min-h-14 justify-between"
                )}
                aria-label="Scroll to product purchase section"
            >
                {price ? (
                    <>
                        {/* Price block — dominant left anchor */}
                        <div className="flex flex-col items-start min-w-0 shrink-0">
                            <span className="text-xl font-bold leading-none tabular-nums">
                                {formatShopifyMoney(price)}
                            </span>
                            {hasDiscount && compareAtPrice && (
                                <span className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] text-primary-foreground/40 line-through tabular-nums leading-none">
                                        {formatShopifyMoney(compareAtPrice)}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-discount-bg px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-discount-text leading-none">
                                        -{discountPct}%
                                    </span>
                                </span>
                            )}
                        </div>

                        {/* Vertical separator — inset for breathing room */}
                        <div className="w-px my-3 self-stretch bg-primary-foreground/10 shrink-0" aria-hidden="true" />

                        {/* CTA label + icon — subordinate action side */}
                        <div className="flex flex-1 items-center justify-between">
                            <span className="text-base font-medium">{buttonText}</span>
                            <ChevronUp className="size-5 opacity-70" />
                        </div>
                    </>
                ) : (
                    <>
                        <span className="text-lg font-medium">{buttonText}</span>
                        <ChevronUp className="ml-auto size-6" />
                    </>
                )}
            </button>
        </div>
    );
}
