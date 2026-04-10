/**
 * @fileoverview Product Discount Analysis and Badge Utilities
 *
 * @description
 * Provides comprehensive discount calculation and analysis for product displays.
 * Supports intelligent discount badge rendering that distinguishes between:
 * - Exact discounts (all variants have same %) → "25% off"
 * - Variable discounts (variants have different %) → "up to 30% off"
 *
 * @architecture
 * Discount analysis flow:
 * 1. Product variant data is fetched with price and compareAtPrice
 * 2. Each variant's discount percentage is calculated
 * 3. Badge type is determined (exact vs upto) based on variance
 * 4. Products can be filtered/sorted by discount for sale pages
 *
 * @business-logic
 * - Only considers availableForSale variants
 * - Discount = (compareAtPrice - price) / compareAtPrice * 100
 * - Rounds percentages to nearest integer
 * - Falls back to price range comparison when variant data unavailable
 *
 * @dependencies
 * - @shopify/hydrogen - MoneyV2 type for price data
 *
 * @related
 * - ProductDiscountBadge.tsx - Renders discount badges
 * - sale.tsx - Sale page filtering discounted products
 * - ProductItem.tsx - Displays discount badges on product cards
 *
 * @example
 * ```tsx
 * // Analyze discount for badge display
 * const badgeInfo = analyzeProductDiscount(product);
 * if (badgeInfo.type === 'exact') {
 *   return <Badge>Save {badgeInfo.percentage}%</Badge>;
 * } else if (badgeInfo.type === 'upto') {
 *   return <Badge>Up to {badgeInfo.percentage}% off</Badge>;
 * }
 * ```
 */

import type {MoneyV2} from "@shopify/hydrogen/storefront-api-types";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Discount badge display information
 * - type: 'exact' = all variants have same discount % → "X% off"
 * - type: 'upto' = variants have different discount %s → "upto X% off"
 * - type: 'none' = no discounts
 */
export interface DiscountBadgeInfo {
    type: "exact" | "upto" | "none";
    percentage: number;
}

/**
 * Variant pricing data for discount calculation
 */
export interface VariantPricing {
    id: string;
    availableForSale: boolean;
    price: {amount: string};
    compareAtPrice?: {amount: string} | null | undefined;
}

/**
 * Product with variant pricing for discount analysis
 */
export interface ProductWithVariants {
    variants?: {
        nodes: VariantPricing[];
    };
    priceRange?: {
        minVariantPrice: {amount: string};
    };
    compareAtPriceRange?: {
        minVariantPrice: {amount: string};
    };
}

/**
 * Analyze a product's variants to determine discount badge display
 *
 * Logic:
 * - Scenario 1: All discounted variants have the exact same discount % → { type: 'exact', percentage: X }
 * - Scenario 2: Variants have different discount %s → { type: 'upto', percentage: maxX }
 * - Scenario 3: No discounts → { type: 'none', percentage: 0 }
 */
export function analyzeProductDiscount(product: ProductWithVariants): DiscountBadgeInfo {
    const variants = product.variants?.nodes;

    // If no variant data available, fall back to price range comparison
    if (!variants || variants.length === 0) {
        return analyzeFromPriceRange(product);
    }

    // Collect all discount percentages from variants with valid discounts
    const discountPercentages: number[] = [];

    for (const variant of variants) {
        // Only consider variants that have a compareAtPrice
        if (!variant.compareAtPrice) {
            continue;
        }

        const compareAt = parseFloat(variant.compareAtPrice.amount);
        const current = parseFloat(variant.price.amount);

        // Check if this variant has a valid discount
        if (compareAt > current && compareAt > 0) {
            const percentage = calculateDiscountPercentage(compareAt, current);
            if (percentage > 0) {
                discountPercentages.push(percentage);
            }
        }
    }

    // No discounts found
    if (discountPercentages.length === 0) {
        return {type: "none", percentage: 0};
    }

    // Find max and check if all percentages are the same
    const maxPercentage = Math.max(...discountPercentages);
    const minPercentage = Math.min(...discountPercentages);

    // All discounted variants have the same percentage
    if (maxPercentage === minPercentage) {
        return {type: "exact", percentage: maxPercentage};
    }

    // Different percentages - show "upto" with max
    return {type: "upto", percentage: maxPercentage};
}

/**
 * Fallback: Analyze discount from price range when variant data is not available
 * Uses compareAtPriceRange vs priceRange (less accurate but works for legacy data)
 */
function analyzeFromPriceRange(product: ProductWithVariants): DiscountBadgeInfo {
    const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount;
    const currentPrice = product.priceRange?.minVariantPrice?.amount;

    if (!compareAtPrice || !currentPrice) {
        return {type: "none", percentage: 0};
    }

    const compareAt = parseFloat(compareAtPrice);
    const current = parseFloat(currentPrice);

    if (compareAt <= current || compareAt <= 0) {
        return {type: "none", percentage: 0};
    }

    const percentage = calculateDiscountPercentage(compareAt, current);

    // Without variant data, we can't know if all variants have the same discount
    // Default to 'upto' to be safe (shows "upto X% off")
    return {type: "upto", percentage};
}

/**
 * Raw product data from GraphQL query with variant pricing
 */
export interface RawDiscountProduct {
    id: string;
    handle: string;
    title: string;
    availableForSale: boolean;
    featuredImage: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
    priceRange: {
        minVariantPrice: MoneyV2;
        maxVariantPrice: MoneyV2;
    };
    compareAtPriceRange: {
        minVariantPrice: MoneyV2;
    };
    variants: {
        nodes: Array<{
            id: string;
            availableForSale: boolean;
            price: MoneyV2;
            compareAtPrice: MoneyV2 | null;
        }>;
    };
}

/**
 * Transformed product with discount information for display
 */
export interface DiscountedProduct {
    id: string;
    handle: string;
    title: string;
    availableForSale: boolean;
    featuredImage: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
    priceRange: {
        minVariantPrice: MoneyV2;
        maxVariantPrice: MoneyV2;
    };
    compareAtPriceRange: {
        minVariantPrice: MoneyV2;
    };
    /** Variant data for discount badge analysis (exact vs upto) */
    variants: {
        nodes: Array<{
            id: string;
            availableForSale: boolean;
            price: MoneyV2;
            compareAtPrice: MoneyV2 | null;
        }>;
    };
    maxDiscountPercentage: number;
    maxDiscountSavings: number;
}

/**
 * Calculate discount percentage from compare-at and current price
 * @returns Rounded percentage (e.g., 25 for 25% off)
 */
export function calculateDiscountPercentage(compareAtPrice: number, currentPrice: number): number {
    if (compareAtPrice <= currentPrice || compareAtPrice <= 0) {
        return 0;
    }
    const percentage = ((compareAtPrice - currentPrice) / compareAtPrice) * 100;
    return Math.round(percentage);
}

/**
 * Calculate savings amount from compare-at and current price
 */
export function calculateSavings(compareAtPrice: number, currentPrice: number): number {
    if (compareAtPrice <= currentPrice) {
        return 0;
    }
    return compareAtPrice - currentPrice;
}

/**
 * Transform a raw product to include discount information
 * Returns null if product has no discounted variants available for sale
 */
export function transformProductForDiscount(product: RawDiscountProduct): DiscountedProduct | null {
    let maxDiscountPercentage = 0;
    let maxDiscountSavings = 0;
    let hasDiscountedVariant = false;

    // Iterate through all variants to find the maximum discount
    for (const variant of product.variants.nodes) {
        // Only consider variants that are available for sale and have a compare-at price
        if (!variant.availableForSale || !variant.compareAtPrice) {
            continue;
        }

        const compareAt = parseFloat(variant.compareAtPrice.amount);
        const current = parseFloat(variant.price.amount);

        // Check if this variant has a discount
        if (compareAt > current) {
            hasDiscountedVariant = true;
            const percentage = calculateDiscountPercentage(compareAt, current);
            const savings = calculateSavings(compareAt, current);

            if (percentage > maxDiscountPercentage) {
                maxDiscountPercentage = percentage;
                maxDiscountSavings = savings;
            }
        }
    }

    // Only return product if it has at least one discounted variant
    if (!hasDiscountedVariant) {
        return null;
    }

    return {
        id: product.id,
        handle: product.handle,
        title: product.title,
        availableForSale: product.availableForSale,
        featuredImage: product.featuredImage,
        priceRange: product.priceRange,
        compareAtPriceRange: product.compareAtPriceRange,
        variants: product.variants,
        maxDiscountPercentage,
        maxDiscountSavings
    };
}

/**
 * Filter products to only those with discounts, and sort by highest discount first
 */
export function filterAndSortDiscountedProducts(products: RawDiscountProduct[]): DiscountedProduct[] {
    const discountedProducts: DiscountedProduct[] = [];

    for (const product of products) {
        const transformed = transformProductForDiscount(product);
        if (transformed) {
            discountedProducts.push(transformed);
        }
    }

    // Sort by highest discount percentage first, then by savings amount
    return discountedProducts.sort((a, b) => {
        const percentageDiff = b.maxDiscountPercentage - a.maxDiscountPercentage;
        if (percentageDiff !== 0) {
            return percentageDiff;
        }
        return b.maxDiscountSavings - a.maxDiscountSavings;
    });
}

/**
 * Lightweight variant type for counting discounted products
 * Used in root loader where we don't need full product data
 */
export interface LightweightVariant {
    availableForSale: boolean;
    price: {amount: string};
    compareAtPrice: {amount: string} | null;
}

/**
 * Lightweight product type for counting discounted products
 */
export interface LightweightProduct {
    availableForSale: boolean;
    variants: {
        nodes: LightweightVariant[];
    };
}

/**
 * Variant with price information for discount calculation
 */
export interface VariantWithPrice {
    price: {amount: string};
    compareAtPrice?: {amount: string} | null;
}

/**
 * Calculate the discount percentage for a specific variant
 * Returns the exact percentage if the variant has a discount, or 0 if no discount
 */
export function calculateVariantDiscountPercentage(variant: VariantWithPrice | null | undefined): number {
    if (!variant?.compareAtPrice) {
        return 0;
    }

    const compareAt = parseFloat(variant.compareAtPrice.amount);
    const current = parseFloat(variant.price.amount);

    if (compareAt <= current || compareAt <= 0) {
        return 0;
    }

    return calculateDiscountPercentage(compareAt, current);
}

/**
 * Count the number of products that have at least one discounted variant
 * This is a lightweight version that doesn't require full product data
 */
export function countDiscountedProducts(products: LightweightProduct[]): number {
    let count = 0;

    for (const product of products) {
        // Check if any variant has a discount
        const hasDiscount = product.variants.nodes.some(variant => {
            if (!variant.availableForSale || !variant.compareAtPrice) {
                return false;
            }
            const compareAt = parseFloat(variant.compareAtPrice.amount);
            const current = parseFloat(variant.price.amount);
            return compareAt > current;
        });

        if (hasDiscount) {
            count++;
        }
    }

    return count;
}
