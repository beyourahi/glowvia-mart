/**
 * @fileoverview Product Pricing Analysis and Display Strategy
 *
 * @description
 * Intelligent pricing analysis that determines optimal price display strategy based on
 * product variant configuration. Handles single variants, multi-variants with same/different
 * prices, compare-at pricing, and all edge cases for accurate customer communication.
 *
 * @architecture
 * Analysis flow:
 * 1. Extract variant data from product
 * 2. Analyze price uniformity across variants
 * 3. Analyze compare-at price availability
 * 4. Calculate discount percentages
 * 5. Determine optimal display strategy
 *
 * @business-logic
 * Pricing scenarios (priority order):
 * 1. Single variant with discount → Show compare-at + sale price + % badge
 * 2. Single variant regular → Show price only
 * 3. Multi-variant same price with discount → Show as single price with discount
 * 4. Multi-variant same price regular → Show single price (no "From")
 * 5. Multi-variant different prices → Show "From {min}" or range
 * 6. Multi-variant all on sale → Show "From {min}" + "Up to X% off"
 * 7. Partial sale → Show "From {min}" + "On Sale"
 *
 * @dependencies
 * - @shopify/hydrogen - MoneyV2 type for price data
 *
 * @related
 * - ProductPrice.tsx - Renders prices based on analysis
 * - discounts.ts - Discount calculation utilities
 * - ProductItem.tsx - Uses pricing analysis for display
 *
 * @example
 * ```tsx
 * const analysis = analyzeProductPricing(product);
 *
 * // Single variant on sale
 * // analysis = {
 * //   displayStrategy: 'single-price-sale',
 * //   variantCount: 1,
 * //   maxDiscountPercentage: 33,
 * //   minPrice: { amount: '19.99', currencyCode: 'USD' },
 * //   minCompareAtPrice: { amount: '29.99', currencyCode: 'USD' }
 * // }
 * ```
 */

import type {MoneyV2} from "@shopify/hydrogen/storefront-api-types";
import {calculateDiscountPercentage} from "~/lib/discounts";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Display strategy for price rendering
 * - single-price: Show single price (no range, no discount)
 * - single-price-sale: Show compare-at + sale price with discount badge
 * - price-range: Show "From {min}" or "{min} - {max}" (no discounts)
 * - price-range-sale: Show "From {min}" with "Up to X% off" (all variants discounted)
 * - partial-sale: Show "From {min}" with "On Sale" badge (some variants discounted)
 */
export type PriceDisplayStrategy =
    | "single-price"
    | "single-price-sale"
    | "price-range"
    | "price-range-sale"
    | "partial-sale";

/**
 * Comprehensive pricing analysis result
 * Contains all information needed to render prices intelligently
 */
export interface PricingAnalysis {
    // Variant metadata
    variantCount: number;
    hasSingleVariant: boolean;
    hasMultipleVariants: boolean;

    // Price uniformity
    allVariantsSamePrice: boolean;
    minPrice: MoneyV2;
    maxPrice: MoneyV2;

    // Compare-at pricing availability
    hasAnyCompareAtPrice: boolean;
    allVariantsHaveCompareAt: boolean;
    someVariantsHaveCompareAt: boolean;
    minCompareAtPrice: MoneyV2 | null;
    maxCompareAtPrice: MoneyV2 | null;

    // Discount analysis
    hasAnyDiscount: boolean;
    allVariantsDiscounted: boolean;
    partiallyDiscounted: boolean;
    maxDiscountPercentage: number;
    minDiscountPercentage: number;

    // Display decision (what to render)
    displayStrategy: PriceDisplayStrategy;
}

/**
 * Minimal variant interface for pricing analysis
 */
interface PricingVariant {
    availableForSale: boolean;
    price: MoneyV2;
    compareAtPrice?: MoneyV2 | null;
}

/**
 * Product interface for pricing analysis
 * Compatible with ProductItemFragment, CollectionItemFragment, etc.
 */
export interface ProductForPricing {
    priceRange: {
        minVariantPrice: MoneyV2;
        maxVariantPrice: MoneyV2;
    };
    compareAtPriceRange?: {
        minVariantPrice?: MoneyV2 | null;
        maxVariantPrice?: MoneyV2 | null;
    } | null;
    variants?: {
        nodes: PricingVariant[];
    };
}

// =============================================================================
// PRICING ANALYSIS
// =============================================================================

/**
 * Analyze product pricing to determine optimal display strategy
 *
 * Decision tree:
 * 1. Check variant count (single vs multiple)
 * 2. For multiple variants, check price uniformity
 * 3. Check for compare-at prices (discounts)
 * 4. Calculate discount percentages
 * 5. Determine display strategy based on all factors
 *
 * @param product - Product with price range and variant data
 * @returns Complete pricing analysis with display strategy
 */
export function analyzeProductPricing(product: ProductForPricing): PricingAnalysis {
    // Extract variant data (filter to available variants only)
    const variants = product.variants?.nodes.filter(v => v.availableForSale) || [];
    const variantCount = variants.length;

    // Extract price range from product-level data (always available)
    const minPrice = product.priceRange.minVariantPrice;
    const maxPrice = product.priceRange.maxVariantPrice;
    const minCompareAtPrice = product.compareAtPriceRange?.minVariantPrice || null;
    const maxCompareAtPrice = product.compareAtPriceRange?.maxVariantPrice || null;

    // Price uniformity: Are all variants the same price?
    const allVariantsSamePrice = parseFloat(minPrice.amount) === parseFloat(maxPrice.amount);

    // Analyze compare-at prices and discounts (only if variant data available)
    let hasAnyCompareAtPrice = false;
    let allVariantsHaveCompareAt = false;
    let someVariantsHaveCompareAt = false;
    let maxDiscountPercentage = 0;
    let minDiscountPercentage = 0;
    let discountedVariantCount = 0;

    if (variants.length > 0) {
        // Check each variant for compare-at pricing and calculate discounts
        const discounts: number[] = [];

        for (const variant of variants) {
            const hasCompareAt = variant.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > 0;

            if (hasCompareAt) {
                hasAnyCompareAtPrice = true;

                const compareAt = parseFloat(variant.compareAtPrice!.amount);
                const current = parseFloat(variant.price.amount);

                // Valid discount: compareAt > current
                if (compareAt > current) {
                    const discount = calculateDiscountPercentage(compareAt, current);
                    if (discount > 0) {
                        discounts.push(discount);
                        discountedVariantCount++;
                    }
                }
            }
        }

        // Calculate discount statistics
        if (discounts.length > 0) {
            maxDiscountPercentage = Math.max(...discounts);
            minDiscountPercentage = Math.min(...discounts);
        }

        // Determine compare-at price coverage
        allVariantsHaveCompareAt = discountedVariantCount === variantCount && variantCount > 0;
        someVariantsHaveCompareAt = discountedVariantCount > 0 && discountedVariantCount < variantCount;
    } else {
        // Fallback: Use product-level compareAtPriceRange when no variant data
        hasAnyCompareAtPrice = !!minCompareAtPrice && parseFloat(minCompareAtPrice.amount) > 0;

        if (hasAnyCompareAtPrice) {
            const compareAt = parseFloat(minCompareAtPrice!.amount);
            const current = parseFloat(minPrice.amount);

            if (compareAt > current) {
                maxDiscountPercentage = calculateDiscountPercentage(compareAt, current);
                minDiscountPercentage = maxDiscountPercentage;
                allVariantsHaveCompareAt = true; // Assume all variants if using fallback
            }
        }
    }

    // Determine display strategy
    const displayStrategy = determineDisplayStrategy({
        variantCount,
        allVariantsSamePrice,
        allVariantsDiscounted: allVariantsHaveCompareAt,
        partiallyDiscounted: someVariantsHaveCompareAt,
        hasAnyDiscount: maxDiscountPercentage > 0
    });

    return {
        // Variant metadata
        variantCount,
        hasSingleVariant: variantCount === 1,
        hasMultipleVariants: variantCount > 1,

        // Price uniformity
        allVariantsSamePrice,
        minPrice,
        maxPrice,

        // Compare-at pricing
        hasAnyCompareAtPrice,
        allVariantsHaveCompareAt,
        someVariantsHaveCompareAt,
        minCompareAtPrice,
        maxCompareAtPrice,

        // Discount analysis
        hasAnyDiscount: maxDiscountPercentage > 0,
        allVariantsDiscounted: allVariantsHaveCompareAt,
        partiallyDiscounted: someVariantsHaveCompareAt,
        maxDiscountPercentage,
        minDiscountPercentage,

        // Display strategy
        displayStrategy
    };
}

/**
 * Determine optimal display strategy based on variant configuration
 *
 * @internal
 */
function determineDisplayStrategy(params: {
    variantCount: number;
    allVariantsSamePrice: boolean;
    allVariantsDiscounted: boolean;
    partiallyDiscounted: boolean;
    hasAnyDiscount: boolean;
}): PriceDisplayStrategy {
    const {variantCount, allVariantsSamePrice, allVariantsDiscounted, partiallyDiscounted, hasAnyDiscount} = params;

    // Single variant products
    if (variantCount === 1) {
        return hasAnyDiscount ? "single-price-sale" : "single-price";
    }

    // Multiple variants with same price
    if (allVariantsSamePrice) {
        return allVariantsDiscounted ? "single-price-sale" : "single-price";
    }

    // Multiple variants with different prices
    if (allVariantsDiscounted) {
        return "price-range-sale";
    }

    if (partiallyDiscounted) {
        return "partial-sale";
    }

    return "price-range";
}

// =============================================================================
// PRICE COMPARISON UTILITIES
// =============================================================================

/**
 * Check if two prices are equal (comparing amounts only)
 */
export function pricesEqual(price1: MoneyV2 | null | undefined, price2: MoneyV2 | null | undefined): boolean {
    if (!price1 || !price2) return false;
    return parseFloat(price1.amount) === parseFloat(price2.amount);
}

/**
 * Check if a product has a price range (min !== max)
 */
export function hasPriceRange(minPrice: MoneyV2, maxPrice: MoneyV2): boolean {
    return parseFloat(minPrice.amount) !== parseFloat(maxPrice.amount);
}

/**
 * Check if a price is valid (positive amount)
 */
export function isPriceValid(price: MoneyV2 | null | undefined): boolean {
    if (!price) return false;
    const amount = parseFloat(price.amount);
    return amount > 0 && !isNaN(amount);
}
