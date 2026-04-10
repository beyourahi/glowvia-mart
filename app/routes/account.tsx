/**
 * @fileoverview Account Layout Route (/account)
 *
 * @description
 * Parent layout route for all account-related pages. Provides:
 * - Soft authentication check (no redirects - pages are publicly accessible)
 * - Shared account navigation menu (visible only when authenticated)
 * - Customer data context for child routes (null when unauthenticated)
 * - Authentication status flag for child routes to conditionally render content
 * - Returns availability check (only when authenticated)
 *
 * @url-pattern /account/*
 * Base route for all account pages. Publicly accessible.
 *
 * @architecture
 * Layout Pattern:
 * - This route uses <Outlet> to render child routes
 * - Child routes receive {customer, returnsEnabled, isAuthenticated} via outlet context
 * - Shared navigation is rendered once here, only when authenticated
 * - Customer data is null for unauthenticated users
 *
 * Authentication:
 * - Uses customerAccount.isLoggedIn() for soft check (returns boolean, never throws)
 * - Never redirects based on auth status
 * - Child routes check isAuthenticated to show content or AuthRequiredFallback
 *
 * Data Loading:
 * - Customer details (profile, addresses) - only when authenticated
 * - Returns availability (checks if any orders are returnable) - only when authenticated
 *
 * @child-routes
 * - account._index.tsx - Dashboard (auth-gated content)
 * - account.profile.tsx - Profile settings (auth-gated content)
 * - account.orders._index.tsx - Order history (auth-gated content)
 * - account.orders.$id.return.tsx - Return request for orders (auth-gated content)
 * - account.addresses.tsx - Address book redirect
 * - account.subscriptions._index.tsx - Subscriptions (auth-gated content)
 * - account.returns._index.tsx - Returns if enabled (auth-gated content)
 * - account.wishlist.tsx - Saved items (fully public, localStorage-based)
 *
 * @seo
 * - noIndex, noFollow (account layout meta - individual routes may override)
 *
 * @related
 * - CustomerDetailsQuery.ts - Customer data query
 * - ReturnsAvailabilityQuery.ts - Returns check
 * - AuthRequiredFallback.tsx - Fallback UI for unauthenticated users
 * - account_.login.tsx - Login route (outside layout)
 */

import {useEffect} from "react";
import {data as remixData, NavLink, Outlet, useLoaderData, useRouteError, isRouteErrorResponse} from "react-router";
import type {Route} from "./+types/account";
import {getSeoMeta} from "@shopify/hydrogen";
import {CUSTOMER_DETAILS_QUERY} from "~/graphql/customer-account/CustomerDetailsQuery";
import {RETURNS_AVAILABILITY_QUERY, checkReturnsEnabled} from "~/graphql/customer-account/ReturnsAvailabilityQuery";
import {cn} from "~/lib/utils";
import {buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {trackErrorBoundary} from "~/hooks/usePwaAnalytics";

// =============================================================================
// META FUNCTION
// =============================================================================

// All account pages should not be indexed by search engines
export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    return (
        getSeoMeta({
            title: "My Account",
            description: "Manage your account, orders, addresses, and profile settings.",
            url: buildCanonicalUrl("/account", siteUrl),
            robots: {noIndex: true, noFollow: true}
        }) ?? []
    );
};

export function shouldRevalidate() {
    return true;
}

export async function loader({context}: Route.LoaderArgs) {
    const {customerAccount} = context;

    // Soft auth check - never redirect, never throw
    // Uses isLoggedIn() which returns a boolean safely, unlike query() which
    // throws when unauthenticated. This allows public access to all /account/* pages.
    let isAuthenticated = false;
    try {
        isAuthenticated = await customerAccount.isLoggedIn();
    } catch {
        isAuthenticated = false;
    }

    // Unauthenticated: return null customer, let child routes show fallback UI
    if (!isAuthenticated) {
        return remixData(
            {customer: null, returnsEnabled: false, isAuthenticated: false},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    // Authenticated: fetch customer details and returns availability in parallel
    const [customerResponse, returnsResponse] = await Promise.all([
        customerAccount.query(CUSTOMER_DETAILS_QUERY, {
            variables: {
                language: customerAccount.i18n.language
            }
        }),
        customerAccount.query(RETURNS_AVAILABILITY_QUERY, {
            variables: {
                first: 10, // Check last 10 orders
                language: customerAccount.i18n.language
            }
        })
    ]);

    const {data, errors} = customerResponse;

    if (errors?.length || !data?.customer) {
        // Graceful fallback - treat as unauthenticated instead of throwing
        return remixData(
            {customer: null, returnsEnabled: false, isAuthenticated: false},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    // Determine if returns are enabled based on order data
    const orders = returnsResponse?.data?.customer?.orders?.nodes ?? [];
    const returnsEnabled = checkReturnsEnabled(orders);

    return remixData(
        {customer: data.customer, returnsEnabled, isAuthenticated: true},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
}

export default function AccountLayout() {
    const {customer, returnsEnabled, isAuthenticated} = useLoaderData<typeof loader>();

    return (
        /* Account page container with standard site-wide padding
           - Uses px-container utility (4px mobile → 12px ultrawide)
           - Edge-to-edge design matches rest of website (no max-width)
           - Full viewport width for modern, spacious layout
           - pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px)
           - PageLayout clears the fixed header, this adds visual breathing room */
        <div className="px-container pt-(--page-breathing-room) mb-4 pb-6 sm:pb-8 md:pb-12 lg:pb-16 xl:pb-20 min-h-[calc(100dvh-var(--total-header-height))]">
            {/* Sidebar navigation is hidden for unauthenticated users to avoid
                showing links to pages they cannot access (L-08) */}
            {isAuthenticated && <AccountMenu returnsEnabled={returnsEnabled} />}
            <main className={isAuthenticated ? "mt-8 md:mt-10 lg:mt-12 xl:mt-14" : undefined}>
                <Outlet context={{customer, returnsEnabled, isAuthenticated}} />
            </main>
        </div>
    );
}

function AccountMenu({returnsEnabled}: {returnsEnabled: boolean}) {
    return (
        /* Account navigation - Matches CuratedCollections TabsList scrolling system
           Mobile: Horizontal scroll with native CSS (smooth, no snap points)
           Desktop: Centered with justified spacing

           Scrolling mechanics (from CuratedCollections):
           - overflow-x-auto: Enable horizontal scrolling
           - overscroll-x-contain: Prevent scroll chaining to parent
           - [scrollbar-width:none]: Hide scrollbar (Firefox)
           - [&::-webkit-scrollbar]:hidden: Hide scrollbar (WebKit)

           Layout mechanics:
           - min-w-max: Prevents wrapping, enables horizontal scroll
           - Responsive gaps: Increased for better visual separation
           - No horizontal padding (parent container provides edge-to-edge spacing)
           - justify-start on mobile, justify-center on desktop
        */
        <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <nav
                role="navigation"
                aria-label="Account navigation"
                className={cn(
                    "flex items-center justify-start sm:justify-center min-w-max mx-auto",
                    // Responsive gaps - increased for better visual separation across all screen sizes
                    "gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12"
                )}
            >
                <AccountNavLink to="/account" end>
                    Dashboard
                </AccountNavLink>
                <AccountNavLink to="/account/orders">Orders</AccountNavLink>
                {returnsEnabled && <AccountNavLink to="/account/returns">Returns</AccountNavLink>}
                <AccountNavLink to="/account/wishlist">Wishlist</AccountNavLink>
                <AccountNavLink to="/account/profile">Account Details</AccountNavLink>
            </nav>
        </div>
    );
}

function AccountNavLink({to, end, children}: {to: string; end?: boolean; children: React.ReactNode}) {
    const {canHover} = usePointerCapabilities();

    return (
        /* Individual navigation link - Matches CuratedCollections tab behavior
           - shrink-0: Prevents link from shrinking in flex container
           - whitespace-nowrap: Ensures text stays on one line (critical for scroll)
           - Removed snap-start as we're not using scroll snap (matching CuratedCollections)
        */
        <NavLink
            to={to}
            end={end}
            className={cn("shrink-0", canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]")}
        >
            {({isActive, isPending}) => (
                <span
                    className={cn(
                        // Responsive text sizing with ultrawide support
                        // whitespace-nowrap ensures text doesn't wrap (critical for horizontal scroll)
                        "relative inline-block pb-1 text-sm sm:text-base font-medium motion-link whitespace-nowrap",
                        // No horizontal padding - spacing handled by parent gap
                        isPending
                            ? "text-muted-foreground"
                            : isActive
                              ? "text-primary"
                              : canHover
                                ? "text-muted-foreground group-hover:text-primary"
                                : "text-foreground"
                    )}
                >
                    {children}
                    {/* Animated underline - scales from left on hover */}
                    <span
                        className={cn(
                            "absolute bottom-0 left-0 w-full h-0.5 bg-primary motion-link origin-left",
                            isActive
                                ? "scale-x-100"
                                : canHover
                                  ? "scale-x-0 group-hover:scale-x-100"
                                  : "scale-x-100 opacity-50"
                        )}
                    />
                </span>
            )}
        </NavLink>
    );
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

/**
 * Account-specific error boundary.
 * Shows contextual "Account Error" with offline detection.
 */
export function ErrorBoundary() {
    const error = useRouteError();
    let statusCode = 500;
    let errorMessage: string | undefined;

    if (isRouteErrorResponse(error)) {
        statusCode = error.status;
        errorMessage = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    const errorType = isRouteErrorResponse(error) ? "route_error" : "js_error";
    const title = statusCode === 404 ? "Account Not Found" : "Account Error";

    return (
        <>
            <AccountErrorTracker statusCode={statusCode} errorType={errorType} />
            <OfflineAwareErrorPage statusCode={statusCode} title={title} message={errorMessage} />
        </>
    );
}

function AccountErrorTracker({
    statusCode,
    errorType
}: {
    statusCode: number;
    errorType: "route_error" | "js_error";
}) {
    useEffect(() => {
        trackErrorBoundary(statusCode, errorType, "account");
    }, [statusCode, errorType]);
    return null;
}
