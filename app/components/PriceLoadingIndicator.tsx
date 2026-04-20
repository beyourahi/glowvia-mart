/**
 * @fileoverview Inline loading dots for price slots during cart mutations.
 *
 * @description
 * Replaces a price value with three staggered pulsing dots while a cart mutation
 * is in flight. Each dot scales from 0.65 → 1 with a rolling 180ms stagger,
 * creating a left-to-right wave that clearly signals "calculating."
 *
 * Uses bg-current so dots inherit the parent text color — works in both the
 * dark cart drawer (text-primary-foreground) and the light cart page (text-primary)
 * without any props.
 *
 * @usage
 * ```tsx
 * {isMutating ? <PriceLoadingIndicator /> : <Money data={price} />}
 * ```
 *
 * @accessibility
 * - aria-hidden: visual element, not meaningful to screen readers
 * - Pair with a sibling <span className="sr-only">calculating</span> for a11y
 *
 * @related
 * - CartSummary.tsx - Checkout button price slot
 * - CartLineItem.tsx - Line item price slots
 * - tailwind.css - @keyframes price-dot / .animate-price-dot
 */

import {cn} from "~/lib/utils";

interface PriceLoadingIndicatorProps {
    className?: string;
}

const DOT_DELAYS = [0, 180, 360] as const;

export function PriceLoadingIndicator({className}: PriceLoadingIndicatorProps) {
    return (
        <span
            className={cn("inline-flex items-center gap-[3px] align-middle h-[1em]", className)}
            aria-hidden="true"
            role="presentation"
        >
            {DOT_DELAYS.map(delay => (
                <span
                    key={delay}
                    className="block size-[0.3em] rounded-full bg-current animate-price-dot"
                    style={{animationDelay: `${delay}ms`}}
                />
            ))}
        </span>
    );
}
