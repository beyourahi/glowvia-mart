/**
 * @fileoverview Progress component - Visual progress indicator
 *
 * @description
 * Progress bar component built on Radix UI Progress primitive. Displays
 * completion status with smooth animations for uploads, form completion,
 * loading states, and other progress-based interactions.
 *
 * @radix-ui
 * Built on @radix-ui/react-progress primitive with ARIA attributes
 *
 * @accessibility
 * - ARIA role="progressbar" for screen readers
 * - aria-valuenow automatically set from value prop
 * - Visual indicator with 500ms smooth transitions
 *
 * @related
 * - Spinner - Indeterminate loading alternative
 * - Skeleton - Placeholder loading state
 */

"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import {cn} from "~/lib/utils";

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
    /** Custom class for the indicator (the filled portion) */
    indicatorClassName?: string;
}

/**
 * Progress bar with smooth animated indicator
 *
 * @param className - Additional CSS classes for container
 * @param indicatorClassName - Additional CSS classes for the filled portion
 * @param value - Progress value (0-100)
 * @param props - All Radix Progress.Root props
 */
function Progress({className, indicatorClassName, value, ...props}: ProgressProps) {
    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
            {...props}
        >
            <ProgressPrimitive.Indicator
                data-slot="progress-indicator"
                className={cn("bg-primary h-full w-full flex-1 transition-all duration-500", indicatorClassName)}
                style={{transform: `translateX(-${100 - (value || 0)}%)`}}
            />
        </ProgressPrimitive.Root>
    );
}

export {Progress};
