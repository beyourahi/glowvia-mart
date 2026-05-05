/**
 * @fileoverview Shared product card type definitions.
 *
 * Provides lightweight Shopify data shapes (`ShopifyProduct`, `ShopifyProductVariant`, etc.)
 * and the pre-computed `ProductCardData` type used by the unified product card system.
 * Raw Shopify types come from the Storefront API; `ProductCardData` is derived by
 * `lib/pricing-analysis.ts` and includes pre-computed discount metadata.
 */

export type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

export type ShopifyImage = {
    id?: string;
    url: string;
    altText: string | null;
    width?: number;
    height?: number;
};

export type ShopifySelectedOption = {
    name: string;
    value: string;
};

export type ShopifyProductVariant = {
    id: string;
    title: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    selectedOptions: ShopifySelectedOption[];
    availableForSale: boolean;
    quantityAvailable: number | null;
    image: ShopifyImage | null;
};

export type ShopifyProductOption = {
    id: string;
    name: string;
    values: string[];
};

export type ShopifyPriceRange = {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
};

export type ShopifyProductSeo = {
    title: string | null;
    description: string | null;
};

export type ShopifyProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: ShopifyProductOption[];
    variants: {edges: Array<{node: ShopifyProductVariant}>};
    images: {edges: Array<{node: ShopifyImage}>};
    priceRange: ShopifyPriceRange;
    seo: ShopifyProductSeo;
};

export type ProductCardVariant = {
    id: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    availableForSale: boolean;
    image: {url: string; altText: string | null} | null;
};

/**
 * Pre-computed product card data returned by `lib/pricing-analysis.ts`.
 * Includes discount metadata so cards can render badges without re-computing.
 */
export type ProductCardData = {
    id: string;
    handle: string;
    title: string;
    productType: string;
    availableForSale: boolean;
    primaryVariant: ProductCardVariant | null;
    primaryImage: {url: string; altText: string | null} | null;
    minPrice: ShopifyMoney;
    hasDiscountedVariant: boolean;
    maxDiscountPercentage: number;
    maxDiscountSavings: number;
};

/** Grid column count for product card layout (1–4 columns). */
export type ProductCardViewMode = "grid1" | "grid2" | "grid3" | "grid4";

/** Props for the unified product card — accepts either raw Shopify data or pre-computed `ProductCardData`. */
export type UnifiedProductCardProps = {
    product: ShopifyProduct | ProductCardData;
    viewMode?: ProductCardViewMode | string;
};

export type CompactProductCardProps = {
    product: ShopifyProduct | ProductCardData;
    className?: string;
    onCartAdd?: () => void;
    onProductClick?: () => void;
};
