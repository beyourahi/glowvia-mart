/**
 * @fileoverview Product Card Price and Display Utilities
 *
 * Computes display-ready price, discount, image, and availability data for product
 * cards. Handles the full range of variant configurations: single variant, multi-variant
 * with uniform pricing, and multi-variant with variable pricing/discounts.
 *
 * Primary exports:
 * - `getPriceRangeForCard` — full price range with on-sale and discount data
 * - `transformProductToCardData` — normalize a `ShopifyProduct` into `ProductCardData`
 * - `getProductDataForCard` — unified entry point accepting either type
 */

import {formatShopifyMoney, formatMinimalisticRange, calculateDiscount} from "~/lib/currency-formatter";
import {parseNumber} from "~/lib/number-utils";
import type {ProductCardData, ShopifyProduct, ShopifyProductVariant} from "~/lib/types/product-card";

/** Label shown on unavailable product cards — single source of truth */
export const OUT_OF_STOCK_LABEL = "Out of Stock";

export interface PriceRangeDisplay {
    displayPrice: string;
    hasRange: boolean;
    minPrice: string;
    maxPrice: string;
    compareAtMin?: string;
    compareAtMax?: string;
    onSale: boolean;
    discountPercentage?: number;
    hasMultipleDiscounts?: boolean;
}

export const getPriceRangeForCard = (product: ShopifyProduct): PriceRangeDisplay => {
    const allVariants = product.variants?.edges?.map(edge => edge.node) || [];
    const availableVariants = allVariants.filter(v => v.availableForSale && Boolean(v.price.amount));

    if (availableVariants.length === 0) {
        return {
            displayPrice: formatShopifyMoney(product.priceRange.minVariantPrice),
            hasRange: false,
            minPrice: formatShopifyMoney(product.priceRange.minVariantPrice),
            maxPrice: formatShopifyMoney(product.priceRange.maxVariantPrice),
            onSale: false
        };
    }

    const prices = availableVariants
        .map(v => parseFloat(v.price.amount))
        .filter(value => Number.isFinite(value) && value >= 0);

    if (prices.length === 0) {
        return {
            displayPrice: formatShopifyMoney(product.priceRange.minVariantPrice),
            hasRange: false,
            minPrice: formatShopifyMoney(product.priceRange.minVariantPrice),
            maxPrice: formatShopifyMoney(product.priceRange.maxVariantPrice),
            onSale: false
        };
    }
    const uniquePrices = [...new Set(prices)];
    const minPriceValue = Math.min(...prices);
    const maxPriceValue = Math.max(...prices);
    const hasRange = uniquePrices.length > 1;

    const currencyCode = product.priceRange.minVariantPrice.currencyCode;

    const minPrice = formatShopifyMoney({
        amount: minPriceValue.toString(),
        currencyCode
    });

    const maxPrice = formatShopifyMoney({
        amount: maxPriceValue.toString(),
        currencyCode
    });

    let maxDiscountPercentage = 0;
    let compareAtMin: string | undefined;
    let compareAtMax: string | undefined;
    const discountPercentages = new Set<number>();

    for (const variant of availableVariants) {
        if (
            variant.compareAtPrice?.amount &&
            parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
        ) {
            const discount = calculateDiscount(
                parseFloat(variant.compareAtPrice.amount),
                parseFloat(variant.price.amount)
            );
            maxDiscountPercentage = Math.max(maxDiscountPercentage, discount.percentage);
            discountPercentages.add(discount.percentage);

            if (!compareAtMin || parseFloat(variant.compareAtPrice.amount) < parseFloat(compareAtMin)) {
                compareAtMin = variant.compareAtPrice.amount;
            }
            if (!compareAtMax || parseFloat(variant.compareAtPrice.amount) > parseFloat(compareAtMax)) {
                compareAtMax = variant.compareAtPrice.amount;
            }
        }
    }

    const hasMultipleDiscounts = hasRange && discountPercentages.size >= 1;

    const displayPrice = hasRange ? formatMinimalisticRange(minPriceValue, maxPriceValue, currencyCode) : minPrice;

    return {
        displayPrice,
        hasRange,
        minPrice,
        maxPrice,
        compareAtMin: compareAtMin
            ? formatShopifyMoney({
                  amount: compareAtMin,
                  currencyCode: product.priceRange.minVariantPrice.currencyCode
              })
            : undefined,
        compareAtMax: compareAtMax
            ? formatShopifyMoney({
                  amount: compareAtMax,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode
              })
            : undefined,
        onSale: maxDiscountPercentage > 0,
        discountPercentage: maxDiscountPercentage > 0 ? maxDiscountPercentage : undefined,
        hasMultipleDiscounts
    };
};

export const transformProductToCardData = (product: ShopifyProduct): ProductCardData => {
    const allVariants = product.variants?.edges?.map(edge => edge.node) || [];
    const availableVariants = allVariants.filter(v => v.availableForSale && Boolean(v.price.amount));

    let maxDiscountPercentage = 0;
    let maxDiscountSavings = 0;
    let hasDiscountedVariant = false;
    let bestDiscountedVariant: ShopifyProductVariant | null = null;

    for (const variant of availableVariants) {
        if (
            variant.compareAtPrice?.amount &&
            parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
        ) {
            hasDiscountedVariant = true;
            const originalPrice = parseFloat(variant.compareAtPrice.amount);
            const currentPrice = parseFloat(variant.price.amount);
            const discountPercentage = Math.round((1 - currentPrice / originalPrice) * 100);
            const savings = originalPrice - currentPrice;

            if (discountPercentage > maxDiscountPercentage) {
                maxDiscountPercentage = discountPercentage;
                maxDiscountSavings = savings;
                bestDiscountedVariant = variant;
            }
        }
    }

    const primaryVariant = bestDiscountedVariant || availableVariants[0] || allVariants[0];
    const firstImage = product.images?.edges?.[0]?.node;

    return {
        id: product.id,
        handle: product.handle,
        title: product.title,
        productType: product.productType,
        availableForSale: product.availableForSale,
        primaryVariant: primaryVariant
            ? {
                  id: primaryVariant.id,
                  price: primaryVariant.price ?? product.priceRange.minVariantPrice,
                  compareAtPrice: primaryVariant.compareAtPrice ?? null,
                  availableForSale: primaryVariant.availableForSale,
                  image: primaryVariant.image
                      ? {
                            url: primaryVariant.image.url,
                            altText: primaryVariant.image.altText
                        }
                      : null
              }
            : null,
        primaryImage: firstImage
            ? {
                  url: firstImage.url,
                  altText: firstImage.altText
              }
            : null,
        minPrice: product.priceRange.minVariantPrice,
        hasDiscountedVariant,
        maxDiscountPercentage,
        maxDiscountSavings
    };
};

const hasVariantDiscount = (variant: ShopifyProductVariant): boolean => {
    return Boolean(
        variant.compareAtPrice?.amount &&
        parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
    );
};

export const getCardProductPrice = (
    product: ProductCardData
): {
    price: string;
    compareAtPrice?: string;
    onSale: boolean;
    discountPercentage?: number;
} => {
    const variant = product.primaryVariant;
    if (!variant) {
        return {
            price: formatShopifyMoney(product.minPrice),
            onSale: false
        };
    }

    const price = formatShopifyMoney(variant.price);
    const compareAtPrice = variant.compareAtPrice ? formatShopifyMoney(variant.compareAtPrice) : undefined;

    const originalPrice = parseNumber(variant.compareAtPrice?.amount || "0");
    const salePrice = parseNumber(variant.price.amount);
    const discount = calculateDiscount(originalPrice, salePrice);

    return {
        price,
        compareAtPrice,
        onSale: discount.percentage > 0,
        discountPercentage: discount.percentage || undefined
    };
};

export const getProductPriceWithDiscount = (
    product: ShopifyProduct
): {
    price: string;
    compareAtPrice?: string;
    onSale: boolean;
    discountPercentage?: number;
} => {
    const allVariants = product.variants?.edges?.map(edge => edge.node) || [];
    const availableVariants = allVariants.filter(v => v.availableForSale && Boolean(v.price.amount));

    let maxDiscountPercentage = 0;
    let bestDiscountedVariant: ShopifyProductVariant | null = null;

    for (const variant of availableVariants) {
        if (hasVariantDiscount(variant)) {
            const originalPrice = parseFloat(variant.compareAtPrice!.amount);
            const currentPrice = parseFloat(variant.price.amount);
            const discountPercentage = Math.round((1 - currentPrice / originalPrice) * 100);

            if (discountPercentage > maxDiscountPercentage) {
                maxDiscountPercentage = discountPercentage;
                bestDiscountedVariant = variant;
            }
        }
    }

    const variantToUse = bestDiscountedVariant || availableVariants[0] || allVariants[0];

    if (!variantToUse) {
        return {
            price: formatShopifyMoney(product.priceRange.minVariantPrice),
            onSale: false
        };
    }

    const price = formatShopifyMoney(variantToUse.price);
    const compareAtPrice = variantToUse.compareAtPrice ? formatShopifyMoney(variantToUse.compareAtPrice) : undefined;

    const originalPrice = parseNumber(variantToUse.compareAtPrice?.amount || "0");
    const salePrice = parseNumber(variantToUse.price.amount);
    const discount = calculateDiscount(originalPrice, salePrice);

    return {
        price,
        compareAtPrice,
        onSale: discount.percentage > 0,
        discountPercentage: discount.percentage || undefined
    };
};

export const getCardProductImage = (product: ProductCardData): {url: string; altText: string | null} | null => {
    const variantImage = product.primaryVariant?.image;
    if (variantImage) return variantImage;

    return product.primaryImage || null;
};

export const isCardProductInStock = (product: ProductCardData): boolean => {
    return product.availableForSale && (product.primaryVariant?.availableForSale ?? false);
};

export const isProductCardData = (product: ShopifyProduct | ProductCardData): product is ProductCardData => {
    return "primaryVariant" in product && "primaryImage" in product && "minPrice" in product;
};

export const selectBestVariant = (variants: ShopifyProductVariant[]): ShopifyProductVariant | null => {
    if (variants.length === 0) return null;

    const variantsWithDiscounts = variants
        .map(variant => {
            if (
                variant.compareAtPrice?.amount &&
                parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
            ) {
                const originalPrice = parseFloat(variant.compareAtPrice.amount);
                const currentPrice = parseFloat(variant.price.amount);
                const discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
                return {variant, discountPercentage};
            }
            return null;
        })
        .filter(item => item !== null) as Array<{
        variant: ShopifyProductVariant;
        discountPercentage: number;
    }>;

    if (variantsWithDiscounts.length > 0) {
        variantsWithDiscounts.sort((a, b) => b.discountPercentage - a.discountPercentage);
        return variantsWithDiscounts[0].variant;
    }

    const sortedByPrice = [...variants].sort((a, b) => {
        const aPrice = parseFloat(a.price.amount);
        const bPrice = parseFloat(b.price.amount);
        return aPrice - bPrice;
    });
    return sortedByPrice[0];
};

export const getProductDataForCard = (
    product: ShopifyProduct | ProductCardData,
    options?: {showPriceRange?: boolean}
): {
    price: string;
    compareAtPrice?: string;
    discountPercentage?: number;
    image: {url: string; altText: string | null} | null;
    inStock: boolean;
    priceRange?: PriceRangeDisplay;
} => {
    if (isProductCardData(product)) {
        return {
            ...getCardProductPrice(product),
            image: getCardProductImage(product),
            inStock: isCardProductInStock(product)
        };
    }

    const cardData = transformProductToCardData(product);
    const priceRange = options?.showPriceRange ? getPriceRangeForCard(product) : undefined;

    return {
        ...getProductPriceWithDiscount(product),
        image: getCardProductImage(cardData),
        inStock: isCardProductInStock(cardData),
        priceRange
    };
};
