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

export class CurrencyFormatter {
    private static instance: CurrencyFormatter;

    private constructor() {}

    public static getInstance(): CurrencyFormatter {
        if (!CurrencyFormatter.instance) {
            CurrencyFormatter.instance = new CurrencyFormatter();
        }
        return CurrencyFormatter.instance;
    }

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

    public formatPriceRange(minPrice: ShopifyMoney, maxPrice: ShopifyMoney): string {
        const min = parseFloat(minPrice.amount);
        const max = parseFloat(maxPrice.amount);

        if (min === max) {
            return this.formatShopifyMoney(minPrice);
        }

        return `${this.formatShopifyMoney(minPrice)} - ${this.formatShopifyMoney(maxPrice)}`;
    }

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

    public calculateDiscount(originalPrice: number, salePrice: number): {amount: number; percentage: number} {
        if (originalPrice <= salePrice || originalPrice <= 0) {
            return {amount: 0, percentage: 0};
        }

        const discountAmount = originalPrice - salePrice;
        const discountPercentage = Math.round((discountAmount / originalPrice) * 100);

        return {amount: discountAmount, percentage: discountPercentage};
    }

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
