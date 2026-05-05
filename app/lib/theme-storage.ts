/**
 * @fileoverview Theme localStorage cache for offline page styling.
 *
 * Persists the generated theme (colors + fonts) to `"hydrogen-theme-cache"` so the
 * service-worker-served `/offline` route can apply brand styling without a network request.
 * `updateOfflinePageCache()` asks the SW to re-fetch `/offline` after the theme is available,
 * overwriting the precached version that was stored before theme data loaded.
 *
 * @related
 * - app/routes/offline.tsx - Reads cached theme for offline page styling
 * - app/root.tsx - Saves theme to localStorage on mount
 * - app/lib/theme-utils.ts - Generates theme from colors and fonts
 */

import type {GeneratedTheme} from "types";

const STORAGE_KEY = "hydrogen-theme-cache";

interface CachedTheme {
    theme: GeneratedTheme;
    timestamp: number;
}

/** Save theme to localStorage. Called on app mount when theme data is available. */
export function saveThemeToStorage(theme: GeneratedTheme): void {
    if (typeof window === "undefined") return;

    try {
        const cached: CachedTheme = {
            theme,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch (error) {
        // Silent fail - localStorage might be full or disabled
        console.warn("[ThemeStorage] Failed to save theme:", error);
    }
}

/** Load theme from localStorage. Returns null if no cache exists or parsing fails. */
export function getThemeFromStorage(): GeneratedTheme | null {
    if (typeof window === "undefined") return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as unknown;

        // Type guard to validate the cached theme has required properties
        if (
            parsed !== null &&
            typeof parsed === "object" &&
            "theme" in parsed &&
            parsed.theme !== null &&
            typeof parsed.theme === "object" &&
            "cssVariables" in parsed.theme &&
            "fonts" in parsed.theme
        ) {
            return (parsed as CachedTheme).theme;
        }

        return null;
    } catch (error) {
        // Silent fail - return null to use fallback
        console.warn("[ThemeStorage] Failed to load theme:", error);
        return null;
    }
}

/** Get the timestamp of the cached theme (for debugging or cache invalidation). */
export function getThemeCacheTimestamp(): number | null {
    if (typeof window === "undefined") return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as unknown;

        // Type guard to validate timestamp exists
        if (
            parsed !== null &&
            typeof parsed === "object" &&
            "timestamp" in parsed &&
            typeof parsed.timestamp === "number"
        ) {
            return parsed.timestamp;
        }

        return null;
    } catch {
        return null;
    }
}

/** Clear the cached theme (useful for testing or forcing a refresh). */
export function clearThemeStorage(): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Silent fail
    }
}

/** Check if a cached theme exists. */
export function hasThemeInStorage(): boolean {
    return getThemeFromStorage() !== null;
}

/**
 * Update the service worker cache with the themed offline page
 *
 * When the app first loads, the SW precaches /offline before theme is available.
 * This function asks the SW to re-fetch /offline (which now has theme CSS from SSR)
 * and update its cache, ensuring offline page displays brand colors.
 *
 * Uses postMessage to let the SW handle the cache update (more reliable than
 * directly manipulating caches from main thread).
 *
 * Must be called AFTER theme is available in the document (after SSR).
 */
export async function updateOfflinePageCache(): Promise<void> {
    if (typeof window === "undefined") return;

    // Only proceed if service worker is supported
    if (!("serviceWorker" in navigator)) return;

    try {
        // Wait for SW to be ready
        const registration = await navigator.serviceWorker.ready;
        if (!registration.active) return;

        // Ask the SW to update its offline page cache
        // The SW will fetch /offline fresh and store it
        registration.active.postMessage({type: "UPDATE_OFFLINE_CACHE"});

        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console -- intentional debug logging for theme storage
            console.log("[ThemeStorage] Requested SW to update offline page cache");
        }
    } catch (error) {
        // Silent fail - this is an enhancement, not critical
        if (process.env.NODE_ENV === "development") {
            console.warn("[ThemeStorage] Failed to request offline cache update:", error);
        }
    }
}
