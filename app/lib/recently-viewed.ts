/**
 * @fileoverview Recently Viewed Products Storage and Management
 *
 * @description
 * Client-side storage system for tracking recently viewed products with dual persistence
 * (localStorage + cookies) and offline-capable full product data. Provides hydration-safe
 * React hooks for managing the recently viewed products list across the storefront.
 *
 * @architecture
 * Dual Storage Strategy:
 * - localStorage: Primary storage with unlimited size for full product data
 * - Cookies: SSR fallback (truncated to 3.5KB) for server-side rendering
 * - Auto-cleanup: Removes expired entries (30 days) and legacy entries without full data
 * - Hydration-safe: React state starts empty, hydrates from localStorage after mount
 *
 * Data Storage:
 * - Max 16 products stored, 10 displayed in UI
 * - Timestamp-based ordering (newest first)
 * - Full product data (title, image, price) for offline display
 * - Legacy migration: Filters out old entries missing full product data
 *
 * @dependencies
 * - React hooks (useState, useEffect)
 * - Browser APIs (localStorage, document.cookie)
 *
 * @related
 * - app/components/RecentlyViewedSection.tsx - Displays recently viewed products
 * - app/routes/products.$handle.tsx - Adds products to recently viewed
 * - app/routes/_index.tsx - Shows recently viewed section on homepage
 */

import {useState, useEffect, useCallback, useMemo} from "react";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Product data stored in recently viewed.
 * Contains all data needed to display product card offline.
 */
export interface RecentlyViewedProduct {
    id: string;
    handle: string;
    timestamp: number;
    // Full product data for offline display
    title: string;
    imageUrl: string | null;
    imageAlt: string | null;
    price: string; // Formatted price (e.g., "$29.99")
    compareAtPrice?: string; // For sale indicators
}

/**
 * Parameters for adding a product to recently viewed.
 * Requires full product data for offline capability.
 */
export interface AddProductParams {
    id: string;
    handle: string;
    title: string;
    imageUrl: string | null;
    imageAlt: string | null;
    price: string;
    compareAtPrice?: string;
}

/**
 * Legacy product data format (before offline enhancement).
 * Used for backward compatibility migration.
 */
interface LegacyRecentlyViewedProduct {
    id: string;
    handle: string;
    timestamp: number;
}

interface RecentlyViewedConfig {
    storageKey: string;
    maxProducts: number;
    expiryDays: number;
}

// Default configuration
const DEFAULT_CONFIG: RecentlyViewedConfig = {
    storageKey: "shopify-recently-viewed",
    maxProducts: 16,
    expiryDays: 30
};

// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

/**
 * Type guard to check if a product is legacy (missing full data).
 * Legacy products are filtered out during load - they'll be re-added
 * with full data on next product view.
 */
function isLegacyProduct(
    product: RecentlyViewedProduct | LegacyRecentlyViewedProduct
): product is LegacyRecentlyViewedProduct {
    return !("title" in product) || !product.title;
}

/**
 * Positive type guard to check if a product has full data.
 * TypeScript handles positive type guards better than negated ones.
 */
function isFullProduct(product: RecentlyViewedProduct | LegacyRecentlyViewedProduct): product is RecentlyViewedProduct {
    return "title" in product && typeof product.title === "string" && product.title.length > 0;
}

/**
 * Load recently viewed products from localStorage.
 * Filters out expired entries and legacy data without full product info.
 */
function loadFromStorage(config: RecentlyViewedConfig): RecentlyViewedProduct[] {
    if (!isBrowser) return [];

    try {
        const stored = localStorage.getItem(config.storageKey);
        if (stored) {
            const parsed = JSON.parse(stored) as (RecentlyViewedProduct | LegacyRecentlyViewedProduct)[];
            if (Array.isArray(parsed)) {
                const expiryTime = config.expiryDays * 24 * 60 * 60 * 1000;
                const now = Date.now();

                // Filter out expired entries AND legacy entries without full data
                // Legacy entries will be re-added with full data on next product view
                return parsed.filter(
                    (product): product is RecentlyViewedProduct =>
                        isFullProduct(product) && now - product.timestamp <= expiryTime
                );
            }
        }
    } catch {
        // Silent fail - return empty array
    }
    return [];
}

// Persist to storage (localStorage + cookie)
function persistToStorage(items: RecentlyViewedProduct[], config: RecentlyViewedConfig) {
    if (!isBrowser) return;

    try {
        const dataToSave = JSON.stringify(items);
        localStorage.setItem(config.storageKey, dataToSave);

        // Also save to cookie for SSR (truncated if too large)
        const maxCookieSize = 3500;
        const cookieData = dataToSave.length <= maxCookieSize ? dataToSave : JSON.stringify(items.slice(0, 6));

        document.cookie = `${config.storageKey}=${encodeURIComponent(cookieData)}; path=/; max-age=${60 * 60 * 24 * config.expiryDays}; SameSite=Lax`;
    } catch {
        // Silent fail
    }
}

/**
 * React hook for accessing recently viewed products
 * Hydration-safe: always starts empty, loads from localStorage after mount
 */
export function useRecentlyViewed(config: RecentlyViewedConfig = DEFAULT_CONFIG) {
    // Start with empty array - hydration safe
    const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydrate from localStorage after mount
    useEffect(() => {
        const stored = loadFromStorage(config);
        setProducts(stored);
        setIsHydrated(true);
    }, [config]);

    // Wrap addProduct in useCallback so that useEffect deps in product pages don't
    // see a new function reference every render — which previously caused an infinite loop:
    // addProduct → setProducts → re-render → new addProduct → effect re-runs → repeat.
    // Using functional setState for setProducts here would not help because addProduct
    // reads fresh from localStorage intentionally to avoid race conditions; the stable
    // dep is config, not products state.
    const addProduct = useCallback(
        (params: AddProductParams) => {
            if (!isBrowser || !params.id || !params.handle) return;

            // Always read fresh from localStorage to avoid race conditions
            // between React state updates and localStorage
            const currentProducts = loadFromStorage(config);
            const now = Date.now();
            const existingIndex = currentProducts.findIndex(p => p.id === params.id);

            // Build full product data
            const productData: RecentlyViewedProduct = {
                id: params.id,
                handle: params.handle,
                timestamp: now,
                title: params.title,
                imageUrl: params.imageUrl,
                imageAlt: params.imageAlt,
                price: params.price,
                compareAtPrice: params.compareAtPrice
            };

            let newProducts: RecentlyViewedProduct[];

            if (existingIndex !== -1) {
                // Update product data and timestamp, move to front
                const updated = [...currentProducts];
                updated.splice(existingIndex, 1);
                newProducts = [productData, ...updated];
            } else {
                // Add new product to front
                newProducts = [productData, ...currentProducts];

                // Enforce max limit
                if (newProducts.length > config.maxProducts) {
                    newProducts = newProducts.slice(0, config.maxProducts);
                }
            }

            // Persist to storage and update React state
            persistToStorage(newProducts, config);
            setProducts(newProducts);
        },
        [config]
    );

    // removeProduct uses functional setState pattern — deps is just config for the localStorage read
    const removeProduct = useCallback(
        (id: string) => {
            if (!isBrowser) return;

            // Read fresh from localStorage
            const currentProducts = loadFromStorage(config);
            const newProducts = currentProducts.filter(p => p.id !== id);
            persistToStorage(newProducts, config);
            setProducts(newProducts);
        },
        [config]
    );

    // clear uses functional setState (setProducts([])) — no dependency on products
    const clear = useCallback(() => {
        if (!isBrowser) return;

        setProducts([]);
        persistToStorage([], config);

        // Also clear cookie
        document.cookie = `${config.storageKey}=; path=/; max-age=0`;
    }, [config]);

    // hasProduct depends on products state — stable when products doesn't change
    const hasProduct = useCallback((id: string) => products.some(p => p.id === id), [products]);

    // Memoize derived arrays to avoid creating new references on every render
    const productIds = useMemo(() => products.map(p => p.id), [products]);
    const productHandles = useMemo(() => products.map(p => p.handle), [products]);

    // Memoize the whole return object so consumers only re-render on actual changes
    return useMemo(
        () => ({
            products,
            productIds,
            productHandles,
            count: products.length,
            hasProducts: products.length > 0,
            isHydrated,
            addProduct,
            removeProduct,
            clear,
            hasProduct
        }),
        [products, productIds, productHandles, isHydrated, addProduct, removeProduct, clear, hasProduct]
    );
}

/**
 * Parse recently viewed products from cookie (for SSR)
 * Use this in loader functions to get initial data.
 * Filters out legacy entries without full product data.
 */
export function parseRecentlyViewedFromCookie(
    cookieHeader: string | null,
    config: RecentlyViewedConfig = DEFAULT_CONFIG
): RecentlyViewedProduct[] {
    if (!cookieHeader) return [];

    try {
        const cookies = cookieHeader.split(";").reduce(
            (acc, cookie) => {
                const [key, value] = cookie.trim().split("=");
                if (key && value) {
                    acc[key] = decodeURIComponent(value);
                }
                return acc;
            },
            {} as Record<string, string>
        );

        const recentlyViewedData = cookies[config.storageKey];
        if (!recentlyViewedData) return [];

        const parsed = JSON.parse(recentlyViewedData) as (RecentlyViewedProduct | LegacyRecentlyViewedProduct)[];
        if (!Array.isArray(parsed)) return [];

        // Filter expired entries AND legacy entries without full data
        const now = Date.now();
        const expiryTime = config.expiryDays * 24 * 60 * 60 * 1000;

        return parsed
            .filter(
                (item): item is RecentlyViewedProduct =>
                    item != null &&
                    typeof item === "object" &&
                    typeof item.id === "string" &&
                    typeof item.handle === "string" &&
                    typeof item.timestamp === "number" &&
                    isFullProduct(item) &&
                    now - item.timestamp < expiryTime
            )
            .slice(0, 10); // Limit to display count
    } catch {
        return [];
    }
}

/**
 * Get recently viewed product IDs from cookie (for SSR queries)
 */
export function getRecentlyViewedIds(
    cookieHeader: string | null,
    config: RecentlyViewedConfig = DEFAULT_CONFIG
): string[] {
    const products = parseRecentlyViewedFromCookie(cookieHeader, config);
    return products.map(p => p.id);
}
