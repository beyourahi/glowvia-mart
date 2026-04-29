// UCP Money type
export type UcpMoney = {
    amount: string;
    currencyCode: string;
};

// UCP Media type
export type UcpMedia = {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
    mediaType: "IMAGE" | "VIDEO" | "EXTERNAL_VIDEO" | "MODEL_3D";
};

// UCP Variant type — full variant representation for agents
export type UcpVariant = {
    id: string;
    title: string;
    availableForSale: boolean;
    currentlyNotInStock: boolean;
    quantityAvailable: number | null;
    price: UcpMoney;
    compareAtPrice: UcpMoney | null;
    selectedOptions: Array<{ name: string; value: string }>;
    sku: string | null;
    requiresShipping: boolean;
    checkoutUrl: string;
    sellingPlans: Array<{
        id: string;
        name: string;
        recurringDeliveries: boolean;
        options: Array<{ name: string; value: string }>;
    }>;
};

// UCP Product type — full product representation for agents
export type UcpProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    descriptionHtml: string;
    vendor: string;
    productType: string;
    tags: string[];
    availableForSale: boolean;
    featuredImage: UcpMedia | null;
    images: UcpMedia[];
    priceRange: {
        minVariantPrice: UcpMoney;
        maxVariantPrice: UcpMoney;
    };
    compareAtPriceRange: {
        minVariantPrice: UcpMoney | null;
    };
    options: Array<{
        name: string;
        values: string[];
    }>;
    variants: UcpVariant[];
    seller: {
        name: string;
        url: string;
    };
    extensions: {
        "dev.shopify.catalog.storefront": {
            version: "2026-04-08";
            fields: {
                isGiftCard: boolean;
                collections: Array<{ id: string; handle: string; title: string }>;
            };
        };
    };
};

// UCP page info for cursor pagination
export type UcpPageInfo = {
    hasNextPage: boolean;
    endCursor: string | null;
};

// Return type for toUcpProductPage
export type UcpProductPage = {
    products: UcpProduct[];
    pageInfo: UcpPageInfo;
};

// Return type for toUcpLookupBatch
export type UcpLookupBatch = {
    products: UcpProduct[];
    unresolved: string[];
};
