/**
 * @fileoverview PWA Analytics Event Tracking Utilities
 *
 * @description
 * Centralized analytics utilities for tracking progressive web app (PWA) events via
 * Google Tag Manager dataLayer. Provides type-safe event tracking for error boundaries,
 * service worker lifecycle events, install prompts, updates, offline states, and cache
 * performance. All events are automatically timestamped for accurate analytics reporting.
 *
 * @architecture
 * - SSR-safe: only pushes to dataLayer when window is available
 * - Type-safe event names using union types for autocomplete and validation
 * - Convenience wrappers for common PWA events with structured data payloads
 * - Automatic timestamp injection for all tracked events
 * - Integrates with GTM for comprehensive PWA performance monitoring
 *
 * @dependencies
 * - Browser window.dataLayer API (provided by GoogleTagManager component)
 * - TypeScript for type safety
 *
 * @related
 * - GoogleTagManager.tsx - Initializes window.dataLayer
 * - OfflineAwareErrorPage.tsx - Tracks error boundary events
 * - ServiceWorkerRegistration.tsx - Tracks SW lifecycle events
 * - entry.client.tsx - Tracks SW registration errors
 *
 * @events
 * - pwa_error_boundary_triggered - Error boundary caught an error
 * - pwa_service_worker_error - Service worker registration/update failed
 * - pwa_offline_page_viewed - User landed on /offline fallback
 * - pwa_cache_miss - SW failed to serve request from cache
 * - pwa_install_prompt_shown - Browser install prompt was displayed
 * - pwa_install_accepted - User accepted the install prompt
 * - pwa_install_dismissed - User dismissed the install prompt
 * - pwa_update_available - A new service worker version is available
 * - pwa_update_applied - User applied the service worker update
 * - pwa_service_worker_registered - Service worker registered successfully
 *
 * @usage
 * ```tsx
 * import { trackErrorBoundary, trackServiceWorkerError } from "~/hooks/usePwaAnalytics";
 *
 * // Track error boundary
 * trackErrorBoundary(500, "js_error", "products");
 *
 * // Track SW error
 * trackServiceWorkerError("Registration failed", "registration_failed");
 *
 * // Track install prompt
 * trackInstallPrompt();
 *
 * // Generic event
 * trackPwaEvent("pwa_cache_miss", { url: "/api/products" });
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * PWA analytics event names.
 * Using union type for type safety and autocomplete.
 */
export type PwaAnalyticsEvent =
    // Error events
    | "pwa_error_boundary_triggered"
    | "pwa_service_worker_error"
    | "pwa_offline_page_viewed"
    | "pwa_cache_miss"
    // Install events
    | "pwa_install_prompt_shown"
    | "pwa_install_accepted"
    | "pwa_install_dismissed"
    // Update events
    | "pwa_update_available"
    | "pwa_update_applied"
    // Registration events
    | "pwa_service_worker_registered";

/**
 * Data payload for error boundary events.
 */
export interface ErrorBoundaryEventData {
    error_status: number;
    error_type: "route_error" | "js_error";
    is_offline: boolean;
    route: string;
}

/**
 * Data payload for service worker error events.
 */
export interface ServiceWorkerErrorEventData {
    error_message: string;
    error_type: "registration_failed" | "update_failed" | "activation_failed";
}

/**
 * Data payload for offline page view events.
 */
export interface OfflinePageViewEventData {
    referrer: string;
}

/**
 * Data payload for cache miss events.
 */
export interface CacheMissEventData {
    url: string;
}

// =============================================================================
// ANALYTICS FUNCTIONS
// =============================================================================

/**
 * Track a PWA-related analytics event via GTM dataLayer.
 * SSR-safe: only pushes to dataLayer if window is available.
 *
 * @param event - The event name (pwa_* prefixed)
 * @param data - Optional data payload for the event
 *
 * @example
 * trackPwaEvent("pwa_error_boundary_triggered", {
 *   error_status: 500,
 *   error_type: "js_error",
 *   is_offline: false,
 *   route: "products"
 * });
 */
export function trackPwaEvent(event: PwaAnalyticsEvent, data?: Record<string, unknown>): void {
    if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({
            event,
            ...data,
            timestamp: new Date().toISOString()
        });
    }
}

// =============================================================================
// ERROR TRACKING
// =============================================================================

/**
 * Track an error boundary trigger with full context.
 * Convenience wrapper for error boundary events.
 *
 * @param statusCode - HTTP status code (404, 500, etc.)
 * @param errorType - Whether error came from route response or JS exception
 * @param route - Route name where error occurred
 */
export function trackErrorBoundary(statusCode: number, errorType: "route_error" | "js_error", route: string): void {
    const isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false;

    trackPwaEvent("pwa_error_boundary_triggered", {
        error_status: statusCode,
        error_type: errorType,
        is_offline: isOffline,
        route
    });
}

/**
 * Track a service worker error.
 * Convenience wrapper for SW error events.
 *
 * @param errorMessage - Error message from the caught exception
 * @param errorType - Type of SW operation that failed
 */
export function trackServiceWorkerError(
    errorMessage: string,
    errorType: "registration_failed" | "update_failed" | "activation_failed"
): void {
    trackPwaEvent("pwa_service_worker_error", {
        error_message: errorMessage,
        error_type: errorType
    });
}

// =============================================================================
// OFFLINE & CACHE TRACKING
// =============================================================================

/**
 * Track an offline page view.
 * Called when user lands on /offline fallback page.
 */
export function trackOfflinePageView(): void {
    const referrer = typeof document !== "undefined" ? document.referrer || "direct" : "unknown";

    trackPwaEvent("pwa_offline_page_viewed", {
        referrer
    });
}

/**
 * Track a cache miss event.
 * Called when service worker fails to serve from cache.
 *
 * @param url - The URL that was requested but not cached
 */
export function trackCacheMiss(url: string): void {
    trackPwaEvent("pwa_cache_miss", {
        url
    });
}

// =============================================================================
// INSTALL TRACKING
// =============================================================================

/**
 * Track when the browser install prompt is shown to the user.
 * Fired when the `beforeinstallprompt` event triggers.
 */
export function trackInstallPrompt(): void {
    trackPwaEvent("pwa_install_prompt_shown");
}

/**
 * Track when the user accepts the PWA install prompt.
 */
export function trackInstallAccepted(): void {
    trackPwaEvent("pwa_install_accepted");
}

/**
 * Track when the user dismisses the PWA install prompt.
 */
export function trackInstallDismissed(): void {
    trackPwaEvent("pwa_install_dismissed");
}

// =============================================================================
// UPDATE TRACKING
// =============================================================================

/**
 * Track when a new service worker version is available.
 * Fired when `updatefound` detects a new SW in the `installed` state.
 */
export function trackUpdateAvailable(): void {
    trackPwaEvent("pwa_update_available");
}

/**
 * Track when the user applies a service worker update.
 * Fired when the user triggers `skipWaiting()` via the update banner.
 */
export function trackUpdateApplied(): void {
    trackPwaEvent("pwa_update_applied");
}

// =============================================================================
// REGISTRATION TRACKING
// =============================================================================

/**
 * Track successful service worker registration.
 * Fired after `navigator.serviceWorker.register()` resolves.
 */
export function trackServiceWorkerRegistered(): void {
    trackPwaEvent("pwa_service_worker_registered");
}

// Note: Window.dataLayer type is declared in ~/components/GoogleTagManager.tsx
