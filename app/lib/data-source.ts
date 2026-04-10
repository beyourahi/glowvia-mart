import {CacheCustom} from "@shopify/hydrogen";

export type DataAdapterSource = "shopify";

export interface DataAdapter {
    readonly source: DataAdapterSource;
    query<T = any>(query: string, options?: {variables?: Record<string, unknown>; cache?: any}): Promise<T>;
    CacheNone(): any;
    CacheLong(): any;
    CacheShort(): any;
}

type StorefrontLike = {
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
        CacheShort: () => storefront.CacheShort()
    };
}
