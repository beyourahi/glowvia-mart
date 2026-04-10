/**
 * @fileoverview ScrollArea component - Custom scrollable container
 *
 * @description
 * Custom scrollable area with styled scrollbars built on Radix UI ScrollArea.
 * Provides consistent scrollbar appearance across browsers with keyboard
 * navigation support. Used for content areas that need controlled scrolling.
 *
 * @radix-ui
 * Built on @radix-ui/react-scroll-area primitive with viewport and scrollbar primitives
 *
 * @accessibility
 * - Keyboard navigation support (arrow keys, page up/down)
 * - Focus-visible ring on viewport
 * - Touch-friendly scrollbar size
 * - Supports both horizontal and vertical orientations
 *
 * @related
 * - Sheet - Often used within sheet bodies
 * - Dialog - Used for scrollable dialog content
 * - Popover - Used in scrollable popovers
 */

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import {cn} from "~/lib/utils";

/**
 * Scrollable container with custom styled scrollbars
 *
 * @param className - Additional CSS classes for container
 * @param children - Content to make scrollable
 * @param props - All Radix ScrollArea.Root props
 */
function ScrollArea({className, children, ...props}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
    return (
        <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative", className)} {...props}>
            <ScrollAreaPrimitive.Viewport
                data-slot="scroll-area-viewport"
                className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

/**
 * Styled scrollbar for ScrollArea
 *
 * @param className - Additional CSS classes
 * @param orientation - Scrollbar direction (vertical or horizontal)
 * @param props - All Radix ScrollAreaScrollbar props
 */
function ScrollBar({
    className,
    orientation = "vertical",
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            data-slot="scroll-area-scrollbar"
            orientation={orientation}
            className={cn(
                "flex touch-none p-px transition-colors select-none",
                orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
                orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
                className
            )}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb
                data-slot="scroll-area-thumb"
                className="bg-border relative flex-1 rounded-full"
            />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    );
}

export {ScrollArea, ScrollBar};
