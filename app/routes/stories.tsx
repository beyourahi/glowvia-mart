/**
 * @fileoverview Stories — editorial product showcase
 *
 * @description
 * A clean, editorial story experience. Newest 8 products displayed as
 * full-screen split-panel "stories" — left side is product image,
 * right side is product info. Auto-advances every 6 seconds.
 *
 * @route GET /stories
 *
 * @features
 * - Split-screen: image left, info right (stacked on mobile)
 * - Auto-advance every 6 seconds, pauses on hover/focus
 * - Left/right keyboard navigation (ArrowLeft, ArrowRight)
 * - ChevronLeft/ChevronRight navigation buttons
 * - "N / 8" progress indicator
 * - Horizontal thumbnail strip — active has thin black border
 * - "Shop Now" CTA in solid black, rounded-none
 *
 * @design
 * Monochromatic white/light. Clean editorial split-screen.
 * No dark overlays, no color accents. Light, airy, precise.
 * Completely different from storefront_001's cinematic dark stories.
 *
 * @data
 * Inline STORIES_PRODUCTS_QUERY — newest 8 products, sortKey: CREATED_AT.
 */

import {useState, useEffect, useCallback, useRef} from "react";
import {useLoaderData, Link} from "react-router";
import type {Route} from "./+types/stories";
import {getSeoMeta} from "@shopify/hydrogen";
import {useAgentSurface} from "~/lib/agent-surface-context";
import {AgentFallbackBanner} from "~/components/AgentFallbackBanner";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {formatShopifyMoney} from "~/lib/currency-formatter";

// =============================================================================
// META
// =============================================================================

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    return (
        getSeoMeta({
            title: "Stories",
            titleTemplate: `%s | ${brandName}`,
            description: "Stories from our latest collection.",
            url: buildCanonicalUrl("/stories", siteUrl)
        }) ?? []
    );
};

// =============================================================================
// LOADER
// =============================================================================

export async function loader({context}: Route.LoaderArgs) {
    const {products} = await context.dataAdapter.query(STORIES_PRODUCTS_QUERY, {
        variables: {},
        cache: context.dataAdapter.CacheShort()
    });

    return {products: products.nodes as StoryProduct[]};
}

// =============================================================================
// TYPES
// =============================================================================

type StoryProduct = {
    id: string;
    handle: string;
    title: string;
    availableForSale: boolean;
    featuredImage: {url: string; altText: string | null; width: number | null; height: number | null} | null;
    priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
    vendor: string | null;
};

// =============================================================================
// COMPONENT
// =============================================================================

const AUTO_ADVANCE_MS = 6000;

export default function Stories() {
    const {products} = useLoaderData<typeof loader>();
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const total = products.length;

    // ── Auto-advance ──────────────────────────────────────────────────────────
    const startInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setCurrent(c => (c + 1) % total);
        }, AUTO_ADVANCE_MS);
    }, [total]);

    useEffect(() => {
        if (!isPaused && total > 1) {
            startInterval();
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPaused, total, startInterval]);

    // ── Navigation ────────────────────────────────────────────────────────────
    const goTo = useCallback(
        (index: number) => {
            setCurrent((index + total) % total);
            // Restart the auto-advance timer on manual nav
            startInterval();
        },
        [total, startInterval]
    );

    const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);
    const goNext = useCallback(() => goTo(current + 1), [current, goTo]);

    // ── Keyboard ──────────────────────────────────────────────────────────────
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [goPrev, goNext]);

    const agentSurface = useAgentSurface();
    // Agent path: cinematic story viewer requires interactive browser session.
    if (agentSurface.isAgent) return <AgentFallbackBanner />;

    if (products.length === 0) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-sm text-muted-foreground">No stories available.</p>
            </div>
        );
    }

    const product = products[current];

    return (
        <div
            className="relative flex flex-col"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
        >
            {/* ── Main story panel ── */}
            <div
                className="flex flex-col md:flex-row"
                style={{minHeight: "calc(100dvh - var(--total-header-height))"}}
            >
                {/* Left — product image */}
                <div className="relative w-full md:w-1/2 flex-shrink-0 overflow-hidden bg-muted">
                    {product.featuredImage ? (
                        <img
                            key={product.id}
                            src={product.featuredImage.url}
                            alt={product.featuredImage.altText ?? product.title}
                            className="w-full h-full object-cover absolute inset-0 transition-opacity duration-500 opacity-0 animate-stories-fade"
                            style={{animationFillMode: "forwards"}}
                            loading="eager"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted" />
                    )}
                    {/* Mobile aspect ratio holder */}
                    <div className="aspect-[4/5] md:hidden" />
                </div>

                {/* Right — product info */}
                <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-10 md:px-14 lg:px-20 md:py-0 bg-background">
                    <div
                        key={product.id}
                        className="max-w-md opacity-0 animate-stories-info"
                        style={{animationFillMode: "forwards"}}
                    >
                        {/* Progress + vendor */}
                        <div className="flex items-center justify-between mb-6">
                            {product.vendor ? (
                                <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                                    {product.vendor}
                                </span>
                            ) : (
                                <span />
                            )}
                            <span className="text-sm text-muted-foreground tabular-nums">
                                {current + 1} / {total}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3 leading-tight">
                            {product.title}
                        </h1>

                        {/* Price */}
                        <p className="text-lg text-foreground mb-8">
                            {formatShopifyMoney(product.priceRange.minVariantPrice)}
                        </p>

                        {/* Shop Now CTA */}
                        <Link
                            to={`/products/${product.handle}`}
                            viewTransition
                            prefetch="intent"
                            className="inline-block bg-foreground text-background text-xs uppercase tracking-widest font-medium px-8 py-3 rounded-none hover:bg-foreground/80 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Shop Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Navigation arrows ── */}
            {total > 1 && (
                <>
                    <button
                        onClick={goPrev}
                        aria-label="Previous story"
                        className="absolute left-3 top-[40%] -translate-y-1/2 md:left-[calc(50%-80px)] z-20 w-10 h-10 flex items-center justify-center bg-background/80 border border-border/60 text-foreground hover:bg-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none"
                    >
                        <ChevronLeft size={18} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={goNext}
                        aria-label="Next story"
                        className="absolute right-3 top-[40%] -translate-y-1/2 md:right-4 z-20 w-10 h-10 flex items-center justify-center bg-background/80 border border-border/60 text-foreground hover:bg-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none"
                    >
                        <ChevronRight size={18} strokeWidth={1.5} />
                    </button>
                </>
            )}

            {/* ── Thumbnail strip ── */}
            {total > 1 && (
                <div className="flex gap-2.5 justify-center items-center px-4 py-5 bg-background border-t border-border/30 overflow-x-auto">
                    {products.map((p, i) => (
                        <button
                            key={p.id}
                            onClick={() => goTo(i)}
                            aria-label={`Go to ${p.title}`}
                            aria-current={i === current ? "true" : undefined}
                            className={[
                                "flex-shrink-0 w-14 h-14 overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none",
                                i === current
                                    ? "border-2 border-foreground opacity-100"
                                    : "border border-border/30 opacity-50 hover:opacity-80"
                            ].join(" ")}
                        >
                            {p.featuredImage ? (
                                <img
                                    src={p.featuredImage.url}
                                    alt={p.featuredImage.altText ?? p.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// GRAPHQL
// =============================================================================

const STORIES_PRODUCTS_QUERY = `#graphql
  query StoriesProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        availableForSale
        featuredImage {
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        vendor
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
