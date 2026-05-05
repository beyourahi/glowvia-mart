/**
 * @fileoverview Numeric Utility Functions
 *
 * Singleton `NumberUtils` providing common numeric helpers: validation, parsing,
 * clamping, rounding, and discount/savings calculations. Module-level aliases
 * are exported for direct import in components and utilities.
 */

/**
 * Singleton class for numeric utility operations.
 * Use the exported module-level aliases rather than accessing the instance directly.
 */
export class NumberUtils {
    private static instance: NumberUtils;

    private constructor() {}

    /** Return the shared singleton instance, creating it on first call. */
    public static getInstance(): NumberUtils {
        if (!NumberUtils.instance) {
            NumberUtils.instance = new NumberUtils();
        }
        return NumberUtils.instance;
    }

    /** Type guard: returns true for finite, non-NaN numbers. */
    public isValidNumber(value: unknown): value is number {
        return typeof value === "number" && !isNaN(value) && isFinite(value);
    }

    /** Parse a string or number to a float, returning `fallback` on failure. */
    public parseNumber(value: string | number, fallback: number = 0): number {
        if (typeof value === "number") {
            return this.isValidNumber(value) ? value : fallback;
        }

        if (typeof value === "string") {
            const parsed = parseFloat(value);
            return this.isValidNumber(parsed) ? parsed : fallback;
        }

        return fallback;
    }

    /** Clamp `value` to the inclusive range `[min, max]`. */
    public clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /** Round `value` to `decimals` decimal places using the multiply-round-divide method. */
    public roundToDecimals(value: number, decimals: number = 2): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /** Calculate `value` as a whole-number percentage of `total`. Returns 0 when total ≤ 0. */
    public calculatePercentage(value: number, total: number): number {
        if (total <= 0) return 0;
        return Math.round((value / total) * 100);
    }

    /** Multiply unit price by quantity (minimum 1), rounded to 2 decimal places. */
    public calculateTotal(unitPrice: number, quantity: number): number {
        const validQuantity = Math.max(1, Math.floor(quantity) || 1);
        return this.roundToDecimals(unitPrice * validQuantity);
    }

    public calculateSavings(
        originalPrice: number,
        salePrice: number
    ): {
        amount: number;
        percentage: number;
        isOnSale: boolean;
    } {
        if (originalPrice <= salePrice || originalPrice <= 0) {
            return {amount: 0, percentage: 0, isOnSale: false};
        }

        const savingsAmount = this.roundToDecimals(originalPrice - salePrice);
        const savingsPercentage = this.calculatePercentage(savingsAmount, originalPrice);

        return {
            amount: savingsAmount,
            percentage: savingsPercentage,
            isOnSale: savingsAmount > 0
        };
    }

    public formatDecimal(value: number, decimals: number = 2): string {
        return value.toFixed(decimals);
    }

    /** Return `value` clamped to ≥ 0. */
    public ensurePositive(value: number): number {
        return Math.max(0, value);
    }

    /** Return the absolute value of `value` floored to an integer. */
    public ensureInteger(value: number): number {
        return Math.floor(Math.abs(value));
    }
}

export const numberUtils = NumberUtils.getInstance();

export const isValidNumber = numberUtils.isValidNumber.bind(numberUtils);
export const parseNumber = numberUtils.parseNumber.bind(numberUtils);
export const clamp = numberUtils.clamp.bind(numberUtils);
export const roundToDecimals = numberUtils.roundToDecimals.bind(numberUtils);
export const calculatePercentage = numberUtils.calculatePercentage.bind(numberUtils);
export const calculateTotal = numberUtils.calculateTotal.bind(numberUtils);
export const calculateSavings = numberUtils.calculateSavings.bind(numberUtils);
export const formatDecimal = numberUtils.formatDecimal.bind(numberUtils);
export const ensurePositive = numberUtils.ensurePositive.bind(numberUtils);
export const ensureInteger = numberUtils.ensureInteger.bind(numberUtils);
