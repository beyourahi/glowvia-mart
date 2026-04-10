/**
 * @fileoverview Service Worker Update Banner Component
 *
 * @description
 * Fixed top banner that notifies users when a new version of the PWA is available.
 * Provides action buttons to immediately apply the update or dismiss until later.
 * Stacks below NetworkStatusIndicator when both are visible (network status is more critical).
 *
 * @related
 * - ~/components/ServiceWorkerRegistration - Detects updates and dispatches events
 * - ~/hooks/useServiceWorkerUpdate - Update state and control logic hook
 * - ~/components/NetworkStatusIndicator - Companion banner for offline status
 */

import {RefreshCw, X} from "lucide-react";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {useServiceWorkerUpdate} from "~/hooks/useServiceWorkerUpdate";

// =============================================================================
// TYPES
// =============================================================================

interface ServiceWorkerUpdateBannerProps {
    className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ServiceWorkerUpdateBanner - Top banner for PWA update notifications.
 *
 * @param className - Additional Tailwind classes
 *
 * @example
 * ```tsx
 * // In root layout
 * <ServiceWorkerUpdateBanner />
 * ```
 */
export function ServiceWorkerUpdateBanner({className}: ServiceWorkerUpdateBannerProps) {
    const {updateAvailable, applyUpdate, dismissUpdate} = useServiceWorkerUpdate();

    // Don't render if no update available
    if (!updateAvailable) return null;

    return (
        <div
            role="alert"
            aria-live="polite"
            className={cn(
                // Base styles - z-9998 is just below NetworkStatusIndicator (z-9999)
                // Network offline is more critical than SW updates for e-commerce
                "fixed top-0 inset-x-0 z-9998",
                // Animation - slide down and fade in
                "animate-slide-down-fade",
                // Info colors (blue-ish)
                "bg-info text-info-foreground",
                className
            )}
        >
            {/* Safe area padding for notched devices */}
            <div className="pt-[env(safe-area-inset-top)]">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                    {/* Message */}
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <RefreshCw className="size-4 shrink-0" aria-hidden="true" />
                        <span>A new version is available. Please refresh.</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Reload button */}
                        <Button
                            variant="link"
                            size="sm"
                            onClick={applyUpdate}
                            className="text-sm font-semibold h-auto p-1"
                        >
                            Reload
                        </Button>

                        {/* Dismiss button */}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={dismissUpdate}
                            aria-label="Dismiss update notification"
                            className="rounded-full hover:bg-info-foreground/10"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
