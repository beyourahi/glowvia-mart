/**
 * @fileoverview Buy Now button — adds product to cart and redirects directly to checkout
 *
 * @description
 * Secondary CTA for immediate purchase, bypassing the cart review step.
 * Submits to /cart with `redirectTo=__checkout_url__`, which causes the cart
 * action to return a 303 redirect to the Shopify checkout URL — the browser
 * follows it as a full navigation, taking the user straight to checkout.
 *
 * @features
 * - Price display matching AddToCartButton layout (price left, label + icon right)
 * - Zap icon for visual "instant checkout" signal
 * - bfcache pageshow handler — resets frozen fetcher state on back-navigation from checkout
 * - Disabled when variant unavailable, fetching in flight, or lines are empty
 * - Outline styling (visually subordinate to the primary Add to Bag button)
 *
 * @architecture
 * Uses a dedicated fetcherKey ("buy-now") separate from "cart-mutation" so both
 * the Add to Bag and Get it now buttons can be in-flight independently without
 * triggering "cart conflicted with another request" errors.
 *
 * The `redirectTo` hidden input is validated server-side in cart.tsx — only the
 * special token "__checkout_url__" and relative paths are accepted; external URLs
 * and protocol-relative paths are rejected to prevent open-redirect attacks.
 *
 * @props
 * - lines: Cart lines to add (merchandiseId, quantity, optional sellingPlanId)
 * - disabled: External disabled state (e.g., no variant selected, sold out)
 * - price: Current variant price shown on the left of the button
 * - compareAtPrice: Original price — shows strikethrough when on sale
 * - label: Button label text (default: "Get it now")
 * - className: Additional class overrides
 *
 * @related
 * - ProductForm.tsx — Primary usage on the PDP
 * - QuickAddDialog.tsx — Used in the desktop quick-add dialog
 * - QuickAddSheet.tsx — Used in the mobile quick-add sheet
 * - ~/routes/cart.tsx — Validates redirectTo and issues the 303
 */

import {useState, useEffect} from "react";
import {type FetcherWithComponents} from "react-router";
import {CartForm, type OptimisticCartLineInput} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {Money} from "~/components/Money";
import {Button} from "~/components/ui/button";

// MoneyV2 (CurrencyCode enum) is assignable to this shape, so ProductForm still works.
// QuickAdd components type prices as plain `{amount: string; currencyCode: string}` — this accepts both.
type MoneyLike = {amount: string; currencyCode: string};

export function BuyNowButton({
    lines,
    disabled = false,
    price,
    compareAtPrice,
    label = "Get it now",
    className
}: {
    lines: Array<OptimisticCartLineInput>;
    disabled?: boolean;
    price?: MoneyLike;
    compareAtPrice?: MoneyLike | null;
    label?: string;
    className?: string;
}) {
    const isOnSale = compareAtPrice && price && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);

    // Reset fetcher loading state on bfcache restore (back navigation from checkout).
    // Without this the button stays stuck in "loading" when the user presses Back.
    const [forceIdle, setForceIdle] = useState(false);
    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) setForceIdle(true);
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    return (
        <CartForm
            fetcherKey="buy-now"
            route="/cart"
            inputs={{lines}}
            action={CartForm.ACTIONS.LinesAdd}
        >
            {(fetcher: FetcherWithComponents<any>) => {
                const isLoading = !forceIdle && fetcher.state !== "idle";
                const isDisabled = disabled || isLoading;
                return (
                    <>
                        {/* Validated server-side — only "__checkout_url__" and relative paths allowed */}
                        <input type="hidden" name="redirectTo" value="__checkout_url__" />
                        <Button
                            type="submit"
                            variant="outline"
                            onClick={() => setForceIdle(false)}
                            disabled={isDisabled}
                            className={cn(
                                "w-full min-h-10 justify-between gap-4 py-1.5 text-base sm:text-lg",
                                className
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {price && <Money data={price} />}
                                {isOnSale && (
                                    <s className="text-sm sm:text-sm opacity-60">
                                        <Money data={compareAtPrice} />
                                    </s>
                                )}
                            </span>
                            <span className="whitespace-nowrap">
                                {label}
                            </span>
                        </Button>
                    </>
                );
            }}
        </CartForm>
    );
}
