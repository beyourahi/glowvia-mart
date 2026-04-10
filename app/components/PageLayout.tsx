/**
 * @fileoverview Main application layout wrapper with global providers
 *
 * @description
 * PageLayout is the root layout component that wraps all pages in the application.
 * It provides global context providers, renders header/footer, and manages sheet overlays
 * (cart, search, mobile menu) via the Aside system.
 *
 * @features
 * - Global context providers (Lenis scroll, Aside state, Brand animations)
 * - Sticky header with navigation and cart
 * - Sheet overlays for cart, search, and mobile menu
 * - Deferred data loading with Suspense for cart state
 * - Body scroll locking when cart is open
 * - Safe area insets for iOS notch/home indicator
 *
 * @architecture
 * Provider hierarchy (outer to inner):
 * 1. LenisProvider - Smooth scroll behavior
 * 2. AsideProvider - Sheet overlay state (cart/search/menu)
 * 3. BrandAnimationProvider - Shared animation context
 * 4. Overlay components - CartSheet, FullScreenSearch, FullScreenMenu
 * 5. Layout components - Header, main content, Footer
 *
 * @props
 * - cart: Deferred cart data promise
 * - children: Page content
 * - footer: Footer menu data
 * - header: Header menu data
 * - isLoggedIn: Deferred auth status promise
 * - hasStoreCredit: Deferred store credit status promise
 * - publicStoreDomain: Store domain for link detection
 * - menuCollections: Collections for navigation menus
 * - totalProductCount: Total products for "All" link
 * - discountCount: Count of discounted products
 * - popularSearchTerms: Terms for search suggestions
 * - shippingConfig: Free shipping thresholds
 * - hasBlog: Whether blogs exist (affects menu)
 *
 * @related
 * - root.tsx - Renders PageLayout with loader data
 * - Aside.tsx - Sheet overlay state management
 * - CartMain.tsx - Cart drawer content
 * - Header.tsx - Site header with navigation
 * - Footer.tsx - Site footer
 * - FullScreenSearch.tsx - Search overlay
 * - FullScreenMenu.tsx - Mobile navigation menu
 */

import {Await, Link, useAsyncValue, useLocation} from "react-router";
import {Suspense, useEffect, useState} from "react";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import type {PageLayoutProps} from "types";
import {cn} from "~/lib/utils";
import type {ShippingConfig} from "~/lib/shipping";
import {AnnouncementBanner} from "~/components/AnnouncementBanner";
import {LenisProvider} from "~/lib/LenisProvider";
import {useScrollLock} from "~/hooks/useScrollLock";
import {AsideProvider, useAside} from "~/components/Aside";
import {BrandAnimationProvider} from "~/components/BrandAnimation";
import {Footer} from "~/components/Footer";
import {Header} from "~/components/Header";
import {CartMain} from "~/components/CartMain";
import {FullScreenMenu} from "~/components/FullScreenMenu";
import {FullScreenSearch} from "~/components/FullScreenSearch";
import {Sheet, SheetContent, SheetTitle, SheetDescription} from "~/components/ui/sheet";
import {Skeleton} from "~/components/ui/skeleton";
import {Button} from "~/components/ui/button";
import {AlertCircle, RefreshCw, ShoppingCart} from "lucide-react";

// ================================================================================
// Header Clearance Padding System
// ================================================================================

/**
 * Page padding type determines whether the page needs header clearance padding.
 *
 * - 'home': Zero padding - VideoHero extends behind transparent header (h-dvh design)
 * - 'content': Header clearance - All other pages get pt-(--total-header-height)
 *
 * Additional breathing room is applied per-page on each page's first section
 * using pt-(--page-breathing-room) or pt-(--page-breathing-room-dense) for
 * more granular control over spacing.
 */
type PagePaddingType = "home" | "content";

/**
 * Determines whether a page needs header clearance padding.
 *
 * PageLayout only provides minimal padding to clear the fixed header.
 * Each page is responsible for adding breathing room to its first section.
 *
 * @param pathname - Current route pathname from useLocation
 * @returns PagePaddingType: 'home' for no padding, 'content' for header clearance
 *
 * @example
 * getPagePaddingType('/') // => 'home'
 * getPagePaddingType('/faq') // => 'home'
 * getPagePaddingType('/policies/privacy-policy') // => 'home'
 * getPagePaddingType('/products/some-product') // => 'content'
 * getPagePaddingType('/collections/all-products') // => 'content'
 */
function getPagePaddingType(pathname: string): PagePaddingType {
    // Homepage - no padding (VideoHero is h-dvh, extends behind transparent header)
    if (pathname === "/") return "home";

    // FAQ page - no padding (custom hero section extends behind header)
    if (pathname === "/faq") return "home";

    // Policy pages - no padding (custom hero sections extend behind header)
    if (pathname.startsWith("/policies/")) return "home";

    // All other pages get header clearance padding
    // Breathing room is added to each page's first section individually
    return "content";
}

// ================================================================================
// Main Layout Component
// ================================================================================

/**
 * PageLayout - Root layout wrapper for all pages
 *
 * Provides global providers and renders header, footer, and sheet overlays.
 * All page content is rendered inside the <main> element.
 *
 * Cart, search, and mobile menu are rendered as sheet overlays controlled by
 * Aside context. Only one overlay can be open at a time.
 */
export function PageLayout({
    cart,
    children = null,
    footer,
    header,
    isLoggedIn,
    hasStoreCredit,
    publicStoreDomain,
    menuCollections,
    totalCollections,
    totalProductCount,
    discountCount,
    popularSearchTerms,
    shippingConfig,
    hasBlog,
    announcementTexts
}: PageLayoutProps) {
    const location = useLocation();
    const paddingType = getPagePaddingType(location.pathname);

    // Determine if announcement banner is present
    const hasAnnouncement = announcementTexts && announcementTexts.length > 0;

    // Set CSS custom property for announcement height
    // This allows Header and main content to position correctly below the fixed announcement
    // Height is ~32px based on py-1.5 (6px×2=12px) + text-sm line-height (~20px)
    useEffect(() => {
        document.documentElement.style.setProperty("--announcement-height", hasAnnouncement ? "32px" : "0px");
    }, [hasAnnouncement]);

    return (
        <LenisProvider>
            <AsideProvider>
                <BrandAnimationProvider>
                    <CartSheet
                        cart={cart}
                        isLoggedIn={isLoggedIn}
                        hasStoreCredit={hasStoreCredit}
                        shippingConfig={shippingConfig}
                    />
                    <FullScreenSearch collections={menuCollections} popularSearchTerms={popularSearchTerms} />
                    <FullScreenMenu
                        collections={menuCollections}
                        totalCollections={totalCollections}
                        totalProductCount={totalProductCount}
                        discountCount={discountCount}
                        hasBlog={hasBlog}
                    />
                    {/* Announcement Banner - Fixed at top: 0 on all pages */}
                    {hasAnnouncement && <AnnouncementBanner texts={announcementTexts} />}
                    {header && (
                        <Header
                            header={header}
                            cart={cart}
                            isLoggedIn={isLoggedIn}
                            publicStoreDomain={publicStoreDomain}
                        />
                    )}
                    {/* Main content area - overflow-x-clip prevents horizontal scroll from
                         any child content that might overflow at narrow viewports (320px).
                         IMPORTANT: Using 'clip' instead of 'hidden' because overflow-hidden creates
                         a new scroll container, which breaks position:sticky for child elements.
                         The 'clip' value clips overflow without creating a scroll container.

                         Header Clearance Padding System:
                         PageLayout only provides minimal padding to clear the fixed header.
                         Additional breathing room is applied per-page on each page's first section
                         for more granular control.

                         1. Exception pages (/, /faq, /policies/*) - Zero padding
                            Custom hero sections extend behind transparent header.
                            No padding classes applied.
                            These pages use explicit Tailwind padding: pt-32 sm:pt-36 md:pt-44 lg:pt-52 xl:pt-64

                         2. All other pages - Header clearance only
                            pt-[var(--total-header-height)] = announcement + gap + header
                            Breathing room is added to each page's first section individually
                            using pt-(--page-breathing-room) or pt-(--page-breathing-room-dense) */}
                    <main
                        className={cn(
                            "motion-interactive overflow-x-clip transition-[padding-top]",
                            paddingType !== "home" && "pt-(--total-header-height)"
                        )}
                    >
                        {children}
                    </main>
                    <Footer footer={footer} header={header} publicStoreDomain={publicStoreDomain} />
                </BrandAnimationProvider>
            </AsideProvider>
        </LenisProvider>
    );
}

// ================================================================================
// Cart Sheet Components
// ================================================================================

/**
 * CartLoadingSkeleton - Loading placeholder for cart contents
 *
 * Displays skeleton items while cart data is being fetched.
 * Matches the visual layout of CartLineItem for smooth transition.
 */
function CartLoadingSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="size-16 rounded-md bg-overlay-light-hover" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-overlay-light-hover" />
                        <Skeleton className="h-3 w-1/2 bg-overlay-light-hover" />
                        <Skeleton className="h-4 w-20 bg-overlay-light-hover" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * CartErrorFallback - Error state when cart fails to load
 *
 * Displayed when cart data loading times out or fails.
 * This prevents the user from being stuck in an infinite loading state.
 *
 * Features:
 * - Clear error message explaining the issue
 * - "Try Again" button that refreshes the page
 * - "Continue Shopping" link to browse products
 * - Matches cart sheet styling for consistent UX
 *
 * Common causes of cart load failure:
 * - Network connectivity issues
 * - Stale cart ID in session cookie
 * - Shopify API temporary unavailability
 * - Request timeout (10 second limit)
 *
 * @accessibility
 * - AlertCircle icon with aria-hidden for decorative use
 * - Clear heading hierarchy
 * - Touch targets meet 44px minimum
 */
function CartErrorFallback() {
    const {close} = useAside();

    // Refresh page to retry loading cart
    // This clears any stale state and re-fetches cart data
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            {/* Error Icon */}
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-overlay-light">
                <AlertCircle className="size-8 text-primary-foreground/70" aria-hidden="true" />
            </div>

            {/* Error Message */}
            <h2 className="mb-2 font-serif text-xl text-primary-foreground">Unable to load cart</h2>
            <p className="mb-6 max-w-xs text-sm text-primary-foreground/70">
                We couldn&apos;t load your cart. This may be due to a connection issue. Please try again.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                {/* Primary: Retry loading */}
                <Button
                    onClick={handleRetry}
                    className="w-full gap-2 bg-light text-primary hover:bg-light/90"
                    size="lg"
                >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Try Again
                </Button>

                {/* Secondary: Continue shopping */}
                <Link
                    to="/collections/all-products"
                    onClick={close}
                    prefetch="viewport"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary-foreground/20 px-4 py-2.5 text-sm font-medium text-primary-foreground motion-link hover:bg-primary-foreground/10 min-h-11"
                >
                    <ShoppingCart className="size-4" aria-hidden="true" />
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}

/**
 * CartSheet - Sliding cart drawer overlay
 *
 * Renders cart in a Sheet component (shadcn) that slides in from the right.
 * Uses Await/Suspense to handle deferred cart data loading.
 * Locks body scroll when open to prevent background scrolling.
 *
 * Sheet behavior:
 * - Mobile: Full width, fills screen height with safe area padding
 * - Desktop: Max 640px width, rounded left corners, offset from edges
 * - Backdrop: Overlay with fade animation
 * - Close: Click backdrop, ESC key, or close button in header
 *
 * Error Handling:
 * - Promises are wrapped with 10-second timeout in root.tsx
 * - On timeout/error, errorElement displays CartErrorFallback
 * - User can retry or continue shopping without clearing cache
 *
 * @param cart - Deferred cart data promise (with timeout)
 * @param isLoggedIn - Deferred auth status promise (with timeout)
 * @param hasStoreCredit - Deferred store credit status promise (with timeout)
 * @param shippingConfig - Free shipping thresholds for progress bar
 *
 * @see root.tsx loadDeferredData - Timeout wrapper implementation
 * @see lib/promise-utils.ts - withTimeoutAndFallback utility
 */
/**
 * Resolves auth promises without blocking cart rendering.
 * Auth status is a progressive enhancement — cart works with defaults (false/false)
 * while these promises resolve. This prevents auth promises from interfering
 * with cart reactivity during revalidation.
 */
function useResolvedAuth(
    isLoggedIn: PageLayoutProps["isLoggedIn"],
    hasStoreCredit: PageLayoutProps["hasStoreCredit"]
): {isLoggedIn: boolean; hasStoreCredit: boolean} {
    const [auth, setAuth] = useState({isLoggedIn: false, hasStoreCredit: false});

    useEffect(() => {
        let cancelled = false;
        Promise.all([isLoggedIn, hasStoreCredit])
            .then(([loggedIn, storeCredit]) => {
                if (!cancelled) {
                    setAuth({isLoggedIn: !!loggedIn, hasStoreCredit: !!storeCredit});
                }
            })
            .catch(() => {
                // Defaults (false/false) are safe — features degrade gracefully
            });
        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, hasStoreCredit]);

    return auth;
}

function CartSheet({
    cart,
    isLoggedIn,
    hasStoreCredit,
    shippingConfig
}: {
    cart: PageLayoutProps["cart"];
    isLoggedIn: PageLayoutProps["isLoggedIn"];
    hasStoreCredit: PageLayoutProps["hasStoreCredit"];
    shippingConfig?: ShippingConfig;
}) {
    const {type, close} = useAside();
    const isOpen = type === "cart";

    // Lock Lenis smooth scroll when cart is open (native scroll lock handled by Radix)
    useScrollLock(isOpen);

    // Resolve auth promises separately so they don't block cart reactivity.
    // Cart promise must be passed directly to <Await> for React Router to track
    // it across revalidation cycles — wrapping in Promise.all() breaks this tracking.
    const resolvedAuth = useResolvedAuth(isLoggedIn, hasStoreCredit);

    return (
        <Sheet open={isOpen} onOpenChange={open => !open && close()}>
            <SheetContent
                side="right"
                className="flex w-full flex-col overflow-hidden border-0 max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl bg-primary pb-[max(1rem,env(safe-area-inset-bottom))] inset-0! rounded-none! sm:top-4! sm:bottom-[max(1rem,env(safe-area-inset-bottom))]! sm:right-0! sm:left-auto! sm:rounded-l-3xl!"
                hideCloseButton
            >
                <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
                <SheetDescription className="sr-only">
                    Your cart items and checkout options
                </SheetDescription>
                <Suspense fallback={<CartLoadingSkeleton />}>
                    <Await resolve={cart} errorElement={<CartErrorFallback />}>
                        <CartSheetContent
                            isLoggedIn={resolvedAuth.isLoggedIn}
                            hasStoreCredit={resolvedAuth.hasStoreCredit}
                            shippingConfig={shippingConfig}
                        />
                    </Await>
                </Suspense>
            </SheetContent>
        </Sheet>
    );
}

/**
 * Inner content of the cart sheet, rendered inside <Await resolve={cart}>.
 * Uses useAsyncValue() to access the resolved cart data — same pattern as
 * the Header's CartBanner component, which correctly receives optimistic updates.
 */
function CartSheetContent({
    isLoggedIn,
    hasStoreCredit,
    shippingConfig
}: {
    isLoggedIn: boolean;
    hasStoreCredit: boolean;
    shippingConfig?: ShippingConfig;
}) {
    const cart = useAsyncValue() as CartApiQueryFragment | null;

    return (
        <CartMain
            cart={cart}
            layout="aside"
            isLoggedIn={isLoggedIn}
            hasStoreCredit={hasStoreCredit}
            shippingConfig={shippingConfig}
        />
    );
}
