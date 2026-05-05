/**
 * @fileoverview Agent-native cart view — monospace layout with JSON-LD structured data.
 *
 * Shown in `cart.tsx` and `cart.$lines.tsx` instead of the normal cart UI when
 * `useAgentSurface().isAgent` is true. Injects a Schema.org `ItemList` JSON-LD
 * block via `useCartJsonLd` for agents that parse structured data from the DOM.
 * The plaintext checkout URL rendered below the button is intentional — it allows
 * agents that parse body text to extract the URL without JavaScript.
 *
 * @related
 * - ~/routes/cart.tsx — conditionally renders this component
 * - ~/routes/cart.$lines.tsx — also renders this for agent cart-lines view
 * - ~/lib/agent-surface-context.tsx — `useAgentSurface()` detection
 * - ~/components/checkout/CheckoutKitEmbed.tsx — checkout CTA
 */

import {useEffect, useRef} from "react";
import {useCartMutationPending} from "~/lib/cart-utils";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {CheckoutKitEmbed} from "~/components/checkout/CheckoutKitEmbed";
import {Bot, ArrowRight} from "lucide-react";

type MoneyV2 = {amount: string; currencyCode: string};

/**
 * Structural duck type for the cart passed to AgentCartView.
 * Avoids strict `OptimisticCart<CartApiQueryFragment>` because `useOptimisticCart()`
 * marks `updatedAt` as `string | undefined`, which conflicts with strict typing.
 */
export type AgentCart = {
    checkoutUrl?: string | null;
    cost?: {subtotalAmount?: MoneyV2 | null} | null;
    lines?: {
        nodes: Array<{
            id: string;
            quantity: number;
            merchandise: {
                title: string;
                availableForSale?: boolean | null;
                image?: {url: string} | null;
                selectedOptions: Array<{name: string; value: string}>;
                product: {title: string; handle: string};
            };
            cost: {
                totalAmount: MoneyV2;
                amountPerQuantity: MoneyV2;
            };
        }>;
    } | null;
};

type CartLine = NonNullable<NonNullable<AgentCart["lines"]>["nodes"]>[number];

/**
 * Injects a Schema.org `ItemList` JSON-LD block into `<head>` for the current cart.
 * Uses `ref.textContent` (not `innerHTML`) — safe from XSS. Re-runs when cart size
 * or checkout URL changes; cleans up the script tag on unmount.
 */
function useCartJsonLd(lines: CartLine[], checkoutUrl?: string) {
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Cart",
            ...(checkoutUrl ? {url: checkoutUrl} : {}),
            "numberOfItems": lines.length,
            "itemListElement": lines.map((line, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": "Product",
                    "name": line.merchandise.product.title,
                    "url": `/products/${line.merchandise.product.handle}`,
                    ...(line.merchandise.image?.url ? {image: line.merchandise.image.url} : {}),
                    "offers": {
                        "@type": "Offer",
                        "price": line.cost.amountPerQuantity.amount,
                        "priceCurrency": line.cost.amountPerQuantity.currencyCode,
                        "availability": line.merchandise.availableForSale
                            ? "https://schema.org/InStock"
                            : "https://schema.org/OutOfStock"
                    },
                    "additionalProperty": line.merchandise.selectedOptions.map(o => ({
                        "@type": "PropertyValue",
                        "name": o.name,
                        "value": o.value
                    }))
                },
                "quantity": line.quantity
            }))
        };

        const existing = document.getElementById("agent-cart-ld");
        if (existing) existing.remove();

        const el = document.createElement("script");
        el.id = "agent-cart-ld";
        el.type = "application/ld+json";
        el.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(el);
        scriptRef.current = el;

        return () => {
            scriptRef.current?.remove();
        };
    // Stable dep — re-inject when cart size or checkout URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines.length, checkoutUrl]);
}

/** Agent-native cart view: line items, summary, and checkout CTA in monospace layout. */
export function AgentCartView({cart}: {cart: AgentCart}) {
    const lines = cart.lines?.nodes ?? [];
    const subtotal = cart.cost?.subtotalAmount;
    const checkoutUrl = cart.checkoutUrl;
    const isMutating = useCartMutationPending();

    useCartJsonLd(lines, checkoutUrl ?? undefined);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-2xl px-6 py-12 font-mono">
                {/* Header */}
                <div className="mb-10">
                    <div className="mb-1 flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                            Agent Cart View
                        </span>
                    </div>
                    <div className="mt-3 border-t border-border pt-3 flex items-baseline justify-between">
                        <h2 className="text-base font-semibold">Shopping Cart</h2>
                        <span className="text-xs text-muted-foreground">
                            {lines.length} {lines.length === 1 ? "item" : "items"}
                        </span>
                    </div>
                </div>

                {/* Line items */}
                <section className="mb-8">
                    <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Items
                    </h3>
                    <div className="divide-y divide-border border-y border-border">
                        {lines.map(line => {
                            const variantLabel =
                                line.merchandise.title !== "Default Title"
                                    ? line.merchandise.title
                                    : line.merchandise.selectedOptions
                                          .map(o => o.value)
                                          .join(" / ");
                            return (
                                <div key={line.id} className="py-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium leading-snug">
                                                {line.merchandise.product.title}
                                            </div>
                                            {variantLabel && (
                                                <div className="mt-0.5 text-[10px] text-muted-foreground">
                                                    {variantLabel}
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-xs font-semibold tabular-nums">
                                                {formatShopifyMoney(line.cost.totalAmount)}
                                            </div>
                                            <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                                                {line.quantity} × {formatShopifyMoney(line.cost.amountPerQuantity)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Summary */}
                <section className="mb-8">
                    <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Summary
                    </h3>
                    <div className="space-y-1.5 border border-border p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Subtotal</span>
                            <span className="text-sm font-semibold tabular-nums">
                                {subtotal ? formatShopifyMoney(subtotal) : "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Shipping</span>
                            <span className="text-[10px] text-muted-foreground">Calculated at checkout</span>
                        </div>
                    </div>
                </section>

                {/* Checkout */}
                {checkoutUrl && (
                    <section>
                        <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Checkout
                        </h3>
                        <CheckoutKitEmbed
                            checkoutUrl={checkoutUrl}
                            disabled={isMutating}
                            mode="popup"
                            className="flex w-full items-center justify-center gap-2 border border-foreground bg-foreground px-4 py-3.5 text-xs font-semibold tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                            Proceed to Checkout
                            <ArrowRight className="h-3.5 w-3.5" />
                        </CheckoutKitEmbed>

                        {/* Plaintext URL for agents that parse body text */}
                        <div className="mt-2">
                            <span className="text-[10px] text-muted-foreground">url: </span>
                            <a
                                href={checkoutUrl}
                                className="text-[10px] text-muted-foreground underline underline-offset-2"
                            >
                                {checkoutUrl}
                            </a>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
