/**
 * @fileoverview Network connectivity status indicator banner.
 *
 * Fixed top banner (z-9999) that shows a persistent "offline" warning and a brief
 * "Back online" confirmation (3s) when connectivity is restored. Returns null when
 * the user has never gone offline this session. Stacks above ServiceWorkerUpdateBanner.
 *
 * @related
 * - app/hooks/useNetworkStatus.ts - Network status detection hook
 * - ServiceWorkerUpdateBanner.tsx - Stacks below at z-9998
 * - OfflineAwareErrorPage.tsx - Error page variant for offline state
 */

import {useState, useEffect, useRef} from "react";
import {WifiOff, Wifi} from "lucide-react";
import {cn} from "~/lib/utils";
import {useNetworkStatus} from "~/hooks/useNetworkStatus";

interface NetworkStatusIndicatorProps {
    className?: string;
}

/** Fixed top banner for offline/online status. Returns null when not needed. */
export function NetworkStatusIndicator({className}: NetworkStatusIndicatorProps) {
    const {isOnline} = useNetworkStatus();
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);
    const wasOfflineRef = useRef(false);

    // Track offline→online transitions; wasOfflineRef ensures we only show
    // "Back online" after a real connectivity loss, not on initial mount.
    useEffect(() => {
        if (!isOnline) {
            wasOfflineRef.current = true;
        } else if (wasOfflineRef.current) {
            setShowOnlineMessage(true);
            wasOfflineRef.current = false;

            const timer = setTimeout(() => {
                setShowOnlineMessage(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isOnline]);

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
