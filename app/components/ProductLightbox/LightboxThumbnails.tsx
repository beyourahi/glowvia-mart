/**
 * @fileoverview Horizontal thumbnail strip for product lightbox navigation.
 *
 * Active thumbnail auto-scrolls into view on index change. Videos and 3D models
 * show a play/cube icon overlay on their preview image to distinguish from stills.
 * Uses `role="tablist"` + `aria-selected` for accessible keyboard navigation.
 *
 * @related
 * - ProductLightbox.tsx - Parent that manages current index
 */

import {useRef, useEffect} from "react";
import {Image} from "@shopify/hydrogen";
import {PlayIcon} from "lucide-react";
import {cn} from "~/lib/utils";
import type {ProductMediaItem} from "types";

interface LightboxThumbnailsProps {
    /** Array of all media items */
    media: ProductMediaItem[];
    /** Currently active media index */
    currentIndex: number;
    /** Callback when a thumbnail is clicked */
    onSelect: (index: number) => void;
}

/** Extracts thumbnail URL from any of the four Shopify media types. */
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

/** Returns a short human-readable label for the media type, used in aria-labels. */
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

export function LightboxThumbnails({media, currentIndex, onSelect}: LightboxThumbnailsProps) {
    const thumbnailRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    // Scroll active thumbnail into view when index changes (keyboard or arrow nav).
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

    return (
        <div className="px-4 md:px-8" role="tablist" aria-label="Product media thumbnails">
            {/* Horizontal scrollable container */}
            <div
                className={cn(
                    "flex gap-2 md:gap-3 overflow-x-auto py-2",
                    "scrollbar-hide",
                    "justify-center",
                    // Suppress focus ring on the scroll container; individual buttons have their own.
                    "outline-none"
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
                                "relative shrink-0 w-12 h-15 select-none md:w-14 md:h-[70px]",
                                "rounded-md overflow-hidden",
                                "sleek",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light",
                                // Active state - highlighted ring
                                isActive
                                    ? "ring-2 ring-light ring-offset-2 ring-offset-dark/80"
                                    : "opacity-60 hover:opacity-100"
                            )}
                        >
                            {thumbnailUrl ? (
                                <Image
                                    src={`${thumbnailUrl}&width=128&height=160&crop=center`}
                                    alt=""
                                    className="size-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="size-full bg-muted flex items-center justify-center">
                                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                                </div>
                            )}

                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-dark/40">
                                    <PlayIcon className="size-4 md:size-5 text-light" />
                                </div>
                            )}

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
