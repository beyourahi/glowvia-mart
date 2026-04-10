/**
 * @fileoverview Spinner component - Loading indicator
 *
 * @description
 * Animated circular loading spinner for indeterminate loading states.
 * Used for button loading states, inline loading, and full-page loading
 * indicators. Provides screen reader feedback via aria-label.
 *
 * @accessibility
 * - role="status" for screen reader announcements
 * - aria-label="Loading" for context
 * - Visible to assistive technologies
 *
 * @related
 * - Skeleton - Content placeholder alternative
 * - Progress - Determinate progress alternative
 * - Button - Often used in loading button states
 */

import {Loader2Icon} from "lucide-react";

import {cn} from "~/lib/utils";

/**
 * Animated loading spinner with accessibility support
 *
 * @param className - Additional CSS classes for sizing/color
 * @param props - All SVG element attributes
 */
function Spinner({className, ...props}: React.ComponentProps<"svg">) {
    return (
        <Loader2Icon role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
    );
}

export {Spinner};
