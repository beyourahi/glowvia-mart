/**
 * @fileoverview Card component for grouped content sections
 *
 * @description
 * Flexible container component for organizing related content. Supports header with
 * title/description, main content area, optional action buttons, and footer.
 *
 * @accessibility
 * - Semantic structure: Header, content, footer hierarchy
 * - Container queries: Header layout adapts to card width
 * - Responsive spacing: Increased padding on larger screens
 * - Grid layout: Proper alignment of title, description, and actions
 *
 * @related
 * - ~/routes/account.tsx - Uses Card for account sections
 * - ~/routes/cart.tsx - Uses Card for cart summary
 */

import * as React from "react";

import {cn} from "~/lib/utils";

/**
 * Card container with rounded corners and shadow
 */
function Card({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card"
            className={cn(
                // Base card styling with subtle shadow for depth without borders
                // Uses layered shadow for sophisticated depth perception
                "bg-card text-card-foreground flex flex-col gap-4 md:gap-6 rounded-xl py-4 md:py-6",
                "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)]",
                // Smooth transition for hover states when applied via className
                "transition-[box-shadow,transform] duration-300",
                className
            )}
            {...props}
        />
    );
}

function CardHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 md:gap-2 px-4 md:px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4 [.border-b]:md:pb-6",
                className
            )}
            {...props}
        />
    );
}

function CardTitle({className, ...props}: React.ComponentProps<"div">) {
    return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />;
}

function CardDescription({className, ...props}: React.ComponentProps<"div">) {
    return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

/**
 * Action area in card header (positioned top-right)
 * Typically contains icon buttons or dropdown menus
 */
function CardAction({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
            {...props}
        />
    );
}

function CardContent({className, ...props}: React.ComponentProps<"div">) {
    return <div data-slot="card-content" className={cn("px-4 md:px-6", className)} {...props} />;
}

function CardFooter({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn("flex items-center px-4 md:px-6 [.border-t]:pt-4 [.border-t]:md:pt-6", className)}
            {...props}
        />
    );
}

export {Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent};
