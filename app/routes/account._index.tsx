/**
 * @fileoverview Account Dashboard Route
 *
 * @description
 * Main dashboard page for authenticated customers displaying personalized account overview
 * with orders, recently viewed products, recommendations, store credit, and quick actions.
 *
 * Features:
 * - Time-based personalized greetings (morning, noon, afternoon, evening, night)
 * - Store credit balance widget with transaction history
 * - Recent orders with visual product thumbnails
 * - Quick action grid for common account tasks
 * - Account statistics (order count, addresses, member duration with live counter)
 * - Recently viewed products carousel (hybrid server/client rendering)
 * - Recommended products based on best sellers
 * - Special offers banner with free shipping threshold
 * - Fully responsive layout with smooth animations
 *
 * @route /account
 *
 * @architecture
 * - Uses Customer Account API for order and customer data
 * - Uses Storefront API for product data (recently viewed, recommended)
 * - Hybrid rendering: server-side product fetching with client-side recently viewed filtering
 * - Cookie-based recently viewed tracking for SSR compatibility
 * - Live member duration counter (updates every second)
 * - Collapsible transaction history in store credit widget
 *
 * @related
 * - ~/graphql/customer-account/CustomerDashboardQuery - Customer orders query
 * - ~/graphql/customer-account/StoreCreditQueries - Store credit queries
 * - ~/lib/recently-viewed - Recently viewed products utilities
 * - ~/lib/shipping - Shipping threshold formatting
 * - ~/lib/site-content-context - Section heading customization
 * - ~/components/ProductItem - Product card component
 * - ~/components/AnimatedSection - Animation wrapper components
 * - ~/routes/account.tsx - Parent layout route
 */

import {data as remixData, Form, Link, useLoaderData, useNavigation, useOutletContext, useRouteLoaderData} from "react-router";
import type {Route} from "./+types/account._index";
import type {RootLoader} from "~/root";
import type {CustomerFragment} from "customer-accountapi.generated";
import type {CuratedProductFragment} from "storefrontapi.generated";
import {CUSTOMER_DASHBOARD_QUERY} from "~/graphql/customer-account/CustomerDashboardQuery";
import {getRecentlyViewedIds, useRecentlyViewed} from "~/lib/recently-viewed";
import {getZeroPrice} from "~/lib/currency-formatter";
import {formatShippingThreshold} from "~/lib/shipping";
import {Button} from "~/components/ui/button";
import {Card, CardContent} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {AuthRequiredFallback} from "~/components/AuthRequiredFallback";
import {getOrderStatusVariant, formatOrderStatus} from "~/lib/order-status";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "~/components/ui/collapsible";
import {Avatar, AvatarFallback} from "~/components/ui/avatar";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {ProductItem} from "~/components/ProductItem";
import {Money} from "~/components/Money";
import {AnimatedSection} from "~/components/AnimatedSection";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {cn} from "~/lib/utils";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
import {
    PackageSearchIcon,
    ShoppingBagIcon,
    MapPinIcon,
    MessageCircleIcon,
    UserCogIcon,
    HistoryIcon,
    CalendarIcon,
    GiftIcon,
    ArrowRightIcon,
    WalletIcon,
    ChevronDownIcon,
    InfoIcon
} from "lucide-react";
import {useState, useEffect} from "react";
import {
    CUSTOMER_STORE_CREDIT_QUERY,
    getTotalBalance,
    isCredit,
    type StoreCreditAccount,
    type StoreCreditTransaction
} from "~/graphql/customer-account/StoreCreditQueries";
import {useSectionHeadings} from "~/lib/site-content-context";
import {getAccountMeta} from "~/lib/seo";

const FALLBACK_ACCOUNT_CONTENT = {
    greetingMorning: "Good morning, {name}",
    greetingMidday: "Good day, {name}",
    greetingAfternoon: "Good afternoon, {name}",
    greetingEvening: "Good evening, {name}",
    greetingNight: "Good night, {name}",
    greetingFallback: "Welcome back",
    sectionRecentOrders: "Recent Orders",
    sectionQuickActions: "Quick Actions",
    sectionAccountStats: "Account Overview",
    sectionRecentlyViewed: "Recently Viewed",
    actionTrackOrders: "Track Orders",
    actionShopNow: "Shop Now",
    actionAddresses: "Addresses",
    actionGetHelp: "Get Help",
    actionEditProfile: "Edit Profile",
    actionOrderHistory: "Order History",
    statOrdersPlaced: "Orders Placed",
    statSavedAddresses: "Saved Addresses",
    statMemberSince: "Member Since",
    emptyNoOrdersHeading: "No orders yet",
    emptyNoOrdersMessage: "When you place an order, it will appear here",
    emptyNoAddresses: "No saved addresses yet",
    navDashboard: "Dashboard",
    navOrders: "Orders",
    navReturns: "Returns",
    navWishlist: "Wishlist",
    navAccountDetails: "Account Details",
    logoutButton: "Sign Out",
    saveButton: "Save Changes",
    cancelButton: "Cancel",
    viewAllOrders: "View All Orders",
    storeCreditLabel: "Store Credit",
    storeCreditAvailable: "Available Credit"
} as const;

export const meta: Route.MetaFunction = () => {
    return getAccountMeta("Account Dashboard");
};

export async function loader({context, request}: Route.LoaderArgs) {
    const {customerAccount, dataAdapter} = context;

    // Soft auth check - dashboard requires customer data for most content
    let isAuthenticated = false;
    try {
        isAuthenticated = await customerAccount.isLoggedIn();
    } catch {
        isAuthenticated = false;
    }

    // Unauthenticated: return empty data, component will show AuthRequiredFallback
    if (!isAuthenticated) {
        return remixData(
            {
                orders: null,
                recentlyViewedProducts: [],
                recommendedProducts: [],
                allProducts: [],
                storeCreditBalance: null,
                storeCreditAccounts: [],
                isStoreCreditEnabled: false,
                isAuthenticated: false
            },
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    // Fetch customer orders with line items
    const {data, errors} = await customerAccount.query(CUSTOMER_DASHBOARD_QUERY, {
        variables: {
            language: customerAccount.i18n.language
        }
    });

    if (errors?.length || !data?.customer) {
        throw new Error("Customer not found");
    }

    // Fetch store credit with full transaction history
    let storeCreditAccounts: StoreCreditAccount[] = [];
    let storeCreditBalance: {amount: string; currencyCode: string} | null = null;
    try {
        const storeCreditResponse = await customerAccount.query(CUSTOMER_STORE_CREDIT_QUERY, {
            variables: {
                first: 10,
                transactionsFirst: 10, // Limit to recent transactions for dashboard
                language: customerAccount.i18n.language
            }
        });
        storeCreditAccounts = storeCreditResponse?.data?.customer?.storeCreditAccounts?.nodes ?? [];
        storeCreditBalance = getTotalBalance(storeCreditAccounts);
    } catch (error) {
        console.error("Failed to load store credit:", error);
    }

    // Get recently viewed product IDs from cookie
    const cookieHeader = request.headers.get("Cookie");
    const recentlyViewedIds = getRecentlyViewedIds(cookieHeader);

    // Fetch recently viewed products if we have IDs
    let recentlyViewedProducts: CuratedProductFragment[] = [];
    if (recentlyViewedIds.length > 0) {
        try {
            const response = await dataAdapter.query(RECENTLY_VIEWED_PRODUCTS_QUERY, {
                variables: {ids: recentlyViewedIds.slice(0, 8)}
            });

            if (response?.nodes) {
                const productMap = new Map<string, CuratedProductFragment>();
                for (const node of response.nodes) {
                    // Include OOS products so recently viewed items remain visible after selling out
                    if (node && node.__typename === "Product") {
                        productMap.set(node.id, node as CuratedProductFragment);
                    }
                }
                recentlyViewedProducts = recentlyViewedIds
                    .map(id => productMap.get(id))
                    .filter((p): p is CuratedProductFragment => p !== undefined);
            }
        } catch (error) {
            console.error("Failed to load recently viewed products:", error);
        }
    }

    // Fetch recommended products (best selling, excluding recently viewed)
    let recommendedProducts: CuratedProductFragment[] = [];
    try {
        const response = await dataAdapter.query(RECOMMENDED_PRODUCTS_QUERY);
        if (response?.products?.nodes) {
            recommendedProducts = response.products.nodes
                .filter((p: CuratedProductFragment) => !recentlyViewedIds.includes(p.id))
                .slice(0, 8);
        }
    } catch (error) {
        console.error("Failed to load recommended products:", error);
    }

    // Fetch all products for client-side recently viewed filtering
    let allProducts: CuratedProductFragment[] = [];
    try {
        const response = await dataAdapter.query(ALL_PRODUCTS_QUERY);
        if (response?.products?.nodes) {
            allProducts = response.products.nodes;
        }
    } catch {
        // Silent fail
    }

    // Store credit is enabled in Shopify Admin if we have any store credit accounts
    // When disabled, the Customer Account API returns an empty array for storeCreditAccounts
    // See: https://shopify.dev/docs/api/customer/latest/objects/StoreCreditAccount
    const isStoreCreditEnabled = storeCreditAccounts.length > 0;

    return remixData(
        {
            orders: data.customer.orders,
            recentlyViewedProducts,
            recommendedProducts,
            allProducts,
            storeCreditBalance,
            storeCreditAccounts,
            isStoreCreditEnabled,
            isAuthenticated: true
        },
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
}

export default function AccountDashboard() {
    const {
        orders,
        recentlyViewedProducts,
        recommendedProducts,
        allProducts,
        storeCreditBalance,
        storeCreditAccounts,
        isStoreCreditEnabled,
        isAuthenticated
    } = useLoaderData<typeof loader>();
    const {customer} = useOutletContext<{customer: CustomerFragment}>();
    const rootData = useRouteLoaderData<RootLoader>("root");
    const shippingConfig = rootData?.shippingConfig;

    if (!isAuthenticated) {
        return (
            <AuthRequiredFallback message="Sign in to view your account dashboard, orders, and personalized recommendations." />
        );
    }

    return (
        <div className="space-y-10 md:space-y-14 lg:space-y-16">
            {/* Welcome Banner - Hero section with prominent greeting */}
            <AnimatedSection animation="hero" threshold={0.1}>
                <WelcomeBanner customer={customer} />
            </AnimatedSection>

            {/* Store Credit Widget - Only shown when store credit is enabled in Shopify Admin
                    When disabled, storeCreditAccounts returns empty array from Customer Account API */}
            {isStoreCreditEnabled && (
                <AnimatedSection animation="slide-up" threshold={0.1} delay={50}>
                    <StoreCreditWidget balance={storeCreditBalance} accounts={storeCreditAccounts} currencyCode={shippingConfig?.currencyCode ?? "USD"} />
                </AnimatedSection>
            )}

            {/* Recent Orders Section - Primary actionable content */}
            <AnimatedSection animation="section" threshold={0.1} delay={100}>
                <RecentOrdersSection orders={orders} />
            </AnimatedSection>

            {/* Quick Actions Grid - Navigation shortcuts */}
            <AnimatedSection animation="slide-up" threshold={0.1} delay={50}>
                <QuickActionsGrid />
            </AnimatedSection>

            {/* Account Stats - Engagement metrics */}
            <AnimatedSection animation="fade" threshold={0.15} delay={100}>
                <AccountStats customer={customer} orderCount={orders?.nodes?.length ?? 0} />
            </AnimatedSection>

            {/* Recently Viewed Products - Personalized browsing history */}
            <AnimatedSection animation="section" threshold={0.1}>
                <RecentlyViewedSection serverProducts={recentlyViewedProducts} allProducts={allProducts} />
            </AnimatedSection>

            {/* Recommended Products - Discovery section */}
            <AnimatedSection animation="section" threshold={0.1}>
                <RecommendedSection products={recommendedProducts} />
            </AnimatedSection>

            {/* Special Offers Banner - CTA and benefits */}
            <AnimatedSection animation="scale" threshold={0.15}>
                <SpecialOffersBanner shippingConfig={shippingConfig} />
            </AnimatedSection>
        </div>
    );
}

// ============================================
// Time-Based Greeting Messages
// ============================================

type TimeOfDay = "morning" | "midday" | "afternoon" | "evening" | "night";

/**
 * Gets the time of day category based on hour
 *
 * Time ranges:
 * - morning: 5am - 11am
 * - midday: 11am - 1pm
 * - afternoon: 1pm - 5pm
 * - evening: 5pm - 9pm
 * - night: 9pm - 5am
 */
function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 13) return "midday";
    if (hour >= 13 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
}

/**
 * Gets the appropriate greeting message based on time of day
 * Uses metaobject content for merchant-customizable greetings
 *
 * @param hour - Current hour (0-23)
 * @param name - Customer's name for personalization
 * @param accountContent - Metaobject content with greeting templates
 * @returns Personalized greeting with {name} replaced
 */
function getGreeting(
    hour: number,
    name: string,
    accountContent: {
        greetingMorning: string;
        greetingMidday: string;
        greetingAfternoon: string;
        greetingEvening: string;
        greetingNight: string;
    }
): string {
    const timeOfDay = getTimeOfDay(hour);
    const greetingTemplates: Record<TimeOfDay, string> = {
        morning: accountContent.greetingMorning,
        midday: accountContent.greetingMidday,
        afternoon: accountContent.greetingAfternoon,
        evening: accountContent.greetingEvening,
        night: accountContent.greetingNight
    };
    return greetingTemplates[timeOfDay].replace("{name}", name);
}

// ============================================
// Welcome Banner Component
// ============================================

function WelcomeBanner({customer}: {customer: CustomerFragment}) {
    const accountContent = FALLBACK_ACCOUNT_CONTENT;
    const initials = [customer.firstName?.[0], customer.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
    const name = customer.firstName || "there";

    // Client-side only to avoid hydration mismatch
    // Use fallback greeting initially, then update with time-based greeting
    const [greeting, setGreeting] = useState<string>(accountContent.greetingFallback);
    const navigation = useNavigation();
    const isLoggingOut = navigation.state !== "idle" && navigation.formAction === "/account/logout";

    useEffect(() => {
        const hour = new Date().getHours();
        setGreeting(getGreeting(hour, name, accountContent));
    }, [name, accountContent]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 sm:p-8 md:p-10 max-w-5xl mx-auto">
            {/* Subtle decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90 pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-light/5 to-transparent pointer-events-none" />

            {/* Max-width wrapper for optimal readability on large screens
                 Constrains text-heavy content to ~1024px while maintaining
                 full-width background visuals. No effect on mobile/tablet. */}
            <div className="max-w-5xl mx-auto">
                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    {/* Left Side - Personal Greeting */}
                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                        <Avatar className="size-16 sm:size-20 md:size-24 border-2 border-primary-foreground/20 shadow-lg shrink-0 ring-4 ring-primary-foreground/10">
                            <AvatarFallback className="text-xl sm:text-2xl md:text-3xl font-serif bg-primary-foreground/10 text-primary-foreground">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5 min-w-0">
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-primary-foreground mb-0 leading-tight tracking-tight">
                                {greeting}
                            </h1>
                            <p className="text-primary-foreground/90 text-sm md:text-base truncate">
                                {customer.emailAddress?.emailAddress}
                            </p>
                        </div>
                    </div>

                    {/* Right Side - Logout */}
                    <Form method="POST" action="/account/logout" className="hidden md:block shrink-0">
                        <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={isLoggingOut}
                        >
                            {accountContent.logoutButton}
                        </Button>
                    </Form>
                </div>

                {/* Mobile logout button */}
                <Form method="POST" action="/account/logout" className="relative mt-6 md:hidden">
                    <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        disabled={isLoggingOut}
                        className="w-full"
                    >
                        {accountContent.logoutButton}
                    </Button>
                </Form>
            </div>
        </div>
    );
}

// ============================================
// Store Credit Widget
// ============================================

interface StoreCreditWidgetProps {
    balance: {amount: string; currencyCode: string} | null;
    accounts: StoreCreditAccount[];
    currencyCode: string;
}

function StoreCreditWidget({balance, accounts, currencyCode}: StoreCreditWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasBalance = balance && parseFloat(balance.amount) > 0;

    // Collect all transactions from all accounts
    const allTransactions: StoreCreditTransaction[] = accounts.flatMap(account => account.transactions.nodes);

    return (
        <section>
            <Card className="overflow-hidden rounded-2xl bg-linear-to-br from-success/8 via-card to-success/5 py-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        {/* Left Side - Balance Info */}
                        <div className="flex items-center gap-4 md:gap-5">
                            <div className="flex items-center justify-center size-14 md:size-16 rounded-2xl bg-success/15 shrink-0 shadow-inner">
                                <WalletIcon className="size-7 md:size-8 text-success" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                                    Store Credit Balance
                                </p>
                                <p className="text-xl md:text-2xl font-serif font-semibold text-foreground tracking-tight">
                                    {hasBalance ? <Money data={balance} /> : getZeroPrice(currencyCode)}
                                </p>
                                {hasBalance && (
                                    <p className="text-sm text-success font-medium">Available to use at checkout</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Note - How to get store credit */}
                    <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted/50 px-4 py-3.5">
                        <InfoIcon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Store credit is issued when you receive a refund or when an order is cancelled. It&apos;s
                            automatically applied at checkout.
                        </p>
                    </div>

                    {/* Transaction History - Collapsible */}
                    {allTransactions.length > 0 && (
                        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between px-0 hover:bg-transparent group"
                                >
                                    <span className="text-sm font-medium text-foreground">
                                        Transaction History ({allTransactions.length})
                                    </span>
                                    <ChevronDownIcon
                                        className={cn(
                                            "size-4 text-muted-foreground transition-transform duration-300 group-hover:text-foreground",
                                            isOpen && "rotate-180"
                                        )}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-4">
                                <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl bg-muted/30 p-3">
                                    {allTransactions.map(transaction => (
                                        <TransactionItem key={transaction.id} transaction={transaction} />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

function TransactionItem({transaction}: {transaction: StoreCreditTransaction}) {
    const credit = isCredit(transaction);
    const formattedDate = new Date(transaction.createdAt).toLocaleDateString(STORE_FORMAT_LOCALE, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <div className="flex items-center justify-between py-2.5 last:pb-0 first:pt-0">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "size-8 rounded-full flex items-center justify-center text-sm font-medium",
                        credit ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                    )}
                >
                    {credit ? "+" : "-"}
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">{credit ? "Credit Added" : "Credit Used"}</p>
                    <p className="text-sm text-muted-foreground">{formattedDate}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={cn("text-sm font-medium", credit ? "text-success" : "text-warning")}>
                    {credit ? "+" : "-"}
                    <Money data={transaction.amount} />
                </p>
                <p className="text-sm text-muted-foreground">
                    Bal: <Money data={transaction.balanceAfterTransaction} />
                </p>
            </div>
        </div>
    );
}

// ============================================
// Recent Orders Section
// ============================================

type OrderNode = NonNullable<ReturnType<typeof useLoaderData<typeof loader>>["orders"]>["nodes"][number];

function RecentOrdersSection({orders}: {orders: ReturnType<typeof useLoaderData<typeof loader>>["orders"]}) {
    const {canHover} = usePointerCapabilities();
    const accountContent = FALLBACK_ACCOUNT_CONTENT;
    const orderNodes = orders?.nodes ?? [];
    const hasOrders = orderNodes.length > 0;

    return (
        <section className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground tracking-tight mb-0">
                    {accountContent.sectionRecentOrders}
                </h2>
                {hasOrders && (
                    <Button variant="link" asChild className="text-primary p-0 h-auto group">
                        <Link
                            to="/account/orders"
                            className={cn(
                                "flex items-center gap-1.5 motion-link hover:text-primary",
                                canHover ? "group-hover:gap-2" : "motion-press active:scale-[var(--motion-press-scale)]"
                            )}
                        >
                            {accountContent.viewAllOrders}{" "}
                            <ArrowRightIcon
                                className={cn("size-4 sleek", canHover && "group-hover:translate-x-0.5")}
                            />
                        </Link>
                    </Button>
                )}
            </div>

            {hasOrders ? (
                <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-3">
                    {orderNodes.map(order => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <EmptyOrders />
            )}
        </section>
    );
}

function OrderCard({order}: {order: OrderNode}) {
    const {canHover} = usePointerCapabilities();
    const lineItems = order.lineItems?.nodes ?? [];
    const fulfillmentStatus = order.fulfillments?.nodes?.[0]?.status;
    const displayStatus = fulfillmentStatus || order.financialStatus;

    return (
        <Link
            to="/account/orders"
            className={cn(
                "block no-underline",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
            )}
        >
            <Card
                className={cn(
                    "rounded-2xl py-0 overflow-hidden h-full bg-linear-to-br from-muted/30 via-card to-muted/15 motion-surface",
                    "shadow-[0_0_0_1px_oklch(0.94_0_0/0.3),0_2px_12px_rgba(0,0,0,0.04)]",
                    canHover
                        ? "hover:shadow-[0_0_0_1px_oklch(0.92_0_0/0.4),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                        : "active:shadow-[0_0_0_1px_oklch(0.92_0_0/0.4),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)]"
                )}
            >
                <CardContent className="p-5 md:p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-lg font-semibold text-foreground tracking-tight">
                            #{order.number}
                        </span>
                        <Badge
                            variant={getOrderStatusVariant(displayStatus)}
                            className="text-xs uppercase tracking-wide"
                        >
                            {formatOrderStatus(displayStatus)}
                        </Badge>
                    </div>

                    {/* Product Thumbnails - Stacked with overlap */}
                    <div className="flex -space-x-3 mb-5">
                        {lineItems.slice(0, 4).map((item, index) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "relative size-14 rounded-xl overflow-hidden bg-muted shrink-0 ring-2 ring-card shadow-sm sleek",
                                    canHover && "group-hover:-translate-y-0.5",
                                    index === 3 && lineItems.length > 4 && "relative"
                                )}
                                style={{zIndex: 10 - index, transitionDelay: `${index * 30}ms`}}
                            >
                                {item.image?.url ? (
                                    <img
                                        src={item.image.url}
                                        alt={item.image.altText || item.title}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="size-full bg-muted flex items-center justify-center">
                                        <ShoppingBagIcon className="size-5 text-muted-foreground" />
                                    </div>
                                )}
                                {index === 3 && lineItems.length > 4 && (
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
                                <ShoppingBagIcon className="size-6 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Order Details */}
                    <div className="space-y-1.5 mt-auto">
                        <p className="text-sm text-muted-foreground">
                            {new Date(order.processedAt).toLocaleDateString(STORE_FORMAT_LOCALE, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            })}
                        </p>
                        <p className="text-xl font-serif font-semibold text-foreground tracking-tight">
                            <Money data={order.totalPrice} />
                        </p>
                    </div>

                    {/* View Details - Subtle arrow indicator */}
                    <div
                        className={cn(
                            "mt-4 flex items-center gap-1.5 text-sm font-medium text-primary sleek",
                            canHover && "group-hover:gap-2.5"
                        )}
                    >
                        <span>View Details</span>
                        <ArrowRightIcon
                            className={cn(
                                "size-4 sleek",
                                canHover && "group-hover:translate-x-0.5"
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function EmptyOrders() {
    const accountContent = FALLBACK_ACCOUNT_CONTENT;

    return (
        <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-20 text-center px-6">
                <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 mb-6 shadow-inner">
                    <ShoppingBagIcon className="size-10 md:size-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-2">
                    {accountContent.emptyNoOrdersHeading}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm leading-relaxed">
                    {accountContent.emptyNoOrdersMessage}
                </p>
                <Button asChild size="lg">
                    <Link to="/collections">{accountContent.actionShopNow}</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

// Status helper functions have been moved to ~/lib/order-status.ts for centralized
// management and guaranteed synchronization across all order-related interfaces.
//
// The shared utilities handle both fulfillment statuses (FULFILLED, UNFULFILLED, etc.)
// and financial/payment statuses (PAID, AUTHORIZED, REFUNDED, etc.), making them
// suitable for the dashboard's hybrid status display.

// ============================================
// Quick Actions Grid
// ============================================

function QuickActionsGrid() {
    const {canHover} = usePointerCapabilities();
    const accountContent = FALLBACK_ACCOUNT_CONTENT;

    const actions = [
        {
            icon: PackageSearchIcon,
            label: accountContent.actionTrackOrders,
            href: "/account/orders",
            description: "View order status"
        },
        {
            icon: ShoppingBagIcon,
            label: accountContent.actionShopNow,
            href: "/collections",
            description: "Browse products"
        },
        {
            icon: MapPinIcon,
            label: accountContent.actionAddresses,
            href: "/account/profile",
            description: "Manage addresses"
        },
        {
            icon: MessageCircleIcon,
            label: accountContent.actionGetHelp,
            href: "/contact",
            description: "Contact support"
        },
        {
            icon: UserCogIcon,
            label: accountContent.actionEditProfile,
            href: "/account/profile",
            description: "Update details"
        },
        {
            icon: HistoryIcon,
            label: accountContent.actionOrderHistory,
            href: "/account/orders",
            description: "Past purchases"
        }
    ];

    return (
        <section className="space-y-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground tracking-tight mb-0">
                {accountContent.sectionQuickActions}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
                {actions.map((action, index) => (
                    <Link
                        key={action.label}
                        to={action.href}
                        className={cn(
                            "flex flex-col items-center gap-4 p-6 md:p-8 lg:p-10 rounded-2xl bg-linear-to-br from-muted/30 via-card to-muted/15",
                            "shadow-[0_0_0_1px_oklch(0.94_0_0/0.3),0_2px_12px_rgba(0,0,0,0.04)]",
                            canHover
                                ? "group hover:shadow-[0_0_0_1px_oklch(0.92_0_0/0.4),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                                : "motion-press active:scale-[var(--motion-press-scale)] active:shadow-[0_0_0_1px_oklch(0.92_0_0/0.4),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)]"
                        )}
                        style={{animationDelay: `${index * 50}ms`}}
                    >
                        <div
                            className={cn(
                                "flex items-center justify-center size-16 md:size-20 lg:size-24 rounded-2xl bg-muted/40 motion-interactive",
                                canHover && "group-hover:bg-primary group-hover:shadow-md"
                            )}
                        >
                            <action.icon
                                className={cn(
                                    "size-7 md:size-8 lg:size-9 text-muted-foreground sleek",
                                    canHover && "group-hover:text-primary-foreground group-hover:scale-110"
                                )}
                            />
                        </div>
                        <div className="text-center space-y-0.5">
                            <span className="block text-base md:text-lg font-medium text-foreground">
                                {action.label}
                            </span>
                            <span
                                className={cn(
                                    "block text-xs text-muted-foreground motion-interactive hidden sm:block",
                                    canHover ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                                )}
                            >
                                {action.description}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

// ============================================
// Account Stats
// ============================================

function formatDuration(totalSeconds: number): string {
    if (totalSeconds < 0) totalSeconds = 0;

    const years = Math.floor(totalSeconds / (365 * 24 * 60 * 60));
    const remainingAfterYears = totalSeconds % (365 * 24 * 60 * 60);

    const months = Math.floor(remainingAfterYears / (30 * 24 * 60 * 60));
    const remainingAfterMonths = remainingAfterYears % (30 * 24 * 60 * 60);

    const days = Math.floor(remainingAfterMonths / (24 * 60 * 60));
    const remainingAfterDays = remainingAfterMonths % (24 * 60 * 60);

    const hours = Math.floor(remainingAfterDays / (60 * 60));
    const remainingAfterHours = remainingAfterDays % (60 * 60);

    const minutes = Math.floor(remainingAfterHours / 60);
    const seconds = Math.floor(remainingAfterHours % 60);

    const pluralize = (value: number, singular: string): string =>
        `${value} ${value === 1 ? singular : singular + "s"}`;

    // Years level: show years, months, days
    if (years > 0) {
        const parts = [pluralize(years, "year")];
        if (months > 0) parts.push(pluralize(months, "month"));
        if (days > 0) parts.push(pluralize(days, "day"));
        return parts.join(" ");
    }

    // Months level: show months, days
    if (months > 0) {
        const parts = [pluralize(months, "month")];
        if (days > 0) parts.push(pluralize(days, "day"));
        return parts.join(" ");
    }

    // Days level: show days, hours, minutes
    if (days > 0) {
        const parts = [pluralize(days, "day")];
        if (hours > 0) parts.push(pluralize(hours, "hour"));
        if (minutes > 0) parts.push(pluralize(minutes, "minute"));
        return parts.join(" ");
    }

    // Hours level: show hours, minutes
    if (hours > 0) {
        const parts = [pluralize(hours, "hour")];
        if (minutes > 0) parts.push(pluralize(minutes, "minute"));
        return parts.join(" ");
    }

    // Minutes level: show minutes, seconds
    if (minutes > 0) {
        const parts = [pluralize(minutes, "minute")];
        if (seconds > 0) parts.push(pluralize(seconds, "second"));
        return parts.join(" ");
    }

    // Seconds only
    return pluralize(seconds, "second");
}

function MemberDuration({creationDate}: {creationDate: string | null | undefined}) {
    const accountContent = FALLBACK_ACCOUNT_CONTENT;
    const [duration, setDuration] = useState<string>("—");

    useEffect(() => {
        if (!creationDate) return;

        const updateDuration = () => {
            const createdDate = new Date(creationDate);
            const now = new Date();
            const diffSeconds = (now.getTime() - createdDate.getTime()) / 1000;
            setDuration(formatDuration(diffSeconds));
        };

        updateDuration();
        const interval = setInterval(updateDuration, 1000);

        return () => clearInterval(interval);
    }, [creationDate]);

    return (
        <>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide order-1 sm:order-0">
                {accountContent.statMemberSince}
            </p>
            <p className="text-xl md:text-2xl font-serif font-semibold text-foreground tracking-tight order-2 sm:order-0">
                {duration}
            </p>
        </>
    );
}

function AccountStats({customer, orderCount}: {customer: CustomerFragment; orderCount: number}) {
    const accountContent = FALLBACK_ACCOUNT_CONTENT;
    const addressCount = customer.addresses?.nodes?.length ?? 0;

    const staticStats = [
        {
            icon: ShoppingBagIcon,
            value: orderCount.toString(),
            label: accountContent.statOrdersPlaced,
            gradient: "from-primary/5 to-transparent"
        },
        {
            icon: MapPinIcon,
            value: addressCount.toString(),
            label: accountContent.statSavedAddresses,
            gradient: "from-accent/5 to-transparent"
        }
    ];

    return (
        <section className="space-y-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground tracking-tight mb-0">
                {accountContent.sectionAccountStats}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                {staticStats.map((stat, index) => (
                    <Card
                        key={stat.label}
                        className="rounded-2xl py-0 relative overflow-hidden group bg-linear-to-br from-muted/30 via-card to-muted/15 shadow-[0_0_0_1px_oklch(0.94_0_0/0.3),0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_oklch(0.92_0_0/0.4),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] motion-surface"
                    >
                        {/* Subtle gradient background */}
                        <div
                            className={cn(
                                "absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-100 motion-interactive",
                                stat.gradient
                            )}
                        />
                        <CardContent className="p-5 sm:p-6 md:p-7 relative">
                            <div className="absolute top-4 sm:top-5 right-4 sm:right-5 flex items-center justify-center size-10 md:size-12 rounded-xl bg-muted/50">
                                <stat.icon className="size-5 md:size-6 text-muted-foreground/60" />
                            </div>
                            <div className="flex sm:block items-center justify-between sm:space-y-1.5 pr-14 sm:pr-0">
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide order-1 sm:order-0">
                                    {stat.label}
                                </p>
                                <p className="text-xl md:text-2xl font-serif font-semibold text-foreground tracking-tight order-2 sm:order-0">
                                    {stat.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {/* Member Duration Card - Live counter */}
                <Card className="rounded-2xl py-0 relative overflow-hidden group bg-linear-to-br from-muted/30 via-card to-muted/15 shadow-[0_0_0_1px_oklch(0.94_0_0/0.3),0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_oklch(0.92_0_0/0.4),0_4px_8px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] motion-surface">
                    <div className="absolute inset-0 bg-linear-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 motion-interactive" />
                    <CardContent className="p-5 sm:p-6 md:p-7 relative">
                        <div className="absolute top-4 sm:top-5 right-4 sm:right-5 flex items-center justify-center size-10 md:size-12 rounded-xl bg-muted/50">
                            <CalendarIcon className="size-5 md:size-6 text-muted-foreground/60" />
                        </div>
                        <div className="flex sm:block items-center justify-between sm:space-y-1.5 pr-14 sm:pr-0">
                            <MemberDuration creationDate={customer.creationDate} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}

// ============================================
// Recently Viewed Products Section
// ============================================

function RecentlyViewedSection({
    serverProducts,
    allProducts
}: {
    serverProducts: CuratedProductFragment[];
    allProducts: CuratedProductFragment[];
}) {
    const accountContent = FALLBACK_ACCOUNT_CONTENT;
    const recentlyViewed = useRecentlyViewed();

    // Derive products to display (prefer client-side after hydration)
    const displayProducts = (() => {
        const storeProductIds = recentlyViewed.productIds;

        if (recentlyViewed.isHydrated && storeProductIds.length > 0 && allProducts.length > 0) {
            return allProducts
                .filter(product => product && product.id && storeProductIds.includes(product.id))
                .sort((a, b) => {
                    const aIndex = storeProductIds.indexOf(a.id);
                    const bIndex = storeProductIds.indexOf(b.id);
                    return aIndex - bIndex;
                })
                .slice(0, 8);
        }

        if (serverProducts && serverProducts.length > 0) {
            return serverProducts.filter(product => product && product.id).slice(0, 8);
        }

        return [];
    })();

    // Don't render if no products
    if (!recentlyViewed.isHydrated && serverProducts.length === 0) return null;
    if (recentlyViewed.isHydrated && displayProducts.length === 0) return null;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground tracking-tight mb-0">
                    {accountContent.sectionRecentlyViewed}
                </h2>
                <Button variant="link" asChild className="text-primary p-0 h-auto group">
                    <Link
                        to="/collections"
                        className="flex items-center gap-1.5 group-hover:gap-2 motion-link hover:text-primary"
                    >
                        View All <ArrowRightIcon className="size-4 sleek group-hover:translate-x-0.5" />
                    </Link>
                </Button>
            </div>

            <Carousel
                opts={{align: "start", loop: true, dragFree: true}}

                className="w-full"
            >
                {/* pt-4 accommodates pin badge overflow (-top-2 to -top-2.5) */}
                <CarouselContent className="-ml-2 md:-ml-3 pt-4">
                    {displayProducts.map((product, index) => (
                        <CarouselItem
                            key={product.id}
                            className="basis-[80%] sm:basis-[45%] lg:basis-[32%] 2xl:basis-[24%] pl-2 md:pl-3"
                        >
                            <ProductItem product={product} index={index} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}

// ============================================
// Recommended Products Section
// ============================================

function RecommendedSection({products}: {products: CuratedProductFragment[]}) {
    const {recommendedTitle} = useSectionHeadings();

    if (!products || products.length === 0) return null;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground tracking-tight mb-0">
                    {recommendedTitle}
                </h2>
                <Button variant="link" asChild className="text-primary p-0 h-auto group">
                    <Link
                        to="/collections/all-products"
                        className="flex items-center gap-1.5 group-hover:gap-2 motion-link hover:text-primary"
                    >
                        Explore More{" "}
                        <ArrowRightIcon className="size-4 sleek group-hover:translate-x-0.5" />
                    </Link>
                </Button>
            </div>

            <Carousel
                opts={{align: "start", loop: true, dragFree: true}}

                className="w-full"
            >
                {/* pt-4 accommodates pin badge overflow (-top-2 to -top-2.5) */}
                <CarouselContent className="-ml-2 md:-ml-3 pt-4">
                    {products.map((product, index) => (
                        <CarouselItem
                            key={product.id}
                            className="basis-[80%] sm:basis-[45%] lg:basis-[32%] 2xl:basis-[24%] pl-2 md:pl-3"
                        >
                            <ProductItem product={product} index={index} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}

// ============================================
// Special Offers Banner
// ============================================

function SpecialOffersBanner({
    shippingConfig
}: {
    shippingConfig?: {freeShippingThreshold: number | null; currencyCode: string};
}) {
    const threshold = shippingConfig?.freeShippingThreshold ?? 0;
    const currencyCode = shippingConfig?.currencyCode ?? "USD";
    const formattedThreshold = formatShippingThreshold(threshold, currencyCode);

    return (
        <section>
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-accent via-accent/90 to-accent/80 p-6 sm:p-8 md:p-10">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-start gap-4 md:gap-5">
                        <div className="flex items-center justify-center size-14 md:size-16 rounded-2xl bg-accent-foreground/10 shrink-0 shadow-inner">
                            <GiftIcon className="size-7 md:size-8 text-accent-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg md:text-xl lg:text-2xl font-serif font-medium text-accent-foreground tracking-tight">
                                Exclusive Member Benefits
                            </h3>
                            <p className="text-sm md:text-base text-accent-foreground/80 max-w-lg leading-relaxed">
                                Enjoy free shipping on orders over {formattedThreshold} and early access to new arrivals
                                as a valued member.
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild
                        size="lg"
                        className="motion-interactive bg-accent-foreground text-accent hover:bg-accent-foreground/90 shrink-0 shadow-lg"
                    >
                        <Link to="/collections">Shop Now</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

// ============================================
// GraphQL Queries
// ============================================

const RECENTLY_VIEWED_PRODUCTS_QUERY = `#graphql
  query AccountRecentlyViewedProducts(
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

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query RecommendedProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 12, sortKey: BEST_SELLING) {
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

const ALL_PRODUCTS_QUERY = `#graphql
  query AllProductsForDashboard(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 250) {
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

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
