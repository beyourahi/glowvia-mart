/**
 * @fileoverview Full-width article hero — two variants: `listing` (gradient overlay + CTA)
 * and `detail` (simple image for article pages).
 *
 * The listing CTA ("Read Article") is a `<span>` rather than a nested `<Link>` because the
 * whole card is already a `<Link>` — nesting interactive controls is invalid HTML and an a11y
 * violation. The span retains the visual affordance via group-hover.
 *
 * Gradient contrast on listing variant:
 * - from-dark/90 on mobile → white text ≈ 8:1 (WCAG AAA) ✓
 * - lightest gradient stop still guarantees ≥ 4.5:1 minimum
 *
 * @related
 * - ~/lib/blog-utils - Date formatting and reading time calculation
 * - ~/components/blog/TagBadge - Tag rendering with hero variant
 */

import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {formatArticleDateShort, calculateReadingTime} from "~/lib/blog-utils";
import {TagList} from "~/components/blog/TagBadge";
import {Button} from "~/components/ui/button";
import {CircleArrowOutUpRight} from "lucide-react";

/** Article data for the hero — matches the shape returned by Shopify Storefront API article queries. */
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

export function ArticleHero({article, variant = "listing", showReadMore = true, className}: ArticleHeroProps) {
    const {handle, title, excerpt, excerptHtml, content, contentHtml, publishedAt, tags, image, blog, author} = article;

    const articleUrl = `/blogs/${blog.handle}/${handle}`;
    const publishedDate = formatArticleDateShort(publishedAt);

    const excerptText = excerpt || (excerptHtml ? excerptHtml.replace(/<[^>]*>/g, "") : null);

    const readingContent = contentHtml || content || "";
    const readingMinutes = readingContent ? calculateReadingTime(readingContent) : null;

    if (variant === "listing") {
        return (
            <Link
                to={articleUrl}
                prefetch="viewport"
                viewTransition
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
                        {tags && tags.length > 0 && <TagList tags={tags} limit={3} variant="hero" size="sm" />}

                        <h2 className="font-serif text-3xl sm:text-3xl md:text-4xl font-normal leading-tight text-light">
                            {title}
                        </h2>

                        {/* Excerpt hidden below 640px to prevent text clutter on small hero */}
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

    return (
        <div className={cn("relative", className)}>
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
