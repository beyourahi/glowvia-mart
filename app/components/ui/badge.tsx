/**
 * @fileoverview Badge component for labels, status indicators, and counts
 *
 * @description
 * Compact pill-shaped labels for categorization, status display, and notification counts.
 * Supports optional icons and interactive variants when used with links.
 *
 * @variants
 * - default: Primary colored badge for emphasis
 * - secondary: Neutral gray badge for less prominent labels
 * - destructive: Red badge for errors, warnings, or removable items
 * - outline: Bordered badge with foreground text color
 *
 * @accessibility
 * - Icons: Automatically sized (12px) and styled to match variant
 * - Focus: Visible ring when used as interactive element (link/button)
 * - Touch: Minimum touch target enforced via padding
 *
 * @related
 * - ~/components/ui/button.tsx - For interactive actions (badges are for display)
 */

import * as React from "react";
import {Slot} from "@radix-ui/react-slot";
import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "~/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-sm font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.1875rem] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
                secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20",
                outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

/**
 * Badge component with variant styling
 * @param variant - Visual style (default | secondary | destructive | outline)
 * @param asChild - Render as child element (e.g., Link) via Radix Slot
 */
function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & {asChild?: boolean}) {
    const Comp = asChild ? Slot : "span";

    return <Comp data-slot="badge" className={cn(badgeVariants({variant}), className)} {...props} />;
}

export {Badge, badgeVariants};
