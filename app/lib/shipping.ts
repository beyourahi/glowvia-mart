import {formatPrice} from "~/lib/currency-formatter";

/**
 * @fileoverview Shipping Configuration and Free Shipping Utilities
 *
 * @description
 * Provides utilities for managing free shipping thresholds and calculations.
 * The free shipping threshold is configured via Shopify shop metafields,
 * allowing merchants to change the value without code deployment.
 *
 * @architecture
 * Data Source:
 * - Shopify shop metafield: custom.free_shipping_threshold
 * - Fetched in root.tsx loader via SHOP_SHIPPING_CONFIG_QUERY
 * - Parsed and passed to components via context
 *
 * Configuration in Shopify Admin:
 * 1. Go to Settings → Custom data → Shop
 * 2. Add metafield: custom.free_shipping_threshold (Decimal type)
 * 3. Set value (e.g., 5000 for $5,000 free shipping)
 *
 * @business-logic
 * - Threshold is in the store's default currency
 * - Cart must reach or exceed threshold for free shipping
 * - UI shows progress toward free shipping goal
 *
 * @related
 * - root.tsx - Fetches shipping config in loader
 * - CartSummary.tsx - Displays free shipping progress
 * - AnnouncementBanner.tsx - May show free shipping promotion
 */

export interface ShippingConfig {
    freeShippingThreshold: number | null;
    currencyCode: string;
}

const FALLBACK_FREE_SHIPPING_THRESHOLD = 0;
const FALLBACK_CURRENCY_CODE = "USD";

export const DEFAULT_FREE_SHIPPING_THRESHOLD = FALLBACK_FREE_SHIPPING_THRESHOLD;
export const DEFAULT_CURRENCY_CODE = FALLBACK_CURRENCY_CODE;

/**
 * GraphQL fragment for fetching shop shipping metafields
 */
export const SHOP_SHIPPING_METAFIELD_FRAGMENT = `#graphql
  fragment ShopShippingMetafield on Shop {
    freeShippingThreshold: metafield(namespace: "custom", key: "free_shipping_threshold") {
      value
      type
    }
  }
` as const;

/**
 * Parse shipping config from shop metafields
 */
export function parseShippingConfig(
    metafieldValue: string | null | undefined,
    currencyCode: string = DEFAULT_CURRENCY_CODE
): ShippingConfig {
    let threshold: number | null = null;

    if (metafieldValue) {
        const parsed = parseFloat(metafieldValue);
        if (!isNaN(parsed) && parsed > 0) {
            threshold = parsed;
        }
    }

    return {
        freeShippingThreshold: threshold,
        currencyCode
    };
}

/**
 * Format currency amount for display using the shared CurrencyFormatter.
 * Produces consistent symbol-based formatting (e.g., "৳5,000" for BDT).
 */
export function formatShippingThreshold(amount: number, currencyCode: string = DEFAULT_CURRENCY_CODE): string {
    return formatPrice(amount, currencyCode);
}

/**
 * Check if cart qualifies for free shipping
 */
export function qualifiesForFreeShipping(cartTotal: number, threshold: number): boolean {
    return cartTotal >= threshold;
}

/**
 * Calculate remaining amount for free shipping
 */
export function remainingForFreeShipping(cartTotal: number, threshold: number): number {
    const remaining = threshold - cartTotal;
    return remaining > 0 ? remaining : 0;
}
