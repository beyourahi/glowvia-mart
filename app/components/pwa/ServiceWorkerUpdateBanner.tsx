/**
 * @fileoverview Fixed top banner notifying users when a new PWA version is available.
 *
 * Uses `z-9998` — one level below `NetworkStatusIndicator` (`z-9999`) because
 * offline status is more critical than an update notification for e-commerce.
 *
 * @related
 * - ~/hooks/useServiceWorkerUpdate - Update state and `applyUpdate` / `dismissUpdate` controls
 * - ~/components/NetworkStatusIndicator - Companion banner at z-9999
 */

import {RefreshCw, X} from "lucide-react";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {useServiceWorkerUpdate} from "~/hooks/useServiceWorkerUpdate";

interface ServiceWorkerUpdateBannerProps {
    className?: string;
}

/** Fixed top banner for PWA update notifications. Returns null when no update is pending. */
export function ServiceWorkerUpdateBanner({className}: ServiceWorkerUpdateBannerProps) {
    const {updateAvailable, applyUpdate, dismissUpdate} = useServiceWorkerUpdate();

    if (!updateAvailable) return null;

    return (
        <div
            role="alert"
            aria-live="polite"
            className={cn(
                "fixed top-0 inset-x-0 z-9998",
                "animate-slide-down-fade",
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

                    <div className="flex items-center gap-2">
                        <Button
                            variant="link"
                            size="sm"
                            onClick={applyUpdate}
                            className="text-sm font-semibold h-auto p-1"
                        >
                            Reload
                        </Button>

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
