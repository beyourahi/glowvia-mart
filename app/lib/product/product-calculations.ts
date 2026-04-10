import {calculateSavings, calculateTotal} from "~/lib/number-utils";
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

type ShopifyProductOption = {
    id: string;
    name: string;
    values: string[];
};

type ShopifyPriceRange = {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
};

type ShopifyProductSeo = {
    title: string | null;
    description: string | null;
};

type ShopifyProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: ShopifyProductOption[];
    variants: {edges: {node: ShopifyProductVariant}[]};
    images: {edges: {node: ShopifyImage}[]};
    priceRange: ShopifyPriceRange;
    seo: ShopifyProductSeo;
};

export interface ProductPriceCalculation {
    unitPrice: number;
    totalPrice: number;
    unitComparePrice?: number;
    totalComparePrice?: number;
    totalSavings: number;
    savingsPercentage: number;
    isOnSale: boolean;
    quantity: number;
    formattedTotalPrice: string;
    formattedTotalComparePrice?: string;
    formattedTotalSavings?: string;
    currencyCode: string;
}

export interface PriceCalculationResult extends ProductPriceCalculation {
    error: null;
}

export interface PriceCalculationError {
    error: "price_unavailable" | "invalid_price" | "invalid_variant";
}

export type ProductCalculationResult = PriceCalculationResult | PriceCalculationError;

export const calculateProductPricing = (
    selectedVariant: ShopifyProductVariant | null,
    quantity: number
): ProductCalculationResult => {
    if (!selectedVariant) {
        return {error: "invalid_variant"};
    }

    const priceAmount = selectedVariant.price?.amount;
    const currencyCode = selectedVariant.price?.currencyCode || "USD";

    if (!priceAmount && priceAmount !== "0") {
        return {error: "price_unavailable"};
    }

    const validQuantity = Math.max(1, Math.floor(quantity) || 1);
    const unitPrice = parseFloat(priceAmount);

    if (isNaN(unitPrice) || unitPrice < 0) {
        return {error: "invalid_price"};
    }

    const unitComparePrice = selectedVariant.compareAtPrice?.amount
        ? parseFloat(selectedVariant.compareAtPrice.amount)
        : undefined;

    const totalPrice = calculateTotal(unitPrice, validQuantity);
    const totalComparePrice = unitComparePrice ? calculateTotal(unitComparePrice, validQuantity) : undefined;

    const savingsCalculation = totalComparePrice
        ? calculateSavings(totalComparePrice, totalPrice)
        : {amount: 0, percentage: 0, isOnSale: false};

    return {
        unitPrice,
        totalPrice,
        unitComparePrice,
        totalComparePrice,
        totalSavings: savingsCalculation.amount,
        savingsPercentage: savingsCalculation.percentage,
        isOnSale: savingsCalculation.isOnSale,
        quantity: validQuantity,
        formattedTotalPrice: formatShopifyMoney({
            amount: totalPrice.toString(),
            currencyCode
        }),
        formattedTotalComparePrice: totalComparePrice
            ? formatShopifyMoney({
                  amount: totalComparePrice.toString(),
                  currencyCode
              })
            : undefined,
        formattedTotalSavings:
            savingsCalculation.amount > 0
                ? formatShopifyMoney({
                      amount: savingsCalculation.amount.toString(),
                      currencyCode
                  })
                : undefined,
        currencyCode,
        error: null
    };
};

export const calculateDiscountPercentage = (originalPrice: number, salePrice: number): number => {
    if (originalPrice <= salePrice || originalPrice <= 0) {
        return 0;
    }

    return calculateSavings(originalPrice, salePrice).percentage;
};

export const calculatePriceComparison = (
    variant: ShopifyProductVariant
): {
    price: string;
    compareAtPrice?: string;
    onSale: boolean;
    discountPercentage: number;
} => {
    const price = formatShopifyMoney(variant.price);
    const compareAtPrice = variant.compareAtPrice ? formatShopifyMoney(variant.compareAtPrice) : undefined;

    const onSale = Boolean(
        compareAtPrice &&
        variant.compareAtPrice &&
        parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
    );

    const discountPercentage =
        onSale && variant.compareAtPrice
            ? calculateDiscountPercentage(parseFloat(variant.compareAtPrice.amount), parseFloat(variant.price.amount))
            : 0;

    return {price, compareAtPrice, onSale, discountPercentage};
};

export const calculateQuantityConstraints = (
    variant: ShopifyProductVariant | null
): {min: number; max: number; step: number} => {
    const maxQuantity = Math.min(999, variant?.quantityAvailable || 999);

    return {
        min: 1,
        max: maxQuantity,
        step: 1
    };
};

export const validateQuantityInput = (quantity: number, variant: ShopifyProductVariant | null): number => {
    const constraints = calculateQuantityConstraints(variant);
    return Math.max(constraints.min, Math.min(quantity, constraints.max));
};

export const canAdjustQuantity = (
    quantity: number,
    adjustment: number,
    variant: ShopifyProductVariant | null
): boolean => {
    const newQuantity = quantity + adjustment;
    const constraints = calculateQuantityConstraints(variant);

    return newQuantity >= constraints.min && newQuantity <= constraints.max;
};

export const formatProductPrice = (
    product: ShopifyProduct
): {price: string; compareAtPrice?: string; onSale: boolean} => {
    const variant = product.variants?.edges?.[0]?.node;

    if (!variant) {
        return {
            price: formatShopifyMoney(product.priceRange.minVariantPrice),
            onSale: false
        };
    }

    return calculatePriceComparison(variant);
};
