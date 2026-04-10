/**
 * @fileoverview Subscription Detail Route
 *
 * @description
 * Comprehensive subscription management page allowing customers to view
 * subscription details, skip billing cycles, and pause/resume/cancel
 * their subscription.
 *
 * @route GET/POST /account/subscriptions/:id
 *
 * @authentication
 * Requires customer authentication (enforced by parent account layout).
 * Validates customer owns the subscription.
 *
 * @data-loading
 * - Subscription contract details with status
 * - Line items with images and pricing
 * - Billing and delivery policies
 * - Upcoming billing cycles (skippable)
 * - Recent orders generated from subscription
 * - Subscription ID is base64-encoded in URL (atob to decode)
 *
 * @related
 * - account.subscriptions._index.tsx - Subscriptions list
 * - SubscriptionMutations.ts - Pause/cancel/activate mutations
 * - SubscriptionQueries.ts - Subscription query and helpers
 */

import {data as remixData, redirect, Form, useLoaderData, useNavigation, useActionData, Link} from "react-router";
import type {Route} from "./+types/account.subscriptions.$id";
import {Image} from "@shopify/hydrogen";
import {Money} from "~/components/Money";
import {AnimatedSection} from "~/components/AnimatedSection";
import {
    CUSTOMER_SUBSCRIPTION_QUERY,
    SUBSCRIPTION_STATUSES,
    formatBillingFrequency,
    type SubscriptionStatus
} from "~/graphql/customer-account/SubscriptionQueries";
import {
    SUBSCRIPTION_CONTRACT_PAUSE_MUTATION,
    SUBSCRIPTION_CONTRACT_CANCEL_MUTATION,
    SUBSCRIPTION_CONTRACT_ACTIVATE_MUTATION,
    SUBSCRIPTION_BILLING_CYCLE_SKIP_MUTATION,
    SUBSCRIPTION_BILLING_CYCLE_UNSKIP_MUTATION,
    SUBSCRIPTION_ACTIONS
} from "~/graphql/customer-account/SubscriptionMutations";

// shadcn components
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Alert, AlertDescription, AlertTitle} from "~/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "~/components/ui/alert-dialog";

// Icons
import {
    RefreshCwIcon,
    CalendarIcon,
    CreditCardIcon,
    PackageSearchIcon,
    SlidersHorizontalIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    AlertCircleIcon,
    ShoppingBagIcon
} from "lucide-react";

export const meta: Route.MetaFunction = ({data}) => {
    return [{title: data?.subscription ? "Subscription Details" : "Subscription Not Found"}];
};

export async function loader({params, context}: Route.LoaderArgs) {
    const {customerAccount} = context;

    if (!params.id) {
        return redirect("/account/subscriptions");
    }

    const subscriptionId = atob(params.id);

    const {data, errors} = await customerAccount.query(CUSTOMER_SUBSCRIPTION_QUERY, {
        variables: {
            id: subscriptionId,
            language: customerAccount.i18n.language
        }
    });

    if (errors?.length) {
        throw new Error(errors[0].message);
    }

    const subscription = data?.customer?.subscriptionContract;

    if (!subscription) {
        throw new Error("Subscription not found");
    }

    return remixData(
        {subscription},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
}

export async function action({request, params, context}: Route.ActionArgs) {
    const {customerAccount} = context;

    if (!params.id) {
        return redirect("/account/subscriptions");
    }

    const subscriptionId = atob(params.id);
    const form = await request.formData();
    const intent = form.get("intent")?.toString();

    try {
        switch (intent) {
            case SUBSCRIPTION_ACTIONS.PAUSE: {
                const {data: mutationData, errors} = await customerAccount.mutate(
                    SUBSCRIPTION_CONTRACT_PAUSE_MUTATION,
                    {
                        variables: {
                            subscriptionContractId: subscriptionId,
                            language: customerAccount.i18n.language
                        }
                    }
                );

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (mutationData?.subscriptionContractPause?.userErrors?.length) {
                    throw new Error(mutationData.subscriptionContractPause.userErrors[0].message);
                }

                return remixData(
                    {success: true, message: "Subscription paused successfully"},
                    {headers: {"Set-Cookie": await context.session.commit()}}
                );
            }

            case SUBSCRIPTION_ACTIONS.ACTIVATE: {
                const {data: mutationData, errors} = await customerAccount.mutate(
                    SUBSCRIPTION_CONTRACT_ACTIVATE_MUTATION,
                    {
                        variables: {
                            subscriptionContractId: subscriptionId,
                            language: customerAccount.i18n.language
                        }
                    }
                );

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (mutationData?.subscriptionContractActivate?.userErrors?.length) {
                    throw new Error(mutationData.subscriptionContractActivate.userErrors[0].message);
                }

                return remixData(
                    {success: true, message: "Subscription activated successfully"},
                    {headers: {"Set-Cookie": await context.session.commit()}}
                );
            }

            case SUBSCRIPTION_ACTIONS.CANCEL: {
                const {data: mutationData, errors} = await customerAccount.mutate(
                    SUBSCRIPTION_CONTRACT_CANCEL_MUTATION,
                    {
                        variables: {
                            subscriptionContractId: subscriptionId,
                            language: customerAccount.i18n.language
                        }
                    }
                );

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (mutationData?.subscriptionContractCancel?.userErrors?.length) {
                    throw new Error(mutationData.subscriptionContractCancel.userErrors[0].message);
                }

                return remixData(
                    {success: true, message: "Subscription cancelled successfully"},
                    {headers: {"Set-Cookie": await context.session.commit()}}
                );
            }

            case SUBSCRIPTION_ACTIONS.SKIP_CYCLE: {
                const cycleIndex = parseInt(form.get("cycleIndex")?.toString() || "0", 10);

                const {data: mutationData, errors} = await customerAccount.mutate(
                    SUBSCRIPTION_BILLING_CYCLE_SKIP_MUTATION,
                    {
                        variables: {
                            billingCycleInput: {
                                contractId: subscriptionId,
                                selector: {index: cycleIndex}
                            },
                            language: customerAccount.i18n.language
                        }
                    }
                );

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (mutationData?.subscriptionBillingCycleSkip?.userErrors?.length) {
                    throw new Error(mutationData.subscriptionBillingCycleSkip.userErrors[0].message);
                }

                return remixData(
                    {success: true, message: "Billing cycle skipped"},
                    {headers: {"Set-Cookie": await context.session.commit()}}
                );
            }

            case SUBSCRIPTION_ACTIONS.UNSKIP_CYCLE: {
                const cycleIndex = parseInt(form.get("cycleIndex")?.toString() || "0", 10);

                const {data: mutationData, errors} = await customerAccount.mutate(
                    SUBSCRIPTION_BILLING_CYCLE_UNSKIP_MUTATION,
                    {
                        variables: {
                            billingCycleInput: {
                                contractId: subscriptionId,
                                selector: {index: cycleIndex}
                            },
                            language: customerAccount.i18n.language
                        }
                    }
                );

                if (errors?.length) {
                    throw new Error(errors[0].message);
                }

                if (mutationData?.subscriptionBillingCycleUnskip?.userErrors?.length) {
                    throw new Error(mutationData.subscriptionBillingCycleUnskip.userErrors[0].message);
                }

                return remixData(
                    {success: true, message: "Billing cycle restored"},
                    {headers: {"Set-Cookie": await context.session.commit()}}
                );
            }

            default:
                return remixData(
                    {error: "Invalid action"},
                    {status: 400, headers: {"Set-Cookie": await context.session.commit()}}
                );
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        return remixData(
            {error: errorMessage, success: false},
            {status: 400, headers: {"Set-Cookie": await context.session.commit()}}
        );
    }
}

type ActionData = {
    success?: boolean;
    message?: string;
    error?: string;
};

type SubscriptionLine = {
    id: string;
    name: string;
    title: string;
    variantTitle?: string | null;
    quantity: number;
    currentPrice: {amount: string; currencyCode: string};
    lineDiscountedPrice: {amount: string; currencyCode: string};
    image?: {altText?: string | null; url: string; width?: number | null; height?: number | null} | null;
    sku?: string | null;
};

type BillingCycle = {
    cycleIndex: number;
    cycleStartAt: string;
    cycleEndAt: string;
    billingAttemptExpectedDate: string;
    skipped: boolean;
    status: string;
};

type SubscriptionOrder = {
    id: string;
    name: string;
    processedAt: string;
    totalPrice: {amount: string; currencyCode: string};
    fulfillmentStatus: string;
};

type Subscription = {
    id: string;
    status: SubscriptionStatus;
    createdAt: string;
    updatedAt: string;
    nextBillingDate: string | null;
    currencyCode: string;
    note?: string | null;
    deliveryPrice: {amount: string; currencyCode: string};
    billingPolicy: {
        interval: string;
        intervalCount: {count: number} | null;
        minCycles?: number | null;
        maxCycles?: number | null;
    };
    deliveryPolicy: {
        interval: string;
        intervalCount: {count: number} | null;
    };
    lines: {nodes: SubscriptionLine[]};
    upcomingBillingCycles: {nodes: BillingCycle[]};
    orders: {nodes: SubscriptionOrder[]};
    originOrder?: {id: string; name: string; processedAt: string} | null;
    lastPaymentStatus?: string | null;
    lastBillingAttemptErrorType?: string | null;
};

export default function SubscriptionDetail() {
    const {subscription} = useLoaderData<{subscription: Subscription}>();
    const actionData = useActionData<ActionData>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const statusConfig = SUBSCRIPTION_STATUSES[subscription.status] ?? SUBSCRIPTION_STATUSES.ACTIVE;
    const frequency = formatBillingFrequency(
        subscription.billingPolicy.interval,
        subscription.billingPolicy.intervalCount
    );

    const canPause = subscription.status === "ACTIVE";
    const canActivate = subscription.status === "PAUSED" || subscription.status === "FAILED";
    const canCancel = subscription.status !== "CANCELLED" && subscription.status !== "EXPIRED";

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
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-foreground tracking-tight my-0">
                                            Subscription Details
                                        </h1>
                                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm md:text-base mt-1">
                                        {frequency} &middot; Created {new Date(subscription.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </AnimatedSection>

                {/* Action feedback alerts */}
                {actionData?.success && (
                    <Alert className="rounded-2xl">
                        <CheckCircleIcon className="size-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{actionData.message}</AlertDescription>
                    </Alert>
                )}

                {actionData?.error && (
                    <Alert variant="destructive" className="rounded-2xl">
                        <AlertCircleIcon className="size-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{actionData.error}</AlertDescription>
                    </Alert>
                )}

                {/* Payment error alert */}
                {subscription.lastBillingAttemptErrorType && (
                    <Alert variant="destructive" className="rounded-2xl">
                        <AlertCircleIcon className="size-4" />
                        <AlertTitle>Payment Issue</AlertTitle>
                        <AlertDescription>
                            Your last payment attempt failed. Please update your payment method to continue receiving
                            shipments.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Subscription Items - Card-based layout instead of table */}
                <AnimatedSection animation="slide-up" threshold={0.1}>
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                    <ShoppingBagIcon className="size-5 md:size-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-serif font-medium tracking-tight">Subscription Items</CardTitle>
                                    <CardDescription>Products included in this subscription</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {subscription.lines.nodes.map(line => (
                                    <div
                                        key={line.id}
                                        className="flex items-center gap-4 rounded-xl bg-muted/30 p-3"
                                    >
                                        {/* Product Image */}
                                        {line.image ? (
                                            <div className="size-16 sm:size-20 shrink-0 rounded-xl overflow-hidden ring-1 ring-border/50 shadow-sm">
                                                <Image
                                                    data={line.image}
                                                    width={80}
                                                    height={80}
                                                    className="size-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="size-16 sm:size-20 shrink-0 rounded-xl bg-muted flex items-center justify-center ring-1 ring-border/50 shadow-sm">
                                                <ShoppingBagIcon className="size-6 text-muted-foreground" />
                                            </div>
                                        )}

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-serif font-medium text-foreground truncate">{line.title}</p>
                                            {line.variantTitle && (
                                                <p className="text-sm text-muted-foreground truncate">{line.variantTitle}</p>
                                            )}
                                            <p className="text-sm text-muted-foreground mt-1">Qty: {line.quantity}</p>
                                        </div>

                                        {/* Pricing */}
                                        <div className="text-right shrink-0">
                                            <p className="font-serif font-medium text-foreground">
                                                <Money data={line.lineDiscountedPrice} />
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                <Money data={line.currentPrice} /> each
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </AnimatedSection>

                {/* Billing and Payment Status - Two-column grid */}
                <AnimatedSection animation="slide-up" threshold={0.1}>
                    <div className="grid gap-4 md:gap-5 md:grid-cols-2">
                        {/* Next Billing Card */}
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                        <CalendarIcon className="size-5 md:size-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-serif font-medium tracking-tight">Next Billing</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="text-xl md:text-2xl font-serif font-medium text-foreground">
                                    {subscription.nextBillingDate
                                        ? new Date(subscription.nextBillingDate).toLocaleDateString()
                                        : "N/A"}
                                </p>
                                <p className="text-sm text-muted-foreground">{frequency}</p>
                                {subscription.deliveryPrice && parseFloat(subscription.deliveryPrice.amount) > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        + <Money data={subscription.deliveryPrice} /> delivery
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Status Card */}
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                        <CreditCardIcon className="size-5 md:size-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-serif font-medium tracking-tight">Payment Status</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Badge variant={subscription.lastPaymentStatus === "SUCCEEDED" ? "default" : "secondary"}>
                                    {subscription.lastPaymentStatus ?? "N/A"}
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>
                </AnimatedSection>

                {/* Upcoming Billing Cycles */}
                {subscription.upcomingBillingCycles.nodes.length > 0 && (
                    <AnimatedSection animation="slide-up" threshold={0.1}>
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                        <CalendarIcon className="size-5 md:size-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-serif font-medium tracking-tight">Upcoming Billing Cycles</CardTitle>
                                        <CardDescription>Skip or restore upcoming deliveries</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {subscription.upcomingBillingCycles.nodes.map(cycle => (
                                        <div
                                            key={cycle.cycleIndex}
                                            className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3"
                                        >
                                            <div>
                                                <p className="font-serif font-medium text-foreground">
                                                    {new Date(cycle.billingAttemptExpectedDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Cycle #{cycle.cycleIndex + 1}
                                                    {cycle.skipped && " (Skipped)"}
                                                </p>
                                            </div>
                                            <Form method="POST">
                                                <input type="hidden" name="cycleIndex" value={cycle.cycleIndex} />
                                                {cycle.skipped ? (
                                                    <Button
                                                        type="submit"
                                                        name="intent"
                                                        value={SUBSCRIPTION_ACTIONS.UNSKIP_CYCLE}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isSubmitting}
                                                    >
                                                        Restore
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="submit"
                                                        name="intent"
                                                        value={SUBSCRIPTION_ACTIONS.SKIP_CYCLE}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isSubmitting}
                                                    >
                                                        Skip
                                                    </Button>
                                                )}
                                            </Form>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </AnimatedSection>
                )}

                {/* Recent Orders */}
                {subscription.orders.nodes.length > 0 && (
                    <AnimatedSection animation="fade" threshold={0.1}>
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                        <PackageSearchIcon className="size-5 md:size-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-serif font-medium tracking-tight">Recent Orders</CardTitle>
                                        <CardDescription>Orders generated from this subscription</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {subscription.orders.nodes.map(order => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3"
                                        >
                                            <div className="min-w-0">
                                                <Link to="/account/orders" className="font-serif font-medium text-foreground hover:text-primary sleek">
                                                    {order.name}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(order.processedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <Badge variant="outline">{order.fulfillmentStatus}</Badge>
                                                <span className="font-serif font-medium text-foreground">
                                                    <Money data={order.totalPrice} />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </AnimatedSection>
                )}

                {/* Manage Subscription */}
                <AnimatedSection animation="slide-up" threshold={0.1}>
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                                    <SlidersHorizontalIcon className="size-5 md:size-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-serif font-medium tracking-tight">Manage Subscription</CardTitle>
                                    <CardDescription>Pause, resume, or cancel your subscription</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                                {canPause && (
                                    <Form method="POST">
                                        <Button
                                            type="submit"
                                            name="intent"
                                            value={SUBSCRIPTION_ACTIONS.PAUSE}
                                            variant="secondary"
                                            disabled={isSubmitting}
                                        >
                                            Pause Subscription
                                        </Button>
                                    </Form>
                                )}

                                {canActivate && (
                                    <Form method="POST">
                                        <Button
                                            type="submit"
                                            name="intent"
                                            value={SUBSCRIPTION_ACTIONS.ACTIVATE}
                                            variant="default"
                                            disabled={isSubmitting}
                                        >
                                            Resume Subscription
                                        </Button>
                                    </Form>
                                )}

                                {canCancel && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isSubmitting}>
                                                Cancel Subscription
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. Once cancelled, you will no longer receive
                                                    shipments and will need to create a new subscription if you change your
                                                    mind.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                                <Form method="POST">
                                                    <AlertDialogAction
                                                        type="submit"
                                                        name="intent"
                                                        value={SUBSCRIPTION_ACTIONS.CANCEL}
                                                        disabled={isSubmitting}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Yes, Cancel Subscription
                                                    </AlertDialogAction>
                                                </Form>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>

                            {/* Back link with arrow icon */}
                            <div className="pt-2">
                                <Button variant="link" className="h-auto p-0 group" asChild>
                                    <Link to="/account/subscriptions" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground sleek">
                                        <ArrowLeftIcon className="size-4 sleek group-hover:-translate-x-0.5" />
                                        Back to Subscriptions
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </AnimatedSection>
            </div>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
