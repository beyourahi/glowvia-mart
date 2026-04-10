/**
 * @fileoverview Empty state component for displaying "no results" or "no data" messages
 *
 * @description
 * Displays centered empty state messages with optional icon/illustration, title,
 * description, and call-to-action buttons. Used when lists, searches, or content
 * areas have no data to display.
 *
 * @variants
 * - EmptyMedia default: Transparent background for custom illustrations
 * - EmptyMedia icon: Muted background with icon sizing for Lucide icons
 *
 * @accessibility
 * - Semantic structure: Header with title/description hierarchy
 * - Text balance: text-balance for optimal line breaks
 * - Focus: Interactive elements (buttons/links) maintain focus visibility
 * - Max-width: Constrained to sm for readability
 *
 * @related
 * - ~/routes/account.orders.tsx - Empty state when no orders
 * - ~/routes/search.tsx - Empty state when no search results
 */

import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "~/lib/utils";

/**
 * Empty state container with centered layout
 */
function Empty({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="empty"
            className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12",
                className
            )}
            {...props}
        />
    );
}

function EmptyHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="empty-header"
            className={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)}
            {...props}
        />
    );
}

const emptyMediaVariants = cva(
    "flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-transparent",
                icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

/**
 * Media area for icons or custom illustrations
 * @param variant - default (transparent) or icon (muted background with sizing)
 */
function EmptyMedia({
    className,
    variant = "default",
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
    return (
        <div
            data-slot="empty-icon"
            data-variant={variant}
            className={cn(emptyMediaVariants({variant, className}))}
            {...props}
        />
    );
}

function EmptyTitle({className, ...props}: React.ComponentProps<"div">) {
    return <div data-slot="empty-title" className={cn("text-lg font-medium tracking-tight", className)} {...props} />;
}

function EmptyDescription({className, ...props}: React.ComponentProps<"p">) {
    return (
        <div
            data-slot="empty-description"
            className={cn("text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed", className)}
            {...props}
        />
    );
}

/**
 * Content area for action buttons or additional information
 */
function EmptyContent({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="empty-content"
            className={cn("flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance", className)}
            {...props}
        />
    );
}

export {Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia};
