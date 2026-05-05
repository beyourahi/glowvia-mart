/**
 * @fileoverview Bottom sheet shown when the PWA is already installed and the user taps "Open in App".
 * Directs them to open from the home screen instead of the browser.
 *
 * @related
 * - ~/components/pwa/OpenInAppButton - Triggers this sheet when `isAppDetectedAsInstalled` is true
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
