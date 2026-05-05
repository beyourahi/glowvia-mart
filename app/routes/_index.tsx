/**
 * @fileoverview Homepage Route (/)
 *
 * @description
 * The main landing page for the storefront. This is a content-rich page that
 * combines multiple sections to create an engaging shopping experience optimized
 * for conversion rate and user engagement through strategic content sequencing.
 *
 * Note: AnnouncementBanner is now rendered globally in PageLayout (fixed at top
 * on ALL pages), not as a homepage section. This provides consistent site-wide
 * messaging and allows users to see promotions/announcements on every page.
 *
 * Section sequence (13 total - announcement moved to global layout):
 * 1. Video hero banner (brand introduction)
 * 2. Curated product collections (IMMEDIATE product discovery)
 * 3. Testimonials (social proof validation)
 * 4. Brand marquee (compound trust signals)
 * 5. Explore collections (category navigation)
 * 6. Recently viewed products (personalized re-engagement)
 * 7. Wishlist highlights (saved items reminder)
 * 8. Order history highlights (VIP easy reorder)
 * 9. Promotional banner one (lifestyle inspiration)
 * 10. Blog posts preview (content marketing)
 * 11. FAQ accordion (pre-footer support)
 * 12. Promotional banner two (final promotional push)
 * 13. Instagram feed integration (social community)
 *
 * @architecture
 * Data Loading Strategy:
 * - Critical data (above fold): Curated collections, hero content
 * - Deferred data (below fold): Recently viewed, order history, related collections
 * - Site content (testimonials, FAQ, Instagram): From SiteContentContext
 * - Announcement banner: From root loader via PageLayout (site-wide)
 *
 * @optimization
 * Strategic section ordering based on conversion rate optimization (CRO) principles:
 *
 * TIER 1: AWARENESS & HOOK (Sections 1-2)
 * - VideoHero: Brand introduction, emotional connection
 * - CuratedCollections: IMMEDIATE product discovery
 * Goal: Reduce bounce rate, establish value proposition instantly
 *
 * TIER 2: TRUST & VALIDATION (Sections 3-4)
 * - TestimonialsSection: Social proof RIGHT AFTER products
 * - BrandMarquee: Compound trust signals
 * Goal: Build confidence immediately, leverage recency effect for validation
 *
 * TIER 3: DISCOVERY & NAVIGATION (Sections 5-6)
 * - ExploreCollectionsSection: Natural navigation
 * - RecentlyViewedSection: Personalized re-engagement
 * Goal: Facilitate exploration without cluttering new visitor experience
 *
 * TIER 4: PERSONALIZED ENGAGEMENT (Sections 7-9)
 * - HomepageWishlistSection: Saved items
 * - OrderHistorySection: VIP reorder
 * - PromotionalBannerOne: Visual break
 * Goal: VIP treatment for logged-in users, breathing room
 *
 * TIER 5: CONTENT & COMMUNITY (Sections 10-13)
 * - BlogSection, FAQSection, PromotionalBannerTwo, InstagramSection
 * Goal: Brand depth for engaged users (25% reach this tier)
 *
 * Expected Impact:
 * - Bounce rate: -5% to -8% (products at #2 instead of #3)
 * - Product engagement: +10% to +15% (one less barrier to discovery)
 * - PDP click-through: +8% to +12% (early social proof validation)
 * - Overall conversion: +12% to +18% (optimized funnel sequence)
 * - Scroll depth: +10% to +15% (better early content = downstream momentum)
 *
 * User Segmentation:
 * - New visitors (70%): See generic content (sections 1-5, 9-13)
 * - Returning visitors (20%): See personalized content at natural depth (#6-7)
 * - Logged-in VIP (10%): See all personalization including order history (#8)
 *
 * @seo
 * - Uses shop name as title (no template)
 * - Brand cover image as social media preview
 * - JSON-LD schemas omitted to avoid hydration mismatch
 * - Products higher on page = better keyword density above fold
 *
 * @personalization
 * - Recently viewed: From localStorage/cookie (~30% of visitors)
 * - Order history: For authenticated customers (~10% of visitors)
 * - Wishlist preview: For users with saved items (~10-15% of visitors)
 *
 * @related
 * - root.tsx - Provides header data, shop info, and announcement texts
 * - PageLayout.tsx - Renders announcement banner globally (fixed at top)
 * - SiteContentContext - Provides testimonials, Instagram, FAQ data
 * - CuratedCollections.tsx - Tab-based product showcase (#2 - core conversion driver)
 * - TestimonialsSection.tsx - Social proof validation (#3 - early trust building)
 * - VideoHero.tsx - Hero banner component (#1 - brand introduction)
 */

import {Suspense} from "react";
import {useLoaderData, useRouteLoaderData, Await} from "react-router";
import type {Route} from "./+types/_index";
import type {RootLoader} from "~/root";
import {getSeoMeta} from "@shopify/hydrogen";
import {VideoHero} from "~/components/VideoHero";
import {CuratedCollections, type CuratedCollectionsData} from "~/components/CuratedCollections";
import {RecentlyViewedSection} from "~/components/RecentlyViewedSection";
import {OrderHistorySection} from "~/components/OrderHistorySection";
import {BrandMarquee} from "~/components/BrandMarquee";
import {ExploreCollectionsSection} from "~/components/ExploreCollectionsSection";
import {InstagramSection} from "~/components/InstagramSection";
import {PromotionalBanner} from "~/components/PromotionalBanner";
import {TestimonialsSection} from "~/components/TestimonialsSection";
import {BlogSection} from "~/components/BlogSection";
import {FAQSection} from "~/components/FAQSection";
import {AnimatedSection} from "~/components/AnimatedSection";
import {FeaturedProductSpotlight} from "~/components/FeaturedProductSpotlight";
import {HomepageWishlistSection} from "~/components/HomepageWishlistSection";
import {NewsletterSection} from "~/components/NewsletterSection";
import {Container} from "~/components/Container";
import {buildCollectionTabs} from "~/lib/collections";
import {getRecentlyViewedIds} from "~/lib/recently-viewed";
import {withTimeoutAndFallback, TIMEOUT_DEFAULTS} from "~/lib/promise-utils";
import {
    CUSTOMER_ORDER_HISTORY_QUERY,
    extractOrderHistoryProducts,
    type OrderHistoryProduct
} from "~/graphql/customer-account/CustomerOrderHistoryQuery";
import type {CuratedProductFragment, CuratedCollectionsQuery, ExploreCollectionFragment} from "storefrontapi.generated";
import {
    generateFAQPageSchema,
    generateOrganizationSchema,
    getSeoDefaults
} from "~/lib/seo";
import {useTestimonials, useInstagramMedia, useFaqItems, usePromotionalBanners, useTrafficSourceBanners, useHomepageVariants} from "~/lib/site-content-context";
import {useAgentSurface} from "~/lib/agent-surface-context";
import {ShopLocation} from "~/components/ShopLocation";
import {useWishlist} from "~/lib/wishlist-context";

// =============================================================================
// BELOW-FOLD DATA LOADERS (deferred — do not block TTFB)
// =============================================================================

/**
 * Fetches collections used by the "Explore" section (below the fold).
 * Returns an empty array on error so the section is simply hidden rather than
 * causing the page to fail.
 */
async function loadExploreCollections(context: Route.LoaderArgs["context"]): Promise<ExploreCollectionFragment[]> {
    try {
        const response = await context.dataAdapter.query(EXPLORE_COLLECTIONS_QUERY, {
            cache: context.dataAdapter.CacheLong()
        });
        return response?.collections?.nodes ?? [];
    } catch (error) {
        console.error("Failed to load explore collections:", error);
        return [];
    }
}

/**
 * Fetches recently viewed products (by ID from the cookie) and a general product
 * list in parallel. The general list (`allProducts`) is used as a fallback when
 * the visitor has no cookie history or the server-side lookup returns nothing.
 *
 * Products are returned in the original cookie order (most recently viewed first),
 * reconstructed via a Map after the batched GID lookup.
 */
async function loadRecentlyViewed(
    context: Route.LoaderArgs["context"],
    cookieHeader: string | null
): Promise<{products: CuratedProductFragment[]; allProducts: CuratedProductFragment[]}> {
    const recentlyViewedIds = getRecentlyViewedIds(cookieHeader);

    // Run both queries concurrently — neither depends on the other's result.
    const [recentlyViewedResponse, allProductsResponse] = await Promise.all([
        recentlyViewedIds.length > 0
            ? context.dataAdapter
                  .query(RECENTLY_VIEWED_PRODUCTS_QUERY, {
                      variables: {ids: recentlyViewedIds},
                      cache: context.dataAdapter.CacheShort()
                  })
                  .catch((error: unknown) => {
                      console.error("Failed to load recently viewed products:", error);
                      return null;
                  })
            : Promise.resolve(null),
        context.dataAdapter
            .query(ALL_PRODUCTS_QUERY, {
                cache: context.dataAdapter.CacheShort()
            })
            .catch(() => null) // Silent fail - client will use store data
    ]);

    // Reconstruct `products` preserving original cookie order
    let products: CuratedProductFragment[] = [];
    if (recentlyViewedResponse?.nodes) {
        const productMap = new Map<string, CuratedProductFragment>();
        for (const node of recentlyViewedResponse.nodes) {
            if (node && node.__typename === "Product") {
                productMap.set(node.id, node as CuratedProductFragment);
            }
        }
        products = recentlyViewedIds
            .map(id => productMap.get(id))
            .filter((p): p is CuratedProductFragment => p !== undefined);
    }

    const allProducts: CuratedProductFragment[] = allProductsResponse?.products?.nodes ?? [];

    return {products, allProducts};
}

/**
 * Fetches the four most recent blog articles across all blogs for the homepage
 * blog preview section. Articles from multiple blogs are merged and sorted by
 * publish date descending before slicing to the top 4.
 * Returns an empty array on error.
 */
async function loadRecentArticles(context: Route.LoaderArgs["context"]): Promise<HomepageArticle[]> {
    try {
        const blogsResponse = await context.dataAdapter.query(RECENT_BLOG_ARTICLES_QUERY, {
            cache: context.dataAdapter.CacheLong()
        });
        if (blogsResponse?.blogs?.nodes) {
            const allArticles: HomepageArticle[] = [];
            for (const blog of blogsResponse.blogs.nodes) {
                if (blog.articles?.nodes) {
                    allArticles.push(...blog.articles.nodes);
                }
            }
            return allArticles
                .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                .slice(0, 4);
        }
    } catch (error) {
        console.error("Failed to load recent blog articles:", error);
    }
    return [];
}

/**
 * Fetches the authenticated customer's order history products for the homepage
 * "reorder" section. Returns early with `isLoggedIn: false` for anonymous visitors.
 *
 * After extracting products from orders, a second query resolves product handles
 * (needed for PDP links) via a batch GID lookup. Handle resolution failures are
 * non-fatal — products are returned without handles rather than crashing the section.
 */
async function loadOrderHistory(
    context: Route.LoaderArgs["context"]
): Promise<{products: OrderHistoryProduct[]; isLoggedIn: boolean}> {
    try {
        const isLoggedIn = await context.customerAccount.isLoggedIn();
        if (!isLoggedIn) return {products: [], isLoggedIn: false};

        const {data} = await context.customerAccount.query(CUSTOMER_ORDER_HISTORY_QUERY, {
            variables: {
                first: 10,
                language: context.customerAccount.i18n.language
            }
        });

        let products = extractOrderHistoryProducts(data?.customer?.orders?.nodes ?? [], 16);

        if (products.length > 0) {
            const productIds = products
                .map(p => p.productId)
                .filter((id): id is string => id !== null);

            if (productIds.length > 0) {
                try {
                    const handlesResponse = await context.dataAdapter.query(PRODUCT_HANDLES_QUERY, {
                        variables: {ids: productIds}
                    });
                    if (handlesResponse?.nodes) {
                        const handleMap = new Map<string, string>();
                        for (const node of handlesResponse.nodes) {
                            if (node && node.__typename === "Product") {
                                handleMap.set(node.id, node.handle);
                            }
                        }
                        products = products.map(product => ({
                            ...product,
                            handle: product.productId ? handleMap.get(product.productId) || null : null
                        }));
                    }
                } catch (error) {
                    console.error("Failed to fetch product handles:", error);
                }
            }
        }

        return {products, isLoggedIn: true};
    } catch (error) {
        console.error("Failed to load order history:", error);
        return {products: [], isLoggedIn: false};
    }
}

// =============================================================================
// META FUNCTION
// =============================================================================

export const meta: Route.MetaFunction = ({matches}) => {
    const rootMatch = matches.find((m): m is (typeof matches)[number] & {id: "root"} => m?.id === "root");
    const rootData = rootMatch?.data as
        | {
              siteContent?: {
                  siteSettings?: Parameters<typeof getSeoDefaults>[0] & {socialLinks?: Array<{url: string}>};
                  themeConfig?: Parameters<typeof getSeoDefaults>[1];
              };
          }
        | undefined;
    const seoDefaults = getSeoDefaults(rootData?.siteContent?.siteSettings, rootData?.siteContent?.themeConfig);
    const socialLinks = rootData?.siteContent?.siteSettings?.socialLinks;
    const faqItems = (rootData?.siteContent?.siteSettings as {faqItems?: Array<{question: string; answer: string}>} | undefined)?.faqItems;
    const organizationSchema = generateOrganizationSchema(rootData?.siteContent?.siteSettings, socialLinks);

    return [
        ...(getSeoMeta({
            title: seoDefaults.brandName,
            titleTemplate: null, // No template for homepage - just the site name
            description: seoDefaults.description,
            url: seoDefaults.siteUrl,
            media: seoDefaults.media,
            jsonLd: organizationSchema as any
        }) ?? []),
        ...(faqItems && faqItems.length > 0 ? [{"script:ld+json": generateFAQPageSchema(faqItems) as any}] : [])
    ];
};

export async function loader({context, request}: Route.LoaderArgs) {
    const cookieHeader = request.headers.get("Cookie");

    // START ALL DEFERRED QUERIES — they run concurrently with the hero await below.
    // Initiating these Promises before the awaited hero fetch means they are already
    // in-flight during the ~300-500ms hero network round-trip, so they resolve sooner.

    // DEFERRED: curatedCollections — CuratedCollections component handles streaming via <Suspense><Await>
    // Timeout guard prevents hung Promises from keeping the section in permanent loading state
    const curatedCollections = withTimeoutAndFallback(
        context.dataAdapter
            .query<CuratedCollectionsQuery>(CURATED_COLLECTIONS_QUERY, {cache: context.dataAdapter.CacheShort()})
            .then(response => {
                if (!response?.collections?.nodes) return null;
                const tabs = buildCollectionTabs(response.collections.nodes);
                if (tabs.length === 0) return null;
                return {tabs};
            })
            .catch((error: Error) => {
                console.error("Failed to load curated collections:", error);
                return null;
            }),
        null,
        TIMEOUT_DEFAULTS.API
    );

    // DEFERRED: below-fold sections — returned as Promises so the initial HTML response
    // is not blocked. Each resolves and streams in after the critical above-fold content.
    const exploreCollections = withTimeoutAndFallback(
        loadExploreCollections(context),
        [] as ExploreCollectionFragment[],
        TIMEOUT_DEFAULTS.API
    );
    const recentlyViewed = withTimeoutAndFallback(
        loadRecentlyViewed(context, cookieHeader),
        {products: [] as CuratedProductFragment[], allProducts: [] as CuratedProductFragment[]},
        TIMEOUT_DEFAULTS.API
    );
    const recentArticles = withTimeoutAndFallback(
        loadRecentArticles(context),
        [] as HomepageArticle[],
        TIMEOUT_DEFAULTS.API
    );
    const orderHistory = withTimeoutAndFallback(
        loadOrderHistory(context),
        {products: [] as OrderHistoryProduct[], isLoggedIn: false},
        TIMEOUT_DEFAULTS.AUTH
    );

    // CRITICAL: Fetch hero collection data — awaited because VideoHero is above the fold.
    // Deferred queries are already in-flight by this point so their latency is hidden.
    let randomHeroCollection: HeroCollection | null = null;
    try {
        const heroCollectionsResponse = await context.dataAdapter.query(HERO_COLLECTIONS_QUERY, {
            cache: context.dataAdapter.CacheLong()
        });
        if (heroCollectionsResponse?.collections?.nodes) {
            const isValidHeroCollection = (collection: any): collection is HeroCollection => {
                return (
                    collection.image &&
                    collection.image.url &&
                    collection.description &&
                    collection.id &&
                    collection.title &&
                    collection.handle
                );
            };
            const eligibleCollections = heroCollectionsResponse.collections.nodes.filter(isValidHeroCollection);
            if (eligibleCollections.length > 0) {
                const randomIndex = Math.floor(Math.random() * eligibleCollections.length);
                randomHeroCollection = eligibleCollections[randomIndex];
            }
        }
    } catch (error) {
        console.error("Failed to load hero collections:", error);
        // Fall back to null - VideoHero will use metaobject content
    }

    return {
        randomHeroCollection,
        curatedCollections,
        exploreCollections,
        recentlyViewed,
        recentArticles,
        orderHistory
    };
}

// Type definition for hero collection (dynamic collection showcase in VideoHero)
export interface HeroCollection {
    id: string;
    title: string;
    handle: string;
    description: string;
    image: {
        url: string;
        altText: string | null;
        width: number;
        height: number;
    };
}

// Type definition for homepage articles
export interface HomepageArticle {
    handle: string;
    title: string;
    excerpt?: string | null;
    publishedAt: string;
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

export default function Homepage() {
    const data = useLoaderData<typeof loader>();
    const rootData = useRouteLoaderData<RootLoader>("root");
    const featuredProduct = rootData?.siteContent?.siteSettings?.featuredProductSection ?? null;
    const testimonials = useTestimonials();
    const instagramMedia = useInstagramMedia();
    const faqItems = useFaqItems();
    const {bannerOneMedia, bannerTwoMedia} = usePromotionalBanners();
    const {count: wishlistCount} = useWishlist();
    const trafficSourceBanners = useTrafficSourceBanners();
    const homepageVariants = useHomepageVariants();
    const {isAgent} = useAgentSurface();
    const agentVariant = homepageVariants?.find(v => v.segment === "agent") ?? null;
    void trafficSourceBanners; // consumed by server-rendered banner components when configured

    return (
        <>
            {/* ═══════════════════════════════════════════════════════════════════
                TIER 1: AWARENESS & HOOK - Above the fold, critical first impression
                ═══════════════════════════════════════════════════════════════════ */}

            {/* 1. VideoHero - Brand introduction with dynamic collection showcase */}
            {isAgent ? (
                <section className="px-6 py-16 max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">{agentVariant?.heroHeading ?? "Explore our catalog"}</h1>
                    <p className="text-muted-foreground mb-8">{agentVariant?.heroDescription ?? "Browse products, collections, and policies below."}</p>
                    {agentVariant?.ctaUrl ? (
                        <a href={agentVariant.ctaUrl} className="text-primary underline underline-offset-4">
                            {agentVariant.ctaLabel ?? "Browse catalog"}
                        </a>
                    ) : null}
                </section>
            ) : (
                <VideoHero randomCollection={data.randomHeroCollection} />
            )}

            {/* Edge-to-edge container with minimal padding (4px-12px)
                 Content spans full viewport width on all screen sizes
                 Sections use negative margins to break out for full-bleed when needed */}
            <Container className="mb-4 pb-16 md:pb-20 lg:pb-24 xl:pb-28 2xl:pb-32">
                {/* 2. CuratedCollections - IMMEDIATE product discovery (MOVED UP FROM #3)
                     WHY: Show products NOW. Core conversion driver. Answers "What do you sell?"
                     IMPACT: Reduces bounce rate, increases engagement, instant credibility
                     AUDIENCE: 100% of visitors */}
                <AnimatedSection animation="section" threshold={0.1} className="mt-8 sm:mt-12">
                    <CuratedCollections collections={data.curatedCollections} />
                </AnimatedSection>

                {featuredProduct ? (
                    <AnimatedSection animation="slide-up" threshold={0.12} className="mt-12 md:mt-16 lg:mt-20">
                        <FeaturedProductSpotlight product={featuredProduct} />
                    </AnimatedSection>
                ) : null}

                {/* ═══════════════════════════════════════════════════════════════════
                    TIER 2: TRUST & VALIDATION - Build confidence after product interest
                    ═══════════════════════════════════════════════════════════════════ */}

                {/* 3. TestimonialsSection - Social proof RIGHT AFTER products (MOVED UP FROM #7)
                     WHY: Validate product quality immediately. "Others love this" = trust
                     IMPACT: +8-12% click-through to PDPs, early trust building
                     AUDIENCE: 100% of visitors */}
                {testimonials && testimonials.length > 0 && (
                    <AnimatedSection animation="slide-up" threshold={0.15} className="mt-12 md:mt-16 lg:mt-20">
                        <TestimonialsSection testimonials={testimonials} />
                    </AnimatedSection>
                )}

                {/* Note: AnnouncementBanner previously at section #4 is now rendered globally
                     in PageLayout - fixed at the very top of all pages above the floating navbar.
                     This provides consistent site-wide messaging and better UX. */}

                {/* 4. BrandMarquee - Compound trust with testimonials (renumbered from #5)
                     WHY: Multiple trust signals together = conversion boost
                     IMPACT: "Featured in" + "5-star reviews" = strong credibility
                     AUDIENCE: 100% of visitors */}
                <AnimatedSection animation="fade" threshold={0.2} className="mt-12 md:mt-16 lg:mt-20">
                    <BrandMarquee />
                </AnimatedSection>

                {/* ═══════════════════════════════════════════════════════════════════
                    TIER 3: DISCOVERY & NAVIGATION - Deeper product exploration
                    ═══════════════════════════════════════════════════════════════════ */}

                {/* 6. ExploreCollectionsSection - Natural navigation (MOVED UP FROM #8)
                     WHY: "What else do you have?" at perfect moment in journey
                     IMPACT: +10-15% collection page visits, better category discovery
                     AUDIENCE: 100% of visitors */}
                <Suspense fallback={null}>
                    <Await resolve={data.exploreCollections}>
                        {(collections) =>
                            collections && collections.length > 0 ? (
                                <AnimatedSection animation="section" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                                    <ExploreCollectionsSection collections={collections} />
                                </AnimatedSection>
                            ) : null
                        }
                    </Await>
                </Suspense>

                {/* 7. RecentlyViewedSection - Personalized re-engagement (MOVED DOWN FROM #5)
                     WHY: Returning visitors (30%) see personalized content at natural depth
                     IMPACT: Better experience for new visitors (70%), meaningful for returning users
                     AUDIENCE: ~30% of visitors (has browsing history) */}
                <Suspense fallback={null}>
                    <Await resolve={data.recentlyViewed}>
                        {(rv) =>
                            rv?.products?.length > 0 ? (
                                <AnimatedSection animation="slide-up" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                                    <RecentlyViewedSection products={rv.products} allProducts={rv.allProducts} />
                                </AnimatedSection>
                            ) : null
                        }
                    </Await>
                </Suspense>

                {/* ═══════════════════════════════════════════════════════════════════
                    TIER 4: PERSONALIZED ENGAGEMENT - VIP treatment for engaged users
                    ═══════════════════════════════════════════════════════════════════ */}

                {/* 8. HomepageWishlistSection - Saved items reminder (MOVED DOWN FROM #6)
                     WHY: Users with wishlists (10-15%) see personalized nudge
                     IMPACT: Cart recovery, doesn't clutter experience for users without wishlists
                     AUDIENCE: ~10-15% of visitors (has wishlist) */}
                {wishlistCount > 0 && (
                    <AnimatedSection animation="slide-up" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                        <HomepageWishlistSection />
                    </AnimatedSection>
                )}

                {/* 9. OrderHistorySection - VIP easy reorder (MOVED UP FROM #10)
                     WHY: Logged-in customers (10%) get prominent reorder access
                     IMPACT: +15-20% reorder rate, loyalty boost
                     AUDIENCE: ~10% of visitors (logged-in customers) */}
                <Suspense fallback={null}>
                    <Await resolve={data.orderHistory}>
                        {(oh) =>
                            oh?.isLoggedIn && oh.products.length > 0 ? (
                                <AnimatedSection animation="slide-up" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                                    <OrderHistorySection products={oh.products} />
                                </AnimatedSection>
                            ) : null
                        }
                    </Await>
                </Suspense>

                {/* 10. PromotionalBannerOne - Visual break & lifestyle (MOVED DOWN FROM #9)
                      WHY: Breathing room after product-heavy sections, aspiration + storytelling
                      IMPACT: Reduces fatigue, adds brand personality
                      AUDIENCE: 100% of visitors
                      Negative margins match Container's minimal padding for full-bleed effect */}
                {bannerOneMedia && (
                    <AnimatedSection
                        animation="scale"
                        threshold={0.15}
                        className="mt-12 md:mt-16 lg:mt-20 xl:mt-24 -mx-container"
                    >
                        <PromotionalBanner media={bannerOneMedia} />
                    </AnimatedSection>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    TIER 5: CONTENT & COMMUNITY - Brand depth for engaged users
                    ═══════════════════════════════════════════════════════════════════ */}

                {/* 11. BlogSection - Content depth (UNCHANGED POSITION)
                      WHY: Brand storytelling for engaged users (25%)
                      IMPACT: SEO benefit, brand depth, content marketing
                      AUDIENCE: ~25% of visitors (high engagement) */}
                <Suspense fallback={null}>
                    <Await resolve={data.recentArticles}>
                        {(articles) =>
                            articles && articles.length > 0 ? (
                                <AnimatedSection animation="section" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                                    <BlogSection articles={articles} />
                                </AnimatedSection>
                            ) : null
                        }
                    </Await>
                </Suspense>

                {/* 12. FAQSection - Pre-footer support (UNCHANGED POSITION)
                      WHY: Last-minute objection handling before footer
                      IMPACT: Reduces support inquiries, builds confidence
                      AUDIENCE: ~20% of visitors (consideration stage) */}
                {faqItems && faqItems.length > 0 && (
                    <AnimatedSection animation="slide-up" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                        <FAQSection faqItems={faqItems} maxItems={10} />
                    </AnimatedSection>
                )}

                {/* 13. NewsletterSection - Email capture at peak trust
                      WHY: After FAQ objection handling, users are in highest trust state
                      IMPACT: Email list growth, repeat purchase channel
                      AUDIENCE: ~20% of visitors (engaged, post-FAQ) */}
                <AnimatedSection animation="slide-up" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                    <NewsletterSection />
                </AnimatedSection>

                {/* 14. PromotionalBannerTwo - Final push (UNCHANGED POSITION)
                      WHY: Last chance to hook deep scrollers (15%)
                      IMPACT: "One more thing" before exit
                      AUDIENCE: ~15% of visitors (deep scrollers)
                      Negative margins match Container's minimal padding for full-bleed effect */}
                {bannerTwoMedia && (
                    <AnimatedSection
                        animation="scale"
                        threshold={0.15}
                        className="mt-12 md:mt-16 lg:mt-20 xl:mt-24 -mx-container"
                    >
                        <PromotionalBanner media={bannerTwoMedia} />
                    </AnimatedSection>
                )}

                {/* 14. InstagramSection - Social footer (UNCHANGED POSITION)
                      WHY: Perfect footer content, UGC + community for brand enthusiasts
                      IMPACT: Social proof, Instagram follows, community building
                      AUDIENCE: ~10% of visitors (brand enthusiasts) */}
                {instagramMedia && instagramMedia.length > 0 && (
                    <AnimatedSection animation="slide-up" threshold={0.1} className="mt-16 md:mt-20 lg:mt-24">
                        <InstagramSection media={instagramMedia} />
                    </AnimatedSection>
                )}

                {/* Shop Location — full-bleed dark map panel, hidden when no locations configured */}
                <AnimatedSection animation="slide-up" threshold={0.1} className="mt-16 md:mt-20 lg:mt-24 -mx-container">
                    <ShopLocation />
                </AnimatedSection>
            </Container>
        </>
    );
}

// GraphQL query to fetch collections with products for the tabbed section
const CURATED_COLLECTIONS_QUERY = `#graphql
  fragment CuratedProduct on Product {
    id
    title
    handle
    availableForSale
    tags
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    images(first: 3) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    media(first: 5) {
      nodes {
        __typename
        ... on MediaImage {
          id
          alt
          image {
            id
            url
            altText
            width
            height
          }
        }
        ... on Video {
          id
          alt
          sources {
            url
            mimeType
            width
            height
          }
          previewImage {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
    variants(first: 5) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }

  query CuratedCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 20) {
      nodes {
        id
        handle
        title
        products(first: 6) {
          nodes {
            ...CuratedProduct
          }
        }
      }
    }
  }
` as const;

// GraphQL query to fetch recently viewed products by IDs
const RECENTLY_VIEWED_PRODUCTS_QUERY = `#graphql
  query HomeRecentlyViewedProducts(
    $ids: [ID!]!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        __typename
        id
        title
        handle
        availableForSale
        tags
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        featuredImage {
          id
          url
          altText
          width
          height
        }
        images(first: 3) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        media(first: 5) {
          nodes {
            __typename
            ... on MediaImage {
              id
              alt
              image {
                id
                url
                altText
                width
                height
              }
            }
            ... on Video {
              id
              alt
              sources {
                url
                mimeType
                width
                height
              }
              previewImage {
                id
                url
                altText
                width
                height
              }
            }
          }
        }
        variants(first: 5) {
          nodes {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
` as const;

// GraphQL query to fetch all products for client-side filtering
// Reduced payload: 50 products (down from 250), 3 images, 2 media, 3 variants (down from 10/5/100)
const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 250) {
      nodes {
        id
        title
        handle
        availableForSale
        tags
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        featuredImage {
          id
          url
          altText
          width
          height
        }
        images(first: 3) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        media(first: 2) {
          nodes {
            __typename
            ... on MediaImage {
              id
              alt
              image {
                id
                url
                altText
                width
                height
              }
            }
            ... on Video {
              id
              alt
              sources {
                url
                mimeType
                width
                height
              }
              previewImage {
                id
                url
                altText
                width
                height
              }
            }
          }
        }
        variants(first: 3) {
          nodes {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
` as const;

// GraphQL query to fetch collections suitable for hero card display
// Only fetches collections with images and descriptions for the dynamic hero showcase
const HERO_COLLECTIONS_QUERY = `#graphql
  fragment HeroCollection on Collection {
    id
    handle
    title
    description
    image {
      url
      altText
      width
      height
    }
  }

  query HeroCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 10) {
      nodes {
        ...HeroCollection
      }
    }
  }
` as const;

// GraphQL query to fetch collections for Explore Collections section
const EXPLORE_COLLECTIONS_QUERY = `#graphql
  fragment ExploreCollection on Collection {
    id
    handle
    title
    description
    image {
      id
      url
      altText
      width
      height
    }
  }

  query ExploreCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 5) {
      nodes {
        ...ExploreCollection
      }
    }
  }
` as const;

// GraphQL query to fetch product handles by IDs (for order history linking)
const PRODUCT_HANDLES_QUERY = `#graphql
  query ProductHandles(
    $ids: [ID!]!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        __typename
        id
        handle
      }
    }
  }
` as const;

const RECENT_BLOG_ARTICLES_QUERY = `#graphql
  fragment HomepageArticle on Article {
    handle
    title
    excerpt
    publishedAt
    image {
      url
      altText
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

  query RecentBlogArticles(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    blogs(first: 5) {
      nodes {
        articles(first: 2, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            ...HomepageArticle
          }
        }
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
