/**
 * @fileoverview Subscriptions List Route
 *
 * @description
 * Displays all customer subscription contracts with status and billing info.
 * Each subscription card links to detailed management page.
 *
 * @route GET /account/subscriptions
 *
 * @authentication
 * Requires customer authentication (enforced by parent account layout).
 *
 * @data-loading
 * - All subscription contracts (20 most recent)
 * - Contract status, billing policy, and next billing date
 * - Line items with product images and pricing
 *
 * @related
 * - account.subscriptions.$id.tsx - Subscription detail/management
 * - SubscriptionQueries.ts - Queries and status helpers
 * - SellingPlanSelector.tsx - Product page subscribe option
 */

import {data as remixData, Link, useLoaderData} from "react-router";
import type {Route} from "./+types/account.subscriptions._index";
import {getAccountMeta} from "~/lib/seo";
import {Image} from "@shopify/hydrogen";
import {Money} from "~/components/Money";
import {AnimatedSection} from "~/components/AnimatedSection";
import {
    CUSTOMER_SUBSCRIPTIONS_QUERY,
    SUBSCRIPTION_STATUSES,
    formatBillingFrequency,
    type SubscriptionStatus
} from "~/graphql/customer-account/SubscriptionQueries";

// shadcn components
import {Card, CardContent} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";

// Icons
import {RefreshCwIcon, ArrowRightIcon, ShoppingBagIcon} from "lucide-react";

export const meta: Route.MetaFunction = () => {
    return getAccountMeta("Subscriptions");
};

export async function loader({context}: Route.LoaderArgs) {
    const {customerAccount} = context;

    const {data, errors} = await customerAccount.query(CUSTOMER_SUBSCRIPTIONS_QUERY, {
        variables: {
            first: 20,
            language: customerAccount.i18n.language
        }
    });

    if (errors?.length) {
        throw new Error(errors[0].message);
    }

    const subscriptions = data?.customer?.subscriptionContracts?.nodes ?? [];

    return remixData(
        {subscriptions},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
}

type SubscriptionContract = {
    id: string;
    status: SubscriptionStatus;
    createdAt: string;
    nextBillingDate: string | null;
    currencyCode: string;
    billingPolicy: {
        interval: string;
        intervalCount: {count: number} | null;
    };
    lines: {
        nodes: Array<{
            id: string;
            name: string;
            title: string;
            quantity: number;
            currentPrice: {
                amount: string;
                currencyCode: string;
            };
            image?: {
                altText?: string | null;
                url: string;
                width?: number | null;
                height?: number | null;
            } | null;
        }>;
    };
};

export default function SubscriptionsIndex() {
    const {subscriptions} = useLoaderData<{subscriptions: SubscriptionContract[]}>();

    const hasSubscriptions = subscriptions.length > 0;

    return (
        <div className="space-y-10 md:space-y-14 lg:space-y-16">
            <div className="max-w-5xl mx-auto space-y-10 md:space-y-14 lg:space-y-16">
                {/* Page Header - Matches dashboard/orders/profile/returns section headers */}
                <AnimatedSection animation="hero" threshold={0.1}>
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                    <RefreshCwIcon className="size-5 md:size-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-foreground tracking-tight my-0">
                                        Subscriptions
                                    </h1>
                                    <p className="text-muted-foreground text-sm md:text-base mt-1">
                                        Manage your recurring orders and subscription plans
                                    </p>
                                </div>
                            </div>
                            {hasSubscriptions && (
                                <Button variant="link" asChild className="text-primary p-0 h-auto group hidden sm:flex">
                                    <Link
                                        to="/collections"
                                        className="flex items-center gap-1.5 group-hover:gap-2 motion-link hover:text-primary"
                                    >
                                        Browse Products{" "}
                                        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </section>
                </AnimatedSection>

                {/* Subscriptions List */}
                <AnimatedSection animation="section" threshold={0.1} delay={100}>
                    {subscriptions.length === 0 ? (
                        <SubscriptionsEmpty />
                    ) : (
                        <div className="grid gap-4 md:gap-5 md:grid-cols-2">
                            {subscriptions.map((subscription, index) => (
                                <SubscriptionCard key={subscription.id} subscription={subscription} index={index} />
                            ))}
                        </div>
                    )}
                </AnimatedSection>
            </div>
        </div>
    );
}

/** Empty state with gradient background, large icon, and CTAs */
function SubscriptionsEmpty() {
    return (
        <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-6">
                {/* Icon container - matches dashboard/returns empty state styling */}
                <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 mb-6 shadow-inner">
                    <RefreshCwIcon className="size-10 md:size-12 text-muted-foreground" />
                </div>

                {/* Title - serif font matching other headings */}
                <h3 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-2">
                    No subscriptions yet
                </h3>

                {/* Description - helpful and encouraging */}
                <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm leading-relaxed">
                    When you subscribe to a product, it will appear here for easy management and tracking.
                </p>

                {/* CTA buttons - primary action to browse products */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild size="lg" className="motion-interactive">
                        <Link to="/collections/all-products" className="gap-2">
                            <ShoppingBagIcon className="size-4" />
                            Browse Products
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

/** Individual subscription card with product thumbnails and billing info */
function SubscriptionCard({subscription, index = 0}: {subscription: SubscriptionContract; index?: number}) {
    const statusConfig = SUBSCRIPTION_STATUSES[subscription.status] ?? SUBSCRIPTION_STATUSES.ACTIVE;
    const frequency = formatBillingFrequency(
        subscription.billingPolicy.interval,
        subscription.billingPolicy.intervalCount
    );

    // Get first line item for preview
    const firstLine = subscription.lines.nodes[0];
    const additionalItems = subscription.lines.nodes.length - 1;

    // Format next billing date
    const nextBillingDate = subscription.nextBillingDate
        ? new Date(subscription.nextBillingDate).toLocaleDateString()
        : "N/A";

    // Calculate total from all line items
    const totalAmount = subscription.lines.nodes.reduce((sum, line) => {
        return sum + parseFloat(line.currentPrice.amount) * line.quantity;
    }, 0);

    return (
        <Link
            to={`/account/subscriptions/${btoa(subscription.id)}`}
            className="group block no-underline animate-product-fade-in"
            style={{animationDelay: `${Math.min(index, 11) * 50}ms`}}
        >
            <Card className="motion-surface hover:shadow-md rounded-2xl py-0 overflow-hidden h-full group-hover:-translate-y-0.5 bg-card/80 hover:bg-card">
                <CardContent className="p-5 md:p-6 flex flex-col h-full">
                    {/* Header with Title and Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="min-w-0">
                            <p className="text-base font-serif font-medium text-foreground truncate">
                                {firstLine?.title ?? "Subscription"}
                                {additionalItems > 0 && (
                                    <span className="text-muted-foreground font-sans font-normal text-sm">
                                        {" "}
                                        +{additionalItems} more item{additionalItems > 1 ? "s" : ""}
                                    </span>
                                )}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">{frequency}</p>
                        </div>
                        <Badge variant={statusConfig.variant} className="text-xs uppercase tracking-wide shrink-0 ml-3">
                            {statusConfig.label}
                        </Badge>
                    </div>

                    {/* Product Thumbnails - Stacked with overlap (matching returns/orders style) */}
                    <div className="flex -space-x-3 mb-5">
                        {subscription.lines.nodes.slice(0, 4).map((line, idx) => (
                            <div
                                key={line.id}
                                className="relative size-14 rounded-xl overflow-hidden bg-muted/50 shrink-0 ring-2 ring-card shadow-sm sleek group-hover:-translate-y-0.5"
                                style={{zIndex: 10 - idx, transitionDelay: `${idx * 30}ms`}}
                            >
                                {line.image ? (
                                    <Image
                                        data={line.image}
                                        width={56}
                                        height={56}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="size-full bg-muted flex items-center justify-center">
                                        <ShoppingBagIcon className="size-5 text-muted-foreground" />
                                    </div>
                                )}
                                {idx === 3 && subscription.lines.nodes.length > 4 && (
                                    <div className="absolute inset-0 bg-primary/80 flex items-center justify-center backdrop-blur-xs">
                                        <span className="text-sm font-semibold text-primary-foreground">
                                            +{subscription.lines.nodes.length - 4}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {subscription.lines.nodes.length === 0 && (
                            <div className="size-14 rounded-xl bg-muted flex items-center justify-center ring-2 ring-card">
                                <RefreshCwIcon className="size-6 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Subscription Info */}
                    <div className="space-y-1.5 mt-auto">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Next billing</span>
                            <span>{nextBillingDate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-serif font-medium">
                                <Money
                                    data={{
                                        amount: totalAmount.toFixed(2),
                                        currencyCode: subscription.currencyCode
                                    }}
                                />
                            </span>
                        </div>
                    </div>

                    {/* Manage link - Matches returns/orders "View Details" pattern */}
                    <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 sleek">
                        <span>Manage</span>
                        <ArrowRightIcon className="size-4 sleek group-hover:translate-x-0.5" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
