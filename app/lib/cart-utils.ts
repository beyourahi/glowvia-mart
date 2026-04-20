/**
 * @fileoverview Shared cart mutation utilities
 *
 * @description
 * Single source of truth for the cart fetcher key and mutation-pending hook.
 * All cart components (CartSummary, CartLineItem, Header, QuickAddButton, etc.)
 * import from here to stay coordinated on a single key.
 *
 * @architecture
 * Using a single fetcher key for ALL cart mutations ensures only one cart
 * operation runs at a time — new submissions cancel in-flight requests,
 * preventing Shopify's "cart conflicted with another request" error.
 */

import {useFetchers} from "react-router";

/**
 * Global fetcher key used by all cart mutations.
 * Must be passed to every CartForm's fetcherKey prop.
 */
export const CART_FETCHER_KEY = "cart-mutation";

/**
 * Detects if any cart mutation is currently in flight.
 * Scans all active fetchers for one matching the cart key.
 *
 * @returns true if a cart mutation (add/update/remove) is pending
 */
export function useCartMutationPending(): boolean {
    const fetchers = useFetchers();
    return fetchers.some(fetcher => fetcher.key === CART_FETCHER_KEY && fetcher.state !== "idle");
}

/**
 * Detects if a quantity-update mutation is in flight for a specific line item.
 * Parses the in-flight fetcher's cartFormInput to extract the target line ID —
 * so only the affected line's price slot enters loading state, not all siblings.
 *
 * Returns false for LinesRemove (the removed item is hidden optimistically;
 * remaining items should stay fully visible).
 *
 * @param lineId - Stable Shopify cart line GID to check
 * @returns true only when a LinesUpdate for this exact line ID is in flight
 */
export function useLineItemMutating(lineId: string): boolean {
    const fetchers = useFetchers();
    const cartFetcher = fetchers.find(f => f.key === CART_FETCHER_KEY && f.state !== "idle");
    if (!cartFetcher?.formData) return false;
    const raw = cartFetcher.formData.get("cartFormInput");
    if (typeof raw !== "string") return false;
    try {
        const {action, inputs} = JSON.parse(raw) as {
            action: string;
            inputs?: {lines?: Array<{id: string}>};
        };
        return action === "LinesUpdate" && (inputs?.lines?.some(l => l.id === lineId) ?? false);
    } catch {
        return false;
    }
}
