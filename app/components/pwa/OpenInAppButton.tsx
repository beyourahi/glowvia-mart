/**
 * @fileoverview PWA Install/Open Button Component
 *
 * @description
 * Universal button for PWA installation and opening across all platforms. Intelligently
 * adapts behavior based on device platform, browser capabilities, and installation state.
 * Supports two display variants: desktop-fixed (bottom-right corner) and menu-item (navigation).
 * Always visible (except when running as installed PWA in standalone mode).
 *
 * @related
 * - ~/components/pwa/IosInstallInstructions - iOS manual installation guide
 * - ~/components/pwa/AlreadyInstalledInstructions - Sheet shown when PWA is already installed
 * - ~/hooks/usePwaInstall - PWA install state and capabilities hook
 * - ~/components/Header - Renders menu-item variant in navigation
 */

import {useState} from "react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {usePwaInstall} from "~/hooks/usePwaInstall";
import {IosInstallInstructions} from "./IosInstallInstructions";
import {AlreadyInstalledInstructions} from "./AlreadyInstalledInstructions";
import {Download} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface OpenInAppButtonProps {
    /** Button variant: desktop-fixed (bottom-right) or menu-item (in navigation) */
    variant?: "desktop-fixed" | "menu-item";
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * OpenInAppButton - Universal PWA install/open button.
 *
 * @param variant - Display variant: "desktop-fixed" or "menu-item" (default: "menu-item")
 *
 * @example
 * ```tsx
 * // In navigation menu
 * <OpenInAppButton variant="menu-item" />
 *
 * // Fixed bottom-right corner
 * <OpenInAppButton variant="desktop-fixed" />
 * ```
 */
export function OpenInAppButton({variant = "menu-item"}: OpenInAppButtonProps) {
    const {canInstall, isIOS, isStandalone, isAppDetectedAsInstalled, triggerInstall, appName, appIcon} =
        usePwaInstall();
    const [showIosInstructions, setShowIosInstructions] = useState(false);
    const [showAlreadyInstalled, setShowAlreadyInstalled] = useState(false);

    // =============================================================================
    // HANDLERS
    // =============================================================================

    /**
     * Handle install/open button click.
     * Platform and state adaptive behavior:
     * - iOS: Show manual instructions sheet
     * - Can install: Trigger native browser prompt
     * - Already installed (in browser): Show "already installed" reminder sheet
     */
    const handleClick = async () => {
        // iOS Safari - show manual instructions
        if (isIOS) {
            setShowIosInstructions(true);
            return;
        }

        // Can install - trigger browser's install prompt
        if (canInstall) {
            await triggerInstall();
            return;
        }

        // App is installed but user is browsing in the browser - remind them to open from home screen
        if (isAppDetectedAsInstalled) {
            setShowAlreadyInstalled(true);
            return;
        }
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    // Hidden when already running as installed PWA — no install prompt needed inside the app.
    if (isStandalone) return null;

    const isFixed = variant === "desktop-fixed";
    const isMenuItem = variant === "menu-item";

    return (
        <>
            <Button
                onClick={() => void handleClick()}
                variant={isFixed ? "default" : "outline"}
                className={cn(
                    "gap-3",
                    // Fixed variant: hidden on mobile (use menu-item via FullScreenMenu instead),
                    // visible on large screens only. Positioning is handled by the parent
                    // FloatingButtonStack container in root.tsx — no fixed/z-index needed here.
                    isFixed && [
                        "hidden lg:flex",
                        "animate-slide-up-fade opacity-0"
                    ],
                    // Menu item variant: full width on mobile, auto on desktop
                    isMenuItem && [
                        "w-full lg:w-auto",
                        "text-lg font-medium min-h-12",
                        "animate-slide-up-fade opacity-0"
                    ]
                )}
                style={
                    isMenuItem
                        ? {animationDelay: "400ms", animationFillMode: "both"}
                        : isFixed
                          ? {animationDelay: "800ms", animationFillMode: "both"}
                          : undefined
                }
            >
                <Download className="size-5" />
                <span>Open App</span>
            </Button>

            {/* iOS Install Instructions Sheet */}
            <IosInstallInstructions
                open={showIosInstructions}
                onDismiss={() => setShowIosInstructions(false)}
                appName={appName}
                appIcon={appIcon}
            />

            {/* Already Installed Reminder Sheet */}
            <AlreadyInstalledInstructions
                open={showAlreadyInstalled}
                onDismiss={() => setShowAlreadyInstalled(false)}
                appName={appName}
                appIcon={appIcon}
            />
        </>
    );
}
