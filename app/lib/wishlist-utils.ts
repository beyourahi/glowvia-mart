/**
 * @fileoverview Wishlist localStorage utilities and base64url share URL helpers.
 *
 * Stores numeric IDs (not full GIDs) under `"wishlist_product_ids"`. All browser APIs
 * are guarded with try/catch for SSR safety. Share URLs use base64url encoding:
 * `encodeWishlistIds` / `decodeWishlistIds` / `generateShareableWishlistUrl`.
 *
 * @related
 * - app/lib/wishlist-context.tsx - React Context that wraps these utilities
 * - app/routes/wishlist.tsx - Wishlist page
 * - app/routes/api.wishlist-products.tsx - Fetches products by numeric ID
 */

const STORAGE_KEY = "wishlist_product_ids";

/**
 * Extract numeric ID from Shopify GID
 * @example extractNumericId("gid://shopify/Product/8547362819123") => 8547362819123
 */
export function extractNumericId(gid: string): number {
    const numericPart = gid.split("/").pop();
    return parseInt(numericPart || "0", 10);
}

/**
 * Reconstruct full Shopify GID from numeric ID
 * @example reconstructGid(8547362819123) => "gid://shopify/Product/8547362819123"
 */
export function reconstructGid(numericId: number): string {
    return `gid://shopify/Product/${numericId}`;
}

/**
 * Reconstruct multiple GIDs for GraphQL queries
 * @example reconstructGids([123, 456]) => ["gid://shopify/Product/123", "gid://shopify/Product/456"]
 */
export function reconstructGids(numericIds: number[]): string[] {
    return numericIds.map(reconstructGid);
}

/**
 * Check if localStorage is available
 * Returns false in SSR, private browsing, or when storage is full
 */
export function isLocalStorageAvailable(): boolean {
    try {
        const testKey = "__wishlist_test__";
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

/**
 * Read wishlist IDs from localStorage
 * Returns empty array if no data or on error
 */
export function getWishlistIds(): number[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored) as unknown;

        // Type guard: ensure it's an array of numbers
        if (Array.isArray(parsed) && parsed.every((item): item is number => typeof item === "number")) {
            return parsed;
        }

        return [];
    } catch {
        // Ignore localStorage errors (SSR, private browsing, etc.)
        return [];
    }
}

/**
 * Write wishlist IDs to localStorage
 */
export function setWishlistIds(ids: number[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
        // Ignore localStorage errors (quota exceeded, etc.)
    }
}

/**
 * Add a product ID to the wishlist
 * @param numericId - The numeric product ID to add
 * @returns The updated wishlist array
 */
export function addToWishlist(numericId: number): number[] {
    const current = getWishlistIds();
    if (current.includes(numericId)) return current;
    const updated = [...current, numericId];
    setWishlistIds(updated);
    return updated;
}

/**
 * Remove a product ID from the wishlist
 * @param numericId - The numeric product ID to remove
 * @returns The updated wishlist array
 */
export function removeFromWishlist(numericId: number): number[] {
    const current = getWishlistIds();
    const updated = current.filter(id => id !== numericId);
    setWishlistIds(updated);
    return updated;
}

/**
 * Check if a product ID is in the wishlist
 * @param numericId - The numeric product ID to check
 */
export function isInWishlist(numericId: number): boolean {
    return getWishlistIds().includes(numericId);
}

/**
 * Clear all items from the wishlist
 */
export function clearWishlist(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore localStorage errors
    }
}

/**
 * Get the count of items in the wishlist
 */
export function getWishlistCount(): number {
    return getWishlistIds().length;
}

/**
 * Encode wishlist IDs for sharing via URL
 * Uses base64url encoding with compression (comma-separated IDs)
 * @example encodeWishlistIds([123, 456, 789]) => "MTIzLDQ1Niw3ODk"
 */
export function encodeWishlistIds(ids: number[]): string {
    if (ids.length === 0) return "";

    // Join IDs with commas and encode to base64url
    const joined = ids.join(",");
    const encoded = btoa(joined)
        // Convert to URL-safe base64
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    return encoded;
}

/**
 * Decode wishlist IDs from a shared URL
 * @example decodeWishlistIds("MTIzLDQ1Niw3ODk") => [123, 456, 789]
 */
export function decodeWishlistIds(encoded: string): number[] {
    if (!encoded) return [];

    try {
        // Convert from URL-safe base64 back to standard base64
        let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

        // Add padding if needed
        while (base64.length % 4 !== 0) {
            base64 += "=";
        }

        const decoded = atob(base64);
        const ids = decoded.split(",").map(id => parseInt(id, 10));

        // Filter out invalid IDs
        return ids.filter(id => !isNaN(id) && id > 0);
    } catch {
        return [];
    }
}

/**
 * Generate a shareable wishlist URL
 * @param baseUrl - The base URL of the site (e.g., "https://store.com")
 * @param ids - Array of numeric product IDs
 */
export function generateShareableWishlistUrl(baseUrl: string, ids: number[]): string {
    if (ids.length === 0) return baseUrl;

    const encoded = encodeWishlistIds(ids);
    return `${baseUrl}/wishlist/share?ids=${encoded}`;
}
