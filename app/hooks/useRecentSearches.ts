/**
 * @fileoverview Recent Searches Hook with LocalStorage Persistence
 *
 * @description
 * Manages a user's recent search history with automatic localStorage persistence.
 * Provides CRUD operations for search terms with a maximum history limit.
 * This improves UX by allowing users to quickly access previous searches.
 *
 * @architecture
 * - State synchronized with localStorage on mount and updates
 * - Case-insensitive deduplication (newer searches bubble to top)
 * - Graceful degradation for SSR and private browsing modes
 * - Maximum 8 searches to prevent localStorage bloat
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
 * Format: JSON array of strings
 * Max entries: 8 (oldest removed when limit exceeded)
 *
 * @example
 * ```tsx
 * const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();
 *
 * // Add when user submits search
 * addSearch(searchTerm);
 *
 * // Display in UI
 * {recentSearches.map(term => <SearchChip key={term} term={term} />)}
 *
 * // Remove individual search
 * removeSearch(term);
 *
 * // Clear all history
 * clearSearches();
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
 * Return type for the useRecentSearches hook.
 * Provides read access to searches and methods to modify them.
 */
export interface UseRecentSearchesReturn {
    /** Array of recent search terms, most recent first */
    recentSearches: string[];
    /** Add a new search term (deduplicates and moves to front if exists) */
    addSearch: (term: string) => void;
    /** Remove a specific search term from history */
    removeSearch: (term: string) => void;
    /** Clear all search history */
    clearSearches: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing recent searches with automatic localStorage persistence.
 *
 * Provides a complete CRUD interface for user search history:
 * - Reads from localStorage on mount
 * - Writes to localStorage on every change
 * - Case-insensitive deduplication (existing terms bubble to top)
 * - Limits history to MAX_RECENT_SEARCHES entries
 *
 * @returns Object with recentSearches array and mutation methods
 *
 * @sideeffect Reads/writes to localStorage under STORAGE_KEY
 */
export function useRecentSearches(): UseRecentSearchesReturn {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // -------------------------------------------------------------------------
    // INITIALIZATION: Load from localStorage on mount
    // -------------------------------------------------------------------------
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;

            const parsed = JSON.parse(stored) as unknown;
            if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) {
                setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
            }
        } catch {
            // Ignore localStorage parse and availability errors.
        }
    }, []);

    // -------------------------------------------------------------------------
    // PERSISTENCE: Save to localStorage
    // -------------------------------------------------------------------------
    const saveToStorage = useCallback((searches: string[]) => {
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
     * If term already exists (case-insensitive), removes old and adds to front.
     * Empty/whitespace-only terms are ignored.
     */
    const addSearch = useCallback((term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;

        setRecentSearches(prev => {
            const normalized = trimmed.toLowerCase();
            const filtered = prev.filter(item => item.toLowerCase() !== normalized);
            const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    /**
     * Removes a specific search term from history.
     * Case-insensitive matching.
     */
    const removeSearch = useCallback((term: string) => {
        setRecentSearches(prev => {
            const updated = prev.filter(item => item.toLowerCase() !== term.toLowerCase());
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

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

    return useMemo(() => ({
        recentSearches,
        addSearch,
        removeSearch,
        clearSearches
    }), [recentSearches, addSearch, removeSearch, clearSearches]);
}
