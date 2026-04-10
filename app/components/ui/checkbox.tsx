/**
 * @fileoverview Checkbox component for binary selections
 *
 * @description
 * Accessible checkbox with responsive sizing and enhanced touch targets on mobile.
 * Supports controlled and uncontrolled usage with proper keyboard interaction.
 *
 * @radix-ui
 * - Primitive: @radix-ui/react-checkbox
 * - States: Checked, unchecked, indeterminate
 * - Indicator: Smooth check icon transition
 *
 * @accessibility
 * - Touch target: 20px on mobile, 16px on desktop (with expanded hit area on mobile)
 * - Keyboard: Space to toggle, Enter submits form
 * - Focus: Visible ring with high contrast
 * - Error states: aria-invalid with destructive ring color
 * - Screen readers: Proper checkbox role and checked state
 *
 * @related
 * - ~/components/ui/button.tsx - For action buttons (checkboxes are for selection)
 */

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import {CheckIcon} from "lucide-react";

import {cn} from "~/lib/utils";

/**
 * Checkbox input with check icon indicator
 * Responsive sizing: 20px mobile, 16px desktop
 */
function Checkbox({className, ...props}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                // Base styles
                "peer border-input shrink-0 rounded-[0.25rem] border shadow-xs transition-shadow outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                // Responsive sizing: larger on mobile (20px) for better touch, 16px on desktop
                "size-5 sm:size-4",
                // Checked states
                "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
                // Focus states
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.1875rem]",
                // Error states
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                // Touch target: use relative positioning with before pseudo for larger hit area on mobile
                "relative before:absolute before:-inset-2 before:content-[''] sm:before:hidden",
                className
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                className="grid place-content-center text-current transition-none"
            >
                <CheckIcon className="size-4 sm:size-3.5" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export {Checkbox};
