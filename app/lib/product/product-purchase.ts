/**
 * @fileoverview Product Purchase Calculation Utilities
 *
 * Public API for the PDP purchase flow: total price, cart projection, and
 * quantity adjustment guards. Delegates core math to `product-calculations.ts`
 * and wraps results in display-ready formatted strings.
 */

import {calculateProductPricing, canAdjustQuantity} from "./product-calculations";
import {formatShopifyMoney} from "~/lib/currency-formatter";

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type ShopifySelectedOption = {
    name: string;
    value: string;
};

type ShopifyImage = {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
};

type ShopifyProductVariant = {
    id: string;
    title: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    selectedOptions: ShopifySelectedOption[];
    availableForSale: boolean;
    quantityAvailable: number | null;
    image: ShopifyImage | null;
};

type PriceCalculation = {
    totalPrice: string;
    totalComparePrice: string | null;
    totalSavings: string | null;
    savingsPercentage: number;
    isOnSale: boolean;
    quantity: number;
    rawProductAmount: number;
    error: null;
};

type PriceCalculationError = {
    error: "price_unavailable" | "invalid_price" | "invalid_variant";
};

type PriceCalculationResult = PriceCalculation | PriceCalculationError;

export const calculateTotalPrice = (
    selectedVariant: ShopifyProductVariant | null,
    quantity: number
): PriceCalculationResult => {
    const result = calculateProductPricing(selectedVariant, quantity);

    if (result.error) {
        return result as PriceCalculationError;
    }

    return {
        totalPrice: result.formattedTotalPrice,
        totalComparePrice: result.formattedTotalComparePrice || null,
        totalSavings: result.formattedTotalSavings || null,
        savingsPercentage: result.savingsPercentage,
        isOnSale: result.isOnSale,
        quantity: result.quantity,
        rawProductAmount: result.totalPrice,
        error: null
    };
};

export const calculateNewCartTotal = (
    totalPriceCalculation: PriceCalculationResult,
    cartTotal: {rawCartAmount: number} | null,
    selectedVariant: ShopifyProductVariant | null
) => {
    if (!totalPriceCalculation || totalPriceCalculation.error) return null;

    const currencyCode = selectedVariant?.price?.currencyCode || "USD";
    const productAmount = totalPriceCalculation.rawProductAmount || 0;
    const cartAmount = cartTotal?.rawCartAmount || 0;
    const newTotal = cartAmount + productAmount;

    return {
        newCartTotal: formatShopifyMoney({
            amount: newTotal.toFixed(2),
            currencyCode
        }),
        hasExistingCart: cartTotal !== null
    };
};

export {validateQuantityInput as validateProductQuantity, canAdjustQuantity} from "./product-calculations";

export const canIncreaseQuantity = (quantity: number, selectedVariant: ShopifyProductVariant | null): boolean => {
    return canAdjustQuantity(quantity, 1, selectedVariant);
};

export const canDecreaseQuantity = (quantity: number): boolean => {
    return quantity > 1;
};
