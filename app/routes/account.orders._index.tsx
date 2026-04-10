/**
 * @fileoverview Order History Route - Order List with Product Carousel
 *
 * @description
 * Displays a scannable list of customer orders showing order info and
 * full product cards in a horizontal carousel using OrderProductItem component.
 * Each order shows: order number, date/time, status badge, and scrollable
 * product cards with "Buy Again" functionality.
 *
 * @route GET /account/orders
 *
 * @authentication
 * Requires customer authentication (enforced by parent account layout).
 *
 * @data-loading
 * - Orders list (paginated, 20 per page)
 * - Line items with product/variant data (first 20 per order)
 *
 * @features
 * - Order metadata (number, date/time, status badge)
 * - Product carousel using OrderProductItem (matches homepage design)
 * - "Buy Again" quick add button on each product
 * - Horizontal scroll with snap behavior
 * - Responsive sizing across all breakpoints
 *
 * @design
 * Single-column list layout with whitespace separation between entries.
 * Products display identically to homepage OrderHistorySection.
 *
 * @related
 * - OrderProductItem.tsx - Product display component (shared with homepage)
 * - OrderHistorySection.tsx - Homepage order carousel (design reference)
 * - CustomerOrdersQuery.ts - Uses CUSTOMER_ORDERS_LIST_QUERY
 */

import {data as remixData, Link, useLoaderData, useSearchParams} from "react-router";
import type {Route} from "./+types/account.orders._index";
import {getPaginationVariables, flattenConnection} from "@shopify/hydrogen";
import {CUSTOMER_ORDERS_LIST_QUERY} from "~/graphql/customer-account/CustomerOrdersQuery";
import type {CustomerOrdersListFragment, OrderListItemFragment} from "customer-accountapi.generated";
import type {OrderHistoryProduct} from "~/graphql/customer-account/CustomerOrderHistoryQuery";
import {PaginatedResourceSection} from "~/components/PaginatedResourceSection";
import {OrderProductItem} from "~/components/OrderProductItem";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Card, CardContent} from "~/components/ui/card";
import {Input} from "~/components/ui/input";
import {AnimatedSection} from "~/components/AnimatedSection";
import {AuthRequiredFallback} from "~/components/AuthRequiredFallback";
import {PackageSearchIcon, ShoppingBagIcon, CalendarIcon, ClockIcon, SearchIcon, XIcon} from "lucide-react";
import {cn} from "~/lib/utils";
import {getOrderStatusVariant, formatOrderStatus} from "~/lib/order-status";
import {useMemo} from "react";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
import {getAccountMeta} from "~/lib/seo";

const FALLBACK_ACCOUNT_CONTENT = {
    emptyNoOrdersHeading: "No orders yet",
    emptyNoOrdersMessage: "When you place an order, it will appear here",
    actionShopNow: "Shop Now",
    navDashboard: "Dashboard"
} as const;

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * GraphQL query to fetch product handles by IDs
 *
 * Used to enrich order line items with product handles from Storefront API,
 * enabling clickable links to product pages from the order history.
 *
 * Customer Account API provides productId but not handle, so we need this
 * separate query to get handles for building product URLs.
 */
const PRODUCT_HANDLES_QUERY = `#graphql
  query OrderProductHandles(
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

// =============================================================================
// TYPES
// =============================================================================

type OrdersLoaderData = {
    customer: CustomerOrdersListFragment | null;
    /**
     * Map of productId to product handle for linking to product pages
     * Enriched from Storefront API since Customer Account API doesn't include handles
     */
    productHandles: Map<string, string>;
    isAuthenticated: boolean;
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Converts a Customer Account API LineItem to OrderHistoryProduct format
 * for compatibility with OrderProductItem component.
 *
 * This enables reuse of the same OrderProductItem component used on the
 * homepage OrderHistorySection, providing consistent visual design and
 * "Buy Again" functionality across the application.
 *
 * @param lineItem - Line item from Customer Account API order
 * @param order - Parent order containing the line item
 * @param productHandles - Map of productId to product handle (from Storefront API)
 * @returns OrderHistoryProduct - Formatted product data for OrderProductItem
 *
 * @note Product handles are fetched separately from Storefront API to enable
 * clickable links to product pages, as Customer Account API doesn't include handles.
 */
function convertLineItemToOrderHistoryProduct(
    lineItem: OrderListItemFragment["lineItems"]["nodes"][number],
    order: OrderListItemFragment,
    productHandles: Map<string, string>
): OrderHistoryProduct {
    // Get fulfillment status from first fulfillment or fallback to order status
    const fulfillments = flattenConnection(order.fulfillments);
    const fulfillmentStatus = fulfillments[0]?.status || order.fulfillmentStatus;

    // Get product handle from the map if available
    const handle = lineItem.productId ? productHandles.get(lineItem.productId) || null : null;

    return {
        // Unique identifier combining order and line item IDs
        id: `${order.id}-${lineItem.id}`,
        lineItemId: lineItem.id,
        // Product and variant IDs for "Buy Again" functionality
        productId: lineItem.productId ?? null,
        variantId: lineItem.variantId ?? null,
        // Product handle for linking to product pages
        handle,
        // Use name if available (preferred), fallback to title
        name: lineItem.name || lineItem.title,
        // Image data for product display
        image: lineItem.image
            ? {
                  url: lineItem.image.url,
                  altText: lineItem.image.altText,
                  width: lineItem.image.width,
                  height: lineItem.image.height
              }
            : null,
        // Price for display (may be null for some line items)
        price: lineItem.price ?? null,
        // Order metadata for display
        orderDate: order.processedAt,
        orderNumber: String(order.number),
        orderName: order.name,
        fulfillmentStatus: fulfillmentStatus || "UNFULFILLED"
    };
}

// =============================================================================
// META
// =============================================================================

export const meta: Route.MetaFunction = () => {
    return getAccountMeta("Orders");
};

// =============================================================================
// LOADER
// =============================================================================

export async function loader({request, context}: Route.LoaderArgs) {
    const {customerAccount, dataAdapter} = context;

    // Soft auth check - orders require customer data
    let isAuthenticated = false;
    try {
        isAuthenticated = await customerAccount.isLoggedIn();
    } catch {
        isAuthenticated = false;
    }

    // Unauthenticated: return empty data, component will show AuthRequiredFallback
    if (!isAuthenticated) {
        return remixData(
            {customer: null, productHandles: new Map(), isAuthenticated: false},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    const paginationVariables = getPaginationVariables(request, {
        pageBy: 20
    });

    const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_LIST_QUERY, {
        variables: {
            ...paginationVariables,
            language: customerAccount.i18n.language
        }
    });

    if (errors?.length || !data?.customer) {
        throw Error("Customer orders not found");
    }

    // Fetch product handles from Storefront API for linking to product pages
    const productHandles = new Map<string, string>();

    // Collect all unique product IDs from all orders
    const productIds = new Set<string>();
    for (const order of data.customer.orders.nodes) {
        const lineItems = flattenConnection(order.lineItems);
        for (const item of lineItems) {
            if (item.productId) {
                productIds.add(item.productId);
            }
        }
    }

    // Fetch handles if we have product IDs
    if (productIds.size > 0) {
        try {
            const handlesResponse = await dataAdapter.query(PRODUCT_HANDLES_QUERY, {
                variables: {ids: Array.from(productIds)}
            });

            if (handlesResponse?.nodes) {
                // Build map of productId -> handle
                for (const node of handlesResponse.nodes) {
                    if (node && node.__typename === "Product") {
                        productHandles.set(node.id, node.handle);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch product handles:", error);
            // Continue without handles - products won't be clickable but page will still work
        }
    }

    return remixData(
        {customer: data.customer, productHandles, isAuthenticated: true},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Orders() {
    const {customer, productHandles, isAuthenticated} = useLoaderData<OrdersLoaderData>();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("q") || "";

    if (!isAuthenticated || !customer) {
        return <AuthRequiredFallback message="Sign in to view your order history and track deliveries." />;
    }

    const {orders} = customer;

    const hasOrders = orders.nodes.length > 0;

    // Update URL search params when search input changes
    const handleSearchChange = (value: string) => {
        if (value.trim()) {
            setSearchParams({q: value});
        } else {
            setSearchParams({});
        }
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchParams({});
    };

    return (
        <div className="space-y-10 md:space-y-14 lg:space-y-16">
            {/* Page Header - with search on large screens */}
            <AnimatedSection animation="hero" threshold={0.1}>
                <section className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Left: Title and description */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                <PackageSearchIcon className="size-5 md:size-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-foreground tracking-tight my-0">
                                    Order History
                                </h1>
                                <p className="text-muted-foreground text-sm md:text-base mt-1">
                                    Track and manage all your orders in one place
                                </p>
                            </div>
                        </div>

                        {/* Right: Search (large screens only) */}
                        {hasOrders && (
                            <div className="hidden lg:block">
                                <OrderSearchInput
                                    searchQuery={searchQuery}
                                    onSearchChange={handleSearchChange}
                                    onClearSearch={handleClearSearch}
                                />
                            </div>
                        )}
                    </div>

                    {/* Mobile/tablet search - below header */}
                    {hasOrders && (
                        <div className="lg:hidden">
                            <OrderSearchInput
                                searchQuery={searchQuery}
                                onSearchChange={handleSearchChange}
                                onClearSearch={handleClearSearch}
                            />
                        </div>
                    )}
                </section>
            </AnimatedSection>

            {/* Orders List */}
            <AnimatedSection animation="section" threshold={0.1} delay={100}>
                <OrdersListWithSearch orders={orders} productHandles={productHandles} searchQuery={searchQuery} />
            </AnimatedSection>
        </div>
    );
}

// =============================================================================
// ORDER SEARCH INPUT COMPONENT
// =============================================================================

/**
 * Reusable search input component for order number filtering.
 *
 * Features:
 * - Search icon on the left
 * - Clear button (X) when input has value
 * - Primary "Search" button for explicit submit action
 * - Responsive design with vertically centered alignment
 *
 * Used in:
 * - Page header (lg+ screens) - right-aligned with header content
 * - Below header (mobile/tablet) - full width in its own section
 */
function OrderSearchInput({
    searchQuery,
    onSearchChange,
    onClearSearch
}: {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                {/* Search icon */}
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />

                {/* Input field */}
                <Input
                    type="search"
                    placeholder="Search by order number..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="pl-9 pr-9 w-64 rounded-full h-11 py-2.5"
                    aria-label="Search orders by order number"
                />

                {/* Clear button */}
                {searchQuery && (
                    <button
                        type="button"
                        onClick={onClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                    >
                        <XIcon className="size-4" />
                    </button>
                )}
            </div>

            {/* Primary Search Button */}
            <Button type="button" onClick={() => onSearchChange(searchQuery)}>
                <SearchIcon className="size-4 mr-2" />
                Search
            </Button>
        </div>
    );
}

// =============================================================================
// ORDERS LIST WITH SEARCH COMPONENT
// =============================================================================

/**
 * Wrapper component that provides order list with client-side filtering.
 *
 * Features:
 * - Case-insensitive partial matching on order numbers
 * - Empty search state with helpful messaging
 * - Maintains pagination for unfiltered results
 * - Search results count display
 *
 * Implementation:
 * - Uses useMemo for performant filtering (only recomputes when orders or search change)
 * - Search term normalized (trimmed, lowercase) for reliable matching
 */
function OrdersListWithSearch({
    orders,
    productHandles,
    searchQuery
}: {
    orders: CustomerOrdersListFragment["orders"];
    productHandles: Map<string, string>;
    searchQuery: string;
}) {
    // Filter orders by order number (case-insensitive partial match)
    const filteredOrders = useMemo(() => {
        if (!searchQuery.trim()) {
            return orders.nodes;
        }

        const normalizedQuery = searchQuery.trim().toLowerCase();
        return orders.nodes.filter(order => String(order.number).toLowerCase().includes(normalizedQuery));
    }, [orders.nodes, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Search results count */}
            {searchQuery && orders.nodes.length > 0 && (
                <p className="text-sm text-muted-foreground">
                    {filteredOrders.length === 0
                        ? "No orders found"
                        : `${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"} found`}
                </p>
            )}

            {/* Orders List */}
            <OrdersList
                orders={orders}
                filteredOrders={filteredOrders}
                searchQuery={searchQuery}
                productHandles={productHandles}
            />
        </div>
    );
}

// =============================================================================
// ORDERS LIST COMPONENT
// =============================================================================

/**
 * Renders the paginated list of orders or empty state.
 * When search is active, shows filtered results instead of paginated results.
 */
function OrdersList({
    orders,
    filteredOrders,
    searchQuery,
    productHandles
}: {
    orders: CustomerOrdersListFragment["orders"];
    filteredOrders: OrderListItemFragment[];
    searchQuery: string;
    productHandles: Map<string, string>;
}) {
    // Empty state - no orders at all
    if (!orders?.nodes.length) {
        return <EmptyOrders />;
    }

    // Empty search results
    if (searchQuery && filteredOrders.length === 0) {
        return <EmptySearchResults searchQuery={searchQuery} />;
    }

    // Show filtered results when searching
    if (searchQuery) {
        return (
            <div aria-live="polite" className="flex flex-col">
                {filteredOrders.map((order, index) => (
                    <OrderListItem key={order.id} order={order} index={index} productHandles={productHandles} />
                ))}
            </div>
        );
    }

    // Show paginated results when not searching
    return (
        <div aria-live="polite">
            <PaginatedResourceSection connection={orders} resourcesClassName="flex flex-col">
                {({node: order, index}) => (
                    <OrderListItem key={order.id} order={order} index={index} productHandles={productHandles} />
                )}
            </PaginatedResourceSection>
        </div>
    );
}

// =============================================================================
// ORDER LIST ITEM COMPONENT
// =============================================================================

/**
 * OrderListItem - Order entry with enhanced metadata display
 *
 * Displays:
 * 1. Order number in pill container (rounded, subtle background with ring border)
 * 2. Date with calendar icon + Time with clock icon
 * 3. Status badge (color-coded by fulfillment status)
 * 4. Product carousel with full product cards and "Buy Again" functionality
 *
 * Layout:
 * - Desktop: Order pill, date/time inline with icons, status badge right-aligned
 * - Mobile: Order pill + status badge on first line, date/time on second line
 * - Visual hierarchy through containers, icons, and spacing
 * - Modern, scannable design with clear visual anchors
 *
 * Design rationale:
 * - Pill container makes order numbers distinctive and memorable
 * - Icons provide semantic meaning (calendar = date, clock = time)
 * - Subtle styling maintains professional appearance
 * - Follows modern e-commerce UI patterns (Linear, GitHub, Shopify Admin)
 */
function OrderListItem({
    order,
    index = 0,
    productHandles
}: {
    order: OrderListItemFragment;
    index?: number;
    productHandles: Map<string, string>;
}) {
    const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
    const displayStatus = fulfillmentStatus || order.fulfillmentStatus;
    const lineItems = flattenConnection(order.lineItems);

    // Format date and time separately for editorial presentation
    const orderDate = new Date(order.processedAt);
    const formattedDate = orderDate.toLocaleDateString(STORE_FORMAT_LOCALE, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
    const formattedTime = orderDate.toLocaleTimeString(STORE_FORMAT_LOCALE, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

    return (
        <div
            className="flex flex-col gap-4 py-10 md:py-12 animate-product-fade-in motion-surface"
            style={{animationDelay: `${Math.min(index, 11) * 50}ms`}}
        >
            {/* Top Row: Order Number Pill + Date/Time + Status Badge */}
            <div className="flex items-center justify-between gap-4">
                {/* Left Side: Order Number + Date/Time */}
                <div className="flex items-center gap-5">
                    {/* Order Number Pill */}
                    <div
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                            "bg-muted/30 ring-1 ring-border/50",
                            "sleek",
                            "hover:bg-muted/40"
                        )}
                    >
                        <span className="font-mono text-xl font-semibold text-foreground tracking-tight tabular-nums">
                            #{order.number}
                        </span>
                    </div>

                    {/* Date/Time with Icons (Desktop - Inline) */}
                    <div className="hidden sm:flex items-center gap-4 text-sm">
                        {/* Date with Calendar Icon */}
                        <time dateTime={order.processedAt} className="flex items-center gap-1.5">
                            <CalendarIcon className="size-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{formattedDate}</span>
                        </time>
                        {/* Time with Clock Icon */}
                        <div className="flex items-center gap-1.5">
                            <ClockIcon className="size-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{formattedTime}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Status Badge */}
                <Badge
                    variant={getOrderStatusVariant(displayStatus)}
                    className="text-xs uppercase tracking-wide shrink-0"
                >
                    {formatOrderStatus(displayStatus)}
                </Badge>
            </div>

            {/* Mobile: Date/Time shown separately with icons */}
            <div className="sm:hidden flex items-center gap-4 text-sm -mt-1">
                {/* Date with Calendar Icon */}
                <time dateTime={order.processedAt} className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{formattedDate}</span>
                </time>
                {/* Time with Clock Icon */}
                <div className="flex items-center gap-1.5">
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{formattedTime}</span>
                </div>
            </div>

            {/* Product Carousel - Show all products with full OrderProductItem display */}
            {lineItems.length > 0 && (
                <ProductCarousel items={lineItems} order={order} productHandles={productHandles} />
            )}
        </div>
    );
}

// =============================================================================
// PRODUCT CAROUSEL COMPONENT
// =============================================================================

/**
 * ProductCarousel - Horizontal scrollable carousel using OrderProductItem
 *
 * Replaces the old thumbnail-based carousel with full product cards that match
 * the homepage OrderHistorySection design. Each product shows:
 * - Product image with hover effects
 * - Product title
 * - Order metadata (order #, date)
 * - Status badge
 * - "Buy Again" QuickAdd button
 *
 * Features:
 * - Horizontal scroll with snap behavior for touch navigation
 * - Gradient fade on right edge to indicate more content
 * - Responsive sizing matching homepage carousel
 * - Lazy loaded images for performance
 * - Clickable product cards that link to product pages
 *
 * @param items - Line items from the order
 * @param order - Parent order (needed for metadata conversion)
 * @param productHandles - Map of productId to product handle for linking
 */
function ProductCarousel({
    items,
    order,
    productHandles
}: {
    items: OrderListItemFragment["lineItems"]["nodes"];
    order: OrderListItemFragment;
    productHandles: Map<string, string>;
}) {
    // Convert line items to OrderHistoryProduct format for OrderProductItem
    const orderProducts: OrderHistoryProduct[] = items.map(item =>
        convertLineItemToOrderHistoryProduct(item, order, productHandles)
    );

    if (orderProducts.length === 0) return null;

    return (
        <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
            {/* Gradient fade on right edge to indicate more content */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

            {/* Scrollable container matching homepage carousel style */}
            <div
                className={cn(
                    "flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide",
                    "px-4 sm:px-6 lg:px-0",
                    "snap-x snap-mandatory scroll-smooth",
                    "-mb-4 pb-4" // Compensate for shadow overflow
                )}
            >
                {orderProducts.map((product, index) => (
                    <div
                        key={product.id}
                        className="snap-start shrink-0 w-[55%] sm:w-[45%] md:w-[32%] lg:w-[27%] xl:w-[22%]"
                    >
                        <OrderProductItem
                            context="carousel"
                            orderHistoryProduct={product}
                            index={index}
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// EMPTY STATE COMPONENTS
// =============================================================================

/**
 * Displays when the customer has no orders.
 */
function EmptyOrders() {
    const accountContent = FALLBACK_ACCOUNT_CONTENT;

    return (
        <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-6">
                {/* Icon container */}
                <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 mb-6 shadow-inner">
                    <ShoppingBagIcon className="size-10 md:size-12 text-muted-foreground" />
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-2">
                    {accountContent.emptyNoOrdersHeading}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm leading-relaxed">
                    {accountContent.emptyNoOrdersMessage}
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild size="lg">
                        <Link to="/collections">{accountContent.actionShopNow}</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link to="/account">{accountContent.navDashboard}</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Displays when search returns no results.
 * Provides helpful messaging and suggests clearing the search.
 */
function EmptySearchResults({searchQuery}: {searchQuery: string}) {
    return (
        <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-6">
                {/* Icon container */}
                <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 mb-6 shadow-inner">
                    <SearchIcon className="size-10 md:size-12 text-muted-foreground" />
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-2">No orders found</h3>

                {/* Description with search query */}
                <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm leading-relaxed">
                    No orders match{" "}
                    <span className="font-mono font-semibold text-foreground">&ldquo;{searchQuery}&rdquo;</span>. Try a
                    different order number or clear your search.
                </p>
            </CardContent>
        </Card>
    );
}

// =============================================================================
// STATUS HELPER FUNCTIONS
// =============================================================================

// Status helper functions have been moved to ~/lib/order-status.ts for centralized
// management and guaranteed synchronization between order header badges and product
// item badges across the application.
//
// This ensures that when an order has status "FULFILLED", both the order header badge
// and ALL product badges in that order show the SAME color (green) and SAME label
// ("Delivered"), preventing user confusion from mismatched status displays.

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
