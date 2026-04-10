/**
 * @fileoverview AlertDialog component for modal confirmations requiring user action
 *
 * @description
 * Modal dialog that interrupts user workflow to get confirmation before proceeding with
 * critical or destructive actions. Users must explicitly confirm or cancel before continuing.
 *
 * @radix-ui
 * - Primitive: @radix-ui/react-alert-dialog
 * - Portal rendering: Renders outside DOM hierarchy to prevent z-index issues
 * - Backdrop blur: Semi-transparent overlay with blur effect
 * - Click-outside: Wrapped with Cancel to enable dismissal
 *
 * @accessibility
 * - ARIA: role="alertdialog" with proper labeling via Title and Description
 * - Focus trap: Focus locked within dialog when open
 * - Keyboard: Escape to cancel, Tab to navigate between actions
 * - Action buttons: Primary action styled as default button, cancel as outline
 *
 * @related
 * - ~/components/ui/dialog.tsx - General-purpose modal dialogs
 * - ~/components/ui/button.tsx - Button variants used for actions
 */

"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import {cn} from "~/lib/utils";
import {buttonVariants} from "~/components/ui/button";

/**
 * Root alert dialog container
 * @param open - Controlled open state
 * @param onOpenChange - Callback when open state changes
 */
function AlertDialog({...props}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
    return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/**
 * Button that triggers the alert dialog
 */
function AlertDialogTrigger({...props}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
    return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({...props}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
    return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
    return (
        <AlertDialogPrimitive.Overlay
            data-slot="alert-dialog-overlay"
            className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-200 bg-overlay-dark backdrop-blur-md",
                className
            )}
            {...props}
        />
    );
}

function AlertDialogContent({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
    return (
        <AlertDialogPortal>
            {/* Wrap overlay with Cancel to enable click-outside-to-close */}
            <AlertDialogPrimitive.Cancel asChild>
                <AlertDialogOverlay />
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Content
                data-slot="alert-dialog-content"
                data-lenis-prevent
                className={cn(
                    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-200 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
                    className
                )}
                {...props}
            />
        </AlertDialogPortal>
    );
}

function AlertDialogHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-header"
            className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    );
}

function AlertDialogFooter({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-footer"
            className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
            {...props}
        />
    );
}

function AlertDialogTitle({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
    return (
        <AlertDialogPrimitive.Title
            data-slot="alert-dialog-title"
            className={cn("text-lg font-semibold", className)}
            {...props}
        />
    );
}

function AlertDialogDescription({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
    return (
        <AlertDialogPrimitive.Description
            data-slot="alert-dialog-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

/**
 * Primary action button (confirms the alert)
 * Styled with default button variant
 */
function AlertDialogAction({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
    return <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />;
}

/**
 * Cancel button (dismisses the alert)
 * Styled with outline button variant
 */
function AlertDialogCancel({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
    return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({variant: "outline"}), className)} {...props} />;
}

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel
};
