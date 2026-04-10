/**
 * @fileoverview Network Status Detection Hook for Online/Offline States
 *
 * @description
 * SSR-safe hook for detecting browser network connectivity using the Navigator.onLine API
 * and window online/offline events. Provides real-time connectivity state for progressive
 * web app (PWA) offline capabilities and conditional feature rendering.
 *
 * @architecture
 * - Defaults to "online" during SSR to prevent hydration mismatches
 * - Updates on mount using navigator.onLine for accurate initial state
 * - Listens to window online/offline events for real-time updates
 * - Uses stable callback references to prevent unnecessary re-renders
 *
 * @dependencies
 * - React hooks (useState, useEffect)
 * - Browser Navigator.onLine API
 * - Window online/offline events
 *
 * @related
 * - OfflineAwareErrorPage.tsx - Uses network status for offline error handling
 * - NetworkStatusIndicator.tsx - UI component for displaying connection state
 * - ServiceWorkerRegistration.tsx - Coordinates with SW for offline caching
 * - ErrorPage.tsx - Shows offline-specific error messages
 *
 * @usage
 * ```tsx
 * const { isOnline } = useNetworkStatus();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 *
 * return <OnlineContent />;
 * ```
 */

import {useState, useEffect} from "react";

interface NetworkStatus {
    isOnline: boolean;
}

/**
 * Hook for detecting network connectivity status.
 *
 * Uses the Navigator.onLine API and online/offline events.
 * Returns { isOnline: true } during SSR (safe default).
 */
export function useNetworkStatus(): NetworkStatus {
    // Default to online for SSR and initial render
    // This prevents hydration mismatches
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Only run in browser environment
        if (typeof window === "undefined") return;

        // Event handlers (defined inside useEffect to avoid dependency warning)
        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        // Set initial state from navigator.onLine
        // This runs after hydration to avoid SSR mismatch
        setIsOnline(navigator.onLine);

        // Add event listeners for network changes
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Cleanup listeners on unmount
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return {isOnline};
}
