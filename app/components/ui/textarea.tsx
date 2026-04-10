/**
 * @fileoverview Textarea component - Multi-line text input
 *
 * @description
 * Native HTML textarea wrapper with consistent styling, responsive sizing,
 * auto-growing height, and accessibility features. Used for longer text
 * input like comments, descriptions, and messages.
 *
 * @accessibility
 * - Touch-friendly minimum height (120px mobile, 64px desktop)
 * - Focus-visible ring for keyboard navigation
 * - Error state with aria-invalid support
 * - Auto-grows with field-sizing-content
 *
 * @related
 * - Input - Single-line text alternative
 * - Label - Should be paired with this component
 * - Form - Used within form contexts
 */

import * as React from "react";

import {cn} from "~/lib/utils";

/**
 * Multi-line text input with auto-growing height
 *
 * @param className - Additional CSS classes
 * @param props - All standard HTML textarea attributes
 */
function Textarea({className, ...props}: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                // Base styles
                "motion-field border-input placeholder:text-muted-foreground flex field-sizing-content w-full rounded-xl border bg-transparent shadow-xs outline-none disabled:cursor-not-allowed disabled:opacity-50",
                // Responsive sizing: larger padding and min-height on mobile for touch comfort
                "min-h-[120px] px-3 py-3 text-base sm:min-h-[100px] sm:py-2.5 md:min-h-16 md:py-2 md:text-sm",
                // Focus states
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.1875rem]",
                // Error states
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                className
            )}
            {...props}
        />
    );
}

export {Textarea};
