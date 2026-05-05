/**
 * @fileoverview Storefront Data Adapter
 *
 * Provides a `DataAdapter` interface that wraps the Shopify Hydrogen storefront
 * client with domain-level methods for the agentic layer. All MCP tool handlers
 * go through this adapter rather than calling the storefront client directly,
 * keeping query logic centralized and making the agentic layer testable.
 *
 * The adapter is created once per request in `lib/context.ts` and injected into
 * the Hydrogen router context as `context.dataAdapter`.
 */

import {CacheCustom} from "@shopify/hydrogen";
import {AGENT_SEARCH_QUERY} from "~/lib/queries/search";
import {LOOKUP_NODES_QUERY} from "~/lib/queries/lookup";
import {PRODUCT_BY_ID_QUERY} from "~/lib/queries/product";
import {toUcpProductPage, toUcpProduct, toUcpLookupBatch} from "~/lib/agentic/catalog-shapes";
import type {UcpProduct, UcpProductPage} from "~/lib/agentic/ucp-catalog-types";

/** The underlying data source backing this adapter (currently Shopify only). */
export type DataAdapterSource = "shopify";

/**
 * Domain-level data access interface for the agentic layer.
 *
 * Wraps the Hydrogen storefront client with typed catalog methods so MCP tool
 * handlers never construct raw GraphQL strings inline. The `query` method is
 * exposed for cases where tools need ad-hoc access to the Storefront API.
 */
export interface DataAdapter {
    readonly source: DataAdapterSource;
    /** Run an arbitrary Storefront API GraphQL query with optional variables and cache policy. */
    query<T = any>(query: string, options?: {variables?: Record<string, unknown>; cache?: any}): Promise<T>;
    /** Cache policy: no caching (for agent requests that must be fresh). */
    CacheNone(): any;
    /** Cache policy: long-lived (up to ~6 hours total with SWR). */
    CacheLong(): any;
    /** Cache policy: short-lived (Hydrogen default short window). */
    CacheShort(): any;
    /** Full-text product search returning a UCP product page. */
    searchCatalog(variables: {
        term: string;
        first?: number;
        after?: string;
        country?: string;
        language?: string;
    }): Promise<UcpProductPage>;
    /** Fetch a single product by its Shopify GID. Returns null when not found. */
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
    /** Fetch multiple products by GID in a single Storefront API `nodes` query. */
    bulkLookupProducts(variables: {
        ids: string[];
        country?: string;
        language?: string;
    }): Promise<UcpProduct[]>;
}

/** Minimal Hydrogen storefront client interface needed to construct an adapter. */
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

/**
 * Create a `DataAdapter` backed by the Shopify Storefront API.
 *
 * Validates env credentials on creation (warns in dev if missing or malformed)
 * then returns the Shopify adapter. Currently Shopify is the only supported source.
 *
 * @param storefront - Hydrogen storefront client from `createHydrogenRouterContext`
 * @param env - Environment bindings (reads `PUBLIC_STORE_DOMAIN` and `PUBLIC_STOREFRONT_API_TOKEN`)
 */
export function createDataAdapter(storefront: StorefrontLike, env: EnvLike): DataAdapter {
    validateShopifyEnv(env);
    return createShopifyAdapter(storefront);
}

/**
 * Warn in dev when Shopify credentials are missing or have an unexpected format.
 * Never throws — a missing env is handled gracefully by the adapter at runtime.
 */
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

/** Build the concrete Shopify `DataAdapter` implementation. */
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
