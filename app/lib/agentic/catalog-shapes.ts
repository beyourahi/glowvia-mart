import type {
    UcpMoney,
    UcpMedia,
    UcpVariant,
    UcpProduct,
    UcpProductPage,
    UcpLookupBatch,
    UcpPageInfo,
} from "./ucp-catalog-types";
import {buildCartPermalink, extractNumericVariantId} from "~/lib/cart-permalink";

// ── Storefront API node types (minimal — shaped for what we actually query) ──

type StorefrontMoney = { amount: string; currencyCode: string } | null | undefined;

type StorefrontImage = {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
} | null | undefined;

type StorefrontVariantNode = {
    id: string;
    title?: string | null;
    availableForSale?: boolean | null;
    currentlyNotInStock?: boolean | null;
    quantityAvailable?: number | null;
    price?: StorefrontMoney;
    compareAtPrice?: StorefrontMoney;
    selectedOptions?: Array<{ name: string; value: string }> | null;
    sku?: string | null;
    requiresShipping?: boolean | null;
    sellingPlanAllocations?: {
        nodes: Array<{
            sellingPlan: {
                id: string;
                name: string;
                recurringDeliveries?: boolean | null;
                options: Array<{ name: string; value: string }>;
            };
        }>;
    } | null;
};

type StorefrontProductNode = {
    id: string;
    title: string;
    handle: string;
    description?: string | null;
    descriptionHtml?: string | null;
    vendor?: string | null;
    productType?: string | null;
    tags?: string[] | null;
    availableForSale?: boolean | null;
    featuredImage?: StorefrontImage;
    images?: { nodes: StorefrontImage[] } | null;
    priceRange?: {
        minVariantPrice?: StorefrontMoney;
        maxVariantPrice?: StorefrontMoney;
    } | null;
    compareAtPriceRange?: {
        minVariantPrice?: StorefrontMoney;
    } | null;
    options?: Array<{
        name: string;
        optionValues?: Array<{ name: string }> | null;
        values?: string[] | null;
    }> | null;
    variants?: { nodes: StorefrontVariantNode[] } | null;
    isGiftCard?: boolean | null;
    collections?: { nodes: Array<{ id: string; handle: string; title: string }> } | null;
};

type StorefrontProductConnection = {
    nodes: StorefrontProductNode[];
    pageInfo?: {
        hasNextPage: boolean;
        endCursor?: string | null;
    } | null;
};

// ── Scalar helpers ────────────────────────────────────────────────────────────

export function toUcpMoney(node: StorefrontMoney): UcpMoney {
    if (!node) return { amount: "0.00", currencyCode: "USD" };
    return { amount: node.amount, currencyCode: node.currencyCode };
}

export function toUcpImage(node: StorefrontImage): UcpMedia | null {
    if (!node) return null;
    return {
        url: node.url,
        altText: node.altText ?? null,
        width: node.width ?? null,
        height: node.height ?? null,
        mediaType: "IMAGE",
    };
}

// ── Variant ───────────────────────────────────────────────────────────────────

export function toUcpVariant(node: StorefrontVariantNode, storeUrl?: string): UcpVariant {
    // Build checkout URL from numeric variant ID when a store URL is available
    const numericId = extractNumericVariantId(node.id);
    const checkoutUrl = storeUrl ? buildCartPermalink(storeUrl, {variantId: numericId}) : "#";

    // Deduplicate selling plans by plan id from allocation nodes
    const seenPlanIds = new Set<string>();
    const sellingPlans: UcpVariant["sellingPlans"] = [];
    for (const allocation of node.sellingPlanAllocations?.nodes ?? []) {
        const plan = allocation.sellingPlan;
        if (seenPlanIds.has(plan.id)) continue;
        seenPlanIds.add(plan.id);
        sellingPlans.push({
            id: plan.id,
            name: plan.name,
            recurringDeliveries: plan.recurringDeliveries ?? false,
            options: plan.options,
        });
    }

    return {
        id: node.id,
        title: node.title ?? "",
        availableForSale: node.availableForSale ?? false,
        currentlyNotInStock: node.currentlyNotInStock ?? false,
        quantityAvailable: node.quantityAvailable ?? null,
        price: toUcpMoney(node.price),
        compareAtPrice: node.compareAtPrice ? toUcpMoney(node.compareAtPrice) : null,
        selectedOptions: node.selectedOptions ?? [],
        sku: node.sku ?? null,
        requiresShipping: node.requiresShipping ?? true,
        checkoutUrl,
        sellingPlans,
    };
}

// ── Product ───────────────────────────────────────────────────────────────────

export function toUcpProduct(node: StorefrontProductNode, storeUrl?: string): UcpProduct {
    const featuredImage = toUcpImage(node.featuredImage);

    // Collect flat image list; fall back to featuredImage only when images field is absent
    const images: UcpMedia[] = node.images?.nodes
        ? node.images.nodes.flatMap(img => {
              const media = toUcpImage(img);
              return media ? [media] : [];
          })
        : featuredImage
          ? [featuredImage]
          : [];

    // Prefer optionValues[].name; fall back to legacy values[] string array
    const options = (node.options ?? []).map(opt => ({
        name: opt.name,
        values: opt.optionValues
            ? opt.optionValues.map(v => v.name)
            : (opt.values ?? []),
    }));

    const variants = (node.variants?.nodes ?? []).map(v => toUcpVariant(v, storeUrl));

    const collections = node.collections?.nodes ?? [];

    return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        description: node.description ?? "",
        descriptionHtml: node.descriptionHtml ?? "",
        vendor: node.vendor ?? "",
        productType: node.productType ?? "",
        tags: node.tags ?? [],
        availableForSale: node.availableForSale ?? false,
        featuredImage,
        images,
        priceRange: {
            minVariantPrice: toUcpMoney(node.priceRange?.minVariantPrice),
            maxVariantPrice: toUcpMoney(node.priceRange?.maxVariantPrice),
        },
        compareAtPriceRange: {
            minVariantPrice: node.compareAtPriceRange?.minVariantPrice
                ? toUcpMoney(node.compareAtPriceRange.minVariantPrice)
                : null,
        },
        options,
        variants,
        seller: {
            name: node.vendor || "Store",
            url: storeUrl || "#",
        },
        extensions: {
            "dev.shopify.catalog.storefront": {
                version: "2026-04-08",
                fields: {
                    isGiftCard: node.isGiftCard ?? false,
                    collections: collections.map(c => ({
                        id: c.id,
                        handle: c.handle,
                        title: c.title,
                    })),
                },
            },
        },
    };
}

// ── Page-level helpers ────────────────────────────────────────────────────────

export function toUcpProductPage(
    connection: StorefrontProductConnection,
    storeUrl?: string
): UcpProductPage {
    const products = connection.nodes.map(n => toUcpProduct(n, storeUrl));
    const pageInfo: UcpPageInfo = {
        hasNextPage: connection.pageInfo?.hasNextPage ?? false,
        endCursor: connection.pageInfo?.endCursor ?? null,
    };
    return { products, pageInfo };
}

export function toUcpLookupBatch(
    nodes: Array<unknown>,
    requestedIds: string[]
): UcpLookupBatch {
    const resolvedProducts: UcpProduct[] = [];
    const resolvedIds = new Set<string>();

    for (const raw of nodes) {
        const node = raw as StorefrontProductNode | null;
        if (!node) continue;
        resolvedProducts.push(toUcpProduct(node));
        resolvedIds.add(node.id);
    }

    const unresolved = requestedIds.filter(id => !resolvedIds.has(id));

    return { products: resolvedProducts, unresolved };
}
