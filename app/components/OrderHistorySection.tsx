/**
 * @fileoverview OrderHistorySection - Customer order history product carousel
 *
 * @description
 * Displays products from customer's order history with order metadata (number, date, status).
 * Fetches data from Shopify Customer Account API and renders in carousel format.
 *
 * @features
 * - **Order Metadata**: Displays order number, date, and fulfillment status
 * - **Status Badges**: Color-coded badges (delivered, processing, on hold, etc.)
 * - **Carousel Display**: Embla Carousel with drag-free scrolling
 * - **Loading States**: Skeleton matching actual carousel layout
 * - **Conditional Rendering**: Only shows when logged in with order history
 * - **Responsive Sizing**: 80% → 45% → 32% → 27% → 22% basis across breakpoints
 *
 * @props
 * - products: OrderHistoryProduct[] - Products from customer's past orders
 * - loading: Show loading skeleton
 *
 * @related
 * - graphql/customer-account/CustomerOrderHistoryQuery.ts - GraphQL query for order data
 * - routes/_index.tsx - Server-side order history fetching for logged-in users
 */

import {Link} from "react-router";
import type {OrderHistoryProduct} from "~/graphql/customer-account/CustomerOrderHistoryQuery";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {Skeleton} from "~/components/ui/skeleton";
import {Card, CardContent} from "~/components/ui/card";
import {OrderProductItem} from "~/components/OrderProductItem";

// ============================================================================
// Types
// ============================================================================

interface OrderHistorySectionProps {
    products: OrderHistoryProduct[];
    loading?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * OrderHistorySection - Carousel of products from customer's order history
 *
 * Only renders when:
 * - User is logged in (customer session exists)
 * - User has order history (products.length > 0)
 * - OR loading state is true (to show skeleton)
 */
export function OrderHistorySection({products, loading = false}: OrderHistorySectionProps) {
    const shouldShowSection = !loading && products.length > 0;

    if (!shouldShowSection && !loading) return null;

    const isLoading = loading && products.length === 0;

    return (
        <section className="py-12 md:py-16">
            {/* Section Header */}
            <div className="mb-8 md:mb-12">
                <div className="flex items-center justify-between">
                    {/* Heading and subheading on the left */}
                    <div>
                        <h2 className="mb-0 font-serif text-xl font-medium text-primary md:text-3xl lg:text-4xl">
                            Your Orders
                        </h2>
                        <p className="mt-1 text-base text-muted-foreground md:text-lg">
                            {isLoading
                                ? "Loading your orders..."
                                : `${products.length} product${products.length !== 1 ? "s" : ""} you've purchased`}
                        </p>
                    </div>
                    {/* View All Button - Desktop (pill style) */}
                    {!isLoading && products.length > 0 && (
                        <Link
                            to="/account/orders"
                            className="hidden rounded-full border-2 border-primary px-3 sm:px-4 py-2 font-sans text-lg md:text-xl font-medium text-primary motion-interactive hover:bg-primary hover:text-primary-foreground hover:no-underline sm:inline-flex"
                        >
                            View All
                        </Link>
                    )}
                </div>
            </div>

            {/* Products Carousel */}
            {isLoading ? (
                <OrderHistorySkeleton />
            ) : (
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                        dragFree: true
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2 md:-ml-3">
                        {products.map((product, index) => (
                            <CarouselItem
                                key={product.id}
                                className="basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%] pl-2 md:pl-3"
                            >
                                <OrderProductItem
                                    context="carousel"
                                    orderHistoryProduct={product}
                                    index={index}
                                    loading="lazy"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            )}

            {/* View All Button - Mobile (centered below carousel) */}
            {!isLoading && products.length > 0 && (
                <div className="mt-6 flex justify-center sm:hidden">
                    <Link
                        to="/account/orders"
                        className="rounded-full border-2 border-primary px-3 sm:px-4 py-2 font-sans text-lg font-medium text-primary motion-interactive hover:bg-primary hover:text-primary-foreground hover:no-underline"
                    >
                        View All
                    </Link>
                </div>
            )}
        </section>
    );
}

// Note: OrderHistoryProductCard and OrderStatusBadge components removed.
// Now using OrderProductItem component with context="carousel" for cleaner code reuse.

function OrderHistorySkeleton() {
    return (
        <div className="flex gap-2 overflow-hidden md:gap-3">
            {Array.from({length: 4}).map((_, i) => (
                <Card
                    // eslint-disable-next-line react/no-array-index-key -- Static skeleton items
                    key={`order-history-skeleton-${i}`}
                    className="w-[55.5%] shrink-0 overflow-hidden border-0 py-0 shadow-none"
                >
                    <Skeleton className="aspect-4/5 w-full rounded-2xl" />
                    <CardContent className="space-y-2 p-0 pt-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
