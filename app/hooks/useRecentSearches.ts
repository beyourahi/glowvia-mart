/**
 * @fileoverview Recent Searches Hook with LocalStorage Persistence
 *
 * @description
 * Manages a user's recent search history with automatic localStorage persistence.
 * Each entry stores the search term alongside an optional product thumbnail captured
 * when the user clicks a product result — this gives the Recent Searches UI a visual
 * anchor for returning shoppers instead of plain text chips.
 *
 * @architecture
 * - State synchronized with localStorage on mount and updates
 * - Case-insensitive deduplication (newer searches bubble to top; thumbnail merges)
 * - Graceful degradation for SSR and private browsing modes
 * - Maximum 8 searches to prevent localStorage bloat
 * - Backwards compatible with legacy `string[]` storage format
 * - Memoized callbacks and return value to prevent unnecessary re-renders
 *
 * @dependencies
 * - React hooks (useState, useEffect, useCallback, useMemo)
 * - Browser localStorage API
 *
 * @related
 * - FullScreenSearch.tsx - Displays recent searches in search UI
 * - SearchFormPredictive.tsx - May trigger addSearch on submit
 * - search.tsx route - Search results page
 *
 * @storage
 * Key: "hydrogen-store-recent-searches"
 * Format: JSON array of RecentSearchEntry (objects). Legacy string[] is migrated on read.
 * Max entries: 8 (oldest removed when limit exceeded)
 *
 * @example
 * ```tsx
 * const { recentSearches, addSearch, clearSearches } = useRecentSearches();
 *
 * // Add plain term (no thumbnail)
 * addSearch("vintage denim");
 *
 * // Add term with product thumbnail captured from clicked result
 * addSearch("vintage denim", {
 *   image: { url: "...", altText: "Denim jacket" },
 *   productHandle: "vintage-denim-jacket"
 * });
 * ```
 */

import {useCallback, useEffect, useMemo, useState} from "react";

// =============================================================================
// CONSTANTS
// =============================================================================

/** LocalStorage key for persisting recent searches */
const STORAGE_KEY = "hydrogen-store-recent-searches";

/** Maximum number of recent searches to store (prevents localStorage bloat) */
const MAX_RECENT_SEARCHES = 8;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Thumbnail captured from a clicked product result, persisted alongside the
 * search term so Recent Searches can render a visual anchor.
 */
export interface RecentSearchThumbnail {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
}

/**
 * A single recent-search entry.
 * `image` / `productHandle` are only present if the user interacted with a
 * specific product result — terms saved from free-text submits have none.
 */
export interface RecentSearchEntry {
    term: string;
    image?: RecentSearchThumbnail | null;
    productHandle?: string | null;
}

/**
 * Optional metadata captured from a clicked product result, passed to
 * `addSearch` to enrich the stored entry.
 */
export interface AddSearchMeta {
    image?: RecentSearchThumbnail | null;
    productHandle?: string | null;
}

/**
 * Return type for the useRecentSearches hook.
 * Provides read access to searches and methods to modify them.
 */
export interface UseRecentSearchesReturn {
    /** Array of recent search entries, most recent first */
    recentSearches: RecentSearchEntry[];
    /** Add a new search term (deduplicates and moves to front if exists) */
    addSearch: (term: string, meta?: AddSearchMeta) => void;
    /** Remove a specific search term from history */
    removeSearch: (term: string) => void;
    /** Clear all search history */
    clearSearches: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Normalizes unknown parsed JSON into a clean array of RecentSearchEntry.
 * Accepts both the legacy string[] format and the new object[] format.
 */
function normalizeStoredEntries(parsed: unknown): RecentSearchEntry[] {
    if (!Array.isArray(parsed)) return [];

    const entries: RecentSearchEntry[] = [];
    for (const item of parsed) {
        // Legacy format: plain string
        if (typeof item === "string" && item.trim()) {
            entries.push({term: item.trim()});
            continue;
        }

        // New format: object with term + optional thumbnail metadata
        if (item && typeof item === "object" && "term" in item) {
            const rec = item as Partial<RecentSearchEntry>;
            if (typeof rec.term === "string" && rec.term.trim()) {
                const image =
                    rec.image && typeof rec.image === "object" && typeof rec.image.url === "string"
                        ? {
                              url: rec.image.url,
                              altText: rec.image.altText ?? null,
                              width: rec.image.width ?? null,
                              height: rec.image.height ?? null
                          }
                        : null;
                entries.push({
                    term: rec.term.trim(),
                    image,
                    productHandle: typeof rec.productHandle === "string" ? rec.productHandle : null
                });
            }
        }
    }
    return entries.slice(0, MAX_RECENT_SEARCHES);
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing recent searches with automatic localStorage persistence.
 *
 * Provides a complete CRUD interface for user search history:
 * - Reads from localStorage on mount (migrates legacy string[] data)
 * - Writes to localStorage on every change
 * - Case-insensitive deduplication (existing terms bubble to top; newest thumbnail wins)
 * - Limits history to MAX_RECENT_SEARCHES entries
 *
 * @returns Object with recentSearches array and mutation methods
 *
 * @sideeffect Reads/writes to localStorage under STORAGE_KEY
 */
export function useRecentSearches(): UseRecentSearchesReturn {
    const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([]);

    // -------------------------------------------------------------------------
    // INITIALIZATION: Load from localStorage on mount
    // -------------------------------------------------------------------------
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;

            const parsed = JSON.parse(stored) as unknown;
            setRecentSearches(normalizeStoredEntries(parsed));
        } catch {
            // Ignore localStorage parse and availability errors.
        }
    }, []);

    // -------------------------------------------------------------------------
    // PERSISTENCE: Save to localStorage
    // -------------------------------------------------------------------------
    const saveToStorage = useCallback((searches: RecentSearchEntry[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
        } catch {
            // Ignore localStorage write errors.
        }
    }, []);

    // -------------------------------------------------------------------------
    // MUTATION METHODS
    // -------------------------------------------------------------------------

    /**
     * Adds a search term to history.
     * If term already exists (case-insensitive), removes the old entry and adds
     * the new one at the front. Incoming thumbnail metadata wins, but if none
     * is provided the existing entry's thumbnail is preserved (so a later plain
     * submit doesn't wipe a previously-captured thumbnail).
     * Empty/whitespace-only terms are ignored.
     */
    const addSearch = useCallback(
        (term: string, meta?: AddSearchMeta) => {
            const trimmed = term.trim();
            if (!trimmed) return;

            setRecentSearches(prev => {
                const normalized = trimmed.toLowerCase();
                const existing = prev.find(item => item.term.toLowerCase() === normalized);
                const filtered = prev.filter(item => item.term.toLowerCase() !== normalized);
                const entry: RecentSearchEntry = {
                    term: trimmed,
                    image: meta?.image ?? existing?.image ?? null,
                    productHandle: meta?.productHandle ?? existing?.productHandle ?? null
                };
                const updated = [entry, ...filtered].slice(0, MAX_RECENT_SEARCHES);
                saveToStorage(updated);
                return updated;
            });
        },
        [saveToStorage]
    );

    /**
     * Removes a specific search term from history.
     * Case-insensitive matching.
     */
    const removeSearch = useCallback(
        (term: string) => {
            setRecentSearches(prev => {
                const updated = prev.filter(item => item.term.toLowerCase() !== term.toLowerCase());
                saveToStorage(updated);
                return updated;
            });
        },
        [saveToStorage]
    );

    /**
     * Clears all search history.
     * Removes both state and localStorage data.
     */
    const clearSearches = useCallback(() => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore localStorage remove errors.
        }
    }, []);

    return useMemo(
        () => ({
            recentSearches,
            addSearch,
            removeSearch,
            clearSearches
        }),
        [recentSearches, addSearch, removeSearch, clearSearches]
    );
}
