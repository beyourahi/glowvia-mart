/**
 * @fileoverview Blog Index Page (All Blogs Overview)
 *
 * @description
 * Displays an overview of all blog categories with their articles.
 * Features a featured article hero and category-based filtering with
 * carousel display for article browsing.
 *
 * @route GET /blogs
 *
 * @features
 * - Featured article hero section (latest across all blogs)
 * - Category tabs for multi-blog stores
 * - Horizontal article carousel for easy browsing
 * - Page transitions and scroll animations
 * - CMS-driven headings via site_settings metaobject
 *
 * @layout
 * 1. Two-column header (title + description)
 * 2. Featured article hero (latest article)
 * 3. Category selector (if multiple blogs exist)
 * 4. Article carousel for selected category
 *
 * @data-loading
 * Uses critical/deferred pattern:
 * - Critical: Blogs with articles, featured article
 * - Deferred: None currently (could be analytics)
 *
 * @cms-integration
 * Headings come from site_settings metaobject:
 * - blogPageHeading: Main page title
 * - blogPageDescription: Subtitle text
 *
 * @related
 * - blogs.$blogHandle._index.tsx - Individual blog category
 * - blogs.$blogHandle.$articleHandle.tsx - Article detail
 * - components/blog/ArticleCard.tsx - Card component
 * - components/blog/ArticleHero.tsx - Hero component
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/Blog
 */

import {useState} from "react";
import {Link} from "react-router";
import type {Route} from "./+types/blogs._index";
import {getPaginationVariables, getSeoMeta} from "@shopify/hydrogen";
import {ArticleCard, type ArticleCardData} from "~/components/blog/ArticleCard";
import {ArticleHero} from "~/components/blog/ArticleHero";
import {AnimatedSection} from "~/components/AnimatedSection";
import {Button} from "~/components/ui/button";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {cn} from "~/lib/utils";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {useSiteSettings} from "~/lib/site-content-context";
import {PageHeading} from "~/components/PageHeading";

interface BlogWithArticles {
    title: string;
    handle: string;
    seo?: {
        title?: string | null;
        description?: string | null;
    } | null;
    articles: {
        nodes: ArticleCardData[];
    };
}

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const featuredArticle = data?.featuredArticle;

    // Get blog page heading from root loader siteSettings
    const rootMatch = matches.find(m => m?.id === "root");
    const rootData = rootMatch?.data as
        | {siteContent?: {siteSettings?: {blogPageHeading?: string; blogPageDescription?: string}}}
        | undefined;
    const pageTitle = rootData?.siteContent?.siteSettings?.blogPageHeading || "The Journal";
    const pageDescription =
        rootData?.siteContent?.siteSettings?.blogPageDescription ||
        "Explore stories, inspiration, and ideas to help you discover joy in everyday moments.";

    return (
        getSeoMeta({
            title: pageTitle,
            titleTemplate: `%s | ${brandName}`,
            description: pageDescription,
            url: buildCanonicalUrl("/blogs", siteUrl),
            media: featuredArticle?.image?.url
                ? {
                      url: featuredArticle.image.url,
                      width: featuredArticle.image.width,
                      height: featuredArticle.image.height,
                      altText: featuredArticle.image.altText || `${brandName} ${pageTitle}`,
                      type: "image" as const
                  }
                : undefined
        }) ?? []
    );
};

export async function loader(args: Route.LoaderArgs) {
    // Start fetching non-critical data without blocking time to first byte
    const deferredData = loadDeferredData(args);

    // Await the critical data required to render initial state of the page
    const criticalData = await loadCriticalData(args);

    return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
    const paginationVariables = getPaginationVariables(request, {
        pageBy: 10
    });

    // Fetch blogs with their articles and the latest article for the hero
    const [{blogs}, {articles: latestArticles}] = await Promise.all([
        context.dataAdapter.query(BLOGS_WITH_ARTICLES_QUERY, {
            variables: {
                ...paginationVariables
            }
        }),
        context.dataAdapter.query(LATEST_ARTICLES_QUERY, {
            variables: {
                first: 1
            }
        })
    ]);

    // Get the featured article (latest across all blogs)
    const featuredArticle = latestArticles?.nodes?.[0] || null;

    const hasRealContent =
        blogs?.nodes?.length > 0 &&
        blogs.nodes.some((blog: {articles?: {nodes?: unknown[]}}) => (blog.articles?.nodes?.length ?? 0) > 0);

    if (!hasRealContent) {
        return {
            blogs: {nodes: [], pageInfo: {hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null}},
            featuredArticle: null
        };
    }

    return {
        blogs,
        featuredArticle
    };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
    return {};
}

export default function Blogs({loaderData}: Route.ComponentProps) {
    const {blogs, featuredArticle} = loaderData;
    const {brandName, blogPageHeading, blogPageDescription} = useSiteSettings();
    const blogNodes = blogs.nodes as BlogWithArticles[];
    const hasMultipleCategories = blogNodes.length > 1;

    // State for selected category - default to first blog
    const [selectedCategoryHandle, setSelectedCategoryHandle] = useState<string>(blogNodes[0]?.handle || "");

    // Get articles for the selected category
    const selectedBlog = blogNodes.find(blog => blog.handle === selectedCategoryHandle);
    const selectedArticles = selectedBlog?.articles?.nodes || [];

    // Handler for category selection
    const handleCategorySelect = (handle: string) => {
        setSelectedCategoryHandle(handle);
    };

    // Get all articles if single category
    const allArticles = hasMultipleCategories ? selectedArticles : blogNodes[0]?.articles?.nodes || [];

    return (
        <div className="px-4 sm:px-6 lg:px-8 mb-4 space-y-12 sm:space-y-16 md:space-y-20 pb-12 sm:pb-16 md:pb-20  ">
            {/* Hero Section - Two Column Layout
                     pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px) */}
            <AnimatedSection animation="hero" threshold={0.1}>
                <header className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-end pt-(--page-breathing-room) pb-6 sm:pb-8 md:pb-12">
                    <PageHeading title={blogPageHeading} description={blogPageDescription} />
                </header>
            </AnimatedSection>

            {/* Featured Article Hero */}
            {featuredArticle && (
                <AnimatedSection animation="scale" threshold={0.1}>
                    <ArticleHero article={featuredArticle} variant="listing" />
                </AnimatedSection>
            )}

            {/* Category Articles Section */}
            {allArticles.length > 0 && (
                <section className="space-y-6 sm:space-y-8">
                    {/* Category Selection - Only show if multiple categories */}
                    {hasMultipleCategories && (
                        <div className="space-y-4 sm:space-y-6">
                            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal text-primary text-center">
                                Browse by Category
                            </h2>
                            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                {blogNodes.map((blog: BlogWithArticles) => (
                                    <Button
                                        key={blog.handle}
                                        variant={selectedCategoryHandle === blog.handle ? "default" : "outline"}
                                        onClick={() => handleCategorySelect(blog.handle)}
                                        size="sm"
                                        className={cn(
                                            "rounded-full border-2 min-h-11 text-sm sm:text-base",
                                            selectedCategoryHandle === blog.handle
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                                        )}
                                    >
                                        {blog.title} ({blog.articles?.nodes?.length || 0})
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Article Carousel */}
                    <ArticleCarousel articles={allArticles} categoryHandle={selectedCategoryHandle} />

                    {/* View All Link */}
                    {selectedBlog && hasMultipleCategories && (
                        <div className="flex justify-center pt-4 sm:pt-6">
                            <Link to={`/blogs/${selectedBlog.handle}`} prefetch="viewport" className="no-underline">
                                <Button
                                    variant="outline"
                                    className="rounded-full border-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground text-sm sm:text-base"
                                >
                                    View all {selectedBlog.title} articles
                                </Button>
                            </Link>
                        </div>
                    )}
                </section>
            )}

            {/* Empty State */}
            {!featuredArticle && allArticles.length === 0 && (
                <div className="text-center py-12 sm:py-16 space-y-4">
                    <p className="text-base sm:text-lg text-muted-foreground">
                        Our journal is coming soon.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        In the meantime, explore our <Link to="/collections/all-products" className="text-primary underline underline-offset-2">latest products</Link>.
                    </p>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// ARTICLE CAROUSEL
// =============================================================================

/**
 * Horizontal article carousel with smooth category transitions.
 *
 * @param articles - Articles to display in carousel
 * @param categoryHandle - Current category (used as key for animations)
 *
 * Features:
 * - Looping carousel with embla-carousel
 * - Responsive item sizing (80% mobile, 45% tablet, etc.)
 * - Mobile scroll indicator dots
 * - Smooth fade-in animations on category change
 */
function ArticleCarousel({articles, categoryHandle}: {articles: ArticleCardData[]; categoryHandle: string}) {
    return (
        <div key={categoryHandle} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Carousel
                opts={{
                    align: "start",
                    loop: true
                }}
                plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                className="w-full"
            >
                <CarouselContent className="-ml-3 sm:-ml-4 md:-ml-6">
                    {articles.map((article, index) => (
                        <CarouselItem
                            key={article.handle}
                            className="pl-3 sm:pl-4 md:pl-6 basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                        >
                            <ArticleCard
                                article={article}
                                index={index}
                                loading={index < 3 ? "eager" : "lazy"}
                                variant="default"
                                showTags={true}
                                showReadingTime={true}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Mobile Scroll Indicator - swipe hint. Index key is intentional: static decorative dots */}
            {articles.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-6 md:hidden" aria-hidden="true">
                    {articles.slice(0, Math.min(articles.length, 5)).map((_, dotIndex) => (
                        <div
                            // eslint-disable-next-line react/no-array-index-key
                            key={`scroll-dot-${dotIndex}`}
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/30"
                        />
                    ))}
                    {articles.length > 5 && (
                        <span className="text-sm text-muted-foreground ml-1">+{articles.length - 5}</span>
                    )}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fetches all blogs with their most recent articles.
 *
 * Returns up to 8 articles per blog for carousel display.
 * Sorted by PUBLISHED_AT descending to show newest first.
 */
const BLOGS_WITH_ARTICLES_QUERY = `#graphql
  query BlogsWithArticles(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
        articles(first: 8, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            handle
            title
            excerpt
            excerptHtml
            content
            contentHtml
            publishedAt
            tags
            image {
              id
              altText
              url
              width
              height
            }
            blog {
              handle
              title
            }
            author: authorV2 {
              name
            }
          }
        }
      }
    }
  }
` as const;

/**
 * Fetches the single most recent article across all blogs.
 *
 * Used for the featured article hero section at the top of the page.
 * Returns full article data including image for hero display.
 */
const LATEST_ARTICLES_QUERY = `#graphql
  query LatestArticles(
    $first: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
      nodes {
        handle
        title
        excerpt
        excerptHtml
        content
        contentHtml
        publishedAt
        tags
        image {
          id
          altText
          url
          width
          height
        }
        blog {
          handle
          title
        }
        author: authorV2 {
          name
        }
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
