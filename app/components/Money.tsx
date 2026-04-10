/**
 * @fileoverview Money formatting component with currency symbol
 *
 * @description
 * Lightweight wrapper that formats prices using the shared CurrencyFormatter.
 * Produces locale-correct narrow currency symbols (e.g., "৳69" for BDT, "$69" for USD)
 * via Intl.NumberFormat with currencyDisplay: "narrowSymbol".
 *
 * All price display in the app should use either:
 * 1. This <Money> component (for JSX rendering)
 * 2. formatShopifyMoney() from ~/lib/currency-formatter (for string contexts)
 *
 * Both use the same underlying CurrencyFormatter singleton to ensure consistency.
 *
 * @features
 * - Uses shared CurrencyFormatter for locale-aware, symbol-based formatting
 * - Removes .00 decimals for cleaner display (e.g., "৳100" not "৳100.00")
 * - Supports any Shopify currency code (via MoneyV2 data)
 * - Supports optional className for styling
 *
 * @props
 * - data: MoneyV2 object with amount and currencyCode
 * - className: Optional CSS classes
 *
 * @formatting
 * - Input: {amount: "100.00", currencyCode: "BDT"} -> Output: "৳100"
 * - Input: {amount: "99.99", currencyCode: "BDT"} -> Output: "৳99.99"
 * - Input: {amount: "49.00", currencyCode: "USD"} -> Output: "$49"
 *
 * @usage
 * ```tsx
 * <Money data={{amount: "100.00", currencyCode: "BDT"}} />
 * // Renders: ৳100
 *
 * <Money data={product.priceRange.minVariantPrice} className="font-bold" />
 * // Renders with custom styling
 * ```
 *
 * @dependencies
 * - CurrencyFormatter: Shared singleton from ~/lib/currency-formatter
 *
 * @related
 * - currency-formatter.ts - Shared formatting logic (single source of truth)
 * - ProductPrice.tsx - Price display with ranges and sales
 * - CartSummary.tsx - Cart totals
 * - AddToCartButton.tsx - Button price display
 */

import type {MoneyData} from "types";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {cn} from "~/lib/utils";

// =============================================================================
// MONEY FORMATTING COMPONENT
// =============================================================================

export function Money({data, className}: {data: MoneyData | null | undefined; className?: string}) {
    if (!data?.amount || !data?.currencyCode) {
        return <span className={cn(className)}>N/A</span>;
    }

    const formatted = formatShopifyMoney({amount: data.amount, currencyCode: data.currencyCode});

    return <span className={cn(className)}>{formatted}</span>;
}
