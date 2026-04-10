/**
 * @fileoverview Alert component for displaying contextual feedback messages
 *
 * @description
 * Displays important information to users with optional icon, title, and description.
 * Uses CSS Grid for flexible icon/content layout.
 *
 * @variants
 * - default: Neutral card background for informational messages
 * - destructive: Red destructive color for errors and warnings
 *
 * @accessibility
 * - ARIA: role="alert" for screen reader announcements
 * - Icons: Automatically sized and colored to match variant
 * - Grid layout: Properly aligns icon with multi-line content
 *
 * @related
 * - ~/components/ui/alert-dialog.tsx - Modal alert dialogs requiring user action
 */

import * as React from "react";
import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "~/lib/utils";

const alertVariants = cva(
    "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
    {
        variants: {
            variant: {
                default: "bg-card text-card-foreground",
                destructive:
                    "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

/**
 * Alert container with variant styling
 * @param variant - Visual style (default | destructive)
 */
function Alert({className, variant, ...props}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
    return <div data-slot="alert" role="alert" className={cn(alertVariants({variant}), className)} {...props} />;
}

/**
 * Alert title with single-line clamp
 */
function AlertTitle({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-title"
            className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
            {...props}
        />
    );
}

/**
 * Alert description with relaxed line height for readability
 */
function AlertDescription({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-description"
            className={cn(
                "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
                className
            )}
            {...props}
        />
    );
}

export {Alert, AlertTitle, AlertDescription};
