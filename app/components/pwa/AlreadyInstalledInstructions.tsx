/**
 * @fileoverview Already Installed PWA Dialog Component
 *
 * @description
 * Bottom sheet shown when the user taps "Open in App" but the PWA is already
 * installed on their device. Reminds them to open the app from their home screen
 * or app library instead of the browser.
 *
 * @related
 * - ~/components/pwa/OpenInAppButton - Triggers this component when isAppDetectedAsInstalled
 * - ~/components/pwa/PwaAppIcon - Displays app icon with fallback
 * - ~/components/pwa/IosInstallInstructions - Sibling sheet for iOS install flow
 */

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetBody,
    SheetFooter
} from "~/components/ui/sheet";
import {Button} from "~/components/ui/button";
import {PwaAppIcon} from "./PwaAppIcon";
import {Smartphone} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface AlreadyInstalledInstructionsProps {
    /** Whether the sheet is open */
    open: boolean;
    /** Called when user wants to close/dismiss */
    onDismiss: () => void;
    /** App name from manifest */
    appName: string | null;
    /** App icon URL from manifest */
    appIcon: string | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * AlreadyInstalledInstructions - Bottom sheet reminding users the PWA is installed.
 *
 * Shown when isAppDetectedAsInstalled is true and the user taps the install button.
 * Guides them to open the app from their home screen instead.
 *
 * @param open - Whether the sheet is currently visible
 * @param onDismiss - Callback invoked when user closes the sheet
 * @param appName - App name from manifest (null if unavailable)
 * @param appIcon - App icon URL from manifest (null if unavailable)
 */
export function AlreadyInstalledInstructions({open, onDismiss, appName, appIcon}: AlreadyInstalledInstructionsProps) {
    return (
        <Sheet open={open} onOpenChange={isOpen => !isOpen && onDismiss()}>
            <SheetContent side="bottom" hideCloseButton>
                <SheetHeader className="items-center text-center">
                    <SheetTitle className="sr-only">Already Installed</SheetTitle>
                    <SheetDescription className="sr-only">
                        Open {appName || "this app"} from your home screen
                    </SheetDescription>
                </SheetHeader>

                <SheetBody className="pt-2">
                    {/* App icon and name */}
                    <div className="flex flex-col items-center gap-3">
                        <PwaAppIcon src={appIcon} alt={appName} size="lg" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-foreground">Already Installed</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {appName || "This app"} is already on your home screen
                            </p>
                        </div>
                    </div>

                    {/* Instruction card */}
                    <div className="mt-6 flex items-start gap-4 rounded-xl bg-muted px-4 py-4">
                        <span className="shrink-0 flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
                            <Smartphone className="size-5" aria-hidden="true" />
                        </span>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-foreground">Open from your home screen</span>
                            <span className="text-sm text-muted-foreground">
                                Find the {appName || "app"} icon on your device home screen or app library for
                                the best experience.
                            </span>
                        </div>
                    </div>
                </SheetBody>

                <SheetFooter>
                    <div className="flex flex-col w-full">
                        <Button onClick={onDismiss} className="w-full">
                            Open from Home Screen
                        </Button>
                        <Button variant="ghost" onClick={onDismiss} className="w-full">
                            Close
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
