/**
 * @fileoverview RelatedProducts - Deferred product recommendations carousel
 *
 * @description
 * Product recommendations section using Shopify's product recommendations API.
 * Uses React Router Await for deferred loading to avoid blocking page render.
 * Displays in carousel format with drag-to-scroll and wheel gesture support.
 *
 * @features
 * - **Deferred Loading**: Streams in via React Router Await (non-critical data)
 * - **Shopify Recommendations**: Uses Shopify's built-in recommendation engine
 * - **Carousel Display**: Embla Carousel with drag-free scrolling, infinite loop
 * - **Loading Skeleton**: Matching placeholder during data fetch
 * - **Responsive Sizing**: 80% → 45% → 32% → 27% → 22% basis across breakpoints
 * - **CMS Integration**: Section title from site_settings metaobject
 *
 * @props
 * - products: Promise<RecommendedProductFragment[] | null> - Deferred recommendations
 *
 * @related
 * - routes/products.$handle.tsx - Loads product recommendations (deferred)
 * - storefrontapi.generated.d.ts - RecommendedProductFragment GraphQL type
 * - ProductItem.tsx - Individual product card component
 */

import {Suspense} from "react";
import {Await} from "react-router";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {ProductItem} from "~/components/ProductItem";
import {RelatedProductsSkeleton} from "~/components/skeletons";
import type {RecommendedProductFragment} from "storefrontapi.generated";
import {useSectionHeadings} from "~/lib/site-content-context";
import {sortWithPinnedFirst} from "~/lib/product-tags";

// ============================================================================
// Types
// ============================================================================

interface RelatedProductsProps {
    products: Promise<RecommendedProductFragment[] | null>;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RelatedProducts - Shopify product recommendations carousel
 *
 * Data loading:
 * - Uses Suspense + Await for deferred (below-fold) data loading
 * - Shows skeleton during initial load
 * - Streams in data when ready without blocking page render
 *
 * Display:
 * - Shows up to 8 recommended products
 * - Large serif heading (5xl → 7xl → 8xl)
 * - Drag-to-scroll carousel with wheel gesture support
 */
export function RelatedProducts({products}: RelatedProductsProps) {
    const {relatedProductsTitle} = useSectionHeadings();
    return (
        <section className="px-4 py-12 md:py-16 mt-40 md:mt-52">
            <h2 className="font-serif font-normal text-xl md:text-3xl lg:text-4xl text-center text-primary mb-8 md:mb-12">
                {relatedProductsTitle}
            </h2>

            <Suspense fallback={<RelatedProductsSkeleton />}>
                <Await resolve={products}>
                    {resolvedProducts => {
                        if (!resolvedProducts || resolvedProducts.length === 0) {
                            return null;
                        }

                        // Sort related products with pinned first
                        const sortedProducts = sortWithPinnedFirst(resolvedProducts);

                        return (
                            <div className="relative">
                                <Carousel
                                    opts={{align: "start", loop: true, dragFree: true}}
                                    plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                                    className="w-full"
                                >
                                    {/* pt-4 accommodates pin badge overflow (-top-2 to -top-2.5) */}
                                    <CarouselContent className="-ml-2 md:-ml-3 pt-4">
                                        {sortedProducts.slice(0, 8).map((product, index) => (
                                            <CarouselItem
                                                key={product.id}
                                                className="pl-2 md:pl-3 basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                                            >
                                                <ProductItem product={product} index={index} />
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
