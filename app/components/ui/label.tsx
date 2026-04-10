/**
 * @fileoverview Label component - Accessible form labels
 *
 * @description
 * Form label component built on Radix UI Label primitive. Provides semantic
 * labeling for form controls with proper accessibility attributes and responsive
 * sizing for mobile touch targets.
 *
 * @radix-ui
 * Built on @radix-ui/react-label primitive for proper form associations
 *
 * @accessibility
 * - Semantic label element with proper for/id associations
 * - Touch-friendly minimum height (44px) on mobile
 * - Disabled state handling via peer/group selectors
 * - Screen reader compatible
 *
 * @related
 * - Input - Primary usage with input fields
 * - Checkbox - Used with checkbox controls
 * - RadioGroup - Used with radio controls
 */

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import {cn} from "~/lib/utils";

/**
 * Accessible form label with responsive sizing
 *
 * @param className - Additional CSS classes
 * @param props - All Radix Label.Root props (htmlFor, etc.)
 */
function Label({className, ...props}: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            className={cn(
                // Base styles
                "flex items-center gap-2 leading-none font-medium select-none",
                // Responsive text: slightly larger on mobile for readability
                "text-base sm:text-sm",
                // Touch target: ensure adequate height for when used with checkboxes/radios
                "min-h-11 sm:min-h-0",
                // Disabled states
                "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}

export {Label};
