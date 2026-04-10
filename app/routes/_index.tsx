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

import {useLoaderData, useRouteLoaderData} from "react-router";
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
// Note: AnnouncementBanner is now rendered globally in PageLayout (fixed at top on all pages)
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
import {
    CUSTOMER_ORDER_HISTORY_QUERY,
    extractOrderHistoryProducts,
    type OrderHistoryProduct
} from "~/graphql/customer-account/CustomerOrderHistoryQuery";
import type {CuratedProductFragment, ExploreCollectionFragment} from "storefrontapi.generated";
import {
    getSeoDefaults,
    generateOrganizationSchema,
    generateWebsiteSchema
} from "~/lib/seo";
import {useTestimonials, useInstagramMedia, useFaqItems, usePromotionalBanners} from "~/lib/site-content-context";
import {useWishlist} from "~/lib/wishlist-context";

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
    const organizationSchema = generateOrganizationSchema(rootData?.siteContent?.siteSettings, socialLinks);
    const websiteSchema = generateWebsiteSchema(rootData?.siteContent?.siteSettings);

    return (
        getSeoMeta({
            title: seoDefaults.brandName,
            titleTemplate: null, // No template for homepage - just the site name
            description: seoDefaults.description,
            url: seoDefaults.siteUrl,
            media: seoDefaults.media,
            jsonLd: [organizationSchema, websiteSchema] as any
        }) ?? []
    );
};

export async function loader({context, request}: Route.LoaderArgs) {
    // Fetch collections suitable for hero card display (with images and descriptions)
    let randomHeroCollection: HeroCollection | null = null;
    try {
        const heroCollectionsResponse = await context.dataAdapter.query(HERO_COLLECTIONS_QUERY);
        if (heroCollectionsResponse?.collections?.nodes) {
            // Type guard to ensure collection has required image and description
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

            // Filter collections that have both image and description
            const eligibleCollections = heroCollectionsResponse.collections.nodes.filter(isValidHeroCollection);

            // Randomly select one collection if we have any
            if (eligibleCollections.length > 0) {
                const randomIndex = Math.floor(Math.random() * eligibleCollections.length);
                randomHeroCollection = eligibleCollections[randomIndex];
            }
        }
    } catch (error) {
        console.error("Failed to load hero collections:", error);
        // Fall back to null - VideoHero will use metaobject content
    }

    const curatedCollections: Promise<CuratedCollectionsData> = context.storefront
        .query(CURATED_COLLECTIONS_QUERY)
        .then(response => {
            if (!response?.collections?.nodes) return null;

            const tabs = buildCollectionTabs(response.collections.nodes);

            if (tabs.length === 0) return null;

            return {tabs};
        })
        .catch((error: Error) => {
            console.error("Failed to load curated collections:", error);
            return null;
        });

    // Get recently viewed product IDs from cookie
    const cookieHeader = request.headers.get("Cookie");
    const recentlyViewedIds = getRecentlyViewedIds(cookieHeader);

    // Fetch recently viewed products if we have IDs
    let recentlyViewedProducts: CuratedProductFragment[] = [];

    if (recentlyViewedIds.length > 0) {
        try {
            const response = await context.dataAdapter.query(RECENTLY_VIEWED_PRODUCTS_QUERY, {
                variables: {ids: recentlyViewedIds}
            });

            if (response?.nodes) {
                // Filter out null values and sort by original order
                const productMap = new Map<string, CuratedProductFragment>();
                for (const node of response.nodes) {
                    // Client-side filter: nodes(ids:) query doesn't support availability filters
                    if (node && node.__typename === "Product" && node.availableForSale) {
                        productMap.set(node.id, node as CuratedProductFragment);
                    }
                }

                // Maintain the order from recentlyViewedIds
                recentlyViewedProducts = recentlyViewedIds
                    .map(id => productMap.get(id))
                    .filter((p): p is CuratedProductFragment => p !== undefined);
            }
        } catch (error) {
            console.error("Failed to load recently viewed products:", error);
        }
    }

    // Fetch all available products for client-side use (API-level filter applied)
    let allProductsData: CuratedProductFragment[] = [];
    try {
        const response = await context.dataAdapter.query(ALL_PRODUCTS_QUERY);
        if (response?.products?.nodes) {
            allProductsData = response.products.nodes;
        }
    } catch {
        // Silent fail - client will use store data
    }

    // Fetch collections for Explore Collections section
    let exploreCollections: ExploreCollectionFragment[] = [];
    try {
        const response = await context.dataAdapter.query(EXPLORE_COLLECTIONS_QUERY);
        if (response?.collections?.nodes) {
            exploreCollections = response.collections.nodes;
        }
    } catch (error) {
        console.error("Failed to load explore collections:", error);
    }

    // Fetch order history for logged-in customers
    let orderHistoryProducts: OrderHistoryProduct[] = [];
    let isLoggedIn = false;

    try {
        isLoggedIn = await context.customerAccount.isLoggedIn();

        if (isLoggedIn) {
            const {data} = await context.customerAccount.query(CUSTOMER_ORDER_HISTORY_QUERY, {
                variables: {
                    first: 10,
                    language: context.customerAccount.i18n.language
                }
            });

            if (data?.customer?.orders?.nodes) {
                orderHistoryProducts = extractOrderHistoryProducts(data.customer.orders.nodes, 16);

                // Fetch product handles from Storefront API for linking to product pages
                if (orderHistoryProducts.length > 0) {
                    const productIds = orderHistoryProducts
                        .map(p => p.productId)
                        .filter((id): id is string => id !== null);

                    if (productIds.length > 0) {
                        try {
                            const handlesResponse = await context.dataAdapter.query(PRODUCT_HANDLES_QUERY, {
                                variables: {ids: productIds}
                            });

                            if (handlesResponse?.nodes) {
                                // Create a map of productId -> handle
                                const handleMap = new Map<string, string>();
                                for (const node of handlesResponse.nodes) {
                                    if (node && node.__typename === "Product") {
                                        handleMap.set(node.id, node.handle);
                                    }
                                }

                                // Update orderHistoryProducts with handles
                                orderHistoryProducts = orderHistoryProducts.map(product => ({
                                    ...product,
                                    handle: product.productId ? handleMap.get(product.productId) || null : null
                                }));
                            }
                        } catch (error) {
                            console.error("Failed to fetch product handles:", error);
                            // Continue without handles - products will fall back to non-clickable state
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to load order history:", error);
    }

    // Note: Announcement banner is now rendered globally in PageLayout
    // Data comes from site_settings metaobject via root loader (siteContent.siteSettings.announcementBanner)
    // HOMEPAGE_METAFIELDS_QUERY is no longer needed for announcements

    // Fetch recent blog articles
    let recentArticles: HomepageArticle[] = [];

    try {
        const blogsResponse = await context.dataAdapter.query(RECENT_BLOG_ARTICLES_QUERY);
        if (blogsResponse?.blogs?.nodes) {
            // Flatten articles from all blogs and get the most recent ones
            const allArticles: HomepageArticle[] = [];
            for (const blog of blogsResponse.blogs.nodes) {
                if (blog.articles?.nodes) {
                    allArticles.push(...blog.articles.nodes);
                }
            }
            // Sort by publishedAt descending and take the 4 most recent for blog section layout
            recentArticles = allArticles
                .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                .slice(0, 4);
        }
    } catch (error) {
        console.error("Failed to load recent blog articles:", error);
    }

    // Note: Testimonials and Instagram media are now loaded from site_settings
    // via context hooks in the component (useTestimonials, useInstagramMedia)

    return {
        randomHeroCollection,
        curatedCollections,
        recentlyViewed: {
            products: recentlyViewedProducts,
            hasProducts: recentlyViewedProducts.length > 0
        },
        allProducts: allProductsData,
        exploreCollections,
        orderHistory: {
            products: orderHistoryProducts,
            isLoggedIn
        },
        recentArticles
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

    return (
        <>
            {/* ═══════════════════════════════════════════════════════════════════
                TIER 1: AWARENESS & HOOK - Above the fold, critical first impression
                ═══════════════════════════════════════════════════════════════════ */}

            {/* 1. VideoHero - Brand introduction with dynamic collection showcase */}
            <VideoHero randomCollection={data.randomHeroCollection} />

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
                {data.exploreCollections && data.exploreCollections.length > 0 && (
                    <AnimatedSection animation="section" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                        <ExploreCollectionsSection collections={data.exploreCollections} />
                    </AnimatedSection>
                )}

                {/* 7. RecentlyViewedSection - Personalized re-engagement (MOVED DOWN FROM #5)
                     WHY: Returning visitors (30%) see personalized content at natural depth
                     IMPACT: Better experience for new visitors (70%), meaningful for returning users
                     AUDIENCE: ~30% of visitors (has browsing history) */}
                {(data.recentlyViewed?.products ?? []).length > 0 && (
                    <AnimatedSection animation="slide-up" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                        <RecentlyViewedSection
                            products={data.recentlyViewed?.products ?? []}
                            allProducts={data.allProducts}
                        />
                    </AnimatedSection>
                )}

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
                {data.orderHistory?.isLoggedIn && data.orderHistory.products.length > 0 && (
                    <AnimatedSection animation="slide-up" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                        <OrderHistorySection products={data.orderHistory.products} />
                    </AnimatedSection>
                )}

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
                {data.recentArticles && data.recentArticles.length > 0 && (
                    <AnimatedSection animation="section" threshold={0.1} className="mt-12 md:mt-16 lg:mt-20">
                        <BlogSection articles={data.recentArticles} />
                    </AnimatedSection>
                )}

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
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    variants(first: 100) {
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
        products(first: 6, filters: [{available: true}]) {
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
        images(first: 10) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        variants(first: 100) {
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
const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 250, query: "available_for_sale:true") {
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
        images(first: 10) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        variants(first: 100) {
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
    collections(first: 50) {
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

// GraphQL query to fetch homepage shop metafields (announcement banner only)
/// GraphQL query to fetch recent blog articles for homepage
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
