/**
 * @fileoverview Add to cart button with price display and offline detection.
 *
 * Shows current price (+ strikethrough compare-at when on sale) on the left and
 * button text on the right. Disabled when offline (shows WifiOff icon + helper text),
 * when a cart mutation is in flight, or via the `disabled` prop. Handles bfcache
 * restore (back navigation from checkout) via a `pageshow` listener.
 *
 * @related
 * - ProductForm.tsx - Primary usage location
 * - CartForm (Hydrogen) - Cart submission handling
 * - Money.tsx - Price formatting
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
                                variant="default"
                                onClick={() => { setForceIdle(false); onClick?.(); }}
                                disabled={isDisabled}
                                className="w-full min-h-10 justify-between gap-4 py-1.5 text-base sm:text-lg"
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
