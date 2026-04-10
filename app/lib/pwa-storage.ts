/**
 * @fileoverview PWA Installation State Storage
 *
 * @description
 * Client-side localStorage utilities for tracking PWA installation state. Provides SSR-safe
 * functions to detect when the app has been installed and show "Open in App" prompts when
 * users visit the website in a browser after installing the PWA.
 *
 * @architecture
 * Installation Tracking Strategy:
 * - Listens for appinstalled event (fired when PWA is installed)
 * - Persists installation state to localStorage (survives browser sessions)
 * - Used to show "Open in App" button on website when PWA is installed
 * - SSR-safe: All browser APIs guarded with typeof window checks
 *
 * Storage Structure:
 * - Key: "pwa-app-installed"
 * - Value: "true" (boolean as string)
 * - Persistence: Never expires until manually cleared
 *
 * Integration with PWA Flow:
 * 1. User installs PWA → appinstalled event fires
 * 2. setAppInstalled() called → localStorage flag set
 * 3. User visits website in browser → isAppMarkedAsInstalled() returns true
 * 4. OpenInAppButton component shows → User can deep link to installed app
 *
 * @dependencies
 * - Browser localStorage API
 *
 * @related
 * - app/components/pwa/OpenInAppButton.tsx - Shows "Open in App" when PWA installed
 * - app/components/ServiceWorkerRegistration.tsx - Listens for appinstalled event
 * - app/entry.client.tsx - Registers service worker and PWA events
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
    /** App was installed (set when appinstalled event fires) */
    APP_INSTALLED: "pwa-app-installed"
} as const;

// =============================================================================
// HELPERS
// =============================================================================

/** SSR-safe check for browser environment */
const isBrowser = typeof window !== "undefined";

// =============================================================================
// APP INSTALLED TRACKING
// =============================================================================

/**
 * Check if app was previously installed (via appinstalled event)
 * Used to detect when user visits the website in browser after installing the PWA
 */
export function isAppMarkedAsInstalled(): boolean {
    if (!isBrowser) return false;

    try {
        return localStorage.getItem(STORAGE_KEYS.APP_INSTALLED) === "true";
    } catch {
        return false;
    }
}

/**
 * Mark app as installed (call when appinstalled event fires)
 * This persists across browser sessions to detect when user
 * visits the website in browser after installing the PWA
 */
export function setAppInstalled(): void {
    if (!isBrowser) return;

    try {
        localStorage.setItem(STORAGE_KEYS.APP_INSTALLED, "true");
    } catch {
        // Storage might be full or disabled - silently fail
    }
}

/**
 * Clear app installed flag
 * Could be called if we detect app is no longer installed
 */
export function clearAppInstalled(): void {
    if (!isBrowser) return;

    try {
        localStorage.removeItem(STORAGE_KEYS.APP_INSTALLED);
    } catch {
        // Silently fail
    }
}
