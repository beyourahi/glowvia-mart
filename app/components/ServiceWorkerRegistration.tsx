/**
 * @fileoverview Service Worker Registration Component
 *
 * @description
 * Client-side component that registers the PWA service worker and orchestrates the update
 * lifecycle. Handles registration, update detection, and seamless version transitions.
 * Dispatches custom events for UI components to react to service worker state changes.
 * This is the single source of truth for service worker lifecycle in the application.
 *
 * @related
 * - ~/components/pwa/ServiceWorkerUpdateBanner - UI for update notifications
 * - ~/hooks/useServiceWorkerUpdate - React hook consuming custom events
 * - ~/hooks/usePwaAnalytics - Analytics tracking for SW events
 */

import {useEffect} from "react";
import {trackServiceWorkerError, trackCacheMiss} from "~/hooks/usePwaAnalytics";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Extend Window interface for TypeScript.
 * Adds sw-update-available custom event to WindowEventMap for type safety.
 */
declare global {
    interface WindowEventMap {
        "sw-update-available": CustomEvent<{registration: ServiceWorkerRegistration}>;
    }
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ServiceWorkerRegistration - Registers and manages PWA service worker lifecycle.
 *
 * This is a logic-only component (renders null). Place in root layout.
 *
 * @example
 * ```tsx
 * // In app/root.tsx
 * <ServiceWorkerRegistration />
 * ```
 */
export function ServiceWorkerRegistration() {
    useEffect(() => {
        // =============================================================================
        // SETUP
        // =============================================================================

        // Only register in browser environment
        if (typeof window === "undefined") return;

        /**
         * Check for service worker support.
         * Gracefully degrades on older browsers.
         */
        if (!("serviceWorker" in navigator)) {
            // eslint-disable-next-line no-console -- intentional debug logging for SW lifecycle
            console.log("[SW] Service Workers not supported");
            return;
        }

        /**
         * Flag to prevent multiple reload loops.
         * Without this, multiple controllerchange events could trigger infinite reloads.
         */
        let refreshing = false;

        // =============================================================================
        // EVENT LISTENERS
        // =============================================================================

        /**
         * Listen for controller change to auto-reload.
         * This fires when the new SW takes over after skipWaiting().
         * Reloading ensures user sees new version immediately.
         */
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (refreshing) return;
            refreshing = true;
            // eslint-disable-next-line no-console -- intentional debug logging for SW lifecycle
            console.log("[SW] Controller changed, reloading page...");
            window.location.reload();
        });

        /**
         * Helper to dispatch update available event.
         * Consumed by useServiceWorkerUpdate hook and ServiceWorkerUpdateBanner.
         */
        const dispatchUpdateAvailable = (registration: ServiceWorkerRegistration) => {
            // eslint-disable-next-line no-console -- intentional debug logging for SW lifecycle
            console.log("[SW] Dispatching sw-update-available event");
            window.dispatchEvent(
                new CustomEvent("sw-update-available", {
                    detail: {registration}
                })
            );
        };

        // =============================================================================
        // REGISTRATION
        // =============================================================================

        /**
         * Register service worker and set up update detection.
         * Non-blocking: runs after window load for performance.
         */
        const registerSW = () => {
            navigator.serviceWorker
                .register("/sw.js")
                .then(registration => {
                    // eslint-disable-next-line no-console -- intentional debug logging for SW lifecycle
                    console.log("[SW] Service Worker registered with scope:", registration.scope);

                    /**
                     * Check if there's already a waiting worker (from previous visit).
                     * Happens when user dismissed update in previous session.
                     */
                    if (registration.waiting && navigator.serviceWorker.controller) {
                        // eslint-disable-next-line no-console -- intentional debug logging for SW lifecycle
                        console.log("[SW] Update already waiting from previous visit");
                        dispatchUpdateAvailable(registration);
                    }

                    /**
                     * Handle future updates.
                     * updatefound fires when a new SW version starts installing.
                     */
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;

                        if (!newWorker) return;

                        // eslint-disable-next-line no-console -- intentional debug logging for SW lifecycle
                        console.log("[SW] New service worker installing...");

                        /**
                         * Monitor new worker state changes.
                         * When it reaches installed state while an old SW is active,
                         * an update is available.
                         */
                        newWorker.addEventListener("statechange", () => {
                            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                // eslint-disable-next-line no-console -- intentional debug logging for SW lifecycle
                                console.log("[SW] New service worker installed, update available");
                                dispatchUpdateAvailable(registration);
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error("[SW] Service Worker registration failed:", error);
                    /**
                     * Track registration error via analytics.
                     * Helps identify deployment or browser issues.
                     */
                    trackServiceWorkerError(
                        error instanceof Error ? error.message : "Unknown registration error",
                        "registration_failed"
                    );
                });
        };

        /**
         * Listen for cache miss messages from service worker.
         * SW sends CACHE_MISS message when offline fallback is needed.
         * Tracked for offline analytics and cache strategy optimization.
         */
        const handleSwMessage = (event: MessageEvent) => {
            if (event.data?.type === "CACHE_MISS") {
                trackCacheMiss(event.data.url);
            }
        };
        navigator.serviceWorker.addEventListener("message", handleSwMessage);

        // =============================================================================
        // INITIALIZATION
        // =============================================================================

        /**
         * Wait for window load if not already loaded (non-blocking registration).
         * Ensures SW registration doesn't block critical page rendering.
         */
        if (document.readyState === "complete") {
            registerSW();
        } else {
            window.addEventListener("load", registerSW);
            return () => {
                window.removeEventListener("load", registerSW);
                navigator.serviceWorker.removeEventListener("message", handleSwMessage);
            };
        }

        /**
         * Cleanup for message listener when already loaded.
         */
        return () => {
            navigator.serviceWorker.removeEventListener("message", handleSwMessage);
        };
    }, []);

    // This component doesn't render anything
    return null;
}
