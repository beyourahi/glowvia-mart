/**
 * @fileoverview Returns History Route
 *
 * @description
 * Displays all customer return requests with status tracking and order links.
 * Returns are aggregated from all orders and sorted by creation date (newest first).
 *
 * @route GET /account/returns
 *
 * @authentication
 * Requires customer authentication (enforced by parent account layout).
 * Validates returns feature is enabled (redirects if disabled).
 *
 * @data-loading
 * - Returns eligibility check (redirects to /account/orders if disabled)
 * - All customer orders (50 most recent)
 * - Returns extracted and aggregated from orders
 * - Sorted by creation date (newest first)
 *
 * @related
 * - account.orders.$id.return.tsx - Initiate return request
 * - account.orders.$id.tsx - Order detail with return timeline
 * - CustomerReturnsQuery.ts - Returns query
 * - ReturnsAvailabilityQuery.ts - Feature check
 */

import {data as remixData, redirect, useLoaderData, Link} from "react-router";
import type {Route} from "./+types/account.returns._index";
import {Image} from "@shopify/hydrogen";
import {CUSTOMER_RETURNS_QUERY, getReturnStatusConfig} from "~/graphql/customer-account/CustomerReturnsQuery";
import {RETURNS_AVAILABILITY_QUERY, checkReturnsEnabled} from "~/graphql/customer-account/ReturnsAvailabilityQuery";
import {Card, CardContent} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {AnimatedSection} from "~/components/AnimatedSection";
import {AuthRequiredFallback} from "~/components/AuthRequiredFallback";
import {
    PackageX,
    ArrowRightIcon,
    CalendarIcon,
    PackageIcon,
    PackageSearchIcon,
    RotateCcwIcon,
    ShoppingBagIcon
} from "lucide-react";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";

export const meta: Route.MetaFunction = () => {
    return [{title: "Returns History"}];
};

export async function loader({context}: Route.LoaderArgs) {
    const {customerAccount} = context;

    // Soft auth check - returns require customer data
    let isAuthenticated = false;
    try {
        isAuthenticated = await customerAccount.isLoggedIn();
    } catch {
        isAuthenticated = false;
    }

    // Unauthenticated: return empty data, component will show AuthRequiredFallback
    if (!isAuthenticated) {
        return remixData(
            {returns: [] as ReturnWithOrder[], isAuthenticated: false},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    // Check if returns are enabled first
    const returnsAvailabilityResponse = await customerAccount.query(RETURNS_AVAILABILITY_QUERY, {
        variables: {
            first: 10,
            language: customerAccount.i18n.language
        }
    });

    const availabilityOrders = returnsAvailabilityResponse?.data?.customer?.orders?.nodes ?? [];
    const returnsEnabled = checkReturnsEnabled(availabilityOrders);

    // Redirect to orders page if returns are disabled
    if (!returnsEnabled) {
        throw redirect("/account/orders");
    }

    const {data, errors} = await customerAccount.query(CUSTOMER_RETURNS_QUERY, {
        variables: {
            first: 50,
            language: customerAccount.i18n.language
        }
    });

    if (errors?.length) {
        console.error("Error fetching returns:", errors);
    }

    // Extract all returns from orders
    const ordersWithReturns = data?.customer?.orders?.nodes ?? [];
    const allReturns: ReturnWithOrder[] = [];

    for (const order of ordersWithReturns) {
        const returns = order.returns?.nodes ?? [];
        for (const returnItem of returns) {
            allReturns.push({
                ...returnItem,
                order: {
                    id: order.id,
                    name: order.name,
                    number: order.number,
                    processedAt: order.processedAt
                }
            });
        }
    }

    // Sort by createdAt (most recent first)
    allReturns.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    return remixData(
        {returns: allReturns, isAuthenticated: true},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
}

// Type for return with associated order info
interface ReturnWithOrder {
    id: string;
    name: string;
    status: string;
    createdAt?: string | null;
    returnLineItems: {
        nodes: Array<{
            id: string;
            quantity: number;
            returnReason?: string | null;
            lineItem: {
                id: string;
                title: string;
                variantTitle?: string | null;
                image?: {
                    altText?: string | null;
                    url: string;
                    width?: number | null;
                    height?: number | null;
                } | null;
            };
        }>;
    };
    order: {
        id: string;
        name: string;
        number: number;
        processedAt: string;
    };
}

export default function ReturnsHistoryRoute() {
    const {returns, isAuthenticated} = useLoaderData<typeof loader>();

    if (!isAuthenticated) {
        return <AuthRequiredFallback message="Sign in to view and manage your returns." />;
    }

    const hasReturns = returns.length > 0;

    return (
        <div className="space-y-10 md:space-y-14 lg:space-y-16">
            {/* Page Header - Matches dashboard/orders/profile section headers */}
            <AnimatedSection animation="hero" threshold={0.1}>
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                <RotateCcwIcon className="size-5 md:size-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-foreground tracking-tight my-0">
                                    Returns History
                                </h1>
                                <p className="text-muted-foreground text-sm md:text-base mt-1">
                                    Track and manage your return requests
                                </p>
                            </div>
                        </div>
                        {hasReturns && (
                            <Button variant="link" asChild className="text-primary p-0 h-auto group hidden sm:flex">
                                <Link
                                    to="/account/orders"
                                    className="flex items-center gap-1.5 group-hover:gap-2 motion-link hover:text-primary"
                                >
                                    View Orders{" "}
                                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </section>
            </AnimatedSection>

            {/* Returns List */}
            <AnimatedSection animation="section" threshold={0.1} delay={100}>
                {returns.length === 0 ? (
                    <ReturnsEmpty />
                ) : (
                    <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {returns.map((returnItem, index) => (
                            <ReturnCard key={returnItem.id} returnItem={returnItem} index={index} />
                        ))}
                    </div>
                )}
            </AnimatedSection>
        </div>
    );
}

function ReturnsEmpty() {
    return (
        <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-6">
                {/* Icon container - matches dashboard empty state styling */}
                <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 mb-6 shadow-inner">
                    <PackageX className="size-10 md:size-12 text-muted-foreground" />
                </div>

                {/* Title - serif font matching other headings */}
                <h3 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-2">No returns yet</h3>

                {/* Description - helpful and encouraging */}
                <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm leading-relaxed">
                    When you request a return for an order, it will appear here for easy tracking.
                </p>

                {/* CTA buttons - primary action to view orders */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild size="lg" className="motion-interactive">
                        <Link to="/account/orders" className="gap-2">
                            <PackageSearchIcon className="size-4" />
                            View Orders
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="motion-interactive">
                        <Link to="/collections">Continue Shopping</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ReturnCard({returnItem, index = 0}: {returnItem: ReturnWithOrder; index?: number}) {
    const statusConfig = getReturnStatusConfig(returnItem.status);
    const encodedOrderId = btoa(returnItem.order.id);
    const lineItems = returnItem.returnLineItems.nodes;
    const firstItem = lineItems[0];
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <Link
            to="/account/orders"
            className="group block no-underline animate-product-fade-in"
            style={{animationDelay: `${Math.min(index, 11) * 50}ms`}}
        >
            <Card className="motion-surface hover:shadow-md rounded-2xl py-0 overflow-hidden h-full group-hover:-translate-y-0.5 bg-card/80 hover:bg-card">
                <CardContent className="p-5 md:p-6 flex flex-col h-full">
                    {/* Header with Return Name and Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-lg font-semibold text-foreground tracking-tight">
                            {returnItem.name}
                        </span>
                        <Badge variant={statusConfig.variant} className="text-xs uppercase tracking-wide shrink-0">
                            {statusConfig.label}
                        </Badge>
                    </div>

                    {/* Product Thumbnails - Stacked with overlap (matching orders/dashboard style) */}
                    <div className="flex -space-x-3 mb-5">
                        {lineItems.slice(0, 4).map((item, idx) => (
                            <div
                                key={item.id}
                                className="relative size-14 rounded-xl overflow-hidden bg-muted/50 shrink-0 ring-2 ring-card shadow-sm sleek group-hover:-translate-y-0.5"
                                style={{zIndex: 10 - idx, transitionDelay: `${idx * 30}ms`}}
                            >
                                {item.lineItem.image ? (
                                    <Image
                                        data={item.lineItem.image}
                                        width={56}
                                        height={56}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="size-full bg-muted flex items-center justify-center">
                                        <ShoppingBagIcon className="size-5 text-muted-foreground" />
                                    </div>
                                )}
                                {idx === 3 && lineItems.length > 4 && (
                                    <div className="absolute inset-0 bg-primary/80 flex items-center justify-center backdrop-blur-xs">
                                        <span className="text-sm font-semibold text-primary-foreground">
                                            +{lineItems.length - 4}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {lineItems.length === 0 && (
                            <div className="size-14 rounded-xl bg-muted flex items-center justify-center ring-2 ring-card">
                                <PackageIcon className="size-6 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Return Details */}
                    <div className="space-y-1.5 mt-auto">
                        {/* Date */}
                        {returnItem.createdAt && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <CalendarIcon className="size-3.5 shrink-0" />
                                {new Date(returnItem.createdAt).toLocaleDateString(STORE_FORMAT_LOCALE, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                })}
                            </p>
                        )}
                        {/* Order reference */}
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <PackageIcon className="size-3.5 shrink-0" />
                            Order {returnItem.order.name}
                        </p>
                        {/* First item info with quantity context */}
                        {firstItem && (
                            <p className="text-base font-serif font-medium text-foreground truncate pt-1">
                                {firstItem.lineItem.title}
                                {lineItems.length > 1 && (
                                    <span className="text-muted-foreground font-sans font-normal text-sm">
                                        {" "}
                                        + {lineItems.length - 1} more
                                    </span>
                                )}
                            </p>
                        )}
                        {/* Total items being returned */}
                        <p className="text-sm text-muted-foreground">
                            {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in return
                        </p>
                    </div>

                    {/* Status Description - subtle separator and styling */}
                    {statusConfig.description && (
                        <div className="mt-4 pt-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">{statusConfig.description}</p>
                        </div>
                    )}

                    {/* View Details - Matches dashboard/orders pattern */}
                    <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 sleek">
                        <span>View Details</span>
                        <ArrowRightIcon className="size-4 sleek group-hover:translate-x-0.5" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
