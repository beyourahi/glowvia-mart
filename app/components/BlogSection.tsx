/**
 * @fileoverview BlogSection - Responsive blog articles display for homepage
 *
 * @description
 * Adaptive blog section with three responsive layouts (desktop, tablet, mobile) that
 * automatically adjusts based on article count. Features editorial-style cards with
 * hover effects, staggered animations, and optimized image loading.
 *
 * @features
 * - **Adaptive Layouts**: Desktop (featured + stacked), Tablet (2x2 grid), Mobile (vertical stack)
 * - **Single Article Mode**: Full-width editorial card when only one article exists
 * - **Staggered Animations**: Sequential fade-in with 80ms delays
 * - **Responsive Images**: Shopify Image component with srcset/sizes optimization
 * - **CMS Integration**: Section title from site_settings metaobject
 * - **Conditional Rendering**: Hides when no articles available
 *
 * @props
 * - articles: HomepageArticle[] - Blog articles from Shopify Blog API
 *
 * @related
 * - routes/_index.tsx - Provides HomepageArticle type and data loading
 * - lib/blog-utils.ts - Date formatting utilities
 * - lib/site-content-context.ts - Section title configuration
 */

import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {formatArticleDateShort} from "~/lib/blog-utils";
import {Button} from "~/components/ui/button";
import {ArrowRight} from "lucide-react";
import type {HomepageArticle} from "~/routes/_index";
import {useSectionHeadings} from "~/lib/site-content-context";

// ============================================================================
// Types and Constants
// ============================================================================

interface BlogSectionProps {
    articles: HomepageArticle[];
}

/**
 * Consistent aspect ratio for all blog images
 * Using 4:3 for better visual balance across card sizes
 */
const IMAGE_ASPECT_RATIO = "aspect-[4/3]";

// ============================================================================
// Main Component
// ============================================================================

/**
 * BlogSection - Main container with adaptive layout switching
 *
 * Layout selection logic:
 * - 0 articles: Returns null (hidden)
 * - 1 article: SingleArticleLayout (full-width featured)
 * - 2+ articles: MultiArticleLayout (responsive grid/stack)
 */
export function BlogSection({articles}: BlogSectionProps) {
    // Conditional visibility: hide if no articles
    if (!articles || articles.length === 0) {
        return null;
    }

    return (
        <section className="py-10 sm:py-12 md:py-16">
            <SectionHeader />

            {articles.length === 1 ? (
                <SingleArticleLayout article={articles[0]} />
            ) : (
                <MultiArticleLayout articles={articles} />
            )}

            {/* Mobile View All Link */}
            <div className="mt-6 sm:mt-8 flex justify-center md:hidden">
                <Button
                    variant="outline"
                    size="default"
                    asChild
                    className="min-h-10 sm:min-h-12 px-6 sm:px-8 text-sm sm:text-base"
                >
                    <Link to="/blogs" prefetch="viewport">
                        View All Articles
                    </Link>
                </Button>
            </div>
        </section>
    );
}

// Shared header component
function SectionHeader() {
    const {blogSectionTitle} = useSectionHeadings();
    return (
        <div className="flex items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8">
            <h2 className="font-serif text-xl md:text-3xl lg:text-4xl font-medium text-primary mb-0">
                {blogSectionTitle}
            </h2>
            <Link
                to="/blogs"
                prefetch="viewport"
                className="hidden md:inline-flex shrink-0 rounded-full border-2 border-primary px-3 sm:px-4 py-1.5 lg:py-2 font-sans text-sm font-medium text-primary motion-interactive hover:bg-primary hover:text-primary-foreground no-underline"
            >
                View All
            </Link>
        </div>
    );
}

// Single article: full-width featured card (editorial style)
function SingleArticleLayout({article}: {article: HomepageArticle}) {
    const articleUrl = `/blogs/${article.blog.handle}/${article.handle}`;
    const publishedDate = formatArticleDateShort(article.publishedAt);
    const authorName = article.author?.name;

    return (
        <Link to={articleUrl} prefetch="viewport" className="group block no-underline animate-product-fade-in">
            <article
                className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-responsive-lg",
                    "rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden",
                    "motion-interactive"
                )}
            >
                {/* Image - cinematic 16:10 aspect ratio */}
                {article.image && (
                    <div className="relative overflow-hidden aspect-16/10 rounded-xl sm:rounded-2xl md:rounded-3xl">
                        <Image
                            alt={article.image.altText || article.title}
                            data={article.image}
                            loading="lazy"
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="absolute inset-0 h-full w-full object-cover motion-image group-hover:scale-[1.03]"
                        />
                    </div>
                )}
                {/* Content - clean, minimal */}
                <div className="flex flex-col justify-center py-4 sm:py-5 md:py-0">
                    {article.blog.title && (
                        <span className="text-sm sm:text-sm font-medium uppercase tracking-wider text-primary mb-2 sm:mb-3 md:mb-4">
                            {article.blog.title}
                        </span>
                    )}
                    <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal leading-tight text-foreground group-hover:text-primary motion-link mb-2 sm:mb-3 md:mb-4">
                        {article.title}
                    </h3>
                    {article.excerpt && (
                        <p className="text-sm sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-5 md:mb-6">
                            {article.excerpt}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2 mt-auto">
                        {/* Date and Author */}
                        <div className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-sm text-muted-foreground">
                            <time dateTime={article.publishedAt}>{publishedDate}</time>
                            {authorName && (
                                <>
                                    <span className="text-border">•</span>
                                    <span>{authorName}</span>
                                </>
                            )}
                        </div>
                        {/* Subtle CTA */}
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-sm sm:text-sm md:text-base font-medium text-primary sleek group-hover:gap-2 sm:group-hover:gap-2.5">
                            <span className="border-b border-primary/50 group-hover:border-primary motion-link">
                                Continue reading
                            </span>
                            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 motion-link group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}

// Multiple articles: responsive grid layout
// Mobile: stacked with dividers, Tablet: 2x2 grid, Desktop: featured overlay + stacked dividers
function MultiArticleLayout({articles}: {articles: HomepageArticle[]}) {
    const [featured, ...rest] = articles;
    const stackedArticles = rest.slice(0, 3); // Max 3 for secondary column

    return (
        <>
            {/* Desktop Layout: Featured (7 cols) + Stacked (5 cols) */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-responsive-lg">
                {/* Left: Featured Article (7 columns) - editorial overlay */}
                <div className="lg:col-span-7">
                    <FeaturedArticleCard article={featured} />
                </div>

                {/* Right: Stacked Articles (5 columns) - horizontal compact cards */}
                <div className="lg:col-span-5 flex flex-col gap-3 lg:gap-4">
                    {stackedArticles.map((article, index) => (
                        <CompactArticleCard key={article.handle} article={article} index={index} />
                    ))}
                </div>
            </div>

            {/* Tablet Layout: 2x2 Grid - clean, minimal */}
            <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-responsive">
                <GridArticleCard article={featured} index={0} />
                {stackedArticles.map((article, index) => (
                    <GridArticleCard key={article.handle} article={article} index={index + 1} />
                ))}
            </div>

            {/* Mobile Layout: Stacked with dividers */}
            <div className="flex flex-col divide-y divide-border/30 md:hidden">
                <MobileArticleCard article={featured} index={0} />
                {stackedArticles.map((article, index) => (
                    <MobileArticleCard key={article.handle} article={article} index={index + 1} />
                ))}
            </div>
        </>
    );
}

// Featured card for desktop multi-article layout (editorial overlay style)
function FeaturedArticleCard({article}: {article: HomepageArticle}) {
    const articleUrl = `/blogs/${article.blog.handle}/${article.handle}`;
    const publishedDate = formatArticleDateShort(article.publishedAt);

    return (
        <Link to={articleUrl} prefetch="viewport" className="group block no-underline h-full animate-product-fade-in">
            <article className="relative h-full min-h-[380px] lg:min-h-[420px] xl:min-h-[480px] 2xl:min-h-[520px] overflow-hidden rounded-xl lg:rounded-2xl xl:rounded-3xl">
                {/* Full-bleed image */}
                {article.image && (
                    <Image
                        alt={article.image.altText || article.title}
                        data={article.image}
                        loading="lazy"
                        sizes="(min-width: 1536px) 50vw, (min-width: 1024px) 58vw, 100vw"
                        className="absolute inset-0 h-full w-full object-cover motion-image group-hover:scale-[1.03]"
                    />
                )}

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-linear-to-t from-dark/80 via-dark/40 to-transparent" />

                {/* Content overlay positioned at bottom */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-6 xl:p-8 2xl:p-10">
                    {article.blog.title && (
                        <span className="text-sm lg:text-sm font-medium uppercase tracking-wider text-light/80 mb-1.5 lg:mb-2">
                            {article.blog.title}
                        </span>
                    )}
                    <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal leading-tight text-light drop-shadow-sm mb-2 lg:mb-3 group-hover:text-light/90 motion-link">
                        {article.title}
                    </h3>
                    {article.excerpt && (
                        <p className="text-sm lg:text-sm xl:text-base text-light/85 leading-relaxed line-clamp-2 mb-3 lg:mb-4">
                            {article.excerpt}
                        </p>
                    )}
                    <div className="flex items-center gap-2 text-sm lg:text-sm text-light/70">
                        <time dateTime={article.publishedAt}>{publishedDate}</time>
                    </div>
                </div>
            </article>
        </Link>
    );
}

// Compact horizontal card for desktop stacked articles
function CompactArticleCard({article, index}: {article: HomepageArticle; index: number}) {
    const articleUrl = `/blogs/${article.blog.handle}/${article.handle}`;
    const publishedDate = formatArticleDateShort(article.publishedAt);
    const authorName = article.author?.name;

    return (
        <Link
            to={articleUrl}
            prefetch="viewport"
            className="group block no-underline animate-product-fade-in"
            style={{animationDelay: `${(index + 1) * 80}ms`}}
        >
            <article
                className={cn(
                    "flex gap-3 lg:gap-4 p-3 lg:p-4",
                    "rounded-xl lg:rounded-2xl",
                    "bg-muted/30 border border-border/20",
                    "motion-interactive",
                    "group-hover:bg-muted/50 group-hover:border-border/40 group-hover:shadow-sm"
                )}
            >
                {/* Thumbnail - square with rounded corners */}
                {article.image && (
                    <div className="w-24 lg:w-28 xl:w-32 shrink-0 overflow-hidden rounded-lg lg:rounded-xl aspect-square relative">
                        <Image
                            alt={article.image.altText || article.title}
                            data={article.image}
                            loading="lazy"
                            sizes="(min-width: 1280px) 128px, 112px"
                            className="absolute inset-0 h-full w-full object-cover motion-image group-hover:scale-105"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5 lg:py-1">
                    {/* Top section */}
                    <div>
                        {article.blog.title && (
                            <span className="text-sm lg:text-sm font-semibold uppercase tracking-wider text-primary mb-1 lg:mb-2 block">
                                {article.blog.title}
                            </span>
                        )}
                        <h4 className="font-serif text-base lg:text-lg xl:text-xl font-normal leading-snug text-foreground group-hover:text-primary motion-link line-clamp-2">
                            {article.title}
                        </h4>
                    </div>

                    {/* Bottom meta */}
                    <div className="flex items-center gap-1.5 lg:gap-2 text-sm lg:text-sm text-muted-foreground mt-2 lg:mt-3">
                        <time dateTime={article.publishedAt}>{publishedDate}</time>
                        {authorName && (
                            <>
                                <span className="text-border">·</span>
                                <span className="truncate">{authorName}</span>
                            </>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}

// Grid card for tablet 2x2 layout (clean, minimal style)
function GridArticleCard({article, index}: {article: HomepageArticle; index: number}) {
    const articleUrl = `/blogs/${article.blog.handle}/${article.handle}`;
    const publishedDate = formatArticleDateShort(article.publishedAt);

    return (
        <Link
            to={articleUrl}
            prefetch="viewport"
            className="group block no-underline animate-product-fade-in"
            style={{animationDelay: `${index * 80}ms`}}
        >
            <article
                className={cn(
                    "h-full flex flex-col",
                    "rounded-lg md:rounded-xl overflow-hidden",
                    "motion-interactive",
                    "hover:bg-muted/5"
                )}
            >
                {/* Image - consistent 4:3 aspect ratio */}
                {article.image && (
                    <div
                        className={cn("relative overflow-hidden shrink-0 rounded-lg md:rounded-xl", IMAGE_ASPECT_RATIO)}
                    >
                        <Image
                            alt={article.image.altText || article.title}
                            data={article.image}
                            loading="lazy"
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="absolute inset-0 h-full w-full object-cover motion-image group-hover:scale-[1.03]"
                        />
                    </div>
                )}
                {/* Content - clean, minimal */}
                <div className="flex flex-col flex-1 py-3 md:py-4">
                    {article.blog.title && (
                        <span className="text-sm font-medium uppercase tracking-wider text-primary mb-1.5 md:mb-2">
                            {article.blog.title}
                        </span>
                    )}
                    <h3 className="font-serif text-base md:text-lg font-normal leading-tight text-foreground group-hover:text-primary motion-link line-clamp-2 mb-1.5 md:mb-2">
                        {article.title}
                    </h3>
                    {article.excerpt && (
                        <p className="text-sm md:text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2 md:mb-3">
                            {article.excerpt}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 text-sm md:text-sm text-muted-foreground mt-auto">
                        <time dateTime={article.publishedAt}>{publishedDate}</time>
                    </div>
                </div>
            </article>
        </Link>
    );
}

// Mobile card - full width stacked layout (clean, minimal style)
function MobileArticleCard({article, index}: {article: HomepageArticle; index: number}) {
    const articleUrl = `/blogs/${article.blog.handle}/${article.handle}`;
    const publishedDate = formatArticleDateShort(article.publishedAt);

    return (
        <Link
            to={articleUrl}
            prefetch="viewport"
            className="group block no-underline animate-product-fade-in py-3 sm:py-4 first:pt-0 last:pb-0"
            style={{animationDelay: `${index * 80}ms`}}
        >
            <article
                className={cn(
                    "flex flex-col",
                    "rounded-lg sm:rounded-xl overflow-hidden",
                    "motion-interactive",
                    "active:scale-[0.98]" // Touch feedback
                )}
            >
                {/* Image - consistent 4:3 aspect ratio */}
                {article.image && (
                    <div
                        className={cn("relative overflow-hidden shrink-0 rounded-lg sm:rounded-xl", IMAGE_ASPECT_RATIO)}
                    >
                        <Image
                            alt={article.image.altText || article.title}
                            data={article.image}
                            loading="lazy"
                            sizes="100vw"
                            className="absolute inset-0 h-full w-full object-cover motion-image group-hover:scale-[1.03]"
                        />
                    </div>
                )}
                {/* Content - clean, minimal */}
                <div className="flex flex-col pt-3 sm:pt-4">
                    {article.blog.title && (
                        <span className="text-xs sm:text-sm font-medium uppercase tracking-wider text-primary mb-1.5 sm:mb-2">
                            {article.blog.title}
                        </span>
                    )}
                    <h3 className="font-serif text-base sm:text-lg font-normal leading-tight text-foreground group-hover:text-primary motion-link line-clamp-2 mb-1.5 sm:mb-2">
                        {article.title}
                    </h3>
                    {article.excerpt && (
                        <p className="text-sm sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2 sm:mb-3">
                            {article.excerpt}
                        </p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 text-sm sm:text-sm text-muted-foreground">
                            <time dateTime={article.publishedAt}>{publishedDate}</time>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 motion-link group-hover:translate-x-1" />
                    </div>
                </div>
            </article>
        </Link>
    );
}
