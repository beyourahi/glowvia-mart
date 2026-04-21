/**
 * @fileoverview Article Hero Component
 *
 * @description
 * Full-width hero component for showcasing featured articles. Supports two variants:
 * listing (with gradient overlay and CTA) and detail (simple image display). The listing
 * variant creates an immersive, magazine-style hero with text overlaid on the article
 * image using gradient overlays to ensure WCAG-compliant contrast.
 *
 * @features
 * - Two variants: listing (gradient overlay with content) and detail (simple image)
 * - WCAG-compliant gradient overlays for text legibility (from-dark/90 on mobile)
 * - Responsive typography scaling from 2xl to 5xl
 * - Reading time calculation and metadata display
 * - Tag display with hero variant styling (light background)
 * - CTA button with hover effects
 * - Responsive min-height (45vh mobile to 60vh desktop)
 * - Eager image loading for above-fold content
 *
 * @props
 * - article: ArticleHeroData - Article data from Shopify Blog API
 * - variant: "listing" | "detail" - Layout variant
 * - showReadMore: boolean - Toggle "Read Article" CTA button
 * - className: string - Additional Tailwind classes
 *
 * @accessibility
 * - Gradient overlay ensures 4.5:1 contrast for white text on any image
 * - Semantic HTML with proper heading hierarchy
 * - Time elements with datetime attributes
 * - Touch-friendly button sizing (min-h-10 mobile, min-h-11 desktop)
 *
 * @related
 * - ~/lib/blog-utils - Date formatting and reading time calculation
 * - ~/components/blog/TagBadge - Tag rendering with hero variant
 * - ~/routes/blogs.$blogHandle._index - Blog listing page
 * - ~/routes/blogs.$blogHandle.$articleHandle - Article detail page
 * - docs/WCAG_COMPLIANCE.md - Gradient overlay contrast documentation
 */

import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {formatArticleDateShort, calculateReadingTime} from "~/lib/blog-utils";
import {TagList} from "~/components/blog/TagBadge";
import {Button} from "~/components/ui/button";
import {CircleArrowOutUpRight} from "lucide-react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Article data structure for hero display.
 * Matches Shopify Storefront API article queries with all required fields.
 */
export interface ArticleHeroData {
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
 * Props for the ArticleHero component.
 *
 * Supports two variants:
 * - listing: Full hero with gradient overlay, content, and CTA
 * - detail: Simple image display for article page headers
 */
interface ArticleHeroProps {
    /** Article data for the hero */
    article: ArticleHeroData;
    /** Visual variant */
    variant?: "listing" | "detail";
    /** Show "Read Article" button */
    showReadMore?: boolean;
    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ArticleHero component for featuring articles in hero sections.
 *
 * @description
 * Creates immersive, magazine-style hero displays for blog articles. The listing
 * variant overlays text on the article image using WCAG-compliant gradient overlays
 * (from-dark/90 via-dark/50 to-dark/20 on mobile, lighter on desktop).
 *
 * Key design decisions:
 * - Stronger gradient on mobile (from-dark/90) for better text contrast on small screens
 * - Minimum 45vh height on mobile, 60vh on desktop for impact
 * - Excerpt hidden on very small screens (<640px) to prevent text clutter
 * - Tags limited to 3 with hero variant styling (light background, primary text)
 * - Button uses rounded-full with icon for modern aesthetic
 *
 * @example
 * ```tsx
 * // Listing hero (blog index page)
 * <ArticleHero article={featuredArticle} variant="listing" />
 *
 * // Detail hero (article page - simple image)
 * <ArticleHero article={article} variant="detail" showReadMore={false} />
 * ```
 *
 * @see docs/WCAG_COMPLIANCE.md - Gradient overlay contrast calculations
 */
export function ArticleHero({article, variant = "listing", showReadMore = true, className}: ArticleHeroProps) {
    const {handle, title, excerpt, excerptHtml, content, contentHtml, publishedAt, tags, image, blog, author} = article;

    // ========================================
    // Data Processing
    // ========================================

    // Construct article URL from blog and article handles
    const articleUrl = `/blogs/${blog.handle}/${handle}`;
    const publishedDate = formatArticleDateShort(publishedAt);

    // Extract plain text excerpt (simple HTML tag stripping)
    const excerptText = excerpt || (excerptHtml ? excerptHtml.replace(/<[^>]*>/g, "") : null);

    // Calculate reading time from content (HTML or plain text)
    const readingContent = contentHtml || content || "";
    const readingMinutes = readingContent ? calculateReadingTime(readingContent) : null;

    // ========================================
    // Variant: Listing (Gradient Overlay Hero)
    // ========================================

    /**
     * Listing variant for blog index pages.
     *
     * Features:
     * - Full-width background image with gradient overlay
     * - WCAG-compliant contrast: from-dark/90 via-dark/50 to-dark/20 (mobile)
     * - Responsive height: 45vh (mobile) to 60vh (desktop)
     * - Light text (text-light) for high contrast on dark overlay
     * - Excerpt hidden below 640px to prevent clutter
     * - CTA button with secondary variant (light bg, dark text)
     * - Tags with hero variant (light background, primary text)
     *
     * Gradient overlay contrast:
     * - White text on from-dark/90 = ~8:1 (exceeds WCAG AAA)
     * - Even on lightest images, overlay guarantees 4.5:1 minimum
     */
    if (variant === "listing") {
        /**
         * Listing layout wraps the entire hero in a single <Link> so tapping
         * anywhere in the card navigates — not just the "Read Article" pill.
         * The inner CTA is kept as an on-card visual affordance but is now a
         * non-interactive <span> to avoid nested interactive controls.
         *
         * Mobile sizing bumped to min-h-[60vh] (was 45vh) so the featured card
         * carries more weight on phones — the primary entry point to the blog.
         */
        return (
            <Link
                to={articleUrl}
                prefetch="viewport"
                aria-label={`Read article: ${title}`}
                className={cn(
                    "group relative block rounded-xl sm:rounded-2xl overflow-hidden no-underline cursor-pointer",
                    "motion-link focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
                    className
                )}
            >
                {/* Background Image */}
                {image && (
                    <div className="absolute inset-0">
                        <Image
                            alt={image.altText || title}
                            data={image}
                            loading="eager"
                            sizes="100vw"
                            className="h-full w-full object-cover motion-image group-hover:scale-[1.02]"
                        />
                        {/* Gradient Overlay - stronger on mobile for text legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/50 to-dark/20 sm:from-dark/80 sm:via-dark/40 sm:to-dark/10" />
                    </div>
                )}

                {/* Content */}
                <div className="relative min-h-[60vh] sm:min-h-[55vh] md:min-h-[60vh] flex flex-col justify-end p-5 sm:p-6 md:p-10 lg:p-12">
                    <div className="max-w-3xl space-y-3 sm:space-y-4 md:space-y-6">
                        {/* Tags - limit to 2 on mobile for space */}
                        {tags && tags.length > 0 && <TagList tags={tags} limit={3} variant="hero" size="sm" />}

                        {/* Title — larger on mobile to match the bumped hero height */}
                        <h2 className="font-serif text-3xl sm:text-3xl md:text-4xl font-normal leading-tight text-light">
                            {title}
                        </h2>

                        {/* Excerpt - hide on very small screens */}
                        {excerptText && (
                            <p className="hidden sm:block text-base md:text-lg text-light/80 leading-relaxed line-clamp-2 max-w-2xl">
                                {excerptText}
                            </p>
                        )}

                        {/* Meta & Button Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:gap-6 pt-1 sm:pt-2">
                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-sm text-light/70">
                                {author?.name && (
                                    <>
                                        <span>{author.name}</span>
                                        <span className="text-light/40">·</span>
                                    </>
                                )}
                                <time dateTime={publishedAt}>{publishedDate}</time>
                                {readingMinutes && (
                                    <>
                                        <span className="text-light/40">·</span>
                                        <span>{readingMinutes} min</span>
                                    </>
                                )}
                            </div>

                            {/* Read Article affordance — now a non-interactive span.
                                The whole card is already a link, so wrapping another
                                <Link> here would nest interactive controls (invalid
                                HTML + a11y violation). The span still provides the
                                visual CTA pattern, driven by the group hover state. */}
                            {showReadMore && (
                                <span
                                    aria-hidden="true"
                                    className="inline-flex w-fit items-center justify-center gap-2 sm:gap-2.5 rounded-full bg-primary border-2 border-primary px-4 sm:px-5 md:px-6 py-3 font-sans text-sm sm:text-base font-medium text-primary-foreground group-hover:bg-light group-hover:text-primary group-hover:border-light sleek"
                                >
                                    Read Article
                                    <CircleArrowOutUpRight className="w-5 h-5 sleek group-hover:rotate-45" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // ========================================
    // Variant: Detail (Simple Image Display)
    // ========================================

    /**
     * Detail variant for article page headers.
     *
     * Features:
     * - Simple full-width image with rounded corners
     * - No gradient overlay or text content
     * - Constrained to max-h-60vh to prevent excessive height
     * - Eager loading for above-fold content
     * - Responsive sizing based on viewport
     *
     * Used when article content is displayed below the image,
     * so no overlay content is needed.
     */
    return (
        <div className={cn("relative", className)}>
            {/* Full-bleed Image */}
            {image && (
                <div className="overflow-hidden rounded-xl sm:rounded-2xl">
                    <Image
                        alt={image.altText || title}
                        data={image}
                        loading="eager"
                        sizes="(min-width: 1024px) 896px, (min-width: 768px) 90vw, 100vw"
                        className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] object-cover motion-image"
                    />
                </div>
            )}
        </div>
    );
}
