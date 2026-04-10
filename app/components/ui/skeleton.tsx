/**
 * @fileoverview Skeleton component - Loading placeholder
 *
 * @description
 * Animated skeleton loader component for content placeholders during
 * loading states. Provides visual feedback with pulse animation while
 * data is being fetched.
 *
 * @accessibility
 * - Pure visual element (no ARIA needed)
 * - Should be replaced by actual content when loaded
 * - Pair with aria-busy on parent container
 *
 * @related
 * - Spinner - Alternative loading indicator
 * - Progress - Determinate loading state
 * - Suspense - React suspense boundaries
 */

import {cn} from "~/lib/utils";

/**
 * Animated loading placeholder with pulse effect
 *
 * @param className - Additional CSS classes
 * @param props - All standard div attributes
 */
function Skeleton({className, ...props}: React.ComponentProps<"div">) {
    return <div data-slot="skeleton" className={cn("bg-accent animate-pulse rounded-md", className)} {...props} />;
}

export {Skeleton};
