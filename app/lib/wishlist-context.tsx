/**
 * @fileoverview Wishlist State Management Context
 *
 * @description
 * Provides application-wide wishlist functionality via React Context.
 * Handles persistent storage of user's saved products with cross-tab
 * synchronization and SSR-safe hydration.
 *
 * @architecture
 * State Management:
 * - Context provides global wishlist state
 * - localStorage for persistence (never expires)
 * - State hydrates client-side to prevent SSR mismatch
 * - Cross-tab sync via window.storage event
 *
 * Data Flow:
 * 1. Provider wraps app in root.tsx
 * 2. Components access via useWishlist() hook
 * 3. Changes persist to localStorage immediately
 * 4. Other tabs receive updates via storage event
 *
 * @features
 * - localStorage persistence (never expires)
 * - SSR-safe hydration (prevents hydration mismatch)
 * - Cross-tab synchronization via storage event
 * - Optimistic UI updates
 * - Undo support (restore single item or all)
 *
 * @dependencies
 * - React Context API
 * - wishlist-utils.ts - Low-level storage operations
 *
 * @related
 * - root.tsx - Wraps app with WishlistProvider
 * - WishlistButton.tsx - Toggle button component
 * - wishlist.tsx - Wishlist page route
 * - wishlist-utils.ts - Storage utilities
 *
 * @usage
 * ```tsx
 * // In root.tsx
 * <WishlistProvider>
 *   <App />
 * </WishlistProvider>
 *
 * // In components
 * const { add, remove, has, count } = useWishlist();
 * ```
 */

import {createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode} from "react";
import {extractNumericId, getWishlistIds, setWishlistIds, clearWishlist as clearStorage} from "./wishlist-utils";

// =============================================================================
// TYPES
// =============================================================================

export interface WishlistContextType {
    /** Array of numeric product IDs in the wishlist */
    ids: number[];
    /** Number of items in the wishlist */
    count: number;
    /** Whether the wishlist has been loaded from localStorage */
    isHydrated: boolean;
    /** Add a product to the wishlist (accepts full GID) */
    add: (productId: string) => void;
    /** Remove a product from the wishlist (accepts full GID) */
    remove: (productId: string) => void;
    /** Toggle a product in the wishlist (accepts full GID) */
    toggle: (productId: string) => void;
    /** Check if a product is in the wishlist (accepts full GID) */
    has: (productId: string) => boolean;
    /** Clear all items from the wishlist */
    clear: () => void;
    /** Restore a specific product ID (for undo single item) */
    restore: (numericId: number) => void;
    /** Restore multiple product IDs (for undo clear all) */
    restoreMany: (numericIds: number[]) => void;
}

interface WishlistProviderProps {
    children: ReactNode;
}

// =============================================================================
// CONTEXT
// =============================================================================

const WishlistContext = createContext<WishlistContextType | null>(null);

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_WISHLIST: WishlistContextType = {
    ids: [],
    count: 0,
    isHydrated: false,
    add: () => {},
    remove: () => {},
    toggle: () => {},
    has: () => false,
    clear: () => {},
    restore: () => {},
    restoreMany: () => {}
};

// =============================================================================
// PROVIDER
// =============================================================================

/**
 * Provider component that wraps the application to provide wishlist functionality
 * Use at the root level (in root.tsx) to make wishlist available everywhere
 */
export function WishlistProvider({children}: WishlistProviderProps) {
    // Start with empty array to prevent SSR hydration mismatch
    const [ids, setIds] = useState<number[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load wishlist from localStorage on mount (client-side only)
    useEffect(() => {
        const storedIds = getWishlistIds();
        setIds(storedIds);
        setIsHydrated(true);
    }, []);

    // Cross-tab synchronization via storage event
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "wishlist_product_ids") {
                const storedIds = getWishlistIds();
                setIds(storedIds);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // All mutating callbacks use functional setState so they never close over stale ids —
    // this means their dep arrays can be [] (truly stable references across all renders).
    // This prevents every wishlist consumer from re-rendering unnecessarily.

    // Add product to wishlist
    const add = useCallback((productId: string) => {
        const numericId = extractNumericId(productId);
        if (numericId === 0) return;

        setIds(prev => {
            // Prevent duplicates
            if (prev.includes(numericId)) return prev;
            const updated = [...prev, numericId];
            setWishlistIds(updated);
            return updated;
        });
    }, []);

    // Remove product from wishlist
    const remove = useCallback((productId: string) => {
        const numericId = extractNumericId(productId);
        if (numericId === 0) return;

        setIds(prev => {
            const updated = prev.filter(id => id !== numericId);
            setWishlistIds(updated);
            return updated;
        });
    }, []);

    // Toggle product in wishlist
    const toggle = useCallback((productId: string) => {
        const numericId = extractNumericId(productId);
        if (numericId === 0) return;

        setIds(prev => {
            const exists = prev.includes(numericId);
            const updated = exists ? prev.filter(id => id !== numericId) : [...prev, numericId];
            setWishlistIds(updated);
            return updated;
        });
    }, []);

    // Check if product is in wishlist — depends on ids so consumers re-render when ids change
    const has = useCallback(
        (productId: string): boolean => {
            const numericId = extractNumericId(productId);
            return ids.includes(numericId);
        },
        [ids]
    );

    // Clear all items from wishlist
    const clear = useCallback(() => {
        setIds([]);
        clearStorage();
    }, []);

    // Restore a single product by numeric ID (for undo single remove)
    const restore = useCallback((numericId: number) => {
        if (numericId === 0) return;

        setIds(prev => {
            // Prevent duplicates
            if (prev.includes(numericId)) return prev;
            const updated = [...prev, numericId];
            setWishlistIds(updated);
            return updated;
        });
    }, []);

    // Restore multiple products by numeric IDs (for undo clear all)
    const restoreMany = useCallback((numericIds: number[]) => {
        if (numericIds.length === 0) return;

        setIds(prev => {
            // Merge with existing, preventing duplicates
            const existingSet = new Set(prev);
            const newIds = numericIds.filter(id => !existingSet.has(id));
            if (newIds.length === 0) return prev;

            const updated = [...prev, ...newIds];
            setWishlistIds(updated);
            return updated;
        });
    }, []);

    // Memoize provider value so consumers only re-render when ids/isHydrated or a callback changes
    const value: WishlistContextType = useMemo(
        () => ({
            ids,
            count: ids.length,
            isHydrated,
            add,
            remove,
            toggle,
            has,
            clear,
            restore,
            restoreMany
        }),
        [ids, isHydrated, add, remove, toggle, has, clear, restore, restoreMany]
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access wishlist functionality
 * Throws an error if used outside of WishlistProvider
 */
export function useWishlist(): WishlistContextType {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}

/**
 * Hook to access wishlist with fallback defaults
 * Safe to use even if provider is not set up (returns empty wishlist)
 */
export function useWishlistSafe(): WishlistContextType {
    const context = useContext(WishlistContext);
    return context || DEFAULT_WISHLIST;
}
