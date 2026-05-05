/**
 * @fileoverview Deferred horizontal carousel of related blog articles.
 *
 * Accepts a `Promise<ArticleCardData[] | null>` so it can render with a skeleton
 * immediately while the loader streams data in. Capped at 8 articles; first 4
 * are eager-loaded for LCP, remainder are lazy. Uses negative margin for
 * full-bleed mobile scrolling.
 *
 * @related
 * - ~/components/blog/ArticleCard - Card rendering in carousel
 * - ~/routes/blogs.$blogHandle.$articleHandle - Article detail page loader
 */

import {Suspense} from "react";
import {Await} from "react-router";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {ArticleCard, type ArticleCardData} from "~/components/blog/ArticleCard";
import {Skeleton} from "~/components/ui/skeleton";
import {Card, CardContent} from "~/components/ui/card";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the RelatedArticles component.
 *
 * Accepts a promise of articles for deferred loading pattern,
 * allowing the component to render immediately while data streams in.
 */
interface RelatedArticlesProps {
    /** Promise of related articles */
    articles: Promise<ArticleCardData[] | null>;
    /** Section title */
    title?: string;
    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RelatedArticles carousel component with deferred loading.
 *
 * @description
 * Displays a horizontal scrollable carousel of related articles with:
 * - Deferred data loading (renders before data arrives)
 * - Skeleton loading state for perceived performance
 * - Responsive card sizing from 80% (mobile) to 22% (2xl)
 * - Wheel gesture support for desktop scrolling
 * - Performance optimizations (8 article limit, progressive image loading)
 *
 * Carousel configuration:
 * - align: "start" - Cards align to start of container
 * - loop: true - Infinite scrolling
 * - dragFree: true - Natural drag physics

 *
 * Responsive breakpoints:
 * - Mobile (default): 80% width per card
 * - sm (640px): 45% width (2 cards visible)
 * - lg (1024px): 32% width (3 cards visible)
 * - xl (1280px): 27% width (3-4 cards visible)
 * - 2xl (1536px): 22% width (4-5 cards visible)
 *
 * @example
 * ```tsx
 * // In route loader
 * export async function loader() {
 *   return defer({
 *     relatedArticles: fetchRelatedArticles()
 *   });
 * }
 *
 * // In component
 * <RelatedArticles articles={data.relatedArticles} />
 * ```
 */
export function RelatedArticles({articles, title = "Related Articles", className}: RelatedArticlesProps) {
    return (
        <section className={className}>
            {/* Responsive title with proper scaling */}
            <h2 className="font-serif font-normal text-xl sm:text-2xl md:text-3xl lg:text-4xl text-center text-primary mb-5 sm:mb-6 md:mb-8 lg:mb-10">
                {title}
            </h2>

            {/* Suspense boundary for deferred data loading */}
            <Suspense fallback={<RelatedArticlesSkeleton />}>
                <Await resolve={articles}>
                    {resolvedArticles => {
                        // Don't render if no articles available
                        if (!resolvedArticles || resolvedArticles.length === 0) {
                            return null;
                        }

                        return (
                            <div className="relative -mx-2 sm:mx-0">
                                <Carousel
                                    opts={{align: "start", loop: true, dragFree: true}}
                                    plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                                    className="w-full"
                                >
                                    {/* Negative margin for full-bleed mobile scrolling */}
                                    <CarouselContent className="-ml-2.5 sm:-ml-3 md:-ml-4 pl-4 sm:pl-0">
                                        {/* Limit to 8 articles for performance */}
                                        {resolvedArticles.slice(0, 8).map((article, index) => (
                                            <CarouselItem
                                                key={article.handle}
                                                className="pl-2.5 sm:pl-3 md:pl-4 basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                                            >
                                                <ArticleCard
                                                    article={article}
                                                    index={index}
                                                    variant="default"
                                                    // Eager load first 4 for LCP, lazy load rest
                                                    loading={index < 4 ? "eager" : "lazy"}
                                                    // Hide tags in carousel for cleaner appearance
                                                    showTags={false}
                                                />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            </div>
                        );
                    }}
                </Await>
            </Suspense>
        </section>
    );
}

// ============================================================================
// Skeleton Loading State
// ============================================================================

/**
 * Skeleton IDs for React keys in loading state.
 * Using const assertion for type safety.
 */
const SKELETON_IDS = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"] as const;

/**
 * Skeleton loading state shown while article data is being fetched.
 *
 * Features:
 * - 4 skeleton cards (represents typical mobile viewport)
 * - Matches carousel layout and spacing
 * - Aspect-video placeholder for images
 * - Progressive skeleton sizes for title, excerpt, metadata
 * - Full-bleed mobile scrolling with negative margin
 */
function RelatedArticlesSkeleton() {
    return (
        <div className="flex gap-2.5 sm:gap-3 md:gap-4 overflow-hidden -mx-2 sm:mx-0 pl-2 sm:pl-0">
            {SKELETON_IDS.map(id => (
                <Card key={id} className="border-0 shadow-none py-0 overflow-hidden shrink-0 w-[55.5%]">
                    <Skeleton className="aspect-video w-full rounded-xl sm:rounded-2xl" />
                    <CardContent className="p-0 pt-2 sm:pt-3 md:pt-4 space-y-1.5 sm:space-y-2 md:space-y-3">
                        <Skeleton className="h-4 sm:h-5 w-3/4" />
                        <Skeleton className="h-3 sm:h-4 w-full" />
                        <Skeleton className="h-2.5 sm:h-3 w-1/3" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
