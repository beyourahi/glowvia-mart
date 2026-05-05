/**
 * @fileoverview Universal PWA install/open button — adapts to platform, browser, and install state.
 *
 * - iOS: shows `IosInstallInstructions` sheet (no `beforeinstallprompt` on Safari)
 * - Desktop / Android: triggers native browser install prompt
 * - Already installed in browser: shows `AlreadyInstalledInstructions` sheet
 * - Running as standalone PWA: returns null (no install prompt needed inside the app)
 *
 * @related
 * - ~/hooks/usePwaInstall - Install state and capabilities
 * - ~/components/pwa/IosInstallInstructions - iOS manual guide
 * - ~/components/pwa/AlreadyInstalledInstructions - "Already installed" reminder sheet
 */

import {useState} from "react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {usePwaInstall} from "~/hooks/usePwaInstall";
import {IosInstallInstructions} from "./IosInstallInstructions";
import {AlreadyInstalledInstructions} from "./AlreadyInstalledInstructions";
import {Download} from "lucide-react";

interface OpenInAppButtonProps {
    /** Button variant: desktop-fixed (bottom-right) or menu-item (in navigation) */
    variant?: "desktop-fixed" | "menu-item";
}

export function OpenInAppButton({variant = "menu-item"}: OpenInAppButtonProps) {
    const {canInstall, isIOS, isStandalone, isAppDetectedAsInstalled, triggerInstall, appName, appIcon} =
        usePwaInstall();
    const [showIosInstructions, setShowIosInstructions] = useState(false);
    const [showAlreadyInstalled, setShowAlreadyInstalled] = useState(false);

    const handleClick = async () => {
        if (isIOS) { setShowIosInstructions(true); return; }
        if (canInstall) { await triggerInstall(); return; }
        if (isAppDetectedAsInstalled) { setShowAlreadyInstalled(true); return; }
    };

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
