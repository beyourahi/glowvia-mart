/**
 * @fileoverview Gallery Image Card Component
 *
 * @description
 * Display-only card component for showcasing gallery images from Shopify products.
 * Features responsive aspect ratio, optimized image loading, and hover overlay that
 * reveals product information. Purely visual presentation for gallery/lookbook pages.
 *
 * @related
 * - ~/components/gallery/GalleryGrid - Parent grid component
 * - ~/lib/gallery - Gallery data types and utilities
 * - ~/routes/gallery - Gallery route providing image data
 */

import {useEffect, useRef, useState} from "react";
import {Link} from "react-router";
import type {GalleryImageData} from "~/lib/gallery";
import {cn} from "~/lib/utils";
import {parseProductTitle} from "~/lib/product";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {buildShopifyImageUrl, createResponsiveSizes, getGridImageConfig} from "~/lib/performance";

// =============================================================================
// TYPES
// =============================================================================

interface GalleryImageCardProps {
    image: GalleryImageData;
    index?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Candidate widths requested from Shopify's CDN. The browser picks the closest
// match given the computed `sizes` attribute.
const SRC_SET_WIDTHS = [400, 600, 800, 1200] as const;

// Widest breakpoint column count in GalleryGrid — determines which cards are
// "above the fold" for priority / eager-loading heuristics.
const MAX_COLUMNS = 5;

const RESPONSIVE_SIZES = createResponsiveSizes(2, 3, 5);

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * GalleryImageCard - Individual image card with hover overlay for product info.
 *
 * @param image - Gallery image data (url, dimensions, product/collection info)
 * @param index - Card position in the grid (used for loading priority)
 */
export function GalleryImageCard({image, index = 0}: GalleryImageCardProps) {
    const {canHover} = usePointerCapabilities();
    const {primary, secondary} = parseProductTitle(image.productTitle);

    const config = getGridImageConfig(index, MAX_COLUMNS);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const [loaded, setLoaded] = useState(false);
    // Priority cards (above-the-fold) bypass the observer — show immediately.
    const [visible, setVisible] = useState(config.priority);

    // Browser-cached images fire onLoad before React attaches the handler.
    // Re-check img.complete after mount to catch those.
    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
            setLoaded(true);
        }
    }, []);

    // Below-the-fold cards: fade in once they scroll into view. This runs in
    // addition to native `loading="lazy"` — it controls the shimmer-to-image
    // transition, not the network request.
    useEffect(() => {
        if (config.priority || visible) return;
        if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

        const node = imgRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {rootMargin: "50px", threshold: 0.01}
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [config.priority, visible]);

    return (
        <Link
            to={`/products/${image.productHandle}`}
            prefetch="intent"
            aria-label={image.productTitle}
            className={cn(
                "group sleek relative block w-full break-inside-avoid",
                "rounded-sm overflow-hidden mb-1 sm:mb-1.5",
                "bg-muted/20",
                "hover:shadow-xl hover:ring-2 hover:ring-primary/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            )}
        >
            <div className="relative w-full" style={{aspectRatio: image.aspectRatio || 1}}>
                {/* Main Image — AVIF + responsive srcSet for bandwidth-tuned delivery */}
                <img
                    ref={imgRef}
                    src={buildShopifyImageUrl(image.url, {format: "avif", width: 800, quality: 85})}
                    srcSet={SRC_SET_WIDTHS.map(
                        w => `${buildShopifyImageUrl(image.url, {format: "avif", width: w, quality: 85})} ${w}w`
                    ).join(", ")}
                    sizes={RESPONSIVE_SIZES}
                    alt={image.altText || image.productTitle}
                    width={image.width}
                    height={image.height}
                    loading={config.loading}
                    {...(config.fetchPriority ? {fetchpriority: config.fetchPriority} : {})}
                    onLoad={() => setLoaded(true)}
                    className={cn(
                        "sleek absolute inset-0 h-full w-full object-cover",
                        canHover && "group-hover:scale-105",
                        visible ? "opacity-100" : "opacity-0"
                    )}
                />

                {/* Shimmer placeholder until the image has finished loading */}
                {!loaded && (
                    <div className="animate-shimmer from-muted/0 via-muted/60 to-muted/0 absolute inset-0 bg-gradient-to-r" />
                )}

                {/* Hover Overlay — always visible on touch; slides up on hover for pointer devices */}
                <div
                    className={cn(
                        "absolute inset-x-0 bottom-0",
                        canHover ? "translate-y-full group-hover:translate-y-0" : "translate-y-0",
                        "transition-transform duration-300 ease-out",
                        "bg-gradient-to-t from-dark/80 via-dark/50 to-transparent",
                        "p-2 pt-8 sm:p-3 sm:pt-10"
                    )}
                >
                    <p className="text-light text-sm sm:text-sm font-medium leading-snug line-clamp-2">
                        <span>{primary}</span>
                        {secondary && <span>, {secondary}</span>}
                    </p>
                    {image.collectionTitle && (
                        <p className="text-light/70 text-sm sm:text-sm mt-0.5 truncate">{image.collectionTitle}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}
