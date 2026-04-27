/**
 * @fileoverview CuratedCollections - Tabbed product collections with carousel
 *
 * @description
 * Tabbed interface displaying curated product collections (New Arrivals, Bestsellers, etc.)
 * with drag-to-scroll carousels. Uses React Router Await for deferred loading and streaming.
 *
 * @features
 * - **Deferred Loading**: Streams in via React Router Await (non-critical data)
 * - **Tab Navigation**: Large serif tabs with opacity transitions
 * - **Carousel Per Tab**: Embla Carousel with drag-free scrolling, infinite loop
 * - **Responsive Sizing**: 80% → 45% → 32% → 27% → 22% basis across breakpoints
 * - **Loading Skeleton**: Matching placeholder during data fetch
 *
 * @props
 * - collections: Promise<CuratedCollectionsData> - Deferred curated collections data
 *
 * @related
 * - routes/_index.tsx - Loads curated collections data (deferred)
 * - types/index.ts - CuratedCollectionsData, CuratedTab type definitions
 * - ProductItem.tsx - Individual product card component
 */

import {Suspense} from "react";
import {Await} from "react-router";
import type {CuratedCollectionsProps, CuratedCollectionsData, CuratedTab} from "types";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "~/components/ui/tabs";
import {ProductItem} from "~/components/ProductItem";
import {Skeleton} from "~/components/ui/skeleton";
import {Card, CardContent} from "~/components/ui/card";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";

export type {CuratedCollectionsData, CuratedTab};

// ============================================================================
// Main Component
// ============================================================================

/**
 * CuratedCollections - Tabbed product collections with carousel
 *
 * Data loading:
 * - Uses Suspense + Await for deferred (below-fold) data loading
 * - Shows skeleton during initial load
 * - Streams in data when ready without blocking page render
 *
 * Tab behavior:
 * - Defaults to second tab (index 1) if available, otherwise first tab
 * - Large serif typography (3xl → 4xl → 5xl → 6xl → 7xl)
 * - Opacity transition on inactive tabs (25% → 100%)
 */
export function CuratedCollections({collections}: CuratedCollectionsProps) {
    return (
        <section className="py-12 md:py-16">
            <Suspense fallback={<CuratedCollectionsSkeleton />}>
                <Await resolve={collections}>
                    {data => {
                        if (!data || data.tabs.length === 0) {
                            return null;
                        }

                        return (
                            <Tabs defaultValue={data.tabs[1]?.key || data.tabs[0].key} className="w-full">
                                {/* Tab List - native CSS scroll for reliable edge behavior
                                     Horizontal scroll enabled at all sizes to handle long tab labels */}
                                <div className="mb-6 sm:mb-8 md:mb-12">
                                    <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        {/* Padding compensates for scroll container edge clipping
                                             min-w-max ensures tabs don't wrap, enabling horizontal scroll
                                             gap-0.5 at 320px prevents tabs from being too spread out */}
                                        <TabsList className="h-auto p-0 bg-transparent flex justify-start sm:justify-center min-w-max mx-auto gap-0.5 sm:gap-1 md:gap-2 px-3 sm:px-4 md:px-8">
                                            {data.tabs.map(tab => (
                                                <TabsTrigger
                                                    key={tab.key}
                                                    value={tab.key}
                                                    className="px-2 sm:px-3 md:px-6 lg:px-8 py-2 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-primary bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none opacity-25 data-[state=active]:opacity-100 whitespace-nowrap cursor-pointer shrink-0"
                                                >
                                                    {tab.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>
                                </div>

                                {/* Tab Content Panels with Carousel */}
                                {data.tabs.map(tab => (
                                    <TabsContent key={tab.key} value={tab.key} className="mt-0">
                                        <div>
                                            <Carousel
                                                opts={{
                                                    align: "start",
                                                    loop: true,
                                                    dragFree: true
                                                }}
                                                plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                                                className="w-full"
                                            >
                                                {/* pt-4 accommodates pin badge overflow (-top-2 to -top-2.5) */}
                                                <CarouselContent className="-ml-2 md:-ml-3 pt-4">
                                                    {tab.collection.products.nodes.map(product => (
                                                        <CarouselItem
                                                            key={product.id}
                                                            className="pl-2 md:pl-3 basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                                                        >
                                                            <ProductItem product={product} inCarousel />
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                            </Carousel>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        );
                    }}
                </Await>
            </Suspense>
        </section>
    );
}

function CuratedCollectionsSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-8 md:space-y-12">
            {/* Tab skeleton - responsive sizing matching actual tabs */}
            <div className="flex justify-start sm:justify-center px-3 sm:px-4 md:px-0">
                <Skeleton className="h-10 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-48 sm:w-64 md:w-100 lg:w-125 rounded-full" />
            </div>

            {/* Product carousel skeleton - matches carousel grid sizing */}
            <div>
                <div className="flex gap-2 md:gap-3 overflow-hidden">
                    {Array.from({length: 4}).map((_, i) => (
                        <Card
                            // eslint-disable-next-line react/no-array-index-key -- Static skeleton items
                            key={`curated-skeleton-${i}`}
                            className="border-0 shadow-none py-0 overflow-hidden shrink-0 basis-[80%]"
                        >
                            <Skeleton className="aspect-4/5 w-full rounded-2xl" />
                            <CardContent className="p-0 pt-4 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
