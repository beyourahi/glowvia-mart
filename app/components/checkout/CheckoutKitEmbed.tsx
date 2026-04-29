/**
 * @fileoverview CheckoutKitEmbed — Shopify checkout button (inline/anchor mode).
 *
 * Current implementation: styled anchor that navigates to `checkoutUrl`.
 * This is the production-correct fallback per Phase 4 Open Risk #1:
 * `@shopify/checkout-kit` is NOT publicly available on npm (404 as of 2026-04,
 * limited-partner preview only). When the package ships publicly, upgrade path is:
 *   1. `npm install @shopify/checkout-kit`
 *   2. Replace the anchor body with the web-component pattern (see storefront_001)
 *
 * @usage
 * ```tsx
 * <CheckoutKitEmbed
 *     checkoutUrl={taggedCheckoutUrl}
 *     mode="inline"
 *     className={baseStyles}
 * >
 *     <span>{price}</span>
 *     <span>Checkout <ArrowRight /></span>
 * </CheckoutKitEmbed>
 * ```
 *
 * @related
 * - ~/components/CartSummary.tsx — renders this inside CartCheckoutActions
 */

import {cn} from "~/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CheckoutKitEmbedProps {
    /** Shopify checkout URL — may already carry UTM / AI attribution params */
    checkoutUrl: string;
    /** Additional class names to apply to the anchor element */
    className?: string;
    /** Button content: price slot + label + icon */
    children: React.ReactNode;
    /** Disables interaction when true (e.g. cart mutation in flight) */
    disabled?: boolean;
    /**
     * Checkout presentation mode.
     * - `"inline"` (default) — navigates in the same tab.
     * - `"popup"` — same as inline until popup upgrade ships.
     * - `"new-tab"` — opens a new browser tab.
     */
    mode?: "popup" | "inline" | "new-tab";
    /** Reserved for future use when checkout:complete event integration ships. */
    onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CheckoutKitEmbed({
    checkoutUrl,
    className,
    children,
    disabled = false,
    mode = "inline"
}: CheckoutKitEmbedProps) {
    return (
        <a
            href={checkoutUrl}
            target={mode === "new-tab" ? "_blank" : "_self"}
            rel={mode === "new-tab" ? "noopener noreferrer" : undefined}
            aria-disabled={disabled || undefined}
            onClick={disabled ? e => e.preventDefault() : undefined}
            className={cn(
                className,
                disabled && "pointer-events-none opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </a>
    );
}
