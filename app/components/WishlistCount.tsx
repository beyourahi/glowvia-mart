/**
 * @fileoverview Wishlist Count Badge Component
 *
 * @description
 * Displays the number of items in the user's wishlist as a small badge with gradient
 * background and bounce animation. Hides when empty and handles SSR safely to prevent
 * hydration mismatches.
 *
 * @components
 * - WishlistCount - Badge showing item count (for icon buttons)
 * - WishlistCountInline - Inline text count (for navigation text)
 *
 * @features
 * - Conditional rendering: only shows when count > 0 (or showZero=true)
 * - SSR-safe: hidden until hydrated to prevent mismatch
 * - Enhanced gradient background with subtle glow effect
 * - Bounce animation on render (draws attention to count changes)
 * - 99+ cap for large counts (prevents overflow)
 * - Tabular numbers for consistent width
 *
 * @props
 * WishlistCount:
 * - className?: string - Additional CSS classes
 * - showZero?: boolean - Show badge even when count is 0 (default: false)
 *
 * WishlistCountInline:
 * - className?: string - Additional CSS classes
 *
 * @behavior
 * Visibility Logic:
 * 1. If not hydrated: return null (prevents SSR mismatch)
 * 2. If count === 0 and !showZero: return null (hide empty state)
 * 3. Otherwise: render badge with count
 *
 * Count Display:
 * - 1-99: Show actual number
 * - 100+: Show "99+"
 *
 * Hydration Safety:
 * - Uses isHydrated flag from context
 * - Returns null during SSR
 * - Prevents flash of empty state
 *
 * @styling
 * WishlistCount Badge:
 * - Shape: rounded-full
 * - Size: min-w-5 h-5 px-1.5
 * - Font: text-sm font-semibold leading-none
 * - Background: gradient from-red-400 via-red-500 to-rose-600
 * - Shadow: shadow-sm shadow-red-500/30 (subtle glow)
 * - Text: white
 * - Animation: animate-badge-bounce (entrance animation)
 *
 * WishlistCountInline:
 * - Font: tabular-nums (consistent spacing)
 * - Format: (count) - e.g., "(3)"
 * - Inherits parent text color/size
 *
 * @animations
 * Badge Bounce:
 * - Defined in tailwind.css as @keyframes badge-bounce
 * - Subtle scale animation on render
 * - Draws attention to count changes
 * - Single play (not continuous)
 *
 * @accessibility
 * - aria-label: "{count} items in wishlist"
 * - Semantic span element
 * - Clear visual contrast (white on red gradient)
 * - Tabular numbers for consistent reading
 *
 * @dependencies
 * - ~/lib/wishlist-context: useWishlistSafe hook for count and hydration state
 * - ~/lib/utils: cn utility for className merging
 *
 * @related
 * - WishlistButton.tsx - Toggles wishlist items (triggers count changes)
 * - lib/wishlist-context.tsx - Wishlist state management
 * - Header.tsx - Uses WishlistCount on wishlist icon
 * - FullScreenMenu.tsx - Uses WishlistCountInline in navigation
 *
 * @usage_example
 * ```tsx
 * // Badge on icon button (typical usage)
 * <Link to="/wishlist" className="relative">
 *   <Heart className="size-6" />
 *   <WishlistCount className="absolute -top-1 -right-1" />
 * </Link>
 *
 * // Inline count in navigation text
 * <Link to="/wishlist">
 *   Wishlist <WishlistCountInline />
 * </Link>
 *
 * // Force show even when empty (e.g., demo mode)
 * <WishlistCount showZero />
 * ```
 *
 * @positioning
 * WishlistCount is typically positioned absolutely on a relative parent:
 * - Common: absolute -top-1 -right-1 (top-right corner of icon)
 * - Adjust positioning via className prop
 * - Parent should have position: relative
 *
 * @gradient_details
 * Background uses Tailwind's gradient utilities:
 * - from-red-400: Lighter red at top-left
 * - via-red-500: Primary red in middle
 * - to-rose-600: Deeper rose at bottom-right
 * - Direction: linear-to-br (top-left to bottom-right)
 * - Shadow: Matching red tone with 30% opacity
 */

import {cn} from "~/lib/utils";
import {useWishlistSafe} from "~/lib/wishlist-context";

interface WishlistCountProps {
    /** Additional CSS classes */
    className?: string;
    /** Show zero count (default: hidden when empty) */
    showZero?: boolean;
}

/**
 * Badge displaying wishlist item count
 * Positioned absolutely for use inside icon buttons
 */
export function WishlistCount({className, showZero = false}: WishlistCountProps) {
    const {count, isHydrated} = useWishlistSafe();

    // Don't render if not hydrated (prevents SSR mismatch)
    // Don't render if count is 0 (unless showZero is true)
    if (!isHydrated || (count === 0 && !showZero)) {
        return null;
    }

    return (
        <span
            className={cn(
                // Base styles
                "inline-flex items-center justify-center",
                "min-w-5 h-5 px-1.5",
                "text-sm font-semibold leading-none",
                // Enhanced gradient background with glow
                "bg-linear-to-br from-red-400 via-red-500 to-rose-600",
                "text-white shadow-sm shadow-red-500/30",
                "rounded-full",
                // Enhanced bounce animation
                "animate-badge-bounce",
                className
            )}
            aria-label={`${count} items in wishlist`}
        >
            {count > 99 ? "99+" : count}
        </span>
    );
}

/**
 * Inline text showing wishlist count
 * For use in navigation text like "Wishlist (3)"
 */
export function WishlistCountInline({className}: {className?: string}) {
    const {count, isHydrated} = useWishlistSafe();

    if (!isHydrated || count === 0) {
        return null;
    }

    return <span className={cn("tabular-nums", className)}>({count})</span>;
}
