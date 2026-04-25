/**
 * @fileoverview Article Card Component
 *
 * @description
 * Reusable card component for displaying blog articles in various layouts. Supports three
 * distinct visual variants (default, featured, compact) with responsive design and staggered
 * animations. Handles article images, excerpts, tags, metadata, and reading time calculations.
 *
 * @features
 * - Three visual variants: default (grid), featured (hero), compact (list)
 * - Staggered fade-in animations for smooth list rendering
 * - Responsive image loading with aspect ratio variants per layout
 * - Reading time calculation from article content
 * - Tag display with customizable limits
 * - Author and metadata display
 * - Hover effects and transitions
 * - Prefetch optimization for viewport-visible links
 *
 * @props
 * - article: ArticleCardData - Complete article data from Shopify Blog API
 * - loading: "eager" | "lazy" - Image loading strategy for performance
 * - variant: "default" | "featured" | "compact" - Visual layout variant
 * - index: number - Position in list for staggered animation timing
 * - className: string - Additional Tailwind classes
 * - showTags: boolean - Toggle tag display (default: true)
 * - showReadingTime: boolean - Toggle reading time (default: true)
 * - showAuthor: boolean - Toggle author name (default: false)
 *
 * @related
 * - ~/lib/blog-utils - Date formatting, reading time calculation, HTML stripping
 * - ~/components/blog/TagBadge - Tag rendering component
 * - ~/routes/blogs.$blogHandle.$articleHandle - Article detail page
 * - ~/routes/blogs.$blogHandle._index - Blog listing page
 */

import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {formatArticleDateShort, calculateReadingTime, stripHtml} from "~/lib/blog-utils";
import {TagList} from "~/components/blog/TagBadge";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Article data structure expected by the card component.
 * Matches the shape returned by Shopify Storefront API article queries.
 */
export interface ArticleCardData {
    handle: string;
    title: string;
    excerpt?: string | null;
    excerptHtml?: string | null;
    content?: string | null;
    contentHtml?: string | null;
    publishedAt: string;
    tags?: string[];
    image?: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
    blog: {
        handle: string;
        title?: string | null;
    };
    author?: {
        name?: string | null;
    } | null;
}

/**
 * Props for the ArticleCard component.
 *
 * Supports three distinct visual variants optimized for different use cases:
 * - default: Standard grid card with 16:9 image
 * - featured: Hero-style card with 16:10 image and larger text
 * - compact: Horizontal list item with small thumbnail
 */
interface ArticleCardProps {
    /** Article data */
    article: ArticleCardData;
    /** Image loading strategy */
    loading?: "eager" | "lazy";
    /** Visual variant */
    variant?: "default" | "featured" | "compact";
    /** Index for staggered animation */
    index?: number;
    /** Additional CSS classes */
    className?: string;
    /** Show tags */
    showTags?: boolean;
    /** Show reading time */
    showReadingTime?: boolean;
    /** Show author */
    showAuthor?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ArticleCard component for displaying blog articles in various layouts.
 *
 * @description
 * Renders article cards with responsive images, metadata, and hover effects.
 * Supports three visual variants optimized for different layout contexts:
 *
 * 1. Default variant - Grid layout with 16:9 image, tags, title, excerpt, and metadata
 * 2. Featured variant - Hero layout with 16:10 image, larger text, and prominent CTA
 * 3. Compact variant - Horizontal list with thumbnail, title, and minimal metadata
 *
 * All variants include:
 * - Staggered fade-in animations (40ms per item, capped at 12 items)
 * - Responsive image sizing with appropriate aspect ratios
 * - Reading time calculation from article content
 * - Hover effects with smooth transitions
 * - Prefetch optimization for better navigation performance
 *
 * @example
 * ```tsx
 * // Default grid card
 * <ArticleCard article={article} index={0} loading="eager" />
 *
 * // Featured hero card
 * <ArticleCard article={article} variant="featured" showAuthor={true} />
 *
 * // Compact list item
 * <ArticleCard article={article} variant="compact" showTags={false} />
 * ```
 */
export function ArticleCard({
    article,
    loading,
    variant = "default",
    index = 0,
    className,
    showTags = true,
    showReadingTime = true,
    showAuthor = false
}: ArticleCardProps) {
    const {handle, title, excerpt, excerptHtml, content, contentHtml, publishedAt, tags, image, blog, author} = article;

    // ========================================
    // Data Processing
    // ========================================

    // Construct article URL from blog and article handles
    const articleUrl = `/blogs/${blog.handle}/${handle}`;
    const publishedDate = formatArticleDateShort(publishedAt);

    // Extract plain text excerpt (prefer plain text field over stripped HTML)
    const excerptText = excerpt || (excerptHtml ? stripHtml(excerptHtml) : null);

    // Calculate reading time from article content (HTML or plain text)
    const readingContent = contentHtml || content || "";
    const readingMinutes = readingContent ? calculateReadingTime(readingContent) : null;

    // Calculate staggered animation delay
    // Capped at 12 items (480ms max) to prevent excessive delays in long lists
    const staggerDelay = Math.min(index, 11) * 40;

    // ========================================
    // Variant: Compact (Horizontal List)
    // ========================================

    /**
     * Compact variant for sidebar or list layouts.
     * Features:
     * - Horizontal layout with small thumbnail (64-96px)
     * - Title and date only (no excerpt)
     * - Minimal spacing for dense lists
     * - 4:5 image aspect ratio for portrait orientation
     */
    if (variant === "compact") {
        return (
            <Link
                to={articleUrl}
                prefetch="viewport"
                viewTransition
                className={cn(
                    "flex items-start gap-3 sm:gap-4 py-3 sm:py-4 no-underline group cursor-pointer",
                    "motion-interactive hover:bg-muted/30 rounded-lg px-2 -mx-2",
                    "animate-product-fade-in",
                    className
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {/* Thumbnail */}
                {image && (
                    <div className="relative w-16 sm:w-20 md:w-24 shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-muted/50">
                        <Image
                            alt={image.altText || title}
                            aspectRatio="4/5"
                            data={image}
                            loading={loading}
                            sizes="(min-width: 768px) 96px, (min-width: 640px) 80px, 64px"
                            className="h-full w-full object-cover motion-image group-hover:scale-105"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                    <h3 className="font-serif text-sm sm:text-base font-normal leading-snug text-primary line-clamp-2 group-hover:text-primary/80 motion-link">
                        {title}
                    </h3>
                    <p className="text-sm sm:text-sm text-muted-foreground">
                        {publishedDate}
                        {showReadingTime && readingMinutes && <span> · {readingMinutes} min</span>}
                    </p>
                </div>
            </Link>
        );
    }

    // ========================================
    // Variant: Featured (Hero Layout)
    // ========================================

    /**
     * Featured variant for hero sections or prominent article displays.
     * Features:
     * - Large 16:10 image for cinematic aspect ratio
     * - Larger typography (xl to 3xl heading)
     * - Full excerpt display (2-3 lines)
     * - Author name and metadata
     * - Prominent tag display (up to 3 tags)
     * - Subtle scale effect on hover (102%)
     */
    if (variant === "featured") {
        return (
            <Link
                to={articleUrl}
                prefetch="viewport"
                viewTransition
                className={cn("block no-underline group animate-product-fade-in cursor-pointer", className)}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {/* Featured Image */}
                {image && (
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-muted/50 mb-4 sm:mb-6">
                        <Image
                            alt={image.altText || title}
                            aspectRatio="16/10"
                            data={image}
                            loading={loading || "eager"}
                            sizes="(min-width: 1024px) 70vw, (min-width: 768px) 80vw, 100vw"
                            className="h-full w-full object-cover motion-image group-hover:scale-[1.02]"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="space-y-3 sm:space-y-4">
                    {/* Tags */}
                    {showTags && tags && tags.length > 0 && (
                        <TagList tags={tags} limit={6} variant="default" size="sm" />
                    )}

                    {/* Title */}
                    <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal leading-tight text-primary group-hover:text-primary/80 motion-link line-clamp-3">
                        {title}
                    </h2>

                    {/* Excerpt */}
                    {excerptText && (
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
                            {excerptText}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-sm text-muted-foreground">
                        {showAuthor && author?.name && (
                            <>
                                <span>{author.name}</span>
                                <span className="text-muted-foreground/50">·</span>
                            </>
                        )}
                        <time dateTime={publishedAt}>{publishedDate}</time>
                        {showReadingTime && readingMinutes && (
                            <>
                                <span className="text-muted-foreground/50">·</span>
                                <span>{readingMinutes} min read</span>
                            </>
                        )}
                    </div>
                </div>
            </Link>
        );
    }

    // ========================================
    // Variant: Default (Grid Card)
    // ========================================

    /**
     * Default variant for standard grid layouts.
     * Features:
     * - 16:9 image aspect ratio
     * - Medium typography (base to xl heading)
     * - 2-line excerpt
     * - Tag display (up to 3 tags)
     * - Reading time and date metadata
     * - Scale effect on hover (105%)
     */
    return (
        <Link
            to={articleUrl}
            prefetch="viewport"
            viewTransition
            className={cn("block no-underline group animate-product-fade-in cursor-pointer", className)}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            {/* Image */}
            {image && (
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-muted/50 mb-3 sm:mb-4">
                    <Image
                        alt={image.altText || title}
                        aspectRatio="16/9"
                        data={image}
                        loading={loading}
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="h-full w-full object-cover motion-image group-hover:scale-105"
                    />
                </div>
            )}

            {/* Content */}
            <div className="space-y-2 sm:space-y-3">
                {/* Tags */}
                {showTags && tags && tags.length > 0 && <TagList tags={tags} limit={6} variant="default" size="sm" />}

                {/* Title */}
                <h3 className="font-serif text-base sm:text-lg md:text-xl font-normal leading-snug text-primary group-hover:text-primary/80 motion-link line-clamp-2">
                    {title}
                </h3>

                {/* Excerpt */}
                {excerptText && (
                    <p className="text-sm sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {excerptText}
                    </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-2 text-sm sm:text-sm text-muted-foreground">
                    <time dateTime={publishedAt}>{publishedDate}</time>
                    {showReadingTime && readingMinutes && (
                        <>
                            <span className="text-muted-foreground/50">·</span>
                            <span>{readingMinutes} min read</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}
