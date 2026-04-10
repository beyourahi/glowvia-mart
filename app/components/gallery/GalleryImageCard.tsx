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

import type {GalleryImageData} from "~/lib/gallery";
import {cn} from "~/lib/utils";
import {parseProductTitle} from "~/lib/product";

// =============================================================================
// TYPES
// =============================================================================

interface GalleryImageCardProps {
    image: GalleryImageData;
    priority?: boolean;
    index?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * GalleryImageCard - Individual image card with hover overlay for product info.
 *
 * @param image - Gallery image data (url, dimensions, product/collection info)
 * @param priority - Whether to eager-load image (default: false)
 * @param index - Card position for staggered animation timing (default: 0)
 *
 * @example
 * ```tsx
 * <GalleryImageCard
 *   image={galleryImage}
 *   priority={index < 8}
 *   index={index}
 * />
 * ```
 */
export function GalleryImageCard({image, priority = false, index = 0}: GalleryImageCardProps) {
    // =============================================================================
    // DERIVED STATE
    // =============================================================================

    const {primary, secondary} = parseProductTitle(image.productTitle);

    /**
     * Stagger delay calculation for cascade animation.
     * Capped at 12 items (480ms max) to avoid excessive delays deep in grid.
     */
    const staggerDelay = Math.min(index, 11) * 40;

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <div
            className={cn("group block w-full animate-product-fade-in motion-surface", "rounded-sm overflow-hidden")}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="aspect-[4/5] relative overflow-hidden bg-muted/20">
                {/* Main Image */}
                <img
                    src={image.url}
                    alt={image.altText || image.productTitle}
                    loading={priority ? "eager" : "lazy"}
                    width={image.width}
                    height={image.height}
                    className="absolute inset-0 h-full w-full object-cover motion-image group-hover:scale-105"
                />

                {/* Hover Overlay - slides up from bottom */}
                <div
                    className={cn(
                        "absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0",
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
        </div>
    );
}
