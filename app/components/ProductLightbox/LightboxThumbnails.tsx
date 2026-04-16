/**
 * @fileoverview Thumbnail strip for product lightbox navigation
 *
 * @description
 * Horizontal scrollable thumbnail strip shown at the bottom of the lightbox.
 * Visible on all devices with responsive sizing. Allows quick navigation
 * between media items by clicking thumbnails.
 *
 * @layout
 * - Mobile (<md): Smaller thumbnails (48x60px), centered layout
 * - Desktop (≥md): Larger thumbnails (56x70px), centered layout
 * - Active thumbnail highlighted with ring indicator
 * - Horizontal scroll when thumbnails exceed viewport width
 *
 * @video-thumbnails
 * Videos display their previewImage with a play icon overlay
 * to distinguish them from static images.
 *
 * @accessibility
 * - Each thumbnail is a button with aria-label
 * - Current thumbnail has aria-selected="true"
 * - Keyboard: Tab to focus, Enter to select
 * - Uses role="tablist" for semantic grouping
 *
 * @scroll-behavior
 * Active thumbnail automatically scrolls into view when
 * navigating via keyboard or arrows.
 *
 * @related
 * - ProductLightbox.tsx - Parent that manages current index
 * - LightboxMedia.tsx - Displays the full-size media
 */

import {useRef, useEffect} from "react";
import {PlayIcon} from "lucide-react";
import {cn} from "~/lib/utils";
import type {ProductMediaItem} from "types";

// =============================================================================
// COMPONENT INTERFACE
// =============================================================================

interface LightboxThumbnailsProps {
    /** Array of all media items */
    media: ProductMediaItem[];
    /** Currently active media index */
    currentIndex: number;
    /** Callback when a thumbnail is clicked */
    onSelect: (index: number) => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract thumbnail URL from media item.
 * All four Shopify media types are handled:
 * - MediaImage: the image URL directly
 * - Video / ExternalVideo / Model3d: the previewImage supplied by Shopify
 */
function getThumbnailUrl(item: ProductMediaItem): string | null {
    if (item.__typename === "MediaImage" && item.image) {
        return item.image.url;
    }
    if (
        (item.__typename === "Video" ||
            item.__typename === "ExternalVideo" ||
            item.__typename === "Model3d") &&
        item.previewImage
    ) {
        return item.previewImage.url;
    }
    return null;
}

/**
 * Returns a short human-readable label for the media type, used in aria-labels.
 */
function getMediaTypeLabel(item: ProductMediaItem): string {
    switch (item.__typename) {
        case "Video":
        case "ExternalVideo":
            return "video";
        case "Model3d":
            return "3D model";
        default:
            return "image";
    }
}

// =============================================================================
// LIGHTBOX THUMBNAILS COMPONENT
// =============================================================================

/**
 * LightboxThumbnails - Horizontal thumbnail strip for media navigation
 *
 * @description
 * Renders clickable thumbnails for all product media.
 * Automatically scrolls to keep the active thumbnail visible.
 *
 * @example
 * ```tsx
 * <LightboxThumbnails
 *   media={product.media.nodes}
 *   currentIndex={currentIndex}
 *   onSelect={(index) => setCurrentIndex(index)}
 * />
 * ```
 */
export function LightboxThumbnails({media, currentIndex, onSelect}: LightboxThumbnailsProps) {
    // Refs for scroll management
    const thumbnailRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    // ==========================================================================
    // SCROLL ACTIVE THUMBNAIL INTO VIEW
    // ==========================================================================

    useEffect(() => {
        const activeThumb = thumbnailRefs.current.get(currentIndex);
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        }
    }, [currentIndex]);

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <div className="px-4 md:px-8" role="tablist" aria-label="Product media thumbnails">
            {/* Horizontal scrollable container */}
            <div
                className={cn(
                    "flex gap-2 md:gap-3 overflow-x-auto pb-2",
                    // Hide scrollbar but keep scroll functionality
                    "scrollbar-hide",
                    // Center thumbnails on all screen sizes
                    "justify-center"
                )}
            >
                {media.map((item, index) => {
                    const thumbnailUrl = getThumbnailUrl(item);
                    const isActive = index === currentIndex;
                    const typeLabel = getMediaTypeLabel(item);
                    const isVideo = item.__typename === "Video" || item.__typename === "ExternalVideo";
                    const is3d = item.__typename === "Model3d";

                    return (
                        <button
                            key={item.id}
                            ref={el => {
                                if (el) {
                                    thumbnailRefs.current.set(index, el);
                                } else {
                                    thumbnailRefs.current.delete(index);
                                }
                            }}
                            onClick={() => onSelect(index)}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={`View ${typeLabel} ${index + 1} of ${media.length}`}
                            className={cn(
                                // Base sizing - responsive
                                // Portrait 4:5 ratio thumbnails
                                "relative shrink-0 w-12 h-15 select-none md:w-14 md:h-[70px]",
                                "rounded-md overflow-hidden",
                                // Transition for smooth state changes
                                "sleek",
                                // Focus ring for keyboard navigation
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light",
                                // Active state - highlighted ring
                                isActive
                                    ? "ring-2 ring-light ring-offset-2 ring-offset-dark/80"
                                    : "opacity-60 hover:opacity-100"
                            )}
                        >
                            {/* Thumbnail image */}
                            {thumbnailUrl ? (
                                <img
                                    // Use Shopify CDN params for optimized small image
                                    src={`${thumbnailUrl}&width=128&height=160&crop=center`}
                                    alt=""
                                    className="size-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                // Fallback for missing thumbnail
                                <div className="size-full bg-muted flex items-center justify-center">
                                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                                </div>
                            )}

                            {/* Video indicator overlay (Video + ExternalVideo) */}
                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-dark/40">
                                    <PlayIcon className="size-4 md:size-5 text-light" />
                                </div>
                            )}

                            {/* 3D model indicator overlay */}
                            {is3d && (
                                <div className="absolute inset-0 flex items-center justify-center bg-dark/40">
                                    <svg width="16" height="16" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="white" strokeWidth="1" className="md:w-5 md:h-5">
                                        <path d="M6 0.5L11 3.25V8.75L6 11.5L1 8.75V3.25L6 0.5Z" />
                                        <path d="M6 0.5V6M6 6L11 3.25M6 6L1 3.25M6 6V11.5" strokeWidth="0.75" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
