/**
 * @fileoverview Re-exports from the shared CurrencyFormatter singleton.
 *
 * All currency formatting in the app is centralized in ~/lib/currency-formatter.ts.
 * This module re-exports the relevant functions to maintain backward compatibility
 * with consumers that import from ~/lib/product/currency.
 *
 * @see ~/lib/currency-formatter.ts — single source of truth for all price formatting
 */

import {formatPrice, formatShopifyMoney as _formatShopifyMoney, getZeroPrice} from "~/lib/currency-formatter";

export const formatPriceWithLocale = formatPrice;
export const formatShopifyMoney = _formatShopifyMoney;
export const getZeroFallbackWithCurrency = getZeroPrice;
