/**
 * @fileoverview Root Application Component and Layout
 *
 * @description
 * The root of the React application tree. This file defines:
 * - HTML document structure (Layout component)
 * - Root data loading (critical + deferred data pattern)
 * - Global context providers (WishlistProvider, SiteContentProvider, Analytics)
 * - Error boundary with offline support
 * - SEO meta tags and PWA configuration
 *
 * This is the first React component rendered for every page. All routes
 * render inside the <Outlet /> within this component.
 *
 * @architecture
 * Component Hierarchy:
 * - Layout (HTML shell with head/body)
 *   - App (Context providers + PageLayout)
 *     - SiteContentProvider (Brand/theme data)
 *       - WishlistProvider (Wishlist state)
 *         - Analytics.Provider (Shopify analytics)
 *           - PageLayout (Header/Footer)
 *             - Outlet (Route content)
 *
 * Data Loading Pattern:
 * - Critical data: Blocks render (header, menu, theme)
 * - Deferred data: Streams in (cart, footer, suggestions)
 *
 * @performance
 * - shouldRevalidate optimizes navigation (avoids refetching root data)
 * - Theme is persisted to localStorage for offline page styling
 * - Cart suggestions are deferred to not block initial render
 *
 * @pwa
 * - PWA meta tags for installability
 * - Service worker registration
 * - Offline page theme injection
 * - Network status indicator
 *
 * @dependencies
 * - @shopify/hydrogen - Analytics, SEO, nonce management
 * - react-router - Routing primitives
 * - ~/lib/context - Site content and wishlist contexts
 *
 * @related
 * - entry.server.tsx - Calls this for SSR
 * - entry.client.tsx - Hydrates this component
 * - PageLayout.tsx - Main layout component
 * - tailwind.css - Theme CSS variables
 */

import {useEffect, useMemo} from "react";
import {Analytics, getShopAnalytics, useNonce, getSeoMeta} from "@shopify/hydrogen";
import {
    Outlet,
    useRouteError,
    isRouteErrorResponse,
    type ShouldRevalidateFunction,
    Links,
    Meta,
    Scripts,
    ScrollRestoration,
    useRouteLoaderData
} from "react-router";
import type {Route} from "./+types/root";
import {Toaster} from "~/components/ui/sonner";
import {toast} from "sonner";
// Note: favicon.svg is still used as fallback in the favicon[.]ico route
// The dynamic route handles Shopify metaobject → static fallback chain
import {CART_SUGGESTIONS_QUERY, FOOTER_QUERY, HEADER_QUERY, MENU_COLLECTIONS_QUERY} from "~/lib/fragments";
import {extractPopularSearchTerms} from "~/lib/popularSearches";
import {parseShippingConfig, type ShippingConfig} from "~/lib/shipping";
import {STORE_LANGUAGE_CODE} from "~/lib/store-locale";
import {countDiscountedProducts, type LightweightProduct} from "~/lib/discounts";
import {STORE_CREDIT_BALANCE_QUERY} from "~/graphql/customer-account/StoreCreditQueries";
import tailwindCss from "./styles/tailwind.css?url";
import {PageLayout} from "./components/PageLayout";
import {OfflineAwareErrorPage} from "./components/OfflineAwareErrorPage";
import {trackErrorBoundary} from "~/hooks/usePwaAnalytics";
import {GtmScript} from "~/components/GtmScript";
import {GoogleTagManager} from "~/components/GoogleTagManager";
import type {CartSuggestionProductFragment} from "storefrontapi.generated";
import {generateWebsiteSchema, getSeoDefaults} from "~/lib/seo";
import {detectAiAttribution} from "~/lib/ai-attribution";
import {AgentSurfaceProvider} from "~/lib/agent-surface-context";
import {deriveAgentSurface, type AgentSurface} from "~/lib/agentic/agent-surface";
import {emitAgentEvent, routeFromRequest} from "~/lib/agentic/observability";
import {AGENT_SESSION_ID_KEY} from "~/lib/session";
import {SITE_CONTENT_QUERY, THEME_SETTINGS_QUERY} from "~/lib/metaobject-queries";
import {parseSiteContent} from "~/lib/metaobject-parsers";
import {SiteContentProvider} from "~/lib/site-content-context";
import {WishlistProvider} from "~/lib/wishlist-context";
import {generateTheme} from "~/lib/theme-utils";
import {saveThemeToStorage, updateOfflinePageCache, getThemeFromStorage} from "~/lib/theme-storage";
import type {GeneratedTheme} from "types";
import {ServiceWorkerRegistration} from "~/components/ServiceWorkerRegistration";
import {NetworkStatusIndicator} from "~/components/NetworkStatusIndicator";
import {ServiceWorkerUpdateBanner} from "~/components/pwa/ServiceWorkerUpdateBanner";
import {OpenInAppButton} from "~/components/pwa/OpenInAppButton";
import {FloatingChatWidget} from "~/components/FloatingChatWidget";
import {useFooterClearance} from "~/hooks/useFooterClearance";
import {withTimeoutAndFallback, TIMEOUT_DEFAULTS} from "~/lib/promise-utils";

export type RootLoader = typeof loader;

export type PopularProduct = {
    id: string;
    handle: string;
    title: string;
    availableForSale: boolean;
    featuredImage: {url: string; altText: string | null} | null;
    priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
    variants: {
        nodes: Array<{
            availableForSale: boolean;
            price: {amount: string; currencyCode: string};
            compareAtPrice: {amount: string; currencyCode: string} | null;
        }>;
    };
};

/**
 * Root meta function - provides base SEO for the entire site
 * Child routes can override by using getSeoMeta with their own data
 */
export const meta: Route.MetaFunction = ({data}) => {
    const seoDefaults = getSeoDefaults(data?.siteContent?.siteSettings, data?.siteContent?.themeConfig);

    const seoMeta =
        getSeoMeta({
            title: seoDefaults.brandName,
            titleTemplate: `%s | ${seoDefaults.brandName}`,
            description: seoDefaults.description,
            url: seoDefaults.siteUrl,
            media: seoDefaults.media
        }) ?? [];

    return [
        ...seoMeta,
        ...(data?.websiteSchema ? [{"script:ld+json": data.websiteSchema}] : [])
    ];
};

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({formMethod, currentUrl, nextUrl}) => {
    // revalidate when a mutation is performed e.g add to cart, login...
    if (formMethod && formMethod !== "GET") return true;

    // revalidate when manually revalidating via useRevalidator
    if (currentUrl.toString() === nextUrl.toString()) return true;

    // Defaulting to no revalidation for root loader data to improve performance.
    // When using this feature, you risk your UI getting out of sync with your server.
    // Use with caution. If you are uncomfortable with this optimization, update the
    // line below to `return defaultShouldRevalidate` instead.
    // For more details see: https://remix.run/docs/en/main/route/should-revalidate
    return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
    return [
        // Preconnect for performance
        {rel: "preconnect", href: "https://cdn.shopify.com"},
        {rel: "preconnect", href: "https://shop.app"},
        {rel: "preconnect", href: "https://fonts.googleapis.com"},
        {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const},
        // Tailwind CSS stylesheet — standard Hydrogen pattern via links() rather than inline JSX
        {rel: "stylesheet", href: tailwindCss},
        // Note: Google Fonts link is dynamically generated in Layout from metaobject theme settings
        // Favicon - dynamic route that redirects to Shopify CDN or static fallback
        {rel: "icon", href: "/favicon.ico"},
        // PWA manifest (dynamic route)
        // crossOrigin="use-credentials" is required for browsers that enforce CORS on manifest requests
        {rel: "manifest", href: "/manifest.webmanifest", crossOrigin: "use-credentials" as const},
        // Apple Touch Icon (dynamic route that redirects to actual icon)
        {rel: "apple-touch-icon", href: "/apple-touch-icon.png"}
    ];
}

export async function loader(args: Route.LoaderArgs) {
    // Start fetching non-critical data without blocking time to first byte
    const deferredData = loadDeferredData(args);

    // Await the critical data required to render initial state of the page
    const criticalData = await loadCriticalData(args);

    const {storefront, env} = args.context;

    return {
        ...deferredData,
        ...criticalData,
        publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
        gtmContainerId: env.PUBLIC_GTM_CONTAINER_ID || "",
        shop: getShopAnalytics({
            storefront,
            publicStorefrontId: env.PUBLIC_STOREFRONT_ID || "0"
        }),
        consent: {
            checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
            storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
            withPrivacyBanner: false,
            // localize the privacy banner
            country: args.context.storefront.i18n.country,
            language: args.context.storefront.i18n.language
        }
    };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
    const aiAttribution = detectAiAttribution(request.headers, new URL(request.url).searchParams);
    const hasAgentSession = Boolean(context.session.get(AGENT_SESSION_ID_KEY));
    const agentSurface = deriveAgentSurface({aiAttribution, hasAgentSession});

    if (agentSurface.isAgent && (agentSurface.source === "referer" || agentSurface.source === "permalink")) {
        emitAgentEvent(context.env as Env, {
            evt: "agent_arrival",
            route: routeFromRequest(request),
            requestType: "agent",
            responseCategory: "ok"
        });
    }
    const {dataAdapter} = context;

    const [header, menuCollectionsData, blogData, siteContentData, themeSettingsData] = await Promise.all([
        // Header - navigation menu and shop brand info (cached: layout data)
        dataAdapter.query(HEADER_QUERY, {
            cache: dataAdapter.CacheLong(),
            variables: {
                headerMenuHandle: "main-menu"
            }
        }).catch((error: unknown) => {
            console.error("Failed to load header:", error);
            return null;
        }),
        // Menu collections with product counts (cached: catalog metadata)
        dataAdapter.query(MENU_COLLECTIONS_QUERY, {
            cache: dataAdapter.CacheLong()
        }).catch((error: unknown) => {
            console.error("Failed to load menu collections:", error);
            return null;
        }),
        // Blog existence check (cached: blog existence barely changes)
        dataAdapter.query(HAS_BLOG_QUERY, {
            cache: dataAdapter.CacheLong()
        }).catch((error: unknown) => {
            console.error("Failed to check blog availability:", error);
            return null;
        }),
        // Site content - brand name, announcements, social links (cached: CMS metaobject)
        dataAdapter.query(SITE_CONTENT_QUERY, {
            cache: dataAdapter.CacheLong()
        }).catch((error: unknown) => {
            console.error("Failed to load site content:", error);
            return null;
        }),
        // Theme settings - colors and fonts (cached: merchant-updated)
        dataAdapter.query(THEME_SETTINGS_QUERY, {
            cache: dataAdapter.CacheLong()
        }).catch((error: unknown) => {
            console.error("Failed to load theme settings:", error);
            return null;
        })
    ]);

    // Capture raw total before filtering — used for "All Collections" count in FullScreenMenu
    const totalCollections = menuCollectionsData?.collections?.nodes?.length ?? 0;

    // Process collections to compute product counts (all products, regardless of availability)
    // Filter out collections with no products at all (truly empty collections)
    const menuCollections =
        menuCollectionsData?.collections?.nodes
            ?.map((collection: any) => ({
                id: collection.id,
                handle: collection.handle,
                title: collection.title,
                productsCount: (collection.products?.nodes?.length ?? 0) > 0 ? 1 : 0,
                image: collection.image
            }))
            .filter((collection: any) => collection.productsCount > 0) ?? [];

    // Count all products for "All Products" link — no availability filter,
    // consistent with how collection product counts are calculated (raw node count)
    const totalProductCount = menuCollectionsData?.allProducts?.nodes?.length ?? 0;

    // Count discounted products for "SALE" link
    const discountCount = menuCollectionsData?.allProducts?.nodes
        ? countDiscountedProducts(menuCollectionsData.allProducts.nodes as LightweightProduct[])
        : 0;

    // Extract popular search terms from product titles and collections
    const popularSearchTerms = menuCollectionsData
        ? extractPopularSearchTerms(
              menuCollectionsData.allProducts?.nodes?.map((p: any) => ({
                  title: p.title,
                  productType: p.productType,
                  availableForSale: p.availableForSale
              })) ?? [],
              menuCollectionsData.collections?.nodes?.map((c: any) => ({
                  title: c.title,
                  handle: c.handle
              })) ?? []
          )
        : [];

    // Top 10 products with images — used by SearchOverlay popular products grid
    const popularProducts: PopularProduct[] = (menuCollectionsData?.allProducts?.nodes ?? [])
        .filter((p: any) => p.featuredImage)
        .slice(0, 10)
        .map((p: any) => ({
            id: p.id,
            handle: p.handle,
            title: p.title,
            availableForSale: p.availableForSale,
            featuredImage: p.featuredImage
                ? {url: p.featuredImage.url, altText: p.featuredImage.altText ?? null}
                : null,
            priceRange: {
                minVariantPrice: {
                    amount: p.priceRange.minVariantPrice.amount,
                    currencyCode: p.priceRange.minVariantPrice.currencyCode
                }
            },
            variants: {
                nodes: (p.variants?.nodes ?? []).map((v: any) => ({
                    availableForSale: v.availableForSale,
                    price: {amount: v.price.amount, currencyCode: v.price.currencyCode},
                    compareAtPrice: v.compareAtPrice
                        ? {amount: v.compareAtPrice.amount, currencyCode: v.compareAtPrice.currencyCode}
                        : null
                }))
            }
        }));

    // Check if there's at least one blog article
    const hasBlog = (blogData?.articles?.nodes?.length ?? 0) > 0;

    // Parse site content from metaobjects (site_settings + theme_settings only)
    // UI content uses FALLBACK_* constants directly from metaobject-parsers.ts (80/20 simplification)
    const siteContent = parseSiteContent(siteContentData, themeSettingsData);

    // Free shipping minimum order from site_settings; currency from shop paymentSettings (in SHOP_FRAGMENT)
    const shippingConfig = parseShippingConfig(
        siteContent.siteSettings.freeShippingMinimumOrder,
        header?.shop?.paymentSettings?.currencyCode ?? "USD"
    );

    // Generate dynamic theme from theme_settings metaobject (fonts + colors)
    const generatedTheme: GeneratedTheme | null = generateTheme(
        siteContent.themeConfig.colors,
        siteContent.themeConfig.fonts,
        siteContent.themeConfig.borderRadius
    );

    // Generate JSON-LD WebSite schema for structured data (SEO)
    const websiteSchema = generateWebsiteSchema(siteContent.siteSettings);

    return {
        header,
        menuCollections,
        totalCollections,
        totalProductCount,
        discountCount,
        popularSearchTerms,
        popularProducts,
        shippingConfig,
        hasBlog,
        siteContent,
        generatedTheme,
        websiteSchema,
        aiAttribution,
        agentSurface
    };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 *
 * IMPORTANT: All deferred promises are wrapped with timeout and fallback handling
 * to prevent infinite loading states. Without this protection, if any promise hangs
 * (network issues, stale cart IDs, API unavailability), the UI would show a skeleton
 * forever. Users would need to manually clear browser cache to recover.
 *
 * @see PageLayout.tsx - Uses Promise.all() on [cart, isLoggedIn, hasStoreCredit]
 * @see lib/promise-utils.ts - withTimeoutAndFallback implementation
 */
function loadDeferredData({context}: Route.LoaderArgs) {
    const {dataAdapter, customerAccount, cart} = context;

    // Footer menu - deferred, below the fold (cached: layout data)
    const footer = dataAdapter
        .query(FOOTER_QUERY, {
            cache: dataAdapter.CacheLong(),
            variables: {
                footerMenuHandle: "footer"
            }
        })
        .catch((error: Error) => {
            console.error(error);
            return null;
        });

    // Cart suggestion products - deferred (cached: catalog shifts slowly)
    const cartSuggestions: Promise<CartSuggestionProductFragment[] | null> = dataAdapter
        .query(CART_SUGGESTIONS_QUERY, {
            cache: dataAdapter.CacheShort()
        })
        .then((response: any) => {
            if (!response?.products?.nodes) return null;
            return response.products.nodes.filter((p: any) => p.availableForSale);
        })
        .catch((error: Error) => {
            console.error("Failed to load cart suggestions:", error);
            return null;
        });

    // Check if store credit is enabled (accounts exist) - only when logged in
    // When store credit is disabled in Shopify admin, storeCreditAccounts returns empty array
    const hasStoreCreditPromise: Promise<boolean> = customerAccount
        .isLoggedIn()
        .then(async isLoggedIn => {
            if (!isLoggedIn) return false;
            try {
                const response = await customerAccount.query(STORE_CREDIT_BALANCE_QUERY, {
                    variables: {language: customerAccount.i18n.language}
                });
                const accounts = response?.data?.customer?.storeCreditAccounts?.nodes ?? [];
                return accounts.length > 0;
            } catch {
                return false;
            }
        })
        .catch(() => false);

    // =========================================================================
    // TIMEOUT-PROTECTED DEFERRED DATA
    // =========================================================================
    // These promises are wrapped with timeouts to prevent infinite loading states.
    // If any promise hangs (network issue, stale cart ID, API unavailable),
    // it will resolve to a safe fallback after the timeout expires.
    //
    // Without this protection, Promise.all([cart, isLoggedIn, hasStoreCredit])
    // in PageLayout.tsx would wait forever, causing permanent skeleton state.
    // =========================================================================

    // Cart data with 10 second timeout
    // Falls back to null if API hangs (stale cart ID, network issues)
    // This is the most critical promise - hung cart causes permanent loading
    // cart.get() is typed as Promise<CartReturn | null> (the SDK's native return type).
    // CartReturn includes metafields (required by Analytics.Provider), so we keep the
    // full type here instead of casting down to CartApiQueryFragment.
    const cartWithTimeout = withTimeoutAndFallback(
        cart.get(),
        null, // Fallback: empty cart state
        TIMEOUT_DEFAULTS.CART
    );

    // Auth status with 5 second timeout
    // Falls back to false (logged out) if auth check hangs
    const isLoggedInWithTimeout = withTimeoutAndFallback(
        customerAccount.isLoggedIn(),
        false, // Fallback: treat as logged out
        TIMEOUT_DEFAULTS.AUTH
    );

    // Store credit with 5 second timeout (already has error handling above)
    // Falls back to false if the check fails
    const hasStoreCreditWithTimeout = withTimeoutAndFallback(
        hasStoreCreditPromise,
        false, // Fallback: no store credit
        TIMEOUT_DEFAULTS.STORE_CREDIT
    );

    // Footer with 8 second timeout
    // Falls back to null if footer menu hangs
    const footerWithTimeout = withTimeoutAndFallback(
        footer,
        null, // Fallback: no footer
        TIMEOUT_DEFAULTS.FOOTER
    );

    // Cart suggestions with 8 second timeout
    // Falls back to null if suggestions hang
    const cartSuggestionsWithTimeout = withTimeoutAndFallback(
        cartSuggestions,
        null, // Fallback: no suggestions
        TIMEOUT_DEFAULTS.SUGGESTIONS
    );

    return {
        cart: cartWithTimeout,
        isLoggedIn: isLoggedInWithTimeout,
        hasStoreCredit: hasStoreCreditWithTimeout,
        footer: footerWithTimeout,
        cartSuggestions: cartSuggestionsWithTimeout
    };
}

/**
 * Component for safe CSS injection
 * CSS is generated server-side from validated OKLCH/HEX values, not user HTML input
 */
function ThemeStyleTag({css}: {css: string}) {
    // CSS contains only CSS custom properties generated from validated color values
    // Safe for inline injection as it's not user-generated HTML content
    return <style dangerouslySetInnerHTML={{__html: css}} />;
}

/**
 * Loads the Google Fonts stylesheet asynchronously to avoid render-blocking.
 * Renders null on the server — the <link rel="preload"> in <head> is the server hint.
 * On the client, useEffect appends the stylesheet after hydration so it never blocks
 * the initial paint. The &display=swap URL param in the href ensures Google Fonts
 * includes font-display:swap in all generated @font-face rules.
 */
function NonBlockingFontLoader({url}: {url?: string}) {
    useEffect(() => {
        if (!url) return;
        if (document.querySelector(`link[href="${url}"][rel="stylesheet"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
    }, [url]);
    return null;
}

export function Layout({children}: {children?: React.ReactNode}) {
    const nonce = useNonce();
    const data = useRouteLoaderData<RootLoader>("root");
    const generatedTheme = data?.generatedTheme;

    // Compute SEO defaults in Layout so PWA meta tags are rendered as static JSX in <head>.
    // React Router 7 replaces ALL parent meta() tags when a child route exports meta() —
    // placing PWA tags here as static JSX ensures they survive child route meta overrides.
    const layoutSeoDefaults = getSeoDefaults(
        data?.siteContent?.siteSettings,
        data?.siteContent?.themeConfig
    );

    return (
        <html lang={STORE_LANGUAGE_CODE.toLowerCase()}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                {/* PWA meta tags — static JSX, not in meta() so child routes cannot replace them */}
                <meta name="theme-color" content={layoutSeoDefaults.themeColor} />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content={layoutSeoDefaults.brandName} />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="format-detection" content="telephone=no" />
                {/* OG + Twitter tags — static JSX so they survive child route meta() overrides (S-C3).
                    og:type defaults to "website"; product/article routes emit their own type additionally. */}
                <meta property="og:site_name" content={layoutSeoDefaults.ogSiteName} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                {/* PWA install capture - MUST be first script, loaded synchronously (no async/defer)
                    to catch beforeinstallprompt event before React hydration on mobile browsers */}
                <script src="/pwa-install-capture.js" nonce={nonce} suppressHydrationWarning />
                {/* Google Fonts: preload hints the browser to fetch CSS early, NonBlockingFontLoader appends
                    the actual <link rel="stylesheet"> via useEffect on the client — never render-blocking.
                    The &display=swap URL param makes Google Fonts include font-display:swap in @font-face rules. */}
                {generatedTheme?.googleFontsUrl && <link rel="preload" as="style" href={generatedTheme.googleFontsUrl} />}
                <NonBlockingFontLoader url={generatedTheme?.googleFontsUrl} />
                <Meta />
                <Links />
                {/* Dynamic CSS variables — injected AFTER <Links /> so the runtime theme
                    overrides the static brand-primary blue defaults in tailwind.css */}
                {generatedTheme?.cssVariables && <ThemeStyleTag css={generatedTheme.cssVariables} />}
            </head>
            <body>
                {children}
                <Toaster position="bottom-center" richColors />
                <ScrollRestoration nonce={nonce} />
                <Scripts nonce={nonce} />
            </body>
        </html>
    );
}

export default function App() {
    const data = useRouteLoaderData<RootLoader>("root");

    // Persist theme to localStorage and update SW cache for offline page
    // This ensures the offline page displays brand-consistent styling
    // even when the network is unavailable and Shopify API can't be reached
    useEffect(() => {
        if (data?.generatedTheme) {
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console -- intentional debug logging for theme saving
                console.log("[ThemeSave] Saving theme to localStorage:", {
                    hasCssVariables: !!data.generatedTheme.cssVariables,
                    hasFonts: !!data.generatedTheme.fonts,
                    hasGoogleFontsUrl: !!data.generatedTheme.googleFontsUrl,
                    cssPreview: data.generatedTheme.cssVariables?.substring(0, 150)
                });
            }
            saveThemeToStorage(data.generatedTheme);

            // Update SW cache with themed /offline page (re-fetches with theme CSS baked in)
            void updateOfflinePageCache();
        }
    }, [data?.generatedTheme]);

    // Show toast notifications for discount code application results.
    // The discount route appends ?discount_applied=CODE or ?discount_error=invalid.
    // NOTE: sonner's Toaster may not hydrate in time for the initial mount toast —
    // if toasts don't appear, investigate sonner SSR hydration with Hydrogen.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const applied = params.get("discount_applied");
        const error = params.get("discount_error");
        if (!applied && !error) return;

        // Defer to allow sonner's Toaster to mount after hydration
        const tid = setTimeout(() => {
            if (applied) {
                toast.success(`Discount code "${applied}" applied!`);
            } else if (error) {
                toast.error("That discount code is invalid or has expired.");
            }
        }, 300);

        params.delete("discount_applied");
        params.delete("discount_error");
        const clean = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
        window.history.replaceState({}, "", clean);

        return () => clearTimeout(tid);
    }, []);

    // Force a clean reload when the browser restores this page from bfcache.
    // Hydrogen's Analytics.Provider calls Object.defineProperty(window, 'shopify', { configurable: false })
    // on mount. bfcache preserves that locked property in the JS heap, so when React re-runs effects
    // on restoration it tries to redefine an already-frozen property — throwing "Cannot redefine
    // property: shopify" and crashing into the ErrorBoundary as a 500. Reloading resets the heap.
    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) window.location.reload();
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    // Memoized before the early return guard to satisfy the Rules of Hooks.
    const menuCollections = useMemo(() => data?.menuCollections ?? [], [data?.menuCollections]);
    const mobileMenuCollections = useMemo(() => menuCollections.map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        description: "",
        image: collection.image
            ? {
                  url: collection.image.url,
                  altText: collection.image.altText ?? null
              }
            : null,
        productCount: collection.productsCount ?? 0
    })), [menuCollections]);
    const searchCollections = useMemo(() => menuCollections.map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        image: collection.image
            ? {
                  url: collection.image.url,
                  altText: collection.image.altText ?? null
              }
            : null
    })), [menuCollections]);

    if (!data) {
        return <Outlet />;
    }

    // Extract announcement texts from siteContent
    // announcementBanner is now a string[] (list of single line texts from Shopify)
    const announcementTexts = data.siteContent?.siteSettings?.announcementBanner || [];

    return (
        <AgentSurfaceProvider value={data.agentSurface ?? {isAgent: false, source: "none"}}>
        <SiteContentProvider siteContent={data.siteContent}>
            <WishlistProvider>
                {/* Shopify analytics (monorail-edge.shopifysvc.com) may abort in dev or
                    when ad blockers are active. This is expected behavior and does not
                    affect storefront functionality. See entry.server.tsx connectSrc. */}
                <Analytics.Provider cart={data.cart} shop={data.shop} consent={data.consent}>
                    <ServiceWorkerUpdateBanner />
                    <NetworkStatusIndicator />
                    <GtmScript gtmContainerId={data.gtmContainerId} />
                    <PageLayout {...data} announcementTexts={announcementTexts}>
                        <Outlet />
                    </PageLayout>
                    <GoogleTagManager />
                    <ServiceWorkerRegistration />
                    <FloatingButtonStack />
                </Analytics.Provider>
            </WishlistProvider>
        </SiteContentProvider>
        </AgentSurfaceProvider>
    );
}

// ================================================================================
// Floating Button Stack
// ================================================================================

/**
 * FloatingButtonStack — unified fixed-position container for all floating action buttons.
 *
 * Owns the `fixed bottom-4 right-4 z-[102]` stacking context so that the
 * PWA install button and chat widget can share a single offset computation
 * instead of each maintaining independently hardcoded `bottom-*` values.
 *
 * Footer clearance:
 *   When `#footer-bottom-bar` scrolls into the viewport, `useFooterClearance`
 *   returns its visible pixel height. That value is applied as `translateY(-Xpx)`
 *   on this container, lifting the entire button stack by exactly the amount needed
 *   to clear the footer's copyright/attribution block.
 *
 * CSS transition:
 *   `transition-transform duration-300 ease-in-out` animates the lift smoothly.
 *   `motion-reduce:transition-none` skips the animation when the user has requested
 *   reduced motion (WCAG 2.3.3 / prefers-reduced-motion).
 *
 * Stack order (bottom → top, flex-col in a bottom-anchored container):
 *   ① PWA install button  — last DOM child → lowest in visual stack (lg+ only)
 *   ② Messenger           — bottom of FloatingChatWidget's own flex-col
 *   ③ WhatsApp            — top of FloatingChatWidget's own flex-col
 *
 * Mobile behaviour:
 *   OpenInAppButton renders `hidden lg:flex` so only the two chat buttons are
 *   visible on viewports narrower than 1024 px.
 *
 * @see useFooterClearance   — IO-based dynamic offset hook
 * @see FloatingChatWidget   — Messenger + WhatsApp buttons (no own positioning)
 * @see OpenInAppButton      — PWA install button (no own positioning when variant="desktop-fixed")
 */
function FloatingButtonStack() {
    const offset = useFooterClearance();

    return (
        <div
            className={[
                "fixed right-4 z-[var(--z-navbar)]",
                "flex flex-col items-end gap-3",
                // Smooth lift when footer bar enters viewport.
                // Only the transform axis is transitioned — no opacity/scale side-effects.
                // motion-reduce: instant reposition is acceptable per WCAG 2.3.3.
                "transition-transform duration-300 ease-in-out motion-reduce:transition-none"
            ].join(" ")}
            style={{
                // Base bottom: clears the product sticky action bar (0 on non-product pages)
                // plus a 1rem gutter from the safe-area / viewport edge.
                bottom: "calc(var(--product-sticky-bar-height, 0px) + max(env(safe-area-inset-bottom), 1rem))",
                transform: offset > 0 ? `translateY(-${offset}px)` : undefined
            }}
        >
            {/* Chat widget first → sits above the PWA button in the visual stack */}
            <FloatingChatWidget />
            {/* PWA install button last → lowest in the stack, desktop only (max-lg:hidden) */}
            <OpenInAppButton variant="desktop-fixed" />
        </div>
    );
}

/**
 * Component to inject cached theme from localStorage
 * Used by ErrorBoundary to maintain brand styling when offline/error state
 *
 * This runs client-side only and injects:
 * - CSS variables (colors, spacing)
 * - Google Fonts link
 */
function CachedThemeInjector() {
    useEffect(() => {
        const theme = getThemeFromStorage();
        if (!theme) return;

        // Inject CSS variables
        if (theme.cssVariables) {
            const styleId = "error-boundary-theme";
            let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
            if (!styleEl) {
                styleEl = document.createElement("style");
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = theme.cssVariables;
        }

        // Inject Google Fonts
        if (theme.googleFontsUrl) {
            const fontId = "error-boundary-fonts";
            if (!document.getElementById(fontId)) {
                const fontLink = document.createElement("link");
                fontLink.id = fontId;
                fontLink.rel = "stylesheet";
                fontLink.href = theme.googleFontsUrl;
                document.head.appendChild(fontLink);
            }
        }
    }, []);

    return null;
}

/**
 * Tracks error boundary events via analytics using useEffect (not during render).
 * Returns null — purely a side-effect component.
 */
function ErrorTracker({
    statusCode,
    errorType,
    route
}: {
    statusCode: number;
    errorType: "route_error" | "js_error";
    route: string;
}) {
    useEffect(() => {
        trackErrorBoundary(statusCode, errorType, route);
    }, [statusCode, errorType, route]);
    return null;
}

export function ErrorBoundary() {
    const error = useRouteError();
    let errorMessage: string | undefined;
    let errorStatus = 500;

    if (isRouteErrorResponse(error)) {
        errorMessage = error?.data?.message ?? error.data;
        errorStatus = error.status;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    const errorType = isRouteErrorResponse(error) ? "route_error" : "js_error";

    const title =
        errorStatus === 404 ? "Page Not Found" : errorStatus >= 500 ? "Something Went Wrong" : "An Error Occurred";

    return (
        <>
            <CachedThemeInjector />
            <ErrorTracker statusCode={errorStatus} errorType={errorType} route="root" />
            <OfflineAwareErrorPage statusCode={errorStatus} title={title} message={errorMessage} />
        </>
    );
}

// GraphQL query to check if there are any blog articles
const HAS_BLOG_QUERY = `#graphql
  query HasBlog(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    articles(first: 1) {
      nodes {
        id
      }
    }
  }
` as const;
