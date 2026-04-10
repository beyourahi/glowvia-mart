/**
 * @fileoverview Article Tag Badge Components
 *
 * @description
 * Reusable tag badge components for displaying article tags with optional linking to
 * filtered blog views. Includes TagBadge (single tag) and TagList (tag collection with
 * limit). Supports multiple visual variants and responsive sizing with WCAG-compliant
 * touch targets for interactive badges.
 *
 * @features
 * - Four visual variants: default, outline, muted, hero
 * - Two size variants: sm and default
 * - Optional linking to blog tag filter pages
 * - Automatic tag slugification for URLs
 * - Touch-friendly sizing (min-h-8 mobile, min-h-9 desktop for links)
 * - TagList with limit and "+X more" indicator
 * - ARIA labels for accessibility
 * - Responsive typography and spacing
 *
 * @props
 * TagBadge:
 * - tag: string - Tag text to display
 * - href: string - Optional explicit link URL
 * - variant: "default" | "outline" | "muted" | "hero" - Visual style
 * - size: "sm" | "default" - Size variant
 * - className: string - Additional Tailwind classes
 * - blogHandle: string - Auto-generates filter URL if provided
 *
 * TagList:
 * - tags: string[] - Array of tag strings
 * - limit: number - Maximum tags to show (rest shown as "+X")
 * - variant: Visual variant for all tags
 * - size: Size variant for all tags
 * - blogHandle: string - Blog handle for filter URLs
 * - className: string - Container classes
 *
 * @architecture
 * URL generation priority:
 * 1. Explicit href prop (highest priority)
 * 2. Auto-generated from blogHandle: /blogs/{blogHandle}?tag={slug}
 * 3. No link if neither provided
 *
 * @related
 * - ~/lib/blog-utils - slugify function for URL-safe tag names
 * - ~/components/ui/badge - shadcn Badge component
 * - ~/components/blog/ArticleCard - Uses TagList for article tags
 * - ~/routes/blogs.$blogHandle._index - Tag filtering implementation
 */

import {Link} from "react-router";
import {Badge} from "~/components/ui/badge";
import {cn} from "~/lib/utils";
import {slugify} from "~/lib/blog-utils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for individual TagBadge component.
 *
 * Supports clickable badges (when href or blogHandle provided) and
 * non-clickable badges (decorative only).
 */
interface TagBadgeProps {
    /** Tag text to display */
    tag: string;
    /** Optional link URL - if provided, badge becomes clickable */
    href?: string;
    /** Visual variant */
    variant?: "default" | "outline" | "muted" | "hero";
    /** Size variant */
    size?: "sm" | "default";
    /** Additional CSS classes */
    className?: string;
    /** Blog handle for constructing filter URLs */
    blogHandle?: string;
}

// ============================================================================
// TagBadge Component
// ============================================================================

/**
 * Single tag badge component with optional linking.
 *
 * @description
 * Renders a styled badge for article tags. Becomes clickable when href or blogHandle
 * is provided, linking to filtered blog views. Supports four visual variants:
 *
 * 1. default - Primary background with primary-foreground text
 * 2. outline - Transparent with primary border (hover effect)
 * 3. muted - Muted background with muted-foreground text (most subtle)
 * 4. hero - Light background for overlay on dark images
 *
 * Link generation:
 * - If href provided: uses exact href
 * - If blogHandle provided: generates /blogs/{handle}?tag={slug}
 * - Tag is slugified for URL safety (lowercase, hyphens)
 *
 * Touch targets:
 * - Clickable badges: min-h-8 (mobile) to min-h-9 (desktop) for WCAG 2.5.5
 * - Non-clickable badges: intrinsic height based on text
 *
 * @example
 * ```tsx
 * // Non-clickable muted badge
 * <TagBadge tag="Sustainability" variant="muted" size="sm" />
 *
 * // Clickable badge with auto-generated URL
 * <TagBadge tag="New Arrivals" blogHandle="journal" variant="outline" />
 *
 * // Clickable badge with explicit URL
 * <TagBadge tag="Featured" href="/featured-articles" variant="default" />
 * ```
 */
export function TagBadge({tag, href, variant = "muted", size = "default", className, blogHandle}: TagBadgeProps) {
    // ========================================
    // Link URL Generation
    // ========================================

    // Generate href from blogHandle if not explicitly provided
    // Example: blogHandle="journal", tag="New Arrivals" → /blogs/journal?tag=new-arrivals
    const linkHref = href ?? (blogHandle ? `/blogs/${blogHandle}?tag=${slugify(tag)}` : undefined);

    // ========================================
    // Styling
    // ========================================

    const badgeClassName = cn(
        "rounded-full font-medium whitespace-nowrap",
        // Size variants with touch-friendly minimum heights for clickable badges
        size === "sm"
            ? "px-2 sm:px-2.5 py-0.5 sm:py-1 text-sm sm:text-sm"
            : "px-2.5 sm:px-3 py-1 sm:py-1.5 text-sm sm:text-sm",
        // Ensure minimum touch target for interactive badges
        linkHref && "min-h-8 sm:min-h-9 inline-flex items-center",
        // Variant styles
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "outline" && "border-2 border-primary/40 text-primary bg-transparent hover:bg-primary/10",
        variant === "muted" && "bg-muted/60 text-muted-foreground",
        variant === "hero" && "bg-light text-primary border-2 border-light",
        linkHref && "cursor-pointer",
        className
    );

    // ========================================
    // Rendering
    // ========================================

    // Render as Link if href is available
    if (linkHref) {
        return (
            <Link to={linkHref} prefetch="viewport" className="no-underline cursor-pointer">
                <Badge variant="outline" className={badgeClassName}>
                    {tag}
                </Badge>
            </Link>
        );
    }

    // Render as static Badge if no href
    return (
        <Badge variant="outline" className={badgeClassName}>
            {tag}
        </Badge>
    );
}

// ============================================================================
// TagList Component
// ============================================================================

/**
 * Props for the TagList component.
 *
 * Manages a collection of tags with optional limiting and overflow indication.
 */
interface TagListProps {
    /** Array of tags to display */
    tags: string[];
    /** Maximum number of tags to show */
    limit?: number;
    /** Visual variant for all tags */
    variant?: "default" | "outline" | "muted" | "hero";
    /** Size variant for all tags */
    size?: "sm" | "default";
    /** Blog handle for constructing filter URLs */
    blogHandle?: string;
    /** Additional CSS classes for container */
    className?: string;
}

/**
 * Tag list component for displaying multiple article tags.
 *
 * @description
 * Renders a flex-wrapped collection of tag badges with optional limiting.
 * When limit is specified and exceeded, shows visible tags plus a "+X" indicator
 * for remaining tags.
 *
 * Features:
 * - Horizontal flex layout with wrapping
 * - Responsive gap sizing (1 to 2 spacing units)
 * - Limit with "+X more" indicator
 * - Passes variant and size to all child badges
 * - ARIA label for screen readers
 * - Auto-hides when tags array is empty
 * - Optional blogHandle for clickable tags
 *
 * Common use cases:
 * - Article cards: limit={3} for concise display
 * - Article hero: limit={3} to avoid clutter
 * - Tag cloud: no limit, all tags visible
 *
 * @example
 * ```tsx
 * // Basic tag list
 * <TagList tags={["Design", "Tech", "Lifestyle"]} variant="muted" />
 *
 * // Limited with clickable tags
 * <TagList
 *   tags={["A", "B", "C", "D", "E"]}
 *   limit={3}
 *   blogHandle="journal"
 *   variant="outline"
 * />
 * // Renders: [A] [B] [C] +2
 * ```
 */
export function TagList({tags, limit, variant = "muted", size = "default", blogHandle, className}: TagListProps) {
    // ========================================
    // Tag Limiting Logic
    // ========================================

    // Slice tags array if limit specified
    const displayTags = limit ? tags.slice(0, limit) : tags;

    // Calculate remaining count for "+X" indicator
    const remaining = limit && tags.length > limit ? tags.length - limit : 0;

    // Don't render anything if no tags
    if (displayTags.length === 0) return null;

    // ========================================
    // Rendering
    // ========================================

    return (
        <div
            className={cn("flex flex-wrap gap-1 sm:gap-1.5 md:gap-2", className)}
            role="list"
            aria-label="Article tags"
        >
            {displayTags.map(tag => (
                <TagBadge key={tag} tag={tag} variant={variant} size={size} blogHandle={blogHandle} />
            ))}
            {remaining > 0 && (
                <span className="text-sm sm:text-sm md:text-sm text-muted-foreground self-center ml-0.5 sm:ml-1">
                    +{remaining}
                </span>
            )}
        </div>
    );
}
