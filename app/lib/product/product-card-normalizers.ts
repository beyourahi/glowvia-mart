/**
 * @fileoverview Product Data Normalization for Card Display
 *
 * Transforms raw Shopify Storefront API product shapes (which vary slightly between
 * query contexts) into the canonical `ShopifyProduct` type used by product card
 * utilities. Each `from*` function handles the field variations specific to its source:
 * - `fromStorefrontNode` — standard collection/search nodes
 * - `fromSaleProduct` — sale page products (may use `featuredImage` fallback)
 * - `fromWishlistProduct` — wishlist products (filters variants with prices)
 * - `fromOrderHistoryProduct` — order line items (reconstructs a product from sparse fields)
 * - `fromCartSuggestionProduct` / `fromRecentlyViewedAllProducts` — recommendation contexts
 */

import type {
    ShopifyImage,
    ShopifyMoney,
    ShopifyProduct,
    ShopifyProductOption,
    ShopifyProductSeo,
    ShopifyProductVariant
} from "~/lib/types/product-card";

type Maybe<T> = T | null | undefined;

type Edge<T> = {node: T};

const DEFAULT_MONEY: ShopifyMoney = {
    amount: "0",
    currencyCode: "USD"
};

const DEFAULT_SEO: ShopifyProductSeo = {
    title: null,
    description: null
};

const normalizeMoney = (money: Maybe<Partial<ShopifyMoney>>, fallback: ShopifyMoney = DEFAULT_MONEY): ShopifyMoney => {
    if (!money?.amount || !money.currencyCode) return fallback;
    return {
        amount: String(money.amount),
        currencyCode: String(money.currencyCode)
    };
};

const normalizeImage = (image: Maybe<Partial<ShopifyImage>>): ShopifyImage | null => {
    if (!image?.url) return null;
    return {
        id: image.id ? String(image.id) : undefined,
        url: String(image.url),
        altText: image.altText ?? null,
        width: typeof image.width === "number" ? image.width : undefined,
        height: typeof image.height === "number" ? image.height : undefined
    };
};

const normalizeVariant = (variant: any, fallbackMoney: ShopifyMoney): ShopifyProductVariant => {
    const image = normalizeImage(variant?.image);
    const selectedOptions = Array.isArray(variant?.selectedOptions)
        ? variant.selectedOptions
              .filter((option: any) => option?.name && option?.value)
              .map((option: any) => ({
                  name: String(option.name),
                  value: String(option.value)
              }))
        : [];

    return {
        id: String(variant?.id ?? ""),
        title: variant?.title ? String(variant.title) : "",
        price: normalizeMoney(variant?.price, fallbackMoney),
        compareAtPrice: variant?.compareAtPrice ? normalizeMoney(variant.compareAtPrice, fallbackMoney) : null,
        selectedOptions,
        availableForSale: Boolean(variant?.availableForSale),
        quantityAvailable: typeof variant?.quantityAvailable === "number" ? variant.quantityAvailable : null,
        image
    };
};

const normalizeVariants = (product: any, fallbackMoney: ShopifyMoney): Array<Edge<ShopifyProductVariant>> => {
    const edgesSource = Array.isArray(product?.variants?.edges) ? product.variants.edges : [];
    const nodesSource = Array.isArray(product?.variants?.nodes) ? product.variants.nodes : [];
    const rawVariants = edgesSource.length > 0 ? edgesSource.map((edge: any) => edge?.node) : nodesSource;

    return rawVariants
        .filter((variant: any) => variant?.id)
        .map((variant: any) => ({node: normalizeVariant(variant, fallbackMoney)}));
};

const normalizeImages = (product: any): Array<Edge<ShopifyImage>> => {
    const edgesSource = Array.isArray(product?.images?.edges) ? product.images.edges : [];
    const nodesSource = Array.isArray(product?.images?.nodes) ? product.images.nodes : [];
    const featured = normalizeImage(product?.featuredImage);

    const rawImages = edgesSource.length > 0 ? edgesSource.map((edge: any) => edge?.node) : nodesSource;
    const normalized = rawImages.map((image: any) => normalizeImage(image)).filter(Boolean) as ShopifyImage[];

    if (normalized.length > 0) {
        return normalized.map(node => ({node}));
    }

    return featured ? [{node: featured}] : [];
};

const normalizeOptions = (options: any): ShopifyProductOption[] => {
    if (!Array.isArray(options)) return [];
    return options
        .filter((option: any) => option?.id && option?.name)
        .map((option: any) => ({
            id: String(option.id),
            name: String(option.name),
            values: Array.isArray(option.values) ? option.values.map((value: any) => String(value)) : []
        }));
};

const normalizeProduct = (product: any): ShopifyProduct => {
    const minVariantPrice = normalizeMoney(product?.priceRange?.minVariantPrice, DEFAULT_MONEY);
    const maxVariantPrice = normalizeMoney(product?.priceRange?.maxVariantPrice, minVariantPrice);

    return {
        id: String(product?.id ?? ""),
        title: String(product?.title ?? ""),
        handle: String(product?.handle ?? ""),
        description: String(product?.description ?? ""),
        tags: Array.isArray(product?.tags) ? product.tags.map((tag: any) => String(tag)) : [],
        vendor: String(product?.vendor ?? ""),
        productType: String(product?.productType ?? ""),
        availableForSale: Boolean(product?.availableForSale),
        options: normalizeOptions(product?.options),
        variants: {
            edges: normalizeVariants(product, minVariantPrice)
        },
        images: {
            edges: normalizeImages(product)
        },
        priceRange: {
            minVariantPrice,
            maxVariantPrice
        },
        seo: {
            title: product?.seo?.title ?? DEFAULT_SEO.title,
            description: product?.seo?.description ?? DEFAULT_SEO.description
        }
    };
};

export const fromStorefrontNode = (product: any): ShopifyProduct => {
    return normalizeProduct(product);
};

export const fromSaleProduct = (product: any): ShopifyProduct => {
    const base = normalizeProduct(product);
    if (base.images.edges.length === 0 && product?.featuredImage) {
        const featured = normalizeImage(product.featuredImage);
        if (featured) {
            base.images.edges = [{node: featured}];
        }
    }
    return base;
};

export const fromWishlistProduct = (product: any): ShopifyProduct => {
    const base = normalizeProduct(product);
    const variantsWithPrice = base.variants.edges.filter(edge => edge.node.price);
    base.variants.edges = variantsWithPrice;
    return base;
};

export const fromOrderHistoryProduct = (product: any): ShopifyProduct => {
    const money = normalizeMoney(product?.price, DEFAULT_MONEY);
    const image = normalizeImage(product?.image);
    const handle = product?.handle ? String(product.handle) : "";

    const variant: ShopifyProductVariant | null =
        product?.variant?.id || product?.variantId
            ? {
                  id: String(product?.variant?.id ?? product?.variantId),
                  title: product?.variant?.title ? String(product.variant.title) : "",
                  price: money,
                  compareAtPrice: null,
                  selectedOptions: [],
                  availableForSale: Boolean(product?.variant?.availableForSale ?? true),
                  quantityAvailable: null,
                  image
              }
            : null;

    return {
        id: String(product?.id ?? ""),
        title: String(product?.title ?? product?.name ?? "Product"),
        handle,
        description: "",
        tags: [],
        vendor: "",
        productType: "",
        availableForSale: Boolean(product?.variant?.availableForSale ?? true),
        options: [],
        variants: {
            edges: variant ? [{node: variant}] : []
        },
        images: {
            edges: image ? [{node: image}] : []
        },
        priceRange: {
            minVariantPrice: money,
            maxVariantPrice: money
        },
        seo: DEFAULT_SEO
    };
};

export const fromCartSuggestionProduct = (product: any): ShopifyProduct => {
    const base = normalizeProduct(product);
    if (base.images.edges.length === 0 && product?.featuredImage) {
        const featured = normalizeImage(product.featuredImage);
        if (featured) {
            base.images.edges = [{node: featured}];
        }
    }
    return base;
};

export const fromRecentlyViewedAllProducts = (product: any): ShopifyProduct => {
    return normalizeProduct(product);
};
