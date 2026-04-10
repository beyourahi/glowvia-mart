/**
 * @fileoverview Network connectivity status indicator banner.
 *
 * @description
 * Fixed top banner that displays the user's network connectivity status. Shows
 * persistent warning when offline and brief confirmation when connectivity is
 * restored. Critical for PWA e-commerce where offline functionality affects
 * cart, checkout, and product browsing. Positioned at highest z-index to ensure
 * visibility above all other UI elements.
 *
 * @features
 * - Real-time online/offline detection via navigator.onLine
 * - Persistent banner while offline
 * - Brief "Back online" confirmation (3 seconds)
 * - Highest z-index (z-9999) for maximum visibility
 * - Safe area padding for notched/dynamic island devices
 * - Semantic colors: destructive (red) for offline, success (green) for online
 * - ARIA live region for screen reader announcements
 * - Smooth transition animations
 *
 * @behavior
 * Initial state: Hidden (assumes online)
 *
 * User goes offline:
 * 1. navigator.onLine becomes false
 * 2. useNetworkStatus hook updates
 * 3. Banner appears with "You're offline" message
 * 4. Banner persists until network restored
 *
 * User comes back online:
 * 1. navigator.onLine becomes true
 * 2. Shows "Back online" message
 * 3. Auto-hides after 3 seconds
 * 4. wasOfflineRef reset for next cycle
 *
 * User always online:
 * - Banner never renders (returns null)
 *
 * @architecture
 * - useNetworkStatus hook for online/offline state
 * - Local state for "Back online" transition message
 * - useRef to track offline→online transitions
 * - Conditional rendering (null when not needed)
 * - Z-index coordination with ServiceWorkerUpdateBanner (below this)
 *
 * @related
 * - app/hooks/useNetworkStatus.ts - Network status detection hook
 * - ServiceWorkerUpdateBanner.tsx - Stacks below at z-9998
 * - OfflineAwareErrorPage.tsx - Error page variant for offline state
 * - public/sw.js - Service worker providing offline functionality
 *
 * @accessibility
 * - role="status" for status updates
 * - aria-live="polite" for non-intrusive announcements
 * - Icon + text label (no icon-only content)
 * - High contrast colors (destructive/success)
 * - Clear, concise messaging
 *
 * @ux
 * - Top position for immediate visibility
 * - Non-dismissible while offline (critical information)
 * - Auto-hides when back online (no manual dismiss needed)
 * - Doesn't block content (fixed position, content flows below)
 * - Destructive color for urgency when offline
 * - Success color for reassurance when restored
 *
 * @styling
 * - Fixed top position with full width
 * - bg-destructive/text-destructive-foreground for offline
 * - bg-success/text-success-foreground for online
 * - pt-[env(safe-area-inset-top)] for notched devices
 * - z-9999 (highest in app, above SW update banner)
 *
 * @ecommerce
 * Critical for e-commerce PWA because:
 * - Cart operations require network (GraphQL mutations)
 * - Checkout requires network (payment processing)
 * - Product browsing benefits from network (fresh data)
 * - Offline banner prevents confusion when actions fail
 * - Service worker can cache some content but not transactional operations
 */

import {useState, useEffect, useRef} from "react";
import {WifiOff, Wifi} from "lucide-react";
import {cn} from "~/lib/utils";
import {useNetworkStatus} from "~/hooks/useNetworkStatus";

// =============================================================================
// TYPES
// =============================================================================

interface NetworkStatusIndicatorProps {
    className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * NetworkStatusIndicator - Top banner for offline/online status.
 *
 * @param className - Additional Tailwind classes
 *
 * @example
 * ```tsx
 * // In root layout
 * <NetworkStatusIndicator />
 * ```
 */
export function NetworkStatusIndicator({className}: NetworkStatusIndicatorProps) {
    const {isOnline} = useNetworkStatus();
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);
    const wasOfflineRef = useRef(false);

    // =============================================================================
    // EFFECTS
    // =============================================================================

    /**
     * Track offline→online transitions and show brief confirmation.
     * Uses ref to detect transitions (not just current state).
     */
    useEffect(() => {
        if (!isOnline) {
            // User went offline - track this
            wasOfflineRef.current = true;
        } else if (wasOfflineRef.current) {
            // User came back online after being offline
            // Show "Back online" message briefly
            setShowOnlineMessage(true);
            wasOfflineRef.current = false;

            const timer = setTimeout(() => {
                setShowOnlineMessage(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    // =============================================================================
    // RENDER
    // =============================================================================

    /**
     * Don't render anything if online and no transition message.
     * Keeps DOM clean when banner not needed.
     */
    if (isOnline && !showOnlineMessage) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                // Base styles
                "fixed top-0 inset-x-0 z-9999",
                // Animation
                "transition-all duration-300 ease-out",
                // State-specific colors
                !isOnline ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground",
                className
            )}
        >
            {/* Safe area padding for notched devices */}
            <div className="pt-[env(safe-area-inset-top)]">
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium">
                    {!isOnline ? (
                        <>
                            <WifiOff className="size-4 shrink-0" aria-hidden="true" />
                            <span>You&apos;re offline. Some features are unavailable.</span>
                        </>
                    ) : (
                        <>
                            <Wifi className="size-4 shrink-0" aria-hidden="true" />
                            <span>Back online</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
