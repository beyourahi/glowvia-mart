/**
 * @fileoverview Blog Article Detail Page
 *
 * @description
 * Displays a single blog article with full content, author info,
 * social sharing, and related articles. Magazine-style layout with
 * centered header, immersive hero image, reading progress bar,
 * and scroll-triggered entrance animations.
 *
 * @route GET /blogs/:blogHandle/:articleHandle
 *
 * @features
 * - Immersive hero image with gradient fade into background
 * - Reading progress bar (fixed 2px at viewport top)
 * - Centered, magazine-style article header
 * - Prose-optimized content via .article-content CSS class
 * - Reading time calculation
 * - Tag-based navigation
 * - Social share buttons
 * - Author bio section
 * - Related articles carousel
 * - JSON-LD structured data for SEO (content renders without entrance animations)
 *
 * @layout
 * 1. Reading progress bar (fixed position)
 * 2. Immersive hero image (gradient fade)
 * 3. Centered article header (tags, title, meta, flourish)
 * 4. Article content (.article-content class)
 * 5. Share buttons (whitespace separation)
 * 6. Author bio (card variant)
 * 7. Back to blog link (pill button)
 * 8. Related articles carousel
 *
 * @typography
 * Uses dedicated .article-content CSS class (in tailwind.css):
 * - 17px body, 1.8 line-height, foreground/80
 * - Serif headings for hierarchy
 * - First paragraph lead treatment (lg/xl)
 * - Refined link styling with underline-offset
 *
 * @seo
 * - BlogPosting JSON-LD schema
 * - Article-specific meta tags
 * - Open Graph image from article
 *
 * @related
 * - blogs.$blogHandle._index.tsx - Blog listing
 * - components/blog/ShareButtons.tsx - Social sharing
 * - components/blog/AuthorBio.tsx - Author display
 * - components/blog/RelatedArticles.tsx - Recommendations
 * - hooks/useReadingProgress.ts - Reading progress tracking
 * - styles/tailwind.css - .article-content prose styles
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/Article
 */

import {Link} from "react-router";
import type {Route} from "./+types/blogs.$blogHandle.$articleHandle";
import {Image, getSeoMeta} from "@shopify/hydrogen";
import {ArrowLeft} from "lucide-react";
import {redirectIfHandleIsLocalized} from "~/lib/redirect";
import {calculateReadingTime, formatArticleDate, filterRelatedArticles} from "~/lib/blog-utils";
import {TagList} from "~/components/blog/TagBadge";
import {ShareButtons} from "~/components/blog/ShareButtons";
import {AuthorBio} from "~/components/blog/AuthorBio";
import {RelatedArticles} from "~/components/blog/RelatedArticles";
import type {ArticleCardData} from "~/components/blog/ArticleCard";
import {
    generateBlogPostingSchema,
    generateBreadcrumbListSchema,
    truncateDescription,
    buildCanonicalUrl,
    getBrandNameFromMatches,
    getSiteUrlFromMatches
} from "~/lib/seo";
import {deriveArticleBreadcrumbs} from "~/lib/seo-breadcrumbs";
import {useReadingProgress} from "~/hooks/useReadingProgress";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const article = data?.article;
    const blogHandle = data?.blogHandle;

    if (!article) return [{title: `Article Not Found | ${brandName}`}];

    const title = article.seo?.title || article.title;
    const description = article.seo?.description || truncateDescription(article.excerpt);

    const baseMeta =
        getSeoMeta({
            title,
            description,
            url: buildCanonicalUrl(`/blogs/${blogHandle}/${article.handle}`, siteUrl),
            media: article.image?.url
                ? {
                      url: article.image.url,
                      width: article.image.width,
                      height: article.image.height,
                      altText: article.image.altText || article.title,
                      type: "image" as const
                  }
                : undefined,
            jsonLd: generateBlogPostingSchema(article, blogHandle || "news") as any
        }) ?? [];

    // Article-specific Open Graph tags for richer social sharing
    const articleMeta = [
        ...(article?.publishedAt ? [{property: "og:published_time", content: article.publishedAt}] : []),
        ...(article?.author?.name ? [{property: "og:article:author", content: article.author.name}] : [])
    ];

    const breadcrumbSchema = generateBreadcrumbListSchema(
        deriveArticleBreadcrumbs(
            blogHandle || "news",
            blogHandle ? blogHandle.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Blog",
            article.handle,
            article.title
        ),
        siteUrl
    );

    return [...baseMeta, ...articleMeta, {"script:ld+json": breadcrumbSchema as any}];
};

export async function loader(args: Route.LoaderArgs) {
    // Await the critical data required to render initial state of the page
    const criticalData = await loadCriticalData(args);

    // Start fetching non-critical data without blocking time to first byte
    const deferredData = loadDeferredData(args, criticalData.allArticles);

    return {...criticalData, ...deferredData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
    const {blogHandle, articleHandle} = params;

    if (!articleHandle || !blogHandle) {
        throw new Response("Not found", {status: 404});
    }

    const [{blog}] = await Promise.all([
        context.dataAdapter.query(ARTICLE_QUERY, {
            variables: {blogHandle, articleHandle}
        })
    ]);

    if (!blog?.articleByHandle) {
        throw new Response(null, {status: 404});
    }

    redirectIfHandleIsLocalized(
        request,
        {
            handle: articleHandle,
            data: blog.articleByHandle
        },
        {
            handle: blogHandle,
            data: blog
        }
    );

    const article = blog.articleByHandle;

    // Calculate reading time
    const readingTime = calculateReadingTime(article.contentHtml || article.content || "");

    return {
        article,
        blogHandle,
        blogTitle: blog.title,
        readingTime,
        allArticles: blog.articles?.nodes || []
    };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs, allArticles: ArticleCardData[]) {
    // Filter related articles by tags (done client-side from already-fetched data)
    const relatedArticles = Promise.resolve(allArticles).then(articles => {
        if (!articles || articles.length === 0) return null;
        // Get current article to filter against
        // Since we have allArticles, we can filter here
        return articles.slice(0, 4) as ArticleCardData[];
    });

    return {relatedArticles};
}

export default function Article({loaderData}: Route.ComponentProps) {
    const {article, blogHandle, blogTitle, readingTime, relatedArticles} = loaderData;
    const {title, image, contentHtml, author, tags, publishedAt} = article;

    const publishedDate = formatArticleDate(publishedAt);
    const {contentRef, progress} = useReadingProgress();

    // Filter related articles (exclude current)
    const filteredRelatedArticles = Promise.resolve(relatedArticles).then(articles => {
        if (!articles) return null;
        return filterRelatedArticles(articles, article, 4);
    });

    return (
        <div className="pb-16 md:pb-20 lg:pb-24">
            {/* Reading Progress Bar - thin fixed indicator at viewport top
                2px height, fills with primary color as user scrolls through content */}
            <div
                className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Reading progress"
            >
                <div
                    className="h-full bg-primary transition-[width] duration-150 ease-out"
                    style={{width: `${progress}%`}}
                />
            </div>

            {/* Immersive Hero Image
                Full-bleed on mobile, rounded + constrained on desktop.
                pt-(--page-breathing-room): Breathing room from fixed header (24px to 64px)
                Bottom gradient fades into page background for seamless transition.
                No entrance animation — above-the-fold content must be immediately visible. */}
            {image && (
                <div className="relative w-full overflow-hidden pt-(--page-breathing-room) md:rounded-2xl md:mx-auto md:max-w-5xl">
                    <div className="aspect-16/10 sm:aspect-video md:aspect-2/1">
                        <Image
                            data={image}
                            sizes="(min-width: 1280px) 1024px, (min-width: 768px) 90vw, 100vw"
                            loading="eager"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    {/* Bottom gradient fade into background */}
                    <div
                        className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-linear-to-t from-background via-background/60 to-transparent"
                        aria-hidden="true"
                    />
                </div>
            )}

            <article className="px-4 md:px-6 lg:px-8">
                {/* Article Header - centered magazine-style layout
                    Matches the blog index and category pages' centered headings.
                    No entrance animation — content renders immediately for perceived performance. */}
                <header className="mx-auto max-w-3xl text-center space-y-5 md:space-y-6 pt-6 md:pt-8 mb-10 md:mb-14 lg:mb-16">
                    {/* Tags - centered row */}
                    {tags && tags.length > 0 && (
                        <div className="flex justify-center">
                            <TagList tags={tags} variant="outline" size="sm" blogHandle={blogHandle} />
                        </div>
                    )}

                    {/* Title - fluid sizing with serif typography */}
                    <h1 className="font-serif text-fluid-h2 font-medium leading-[1.15] tracking-tight text-primary">
                        {title}
                    </h1>

                    {/* Meta Row - centered with dot separators */}
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm md:text-base text-muted-foreground">
                        {author?.name && (
                            <>
                                <span className="font-medium text-foreground">{author.name}</span>
                                <span className="text-muted-foreground/40" aria-hidden="true">
                                    &middot;
                                </span>
                            </>
                        )}
                        <time dateTime={publishedAt}>{publishedDate}</time>
                        <span className="text-muted-foreground/40" aria-hidden="true">
                            &middot;
                        </span>
                        <span>{readingTime} min read</span>
                    </div>

                    {/* Decorative flourish line - replaces full-width Separator */}
                    <div className="flex justify-center pt-2" aria-hidden="true">
                        <div className="w-12 h-px bg-primary/30" />
                    </div>
                </header>

                {/* Article Content
                    Uses dedicated .article-content CSS class from tailwind.css
                    (follows same pattern as .policy-content)
                    Note: contentHtml is sanitized by Shopify's Storefront API.
                    No fade-in — content renders immediately on page load. */}
                <ArticleContent contentHtml={contentHtml} contentRef={contentRef} />

                {/* Share Section - whitespace separation instead of Separator */}
                <div className="mx-auto prose-readable-wide pt-8 md:pt-10 pb-6 md:pb-8">
                    <ShareButtons
                        article={{
                            title,
                            excerpt: article.excerpt,
                            image: article.image,
                            blog: {handle: blogHandle},
                            handle: article.handle
                        }}
                        variant="inline"
                    />
                </div>

                {/* Author Bio - card background (bg-muted/30) provides natural separation */}
                {author?.bio && (
                    <div className="mx-auto prose-readable-wide pb-6 md:pb-8">
                        <AuthorBio author={author} variant="card" />
                    </div>
                )}

                {/* Back to Blog - polished pill-shaped link with icon animation */}
                <div className="mx-auto prose-readable-wide pt-4 md:pt-6 pb-8 md:pb-12">
                    <Link
                        to={`/blogs/${blogHandle}`}
                        prefetch="viewport"
                        className="group inline-flex items-center gap-2 rounded-full border-2 border-primary/30 px-5 py-2.5 text-sm md:text-base text-muted-foreground motion-link hover:text-foreground hover:border-primary/60 hover:no-underline min-h-11"
                    >
                        <ArrowLeft className="size-4 motion-link group-hover:-translate-x-0.5" />
                        <span>Back to {blogTitle || "Blog"}</span>
                    </Link>
                </div>
            </article>

            {/* Related Articles Section - generous spacing via mt-section utility */}
            <div className="mt-section px-4 md:px-6 lg:px-8">
                <RelatedArticles articles={filteredRelatedArticles} title="More Articles" />
            </div>
        </div>
    );
}

/**
 * Renders the article body HTML. Extracted so the main component stays focused
 * and to keep the sanitized-HTML injection isolated to a single small component.
 * contentHtml comes from Shopify's Storefront API and is already sanitized.
 */
function ArticleContent({
    contentHtml,
    contentRef
}: {
    contentHtml: string;
    contentRef: React.RefObject<HTMLDivElement>;
}) {
    return (
        <div
            ref={contentRef}
            dangerouslySetInnerHTML={{__html: contentHtml}}
            className="article-content mx-auto prose-readable-wide py-8 md:py-10 lg:py-12"
        />
    );
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fetches article with full content and related articles.
 *
 * Includes:
 * - Full article content (HTML for rendering)
 * - Author info with optional bio
 * - Tags for navigation and filtering
 * - SEO metadata
 * - 10 recent articles from same blog for "related" section
 */
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      title
      articleByHandle(handle: $articleHandle) {
        handle
        title
        content
        contentHtml
        excerpt
        excerptHtml
        publishedAt
        tags
        author: authorV2 {
          name
          bio
          firstName
          lastName
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
      articles(first: 10, sortKey: PUBLISHED_AT, reverse: true) {
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
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
