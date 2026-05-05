/**
 * @fileoverview Currency Formatting Utilities
 *
 * Singleton `CurrencyFormatter` wrapping `Intl.NumberFormat` for locale-aware
 * currency display. Uses `currencyDisplay: "narrowSymbol"` so currencies render
 * as symbols (e.g. `৳69`) rather than ISO codes (e.g. `BDT 69`). Falls back to
 * the `CURRENCY_SYMBOLS` lookup table when `Intl` throws.
 *
 * Module-level aliases (`formatPrice`, `formatShopifyMoney`, etc.) are bound to
 * the singleton instance and exported for direct import in components.
 */

import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

/**
 * Currency symbol lookup used ONLY as a fallback when Intl.NumberFormat fails.
 * The primary formatting path uses Intl.NumberFormat with currencyDisplay: "narrowSymbol"
 * to produce locale-correct symbols (e.g., "৳69" for BDT, "$69" for USD).
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
    MXN: "$",
    BRL: "R$",
    ZAR: "R",
    KRW: "₩",
    SGD: "S$",
    HKD: "HK$",
    NOK: "kr",
    SEK: "kr",
    DKK: "kr",
    PLN: "zł",
    THB: "฿",
    IDR: "Rp",
    HUF: "Ft",
    CZK: "Kč",
    ILS: "₪",
    CLP: "$",
    PHP: "₱",
    AED: "د.إ",
    COP: "$",
    SAR: "﷼",
    MYR: "RM",
    RON: "lei",
    BDT: "৳",
    TWD: "NT$",
    NZD: "NZ$",
    TRY: "₺",
    RUB: "₽",
    UAH: "₴",
    VND: "₫",
    NGN: "₦",
    PKR: "₨",
    LKR: "₨",
    NPR: "₨",
    BHD: "BD",
    KWD: "د.ك",
    QAR: "ر.ق",
    OMR: "ر.ع."
};

const DEFAULT_CURRENCY = "USD";
const DEFAULT_LOCALE = STORE_FORMAT_LOCALE;

/**
 * Singleton currency formatter using `Intl.NumberFormat`.
 *
 * Use the exported module-level aliases (`formatPrice`, `formatShopifyMoney`, etc.)
 * rather than calling instance methods directly in components.
 */
export class CurrencyFormatter {
    private static instance: CurrencyFormatter;

    private constructor() {}

    /** Return the shared singleton instance, creating it on first call. */
    public static getInstance(): CurrencyFormatter {
        if (!CurrencyFormatter.instance) {
            CurrencyFormatter.instance = new CurrencyFormatter();
        }
        return CurrencyFormatter.instance;
    }

    /**
     * Format a numeric amount as a localized currency string.
     *
     * Integers render without decimal places (`$12`); fractional amounts render
     * with exactly 2 decimal places (`$12.50`). Falls back to the symbol lookup
     * table when `Intl.NumberFormat` throws (unsupported currency codes, etc.).
     *
     * @param amount - Numeric value to format
     * @param currencyCode - ISO 4217 currency code (default: `"USD"`)
     */
    public format(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
        if (!this.isValidAmount(amount)) {
            return this.getFallbackFormat(0, currencyCode);
        }

        if (!this.isValidCurrencyCode(currencyCode)) {
            currencyCode = DEFAULT_CURRENCY;
        }

        try {
            // Use narrowSymbol to display currency symbols (e.g., "৳69") instead of
            // ISO codes (e.g., "BDT 69") — ensures consistent symbol-based formatting
            // across all locales and currencies.
            // Pin both min/max to the same value so fractional prices always show
            // exactly 2 decimal places ("$12.50" not "$12.5") while integers stay
            // clean ("$12" not "$12.00").
            const isInteger = amount % 1 === 0;
            return new Intl.NumberFormat(DEFAULT_LOCALE, {
                style: "currency",
                currency: currencyCode,
                currencyDisplay: "narrowSymbol",
                minimumFractionDigits: isInteger ? 0 : 2,
                maximumFractionDigits: isInteger ? 0 : 2
            }).format(amount);
        } catch {
            return this.getFallbackFormat(amount, currencyCode);
        }
    }

    /**
     * Format a Shopify `Money` object (from the Storefront API) as a localized string.
     *
     * @param money - `{amount: string, currencyCode: string}` from the Storefront API
     */
    public formatShopifyMoney(money: ShopifyMoney): string {
        if (!this.isValidMoneyObject(money)) {
            return this.getFallbackFormat(0, DEFAULT_CURRENCY);
        }

        const amount = parseFloat(money.amount);
        if (isNaN(amount)) {
            return this.getFallbackFormat(0, money.currencyCode);
        }

        return this.format(amount, money.currencyCode);
    }

    /**
     * Format a min/max Shopify price range.
     * Returns a single formatted price when min and max are equal.
     *
     * @param minPrice - Lowest variant price
     * @param maxPrice - Highest variant price
     */
    public formatPriceRange(minPrice: ShopifyMoney, maxPrice: ShopifyMoney): string {
        const min = parseFloat(minPrice.amount);
        const max = parseFloat(maxPrice.amount);

        if (min === max) {
            return this.formatShopifyMoney(minPrice);
        }

        return `${this.formatShopifyMoney(minPrice)} - ${this.formatShopifyMoney(maxPrice)}`;
    }

    /**
     * Format a min/max price range using just the currency symbol (no locale-specific grouping).
     * Produces compact strings like `$ 10 – 25` — used in product card quick-view overlays.
     * Falls back to the ISO currency code when the symbol is not in the lookup table.
     *
     * @param minAmount - Minimum numeric price
     * @param maxAmount - Maximum numeric price
     * @param currencyCode - ISO 4217 currency code
     */
    public formatMinimalisticRange(
        minAmount: number,
        maxAmount: number,
        currencyCode: string = DEFAULT_CURRENCY
    ): string {
        if (minAmount === maxAmount) {
            return this.format(minAmount, currencyCode);
        }

        const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;

        const formatValue = (value: number): string => {
            const hasDecimals = value % 1 !== 0;
            return hasDecimals ? value.toFixed(2) : value.toFixed(0);
        };

        const minFormatted = formatValue(minAmount);
        const maxFormatted = formatValue(maxAmount);

        return `${symbol} ${minFormatted} – ${maxFormatted}`;
    }

    /**
     * Calculate the discount amount and percentage between an original and sale price.
     * Returns `{amount: 0, percentage: 0}` when there is no discount or inputs are invalid.
     *
     * @param originalPrice - Compare-at price (before discount)
     * @param salePrice - Current sale price
     */
    public calculateDiscount(originalPrice: number, salePrice: number): {amount: number; percentage: number} {
        if (originalPrice <= salePrice || originalPrice <= 0) {
            return {amount: 0, percentage: 0};
        }

        const discountAmount = originalPrice - salePrice;
        const discountPercentage = Math.round((discountAmount / originalPrice) * 100);

        return {amount: discountAmount, percentage: discountPercentage};
    }

    /**
     * Return a formatted zero price for the given currency (e.g. `"$0"` for USD).
     * Useful as a fallback when a variant has no price data.
     */
    public getZeroPrice(currencyCode: string = DEFAULT_CURRENCY): string {
        return this.format(0, currencyCode);
    }

    private isValidAmount(amount: unknown): amount is number {
        return typeof amount === "number" && !isNaN(amount) && isFinite(amount);
    }

    private isValidCurrencyCode(code: unknown): code is string {
        return typeof code === "string" && code.length === 3;
    }

    private isValidMoneyObject(money: unknown): money is ShopifyMoney {
        return (
            typeof money === "object" &&
            money !== null &&
            "amount" in money &&
            "currencyCode" in money &&
            typeof (money as ShopifyMoney).amount === "string" &&
            typeof (money as ShopifyMoney).currencyCode === "string"
        );
    }

    private getFallbackFormat(amount: number, currencyCode: string): string {
        const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
        const isInteger = amount % 1 === 0;
        const formattedAmount = isInteger ? amount.toFixed(0) : amount.toFixed(2);
        return `${symbol}${formattedAmount}`;
    }
}

export const currencyFormatter = CurrencyFormatter.getInstance();

export const formatPrice = currencyFormatter.format.bind(currencyFormatter);
export const formatShopifyMoney = currencyFormatter.formatShopifyMoney.bind(currencyFormatter);
export const formatPriceRange = currencyFormatter.formatPriceRange.bind(currencyFormatter);
export const formatMinimalisticRange = currencyFormatter.formatMinimalisticRange.bind(currencyFormatter);
export const calculateDiscount = currencyFormatter.calculateDiscount.bind(currencyFormatter);
export const getZeroPrice = currencyFormatter.getZeroPrice.bind(currencyFormatter);

export const formatPriceWithLocale = formatPrice;
export const getZeroFallbackWithCurrency = getZeroPrice;
