/**
 * @fileoverview Input component - Standard form input field
 *
 * @description
 * Native HTML input wrapper with consistent styling, responsive sizing,
 * and accessibility features. Supports all standard input types including
 * text, email, password, number, and file uploads.
 *
 * @accessibility
 * - Touch-friendly sizing (44px on mobile, 36px on desktop)
 * - Focus-visible ring for keyboard navigation
 * - Error state with aria-invalid support
 * - File input with semantic styling
 *
 * @related
 * - Label - Should be paired with this component
 * - Form - Used within form contexts
 * - Textarea - Multi-line text input alternative
 */

import * as React from "react";

import {cn} from "~/lib/utils";

/**
 * Standard form input field with responsive sizing and error states
 *
 * @param className - Additional CSS classes
 * @param type - HTML input type (text, email, password, file, etc.)
 * @param props - All standard HTML input attributes
 */
function Input({className, type, ...props}: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                // Base styles with touch-friendly height (44px min on mobile, 36px on desktop)
                // Uses bg-muted/50 with inset shadow for subtle visual definition without borders
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 rounded-xl bg-muted/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                // Responsive sizing: h-11 (44px) on mobile for touch targets, h-9 (36px) on desktop
                "h-11 px-3 py-2 text-base sm:h-10 md:h-9 md:py-1 md:text-sm",
                // File input styling
                "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium sm:file:h-7",
                // Focus states - enhanced ring with subtle outer shadow for depth
                "focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:shadow-[0_0_0_4px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(0,0,0,0.04)] focus-visible:bg-muted/60",
                // Error states
                "aria-invalid:ring-2 aria-invalid:ring-destructive/30",
                className
            )}
            {...props}
        />
    );
}

export {Input};
