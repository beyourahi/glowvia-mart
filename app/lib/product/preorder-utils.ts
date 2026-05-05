type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type ShopifyImage = {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
};

type ShopifyProductOption = {
    id: string;
    name: string;
    values: string[];
};

type ShopifySelectedOption = {
    name: string;
    value: string;
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

type ProductCardData = {
    id: string;
    handle: string;
    title: string;
    productType: string;
    availableForSale: boolean;
    primaryVariant: {
        id: string;
        price: ShopifyMoney;
        compareAtPrice: ShopifyMoney | null;
        availableForSale: boolean;
        image: {url: string; altText: string | null} | null;
    } | null;
    primaryImage: {url: string; altText: string | null} | null;
    minPrice: ShopifyMoney;
    hasDiscountedVariant: boolean;
    maxDiscountPercentage: number;
    maxDiscountSavings: number;
};

/**
 * @fileoverview Pre-order Product Detection
 *
 * Detects pre-order products by checking for a `preorder` tag (case-insensitive,
 * with hyphen/space normalization). Used by the PDP and product cards to swap
 * the "Add to Bag" CTA for a "Pre-order" label.
 */

const normalizeTag = (tag: string): string => {
    return tag.toLowerCase().replace(/[-\s]/g, "");
};

const PREORDER_TAG_NORMALIZED = "preorder";

export const isPreorderProduct = (product: ShopifyProduct | ProductCardData | {tags?: string[]}): boolean => {
    if (!product) return false;

    const tags = "tags" in product && Array.isArray(product.tags) ? product.tags : [];

    return tags.some(tag => normalizeTag(tag) === PREORDER_TAG_NORMALIZED);
};
