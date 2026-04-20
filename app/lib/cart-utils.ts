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
