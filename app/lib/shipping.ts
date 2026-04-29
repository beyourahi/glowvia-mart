import {formatPrice} from "~/lib/currency-formatter";

/**
 * @fileoverview Shipping Configuration and Free Shipping Utilities
 *
 * @description
 * Provides utilities for managing free shipping thresholds and calculations.
 * The minimum order amount is configured via the site_settings metaobject,
 * allowing merchants to change the value without code deployment.
 *
 * @architecture
 * Data Source:
 * - site_settings metaobject field: free_shipping_minimum_order (Decimal)
 * - Parsed by metaobject-parsers.ts into siteContent.siteSettings.freeShippingMinimumOrder
 * - Passed to components via shippingConfig returned from the root loader
 *
 * Configuration in Shopify Admin:
 * 1. Go to Content → Metaobjects → site_settings
 * 2. Set the free_shipping_minimum_order field (Decimal, e.g. "50.00")
 *
 * @business-logic
 * - Minimum order is in the store's configured currency
 * - Cart must reach or exceed the amount for free shipping
 * - UI shows progress toward free shipping goal
 *
 * @related
 * - root.tsx - Builds shippingConfig from siteContent + shop currency
 * - CartSummary.tsx - Displays free shipping progress
 * - AnnouncementBanner.tsx - May show free shipping promotion
 */

export interface ShippingConfig {
    freeShippingMinimumOrder: number | null;
    currencyCode: string;
}

const FALLBACK_CURRENCY_CODE = "USD";

export const DEFAULT_CURRENCY_CODE = FALLBACK_CURRENCY_CODE;

/**
 * Build shipping config from parsed site_settings value and shop currency.
 */
export function parseShippingConfig(
    minimumOrder: number | null,
    currencyCode: string = DEFAULT_CURRENCY_CODE
): ShippingConfig {
    return {
        freeShippingMinimumOrder: minimumOrder,
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
