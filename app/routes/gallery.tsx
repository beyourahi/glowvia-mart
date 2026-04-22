/**
 * @fileoverview Product Gallery / Lookbook Page
 *
 * @description
 * Displays a visual gallery of all product images in a masonry-style
 * grid layout with infinite scrolling and lightbox functionality.
 * Creates a lookbook experience for browsing product photography.
 *
 * @route GET /gallery
 *
 * @features
 * - Masonry grid layout for visual interest
 * - Infinite scroll pagination
 * - Lightbox for full-size image viewing
 * - Product link from each image
 * - CMS-driven page heading/description
 *
 * @data-transformation
 * Products are transformed into flat image array:
 * 1. Fetch products with images
 * 2. Flatten to individual images with product metadata
 * 3. Each image links back to its product
 *
 * @performance
 * - Loads 48 products per page (images vary)
 * - Cursor-based pagination for infinite scroll
 * - Lazy loading for images below fold
 *
 * @cms-integration
 * Page headings from site_settings:
 * - galleryPageHeading: Main title
 * - galleryPageDescription: Subtitle
 *
 * @layout
 * 1. Header with title/description
 * 2. Masonry grid of product images
 * 3. Infinite scroll trigger at bottom
 *
 * @related
 * - components/gallery/GalleryGrid.tsx - Grid layout component
 * - components/gallery/GalleryImageCard.tsx - Individual image card
 * - lib/gallery.ts - Image transformation utilities
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/Product
 */

import {useLoaderData} from "react-router";
import type {Route} from "./+types/gallery";
import {getSeoMeta} from "@shopify/hydrogen";
import {AnimatedSection} from "~/components/AnimatedSection";
import {GalleryGrid} from "~/components/gallery/GalleryGrid";
import {transformToGalleryImages} from "~/lib/gallery";
import type {GalleryImageData, GalleryPageInfo} from "~/lib/gallery";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {useSiteSettings} from "~/lib/site-content-context";
import {PageHeading} from "~/components/PageHeading";

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    // Get gallery page settings from root loader siteSettings
    const rootMatch = matches.find(m => m?.id === "root");
    const rootData = rootMatch?.data as
        | {siteContent?: {siteSettings?: {galleryPageHeading?: string; galleryPageDescription?: string}}}
        | undefined;
    const pageTitle = rootData?.siteContent?.siteSettings?.galleryPageHeading || "The Collection Lookbook";
    const pageDescription =
        rootData?.siteContent?.siteSettings?.galleryPageDescription ||
        "A curated visual journey through our handcrafted pieces.";

    return (
        getSeoMeta({
            title: pageTitle,
            titleTemplate: `%s | ${brandName}`,
            description: pageDescription,
            url: buildCanonicalUrl("/gallery", siteUrl)
        }) ?? []
    );
};

export async function loader(args: Route.LoaderArgs) {
    const {context, request} = args;
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");

    // Check if this is a fetcher request (infinite scroll loading more)
    const isFetcherRequest = url.searchParams.has("index");

    const {products} = await context.dataAdapter.query(GALLERY_PRODUCTS_QUERY, {
        variables: {
            first: 100,
            after: cursor
        }
    });

    // Transform products to flat gallery images
    const images = transformToGalleryImages(products.nodes);

    const pageInfo: GalleryPageInfo = {
        hasNextPage: products.pageInfo.hasNextPage,
        endCursor: products.pageInfo.endCursor ?? null
    };

    // For fetcher requests, return only images and pageInfo
    if (isFetcherRequest) {
        return {images, pageInfo};
    }

    return {images, pageInfo};
}

export default function Gallery() {
    const data = useLoaderData<typeof loader>();
    const {galleryPageHeading, galleryPageDescription} = useSiteSettings();

    // Type guard for fetcher vs full page load (both have same structure for gallery)
    const {images, pageInfo} = data as {images: GalleryImageData[]; pageInfo: GalleryPageInfo};

    return (
        <div className="px-4 sm:px-6 lg:px-8 pb-8 md:pb-12  ">
            {/* Header - responsive text sizing and spacing
                 pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px) */}
            <AnimatedSection animation="fade" threshold={0.08}>
                <header className="pt-(--page-breathing-room) mb-6 md:mb-10 lg:mb-12">
                    <PageHeading title={galleryPageHeading} description={galleryPageDescription} descriptionClassName="mx-0" />
                </header>
            </AnimatedSection>

            {images.length > 0 ? (
                <AnimatedSection animation="slide-up" threshold={0}>
                    <GalleryGrid initialImages={images} pageInfo={pageInfo} />
                </AnimatedSection>
            ) : (
                <div className="text-center py-12 sm:py-16">
                    <p className="text-sm sm:text-base text-muted-foreground">No gallery images available yet.</p>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fetches products with images for gallery display.
 *
 * Fetches all products including out-of-stock so shoppers can browse the full catalogue.
 * Includes up to 10 images per product for variety.
 * Uses cursor pagination for infinite scroll.
 */
const GALLERY_PRODUCTS_QUERY = `#graphql
  query GalleryProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int!
    $after: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, after: $after) {
      nodes {
        handle
        title
        availableForSale
        collections(first: 1) {
          nodes {
            handle
            title
          }
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
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
