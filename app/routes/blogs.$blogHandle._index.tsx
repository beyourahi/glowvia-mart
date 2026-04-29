/**
 * @fileoverview Individual Blog Category Page
 *
 * @description
 * Displays all articles within a specific blog category (e.g., News, Lookbook).
 * Features a hero section, tag-based filtering, and paginated article grid.
 *
 * @route GET /blogs/:blogHandle
 *
 * @features
 * - Featured article hero (most recent)
 * - Tag-based topic filtering
 * - Paginated article grid with infinite scroll
 * - Responsive grid layout (1-3 columns)
 * - SEO optimized with blog-specific meta
 *
 * @layout
 * 1. Blog header (title + description)
 * 2. Featured article hero
 * 3. Tag filter navigation
 * 4. Article grid with pagination
 *
 * @seo
 * - Uses blog's SEO title/description from Shopify
 * - Featured image for social sharing
 * - Proper canonical URL structure
 *
 * @data-loading
 * Critical data:
 * - Blog metadata
 * - Articles with pagination
 * - Unique tags for filtering
 *
 * @related
 * - blogs._index.tsx - All blogs overview
 * - blogs.$blogHandle.$articleHandle.tsx - Article detail
 * - components/blog/TagBadge.tsx - Tag filter UI
 *
 * @see https://shopify.dev/docs/api/storefront/latest/queries/blog
 */

import {Link} from "react-router";
import type {Route} from "./+types/blogs.$blogHandle._index";
import {getPaginationVariables, getSeoMeta} from "@shopify/hydrogen";
import {PaginatedResourceSection} from "~/components/PaginatedResourceSection";
import {redirectIfHandleIsLocalized} from "~/lib/redirect";
import {ArticleCard, type ArticleCardData} from "~/components/blog/ArticleCard";
import {ArticleHero} from "~/components/blog/ArticleHero";
import {TagList} from "~/components/blog/TagBadge";
import {buildCanonicalUrl, truncateDescription, getBrandNameFromMatches, getSiteUrlFromMatches, generateBreadcrumbListSchema} from "~/lib/seo";
import {PageHeading} from "~/components/PageHeading";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const blog = data?.blog;
    const featuredArticle = data?.featuredArticle;

    if (!blog) return [{title: `Blog | ${brandName}`}];

    const title = blog.seo?.title || `${blog.title} | Blog`;
    const description = blog.seo?.description || truncateDescription(`Explore articles from ${blog.title}.`);

    const breadcrumbSchema = generateBreadcrumbListSchema([
        {name: "Home", url: "/"},
        {name: "Blog", url: "/blogs"},
        {name: blog.title, url: `/blogs/${blog.handle}`}
    ], siteUrl);

    return [
        ...(getSeoMeta({
            title,
            description,
            url: buildCanonicalUrl(`/blogs/${blog.handle}`, siteUrl),
            media: featuredArticle?.image?.url
                ? {
                      url: featuredArticle.image.url,
                      width: featuredArticle.image.width,
                      height: featuredArticle.image.height,
                      altText: featuredArticle.image.altText || blog.title,
                      type: "image" as const
                  }
                : undefined
        }) ?? []),
        {"script:ld+json": breadcrumbSchema as any}
    ];
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
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
    const paginationVariables = getPaginationVariables(request, {
        pageBy: 10
    });

    if (!params.blogHandle) {
        throw new Response(`blog not found`, {status: 404});
    }

    const [{blog}] = await Promise.all([
        context.dataAdapter.query(BLOG_QUERY, {
            variables: {
                blogHandle: params.blogHandle,
                ...paginationVariables
            }
        })
    ]);

    if (!blog?.articles?.nodes || blog.articles.nodes.length === 0) {
        throw new Response("Not found", {status: 404});
    }

    redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

    // Extract articles
    const allArticles = blog.articles.nodes as ArticleCardData[];

    // First article is featured
    const featuredArticle = allArticles[0] || null;

    // Remaining articles for grid
    const remainingArticles = {
        ...blog.articles,
        nodes: allArticles.slice(1)
    };

    // Collect unique tags for filtering
    const allTags = [...new Set(allArticles.flatMap(a => a.tags || []))].sort();

    return {
        blog,
        featuredArticle,
        articles: remainingArticles,
        allTags
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

export default function Blog({loaderData}: Route.ComponentProps) {
    const {blog, featuredArticle, articles, allTags} = loaderData;

    return (
        /* Blog page container with responsive padding and max-width constraint for ultrawide
           - Mobile (320px): px-4, space-y-10
           - Tablet: px-6 → px-8
           - Desktop: px-12 → px-16
           - Ultrawide (3xl): centered with max-w-400 (1600px) */
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:mx-auto 3xl:max-w-400 3xl:px-12 mb-4 space-y-10 sm:space-y-12 md:space-y-16 lg:space-y-20 pb-12 sm:pb-16 md:pb-20 lg:pb-24  ">
            {/* Blog Header with fluid title sizing
                 pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px) */}
            <header className="space-y-3 sm:space-y-4 md:space-y-5 text-center max-w-3xl xl:max-w-4xl mx-auto pt-(--page-breathing-room)">
                <PageHeading title={blog.title} />
            </header>

            {/* Featured Article Hero */}
            {featuredArticle && <ArticleHero article={featuredArticle} variant="listing" />}

            {/* Tag Filter (if tags exist) */}
            {allTags.length > 0 && (
                <nav
                    className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
                    aria-label="Filter articles by topic"
                >
                    <span className="text-sm sm:text-sm text-muted-foreground mr-1 sm:mr-2 w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">
                        Browse by topic:
                    </span>
                    <TagList tags={allTags} limit={8} variant="outline" size="default" blogHandle={blog.handle} />
                </nav>
            )}

            {/* Articles Grid */}
            {articles.nodes.length > 0 && (
                <section className="space-y-6 sm:space-y-8 lg:space-y-10">
                    <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-primary">
                        More Articles
                    </h2>

                    <PaginatedResourceSection<ArticleCardData>
                        connection={articles}
                        resourcesClassName="grid gap-2 sm:gap-responsive grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {({node: article, index}) => (
                            <ArticleCard
                                key={article.handle}
                                article={article}
                                index={index}
                                loading={index < 6 ? "eager" : "lazy"}
                                variant="default"
                                showTags={true}
                                showReadingTime={true}
                            />
                        )}
                    </PaginatedResourceSection>
                </section>
            )}

            {/* Empty State */}
            {!featuredArticle && articles.nodes.length === 0 && (
                <div className="text-center py-12 sm:py-16">
                    <p className="text-sm sm:text-base text-muted-foreground">No articles published yet.</p>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fetches a single blog with paginated articles.
 *
 * Includes full article data for both hero display and grid cards:
 * - Tags for filtering functionality
 * - Excerpt/content for reading time calculation
 * - Author info for article cards
 * - Images for visual display
 */
const BLOG_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: PUBLISHED_AT,
        reverse: true
      ) {
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
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
