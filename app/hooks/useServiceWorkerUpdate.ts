/**
 * @fileoverview Service Worker Update Detection and Control Hook
 *
 * @description
 * Manages the service worker update lifecycle for progressive web apps, providing
 * user-friendly update notifications and controls. Listens for service worker updates,
 * displays update prompts, and handles the skipWaiting/reload flow. Integrates with
 * Google Tag Manager for analytics tracking.
 *
 * @architecture
 * - Listens for custom 'sw-update-available' events dispatched by ServiceWorkerRegistration
 * - Stores the ServiceWorkerRegistration for later activation
 * - Sends SKIP_WAITING message to waiting service worker on user acceptance
 * - Tracks user interactions (accepted/dismissed) via GTM dataLayer
 * - Works in conjunction with ServiceWorkerRegistration component for auto-reload
 *
 * @dependencies
 * - React hooks (useState, useEffect)
 * - ServiceWorker API (registration.waiting, postMessage)
 * - Custom events ('sw-update-available')
 * - GTM dataLayer for analytics
 *
 * @related
 * - ServiceWorkerRegistration.tsx - Dispatches sw-update-available event
 * - ServiceWorkerUpdateBanner.tsx - UI component for update notification
 * - GoogleTagManager.tsx - Provides window.dataLayer
 * - entry.client.tsx - Registers service worker on app load
 *
 * @usage
 * ```tsx
 * const { updateAvailable, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();
 *
 * if (updateAvailable) {
 *   return (
 *     <UpdateBanner
 *       onUpdate={applyUpdate}
 *       onDismiss={dismissUpdate}
 *     />
 *   );
 * }
 * ```
 */

import {useState, useEffect} from "react";

// =============================================================================
// TYPES
// =============================================================================

interface UseServiceWorkerUpdateReturn {
    /** True when a new service worker is waiting to activate */
    updateAvailable: boolean;
    /** Apply the update by sending SKIP_WAITING message to SW */
    applyUpdate: () => void;
    /** Dismiss the update notification (will activate on next navigation) */
    dismissUpdate: () => void;
}

// =============================================================================
// ANALYTICS HELPERS
// =============================================================================

function trackEvent(event: string, data?: Record<string, unknown>) {
    if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({event, ...data});
    }
}

// =============================================================================
// HOOK
// =============================================================================

export function useServiceWorkerUpdate(): UseServiceWorkerUpdateReturn {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    // Listen for update available event from ServiceWorkerRegistration
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleUpdateAvailable = (e: CustomEvent<{registration: ServiceWorkerRegistration}>) => {
            // eslint-disable-next-line no-console -- intentional debug logging for SW updates
            console.log("[SW Update] Update available event received");
            setRegistration(e.detail.registration);
            setUpdateAvailable(true);
            trackEvent("pwa_update_available");
        };

        window.addEventListener("sw-update-available", handleUpdateAvailable);

        return () => {
            window.removeEventListener("sw-update-available", handleUpdateAvailable);
        };
    }, []);

    // Apply update by sending SKIP_WAITING message to waiting SW
    const applyUpdate = () => {
        if (!registration?.waiting) {
            console.warn("[SW Update] No waiting service worker to activate");
            return;
        }

        // eslint-disable-next-line no-console -- intentional debug logging for SW updates
        console.log("[SW Update] Sending SKIP_WAITING message to service worker");

        // Send message to waiting SW to call skipWaiting()
        registration.waiting.postMessage({type: "SKIP_WAITING"});

        trackEvent("pwa_update_accepted");

        // Note: Page reload happens automatically via controllerchange listener
        // in ServiceWorkerRegistration component
    };

    // Dismiss update notification (SW will activate on next navigation)
    const dismissUpdate = () => {
        // eslint-disable-next-line no-console -- intentional debug logging for SW updates
        console.log("[SW Update] Update dismissed by user");
        setUpdateAvailable(false);
        trackEvent("pwa_update_dismissed");
    };

    return {
        updateAvailable,
        applyUpdate,
        dismissUpdate
    };
}
