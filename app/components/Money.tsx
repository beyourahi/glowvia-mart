/**
 * @fileoverview Money formatting component with currency symbol.
 *
 * Wraps `formatShopifyMoney()` for JSX contexts. Drops `.00` decimals
 * (e.g., `৳100` not `৳100.00`). Use `formatShopifyMoney()` directly for
 * string-only contexts. Both share the same CurrencyFormatter singleton.
 *
 * @related
 * - currency-formatter.ts - Shared formatting logic (single source of truth)
 * - ProductPrice.tsx - Price display with ranges and sales
 */

import type {MoneyData} from "types";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {cn} from "~/lib/utils";

export function Money({data, className}: {data: MoneyData | null | undefined; className?: string}) {
    if (!data?.amount || !data?.currencyCode) {
        return <span className={cn(className)}>N/A</span>;
    }

    const formatted = formatShopifyMoney({amount: data.amount, currencyCode: data.currencyCode});

    return <span className={cn(className)}>{formatted}</span>;
}
