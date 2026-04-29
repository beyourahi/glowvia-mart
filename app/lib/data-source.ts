import {CacheCustom} from "@shopify/hydrogen";
import {AGENT_SEARCH_QUERY} from "~/lib/queries/search";
import {LOOKUP_NODES_QUERY} from "~/lib/queries/lookup";
import {PRODUCT_BY_ID_QUERY} from "~/lib/queries/product";
import {toUcpProductPage, toUcpProduct, toUcpLookupBatch} from "~/lib/agentic/catalog-shapes";
import type {UcpProduct, UcpProductPage} from "~/lib/agentic/ucp-catalog-types";

export type DataAdapterSource = "shopify";

export interface DataAdapter {
    readonly source: DataAdapterSource;
    query<T = any>(query: string, options?: {variables?: Record<string, unknown>; cache?: any}): Promise<T>;
    CacheNone(): any;
    CacheLong(): any;
    CacheShort(): any;
    searchCatalog(variables: {
        term: string;
        first?: number;
        after?: string;
        country?: string;
        language?: string;
    }): Promise<UcpProductPage>;
    lookupProduct(variables: {
        id: string;
        country?: string;
        language?: string;
    }): Promise<UcpProduct | null>;
    /** Resolves a product from a variant GID. Returns null if the GID is not a Product node. */
    lookupByVariant(variables: {
        variantId: string;
        country?: string;
        language?: string;
    }): Promise<UcpProduct | null>;
    bulkLookupProducts(variables: {
        ids: string[];
        country?: string;
        language?: string;
    }): Promise<UcpProduct[]>;
}

export type StorefrontLike = {
    query<T = any>(query: string, options?: {variables?: Record<string, unknown>; cache?: any}): Promise<T>;
    CacheNone(): any;
    CacheLong(): any;
    CacheShort(): any;
};

type EnvLike = {
    PUBLIC_STORE_DOMAIN?: string;
    PUBLIC_STOREFRONT_API_TOKEN?: string;
};

const DOMAIN_PATTERN = /^(?!https?:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const TOKEN_PATTERN = /^[A-Za-z0-9_=-]{20,}$/;

export function createDataAdapter(storefront: StorefrontLike, env: EnvLike): DataAdapter {
    validateShopifyEnv(env);
    return createShopifyAdapter(storefront);
}

function validateShopifyEnv(env: EnvLike): void {
    const domain = env.PUBLIC_STORE_DOMAIN?.trim();
    const token = env.PUBLIC_STOREFRONT_API_TOKEN?.trim();

    if (!domain || !token) {
        if (import.meta.env.DEV) {
            console.warn("[DataAdapter] Missing PUBLIC_STORE_DOMAIN or PUBLIC_STOREFRONT_API_TOKEN");
        }
        return;
    }

    if (!DOMAIN_PATTERN.test(domain) || !TOKEN_PATTERN.test(token)) {
        if (import.meta.env.DEV) {
            console.warn("[DataAdapter] Invalid PUBLIC_STORE_DOMAIN or PUBLIC_STOREFRONT_API_TOKEN format");
        }
    }
}

function createShopifyAdapter(storefront: StorefrontLike): DataAdapter {
    return {
        source: "shopify",
        query: (query, options) => storefront.query(query, options),
        CacheNone: () => storefront.CacheNone(),
        // Reduced from default 23hr stale window to 5hr — total max cache age: 6hr
        CacheLong: () => CacheCustom({maxAge: 3600, staleWhileRevalidate: 3600 * 5}),
        CacheShort: () => storefront.CacheShort(),

        async searchCatalog({term, first = 20, after, country = "US", language = "EN"}) {
            const result = await storefront.query(AGENT_SEARCH_QUERY, {
                variables: {term, first, after: after ?? null, country, language},
                cache: storefront.CacheNone()
            });
            const connection = result.products ?? {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}};
            return toUcpProductPage(connection, "");
        },

        async lookupProduct({id, country = "US", language = "EN"}) {
            const result = await storefront.query(PRODUCT_BY_ID_QUERY, {
                variables: {id, country, language},
                cache: storefront.CacheNone()
            });
            const node = result.product;
            return node ? toUcpProduct(node, "") : null;
        },

        async lookupByVariant({variantId, country = "US", language = "EN"}) {
            // LOOKUP_NODES_QUERY spreads AgentLookupProduct on Product nodes only;
            // variant GIDs resolve to ProductVariant and will not match, returning null.
            const result = await storefront.query(LOOKUP_NODES_QUERY, {
                variables: {ids: [variantId], country, language},
                cache: storefront.CacheNone()
            });
            const nodes = (result.nodes ?? []) as Array<Record<string, unknown> | null>;
            const productNode = nodes.find(n => n && n.__typename === "Product") ?? null;
            return productNode ? toUcpProduct(productNode as any, "") : null;
        },

        async bulkLookupProducts({ids, country = "US", language = "EN"}) {
            const result = await storefront.query(LOOKUP_NODES_QUERY, {
                variables: {ids, country, language},
                cache: storefront.CacheNone()
            });
            const nodes = (result.nodes ?? []) as Array<Record<string, unknown> | null>;
            const productNodes = nodes.map(n => (n && n.__typename === "Product" ? n : null));
            const {products} = toUcpLookupBatch(productNodes as any, ids);
            return products;
        }
    };
}
