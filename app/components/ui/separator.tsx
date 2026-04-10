/**
 * @fileoverview Separator component - Visual divider line
 *
 * @description
 * Visual separator component built on Radix UI Separator primitive.
 * Provides semantic dividers with proper ARIA attributes. Supports
 * both horizontal and vertical orientations.
 *
 * @radix-ui
 * Built on @radix-ui/react-separator primitive
 *
 * @accessibility
 * - Semantic separator role when decorative=false
 * - Removed from accessibility tree when decorative=true (default)
 * - Proper orientation attributes for screen readers
 *
 * @related
 * - Card - Often used between card sections
 * - Sheet - Used in sheet layouts
 * - Menu - Used between menu sections
 */

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import {cn} from "~/lib/utils";

/**
 * Visual divider with horizontal or vertical orientation
 *
 * @param orientation - Line direction (horizontal or vertical)
 * @param decorative - Whether separator is purely visual (default true)
 */
function Separator({
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
    return (
        <SeparatorPrimitive.Root
            data-slot="separator"
            decorative={decorative}
            orientation={orientation}
            className={cn(
                "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
                className
            )}
            {...props}
        />
    );
}

export {Separator};
