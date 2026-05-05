/**
 * @fileoverview Order Detail Page
 *
 * @description
 * Displays the full details of a single customer order: line items, pricing,
 * shipping address, billing summary, and current fulfillment status.
 *
 * @route GET /account/orders/:id
 *
 * @authentication Required — redirects to login via handleAuthStatus() on unauthenticated requests.
 *
 * @data-loading
 * Fetches the order via the Customer Account API using the order GID.
 * Accepts either a raw numeric ID or a full GID string in the :id param.
 *
 * @related
 * - account.orders._index.tsx - Order list page
 * - graphql/customer-account/CustomerOrderQuery.ts - Order detail GraphQL query
 * - lib/order-status.ts - Status badge and label helpers
 */

import {Image} from "@shopify/hydrogen";
import {Link, useLoaderData} from "react-router";
import type {Route} from "./+types/account.orders.$id";
import {CUSTOMER_ORDER_QUERY} from "~/graphql/customer-account/CustomerOrderQuery";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import {Separator} from "~/components/ui/separator";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {getOrderStatusVariant, formatOrderStatus} from "~/lib/order-status";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
import {ArrowLeftIcon, PackageSearchIcon, MapPinIcon, WalletIcon} from "lucide-react";
import {parseProductTitle} from "~/lib/product";
import {AnimatedSection} from "~/components/AnimatedSection";

export const meta: Route.MetaFunction = ({data}) => {
    const orderName = data?.order?.name ?? "Order";
    return [{title: `Order ${orderName}`}];
};

/**
 * Loads the order record for the authenticated customer.
 *
 * Normalizes the :id param to a full GID before querying. Throws 400 if the
 * param is absent and 404 if the order is not found or belongs to another customer.
 *
 * @returns `{order}` — Customer Account API order node
 */
export const loader = async ({params, context}: Route.LoaderArgs) => {
    if (!params.id) {
        throw new Response("Order ID is required", {status: 400});
    }

    await context.customerAccount.handleAuthStatus();

    const orderId = params.id.startsWith("gid://") ? params.id : `gid://shopify/Order/${params.id}?key=${params.id}`;

    const {data, errors} = await context.customerAccount.query(CUSTOMER_ORDER_QUERY, {
        variables: {orderId}
    });

    if (errors?.length || !data?.order) {
        throw new Response("Order not found", {status: 404});
    }

    return {order: data.order};
};

/**
 * Formats an ISO date string into a locale-aware long-form date+time label.
 * Output example: "January 15, 2025, 3:42 PM"
 */
const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(STORE_FORMAT_LOCALE, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });

const OrderDetailPage = () => {
    const {order} = useLoaderData<typeof loader>();

    return (
        <div className="mx-auto max-w-5xl space-y-10 md:space-y-14 lg:space-y-16">
            {/* Back button + page header */}
            <AnimatedSection animation="hero" threshold={0.1}>
                <section className="space-y-6">
                    <Button variant="ghost" size="sm" asChild className="gap-2 motion-interactive">
                        <Link to="/account/orders">
                            <ArrowLeftIcon className="size-4" />
                            Back to Orders
                        </Link>
                    </Button>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                <PackageSearchIcon className="size-5 md:size-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-primary tracking-tight my-0">
                                    Order {order.name}
                                </h1>
                                <p className="text-muted-foreground text-sm md:text-base mt-1">
                                    {formatDate(order.processedAt)}
                                </p>
                            </div>
                        </div>
                        <Badge variant={getOrderStatusVariant(order.fulfillmentStatus)} className="w-fit">
                            {formatOrderStatus(order.fulfillmentStatus)}
                        </Badge>
                    </div>
                </section>
            </AnimatedSection>

            {/* Line items */}
            <AnimatedSection animation="section" threshold={0.1}>
                <Card className="rounded-2xl py-0 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    {order.lineItems?.nodes?.map((item, index) => (
                        <div
                            key={item.id}
                            className={`flex gap-4 p-4 sm:p-5 ${index < (order.lineItems?.nodes?.length ?? 0) - 1 ? "border-b border-border/50" : ""}`}
                        >
                            {item.image && (
                                <Image
                                    data={item.image}
                                    alt={item.image.altText ?? item.title}
                                    className="size-16 rounded-xl ring-1 ring-border/50 shadow-sm object-cover sm:size-20"
                                    width={item.image.width ?? 80}
                                    height={item.image.height ?? 80}
                                />
                            )}
                            <div className="flex flex-1 flex-col justify-center gap-1 min-w-0">
                                {(() => {
                                    const {primary, secondary} = parseProductTitle(item.title);
                                    return (
                                        <>
                                            <p className="font-serif font-medium break-words">{primary}</p>
                                            {secondary && (
                                                <p className="text-muted-foreground text-sm font-normal">{secondary}</p>
                                            )}
                                        </>
                                    );
                                })()}
                                {item.variantTitle && <p className="text-muted-foreground text-sm">{item.variantTitle}</p>}
                                <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                            </div>
                            {item.price && (
                                <div className="flex items-center">
                                    <span className="font-medium">{formatShopifyMoney(item.price)}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </Card>
            </AnimatedSection>

            {/* Address + Summary grid */}
            <AnimatedSection animation="slide-up" threshold={0.1}>
                <div className="grid gap-6 sm:grid-cols-2">
                    {order.shippingAddress && (
                        <Card className="p-4 space-y-2 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center justify-center size-8 rounded-xl bg-muted/50">
                                    <MapPinIcon className="size-4 text-muted-foreground" />
                                </div>
                                <h3 className="font-serif font-medium">Shipping Address</h3>
                            </div>
                            <div className="text-sm space-y-1">
                                {order.shippingAddress.formatted?.map(line => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                        </Card>
                    )}

                    <Card className="p-4 space-y-3 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center justify-center size-8 rounded-xl bg-muted/50">
                                <WalletIcon className="size-4 text-muted-foreground" />
                            </div>
                            <h3 className="font-serif font-medium">Order Summary</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            {order.subtotal && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatShopifyMoney(order.subtotal)}</span>
                                </div>
                            )}
                            {order.totalTax && parseFloat(order.totalTax.amount) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatShopifyMoney(order.totalTax)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-serif font-medium">
                                <span>Total</span>
                                <span>{formatShopifyMoney(order.totalPrice)}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </AnimatedSection>

            {order.confirmationNumber && (
                <p className="text-muted-foreground text-center text-sm font-mono">
                    Confirmation #{order.confirmationNumber}
                </p>
            )}
        </div>
    );
};

export default OrderDetailPage;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
