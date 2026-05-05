/**
 * @fileoverview PDP order summary panel — unit price × quantity with savings row and cart context.
 *
 * Reads the deferred `cart` promise from the root loader via `useRouteLoaderData` to show
 * the existing cart total alongside the new item. The "Total" label becomes "New Total"
 * when an existing cart is present, so the buyer sees their full updated cost before adding.
 */

import {Suspense} from "react";
import {Await, useRouteLoaderData} from "react-router";
import {ShoppingCart} from "lucide-react";
import {Skeleton} from "~/components/ui/skeleton";
import {Spinner} from "~/components/ui/spinner";
import type {RootLoader} from "~/root";
import {parseProductTitle} from "~/lib/product";
import {formatPrice} from "~/lib/currency-formatter";

type ShoppingSummaryProps = {
    product: any;
    selectedVariant: any;
    quantity: number;
    isLoading?: boolean;
    isVariantTransitioning?: boolean;
};

const SummaryContent = ({
    product,
    selectedVariant,
    quantity,
    isVariantTransitioning,
    cart
}: {
    product: any;
    selectedVariant: any;
    quantity: number;
    isVariantTransitioning?: boolean;
    cart: any;
}) => {
    if (!selectedVariant?.price) {
        if (isVariantTransitioning) {
            return (
                <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <Spinner />
                    <span className="text-muted-foreground text-sm">Updating price...</span>
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center py-4">
                <span className="text-muted-foreground text-sm">Select options to see total</span>
            </div>
        );
    }

    const unitPrice = parseFloat(selectedVariant.price.amount);
    if (isNaN(unitPrice) || unitPrice < 0) {
        return (
            <div className="flex items-center justify-center py-4">
                <span className="text-muted-foreground text-sm">Price unavailable for this selection</span>
            </div>
        );
    }

    const currencyCode = selectedVariant.price.currencyCode || "USD";
    const totalPrice = unitPrice * quantity;

    const unitComparePrice = selectedVariant.compareAtPrice?.amount
        ? parseFloat(selectedVariant.compareAtPrice.amount)
        : null;
    const totalComparePrice = unitComparePrice ? unitComparePrice * quantity : null;

    const isOnSale = totalComparePrice !== null && totalComparePrice > totalPrice;
    const totalSavings = isOnSale ? totalComparePrice - totalPrice : 0;
    const savingsPercentage = isOnSale ? Math.round((totalSavings / totalComparePrice) * 100) : 0;

    const cartItemCount = cart?.totalQuantity ?? 0;
    const cartTotalAmount = cart?.cost?.totalAmount ? parseFloat(cart.cost.totalAmount.amount) : 0;
    const cartCurrencyCode = cart?.cost?.totalAmount?.currencyCode || currencyCode;
    const hasExistingCart = cartItemCount > 0;
    const newCartTotal = cartTotalAmount + totalPrice;

    const {primary} = parseProductTitle(product.title);

    return (
        <div className="space-y-1.5 sm:space-y-2">
            {hasExistingCart && (
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                    <span className="text-muted-foreground text-xs">
                        In cart &middot; {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
                    </span>
                    <span className="font-mono tabular-nums text-xs font-medium text-foreground">
                        {formatPrice(cartTotalAmount, cartCurrencyCode)}
                    </span>
                </div>
            )}

            <div className="flex items-start justify-between gap-3 py-0.5">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground leading-snug">{primary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Qty {quantity}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                    {isOnSale && totalComparePrice && (
                        <span className="font-mono tabular-nums text-xs text-muted-foreground line-through">
                            {formatPrice(totalComparePrice, currencyCode)}
                        </span>
                    )}
                    <span className="font-mono tabular-nums text-sm font-semibold text-foreground">
                        {formatPrice(totalPrice, currencyCode)}
                    </span>
                </div>
            </div>

            {isOnSale && totalSavings > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-success/10 px-2.5 py-1.5">
                    <span className="text-sale-text text-xs font-medium">You save</span>
                    <span className="text-sale-text font-mono tabular-nums text-xs font-semibold">
                        -{formatPrice(totalSavings, currencyCode)} ({savingsPercentage}%)
                    </span>
                </div>
            )}

            <div className="border-t border-border" />

            <div className="flex items-center justify-between pt-0.5">
                <span className="text-sm font-medium text-foreground">
                    {hasExistingCart ? "New Total" : "Total"}
                </span>
                <span className="font-mono tabular-nums text-base font-bold text-foreground">
                    {formatPrice(hasExistingCart ? newCartTotal : totalPrice, currencyCode)}
                </span>
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="space-y-2.5 sm:space-y-3 rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-1.5">
            <Skeleton className="size-3 rounded" />
            <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-start justify-between gap-3 py-0.5">
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
        <div className="border-t border-border" />
        <div className="flex items-center justify-between pt-0.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-20" />
        </div>
    </div>
);

export const ShoppingSummary = ({
    product,
    selectedVariant,
    quantity,
    isLoading = false,
    isVariantTransitioning = false
}: ShoppingSummaryProps) => {
    const rootData = useRouteLoaderData<RootLoader>("root");

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-2.5 sm:space-y-3 rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
                <ShoppingCart className="size-3 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Order Summary
                </span>
            </div>

            <Suspense
                fallback={
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <Spinner />
                        <span className="text-muted-foreground text-sm">Loading cart...</span>
                    </div>
                }
            >
                <Await resolve={rootData?.cart}>
                    {cart => (
                        <SummaryContent
                            product={product}
                            selectedVariant={selectedVariant}
                            quantity={quantity}
                            isVariantTransitioning={isVariantTransitioning}
                            cart={cart}
                        />
                    )}
                </Await>
            </Suspense>
        </div>
    );
};
