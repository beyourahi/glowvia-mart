/**
 * @fileoverview Tag badge primitives for article tags — `TagBadge` (single) and `TagList` (collection).
 *
 * Link priority: explicit `href` > auto-generated `/blogs/{handle}?tag={slug}` > no link.
 * Four visual variants: `default`, `outline`, `muted`, `hero`.
 *
 * @related
 * - ~/lib/blog-utils - `slugify` for URL-safe tag names
 * - ~/routes/blogs.$blogHandle._index - tag filtering route
 */

import {Link} from "react-router";
import {Badge} from "~/components/ui/badge";
import {cn} from "~/lib/utils";
import {slugify} from "~/lib/blog-utils";

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

export function TagBadge({tag, href, variant = "muted", size = "default", className, blogHandle}: TagBadgeProps) {
    const linkHref = href ?? (blogHandle ? `/blogs/${blogHandle}?tag=${slugify(tag)}` : undefined);

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

    if (linkHref) {
        return (
            <Link to={linkHref} prefetch="viewport" viewTransition className="no-underline cursor-pointer">
                <Badge variant="outline" className={badgeClassName}>
                    {tag}
                </Badge>
            </Link>
        );
    }

    return (
        <Badge variant="outline" className={badgeClassName}>
            {tag}
        </Badge>
    );
}

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

export function TagList({tags, limit, variant = "muted", size = "default", blogHandle, className}: TagListProps) {
    const displayTags = limit ? tags.slice(0, limit) : tags;
    const remaining = limit && tags.length > limit ? tags.length - limit : 0;

    if (displayTags.length === 0) return null;

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
