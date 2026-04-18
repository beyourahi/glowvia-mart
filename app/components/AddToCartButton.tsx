/**
 * @fileoverview Add to cart button with price display and offline detection
 *
 * @description
 * Primary CTA button for adding products to cart. Displays price with sale comparison,
 * handles cart line submission via Shopify CartForm, and disables when offline.
 *
 * @features
 * - Price display on the left (current + compare-at strikethrough if on sale)
 * - Button text on the right (custom children or default)
 * - Offline detection with disabled state and icon
 * - Loading state during cart submission
 * - Sale price highlighting (strikethrough compare-at)
 * - Optional analytics tracking
 * - Hover and active state transitions
 * - Responsive font sizing
 *
 * @props
 * - analytics: Optional analytics data to track with cart addition
 * - children: Button text (e.g., "Get it now", "Sold out", "Subscribe now")
 * - disabled: External disabled state (e.g., out of stock, no variant selected)
 * - lines: Cart lines to add (merchandise ID, quantity, selling plan)
 * - onClick: Optional callback when button is clicked
 * - price: Current price to display
 * - compareAtPrice: Original price for sale comparison
 *
 * @state
 * - Fetcher state from CartForm (idle/submitting/loading)
 * - Online status from useNetworkStatus
 *
 * @disabled-conditions
 * Button is disabled when:
 * 1. Explicitly disabled via prop (e.g., out of stock)
 * 2. Cart submission in progress (fetcher not idle)
 * 3. Device is offline (no network connection)
 *
 * @offline-behavior
 * - Shows "Offline" text with WifiOff icon
 * - Displays helper text below button
 * - Prevents cart submission attempts
 *
 * @sale-logic
 * - Compares compareAtPrice with price
 * - Shows strikethrough original price if on sale
 * - Uses smaller font size for compare-at
 *
 * @related
 * - ProductForm.tsx - Primary usage location
 * - CartForm (Hydrogen) - Cart submission handling
 * - Money.tsx - Price formatting
 * - useNetworkStatus - Offline detection
 */

import {useState, useEffect} from "react";
import {type FetcherWithComponents} from "react-router";
import {CartForm, type OptimisticCartLineInput} from "@shopify/hydrogen";
import type {MoneyV2} from "@shopify/hydrogen/storefront-api-types";
import {cn} from "~/lib/utils";
import {Money} from "~/components/Money";
import {useNetworkStatus} from "~/hooks/useNetworkStatus";
import {WifiOff} from "lucide-react";
import {Button} from "~/components/ui/button";

// =============================================================================
// ADD TO CART BUTTON
// =============================================================================

export function AddToCartButton({
    analytics,
    children,
    disabled,
    lines,
    onClick,
    price,
    compareAtPrice
}: {
    analytics?: unknown;
    children: React.ReactNode;
    disabled?: boolean;
    lines: Array<OptimisticCartLineInput>;
    onClick?: () => void;
    price?: MoneyV2;
    compareAtPrice?: MoneyV2 | null;
}) {
    const isOnSale = compareAtPrice && price && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);
    const {isOnline} = useNetworkStatus();

    // Reset fetcher loading state on bfcache restore (back navigation from checkout).
    const [forceIdle, setForceIdle] = useState(false);
    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) setForceIdle(true);
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    return (
        <div className="w-full space-y-1.5">
            <CartForm fetcherKey="cart-mutation" route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
                {(fetcher: FetcherWithComponents<any>) => {
                    // Disable if: explicitly disabled, fetching, OR offline.
                    // forceIdle overrides a bfcache-frozen fetcher state on back navigation.
                    const isDisabled = disabled ?? ((!forceIdle && fetcher.state !== "idle") || !isOnline);
                    return (
                        <>
                            <input name="analytics" type="hidden" value={JSON.stringify(analytics)} />
                            <Button
                                type="submit"
                                variant="outline"
                                onClick={() => { setForceIdle(false); onClick?.(); }}
                                disabled={isDisabled}
                                className={cn(
                                    "w-full min-h-10 justify-between gap-4 py-1.5 text-base sm:text-lg",
                                    "active:bg-primary active:text-primary-foreground"
                                )}
                            >
                                {/* Price on the left with clear hierarchy */}
                                <span className="flex items-center gap-2">
                                    {price && (
                                        <span>
                                            <Money data={price} />
                                        </span>
                                    )}
                                    {isOnSale && (
                                        <s className="text-sm sm:text-sm opacity-60">
                                            <Money data={compareAtPrice} />
                                        </s>
                                    )}
                                </span>
                                {/* Button text on the right - show offline message when offline */}
                                <span className="whitespace-nowrap flex items-center gap-1.5">
                                    {!isOnline && <WifiOff className="size-4" aria-hidden="true" />}
                                    {!isOnline ? "Offline" : children}
                                </span>
                            </Button>
                        </>
                    );
                }}
            </CartForm>
            {/* Offline helper text */}
            {!isOnline && (
                <p className="text-sm text-muted-foreground text-center">Cart requires an internet connection</p>
            )}
        </div>
    );
}
