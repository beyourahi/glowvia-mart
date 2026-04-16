/**
 * @fileoverview Product detail page image gallery with responsive layouts, inline video, and lightbox
 *
 * @description
 * Dual-mode gallery (mobile carousel / desktop vertical stack) that renders all Shopify
 * media types in the correct visual treatment:
 *   - MediaImage  → static image with skeleton + hover scale
 *   - Video       → inline HTML5 player (muted, hover-autoplay, native controls)
 *   - ExternalVideo → poster + play overlay → opens lightbox with sandboxed iframe
 *   - Model3d     → previewImage + 3D badge → opens lightbox (3D viewer out of scope)
 *
 * @key-architecture
 * `galleryMedia` is the single source of truth for BOTH gallery rendering AND lightbox
 * indexing. Using the same array for both eliminates the index misalignment that would
 * occur if the gallery renders from `images` (a subset) while the lightbox reads from
 * `media` (the full set including videos).
 *
 * @features
 * - Mobile: Horizontal swipeable carousel with drag-free scrolling
 * - Desktop: Vertical stack of all media items
 * - Individual loading skeletons for image items
 * - Smooth scroll to variant image when variant selection changes
 * - Responsive image sizing with srcset
 * - Eager loading for first image (LCP optimization)
 * - Lazy loading for subsequent media
 * - Muted autoplay on hover for Video items (browser policy permits muted)
 * - Play/expand badge overlays distinguish video items from images
 * - Full-screen lightbox on click (images) or expand button (videos)
 *
 * @video-behaviour
 * - Hover → muted playback starts via HTMLVideoElement.play()
 * - Mouse leave → pause (position held, no reset)
 * - Native controls visible for user-driven interaction
 * - `muted`, `playsinline`, `preload="metadata"` always set
 * - Explicit `controls` attribute for in-gallery playback
 *
 * @lightbox-alignment
 * Gallery index === lightboxMedia index because both use `galleryMedia`.
 * Clicking item at gallery[i] opens lightbox at lightboxMedia[i]. No mapping needed.
 *
 * @related
 * - ~/routes/products.$handle.tsx - Product detail page
 * - ~/components/ProductLightbox - Full-screen media viewer
 * - Carousel components - Embla carousel wrappers
 */

import {useState, useEffect, useRef, useMemo} from "react";
import {Image} from "@shopify/hydrogen";
import type {ProductImageGalleryProps, ProductMediaItem} from "types";
import {cn} from "~/lib/utils";
import {Skeleton} from "~/components/ui/skeleton";
import {Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext} from "~/components/ui/carousel";
import {ProductLightbox} from "~/components/ProductLightbox";
import {Maximize2} from "lucide-react";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Type guard — checks if a raw media node is a fully handled ProductMediaItem.
 * Accepts all four Shopify media types; unrecognised types are silently dropped.
 */
function isKnownMediaItem(item: unknown): item is ProductMediaItem {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    return (
        obj.__typename === "MediaImage" ||
        obj.__typename === "Video" ||
        obj.__typename === "ExternalVideo" ||
        obj.__typename === "Model3d"
    );
}

/**
 * Normalise a raw Shopify media node into a strongly-typed ProductMediaItem.
 * All four types are handled; the fallback is the Model3d shape (preview-only).
 */
function normaliseMediaItem(raw: ProductMediaItem): ProductMediaItem {
    if (raw.__typename === "MediaImage") {
        return {
            __typename: "MediaImage",
            id: raw.id,
            alt: raw.alt ?? null,
            image: raw.image
                ? {
                      id: raw.image.id,
                      url: raw.image.url,
                      altText: raw.image.altText ?? null,
                      width: raw.image.width ?? 0,
                      height: raw.image.height ?? 0
                  }
                : null
        };
    }

    if (raw.__typename === "Video") {
        return {
            __typename: "Video",
            id: raw.id,
            alt: raw.alt ?? null,
            sources: raw.sources ?? [],
            previewImage: raw.previewImage ?? null
        };
    }

    if (raw.__typename === "ExternalVideo") {
        return {
            __typename: "ExternalVideo",
            id: raw.id,
            alt: raw.alt ?? null,
            embedUrl: raw.embedUrl,
            previewImage: raw.previewImage ?? null
        };
    }

    // Model3d
    return {
        __typename: "Model3d",
        id: raw.id,
        alt: raw.alt ?? null,
        previewImage: raw.previewImage ?? null
    };
}

// =============================================================================
// PRODUCT IMAGE GALLERY
// =============================================================================

/**
 * ProductImageGallery — Responsive product media gallery with inline video and lightbox.
 *
 * Gallery and lightbox both use the same `galleryMedia` array so indices always align.
 * Falls back to converting the `images` array when no `media` prop is supplied.
 */
export function ProductImageGallery({images, selectedVariantImage, media, isAvailableForSale = true}: ProductImageGalleryProps) {
    // =============================================================================
    // GALLERY MEDIA — single source of truth
    // =============================================================================

    /**
     * Build the unified media list from `media` nodes when available.
     * Unknown `__typename` values are silently filtered out (graceful degradation).
     * Falls back to converting the plain `images` array to MediaImage format.
     */
    const galleryMedia: ProductMediaItem[] = useMemo(() => {
        if (media && media.length > 0) {
            return (media as unknown[]).filter(isKnownMediaItem).map(normaliseMediaItem);
        }

        // Fallback: images array → MediaImage shape
        return images.map(img => ({
            __typename: "MediaImage" as const,
            id: img.id ?? "",
            alt: img.altText ?? null,
            image: {
                id: img.id ?? "",
                url: img.url,
                altText: img.altText ?? null,
                width: img.width ?? 0,
                height: img.height ?? 0
            }
        }));
    }, [media, images]);

    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    // Track loaded state per MediaImage item (keyed by item.id)
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

    // Refs for scroll-to-variant behaviour (keyed by underlying image.id)
    const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // =============================================================================
    // LIGHTBOX STATE
    // =============================================================================

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);

    // =============================================================================
    // IMAGE PRELOADING (MediaImage only)
    // =============================================================================

    // Preload images using native Image API (avoids SSR hydration mismatch with onLoad)
    useEffect(() => {
        const markLoaded = (key: string) => {
            setLoadedImages(prev => {
                if (prev.has(key)) return prev;
                return new Set(prev).add(key);
            });
        };

        const cleanupFns: (() => void)[] = [];

        galleryMedia.forEach(item => {
            if (item.__typename !== "MediaImage" || !item.image?.url) return;
            const key = item.id;
            const img = new window.Image();
            img.onload = () => markLoaded(key);
            img.onerror = () => markLoaded(key);
            img.src = item.image.url;
            if (img.complete) markLoaded(key);
            cleanupFns.push(() => {
                img.onload = null;
                img.onerror = null;
            });
        });

        return () => cleanupFns.forEach(fn => fn());
    }, [galleryMedia]);

    // =============================================================================
    // VARIANT IMAGE SCROLL
    // =============================================================================

    // When the selected variant changes, scroll its image into view (desktop only).
    // Refs are stored by the underlying image.id (not MediaImage node id) so they
    // match selectedVariantImage.id which comes from the variant fragment.
    useEffect(() => {
        if (!selectedVariantImage?.id) return;
        const targetRef = imageRefs.current.get(selectedVariantImage.id);
        if (targetRef) {
            targetRef.scrollIntoView({behavior: "smooth", block: "center"});
        }
    }, [selectedVariantImage?.id]);

    const setImageRef = (imageId: string, el: HTMLDivElement | null) => {
        if (el) imageRefs.current.set(imageId, el);
        else imageRefs.current.delete(imageId);
    };

    // (Hover-autoplay removed — videos use autoPlay + loop instead)

    // =============================================================================
    // RENDER — MediaImage
    // =============================================================================

    // L-09: Clicking an image opens the lightbox rather than navigating.
    // This is intentional luxury e-commerce UX: large hero images → fullscreen detail.
    const renderImageItem = (item: ProductMediaItem & {__typename: "MediaImage"}, index: number, forCarousel = false) => {
        const isLoaded = loadedImages.has(item.id);
        const imageId = item.image?.id ?? item.id;

        return (
            <div
                key={item.id}
                ref={forCarousel ? undefined : el => setImageRef(imageId, el)}
                className="relative w-full overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => openLightbox(index)}
                onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLightbox(index);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${item.alt || item.image?.altText || `image ${index + 1}`} in fullscreen`}
            >
                <div className="relative w-full aspect-4/5">
                    {/* Loading skeleton */}
                    {!isLoaded && <Skeleton className="absolute inset-0 z-10" />}

                    {/* Product image — first eager for LCP, rest lazy */}
                    {item.image && (
                        <Image
                            alt={item.alt || item.image.altText || `Product image ${index + 1}`}
                            data={item.image}
                            loading={index === 0 ? "eager" : "lazy"}
                            sizes="(min-width: 45em) 50vw, 100vw"
                            className={cn(
                                "sleek product-image w-full h-full object-cover",
                                !isLoaded && "opacity-0",
                                isAvailableForSale && "hover:scale-105"
                            )}
                        />
                    )}

                    {/* Subtle hover overlay signals clickability */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-dark/0 motion-overlay pointer-events-none",
                            isAvailableForSale && "group-hover:bg-dark/5"
                        )}
                    />
                </div>
            </div>
        );
    };

    // =============================================================================
    // RENDER — Video (Shopify-hosted)
    // =============================================================================

    const renderVideoItem = (item: ProductMediaItem & {__typename: "Video"}, index: number) => {
        // Prefer MP4 for broadest browser support; fall back to first available source
        const source = item.sources.find(s => s.mimeType === "video/mp4") ?? item.sources[0];

        return (
            <div
                key={item.id}
                className="relative w-full overflow-hidden rounded-lg group"
            >
                {/*
                 * Natural video dimensions — no fixed aspect ratio wrapper.
                 * `w-full h-auto` lets the video element render at whatever aspect ratio
                 * was uploaded in Shopify. Do not add aspect-* classes here.
                 * autoPlay + loop + muted: plays immediately, repeats, no controls shown.
                 */}
                {source ? (
                    <video
                        src={source.url}
                        poster={item.previewImage?.url}
                        className="w-full h-auto block"
                        autoPlay
                        loop
                        muted
                        playsInline
                        aria-label={item.alt || `Product video ${index + 1}`}
                    >
                        <source src={source.url} type={source.mimeType} />
                    </video>
                ) : (
                    /* Fallback when no sources present — use fixed aspect as placeholder */
                    <div className="w-full aspect-4/5 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Video unavailable</span>
                    </div>
                )}

                {/* Video badge — pure SVG, no icon import */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-dark/75 text-light text-xs font-medium pointer-events-none select-none">
                    <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true" fill="currentColor">
                        <path d="M0 0L8 4.5L0 9V0Z" />
                    </svg>
                    VIDEO
                </div>

                {/* Expand button — opens fullscreen lightbox without conflicting with video clicks */}
                <button
                    type="button"
                    className="absolute top-2 right-2 z-10 size-8 flex items-center justify-center rounded-full bg-dark/60 hover:bg-dark/80 text-light opacity-0 group-hover:opacity-100 sleek focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light"
                    onClick={() => openLightbox(index)}
                    aria-label="Open video in fullscreen"
                >
                    <Maximize2 className="size-4" aria-hidden="true" />
                </button>
            </div>
        );
    };

    // =============================================================================
    // RENDER — ExternalVideo (YouTube / Vimeo)
    // =============================================================================

    // ExternalVideo items show their poster image with a play overlay.
    // Clicking opens the lightbox which renders a sandboxed iframe.
    const renderExternalVideoItem = (item: ProductMediaItem & {__typename: "ExternalVideo"}, index: number) => {
        return (
            <div
                key={item.id}
                className="relative w-full overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => openLightbox(index)}
                onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLightbox(index);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Play ${item.alt || "external video"}`}
            >
                <div className="relative w-full aspect-4/5">
                    {item.previewImage ? (
                        <img
                            src={item.previewImage.url}
                            alt={item.alt || `Video thumbnail ${index + 1}`}
                            className={cn("w-full h-full object-cover sleek", isAvailableForSale && "group-hover:scale-105")}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted" />
                    )}

                    {/* Centred play circle — pure SVG */}
                    <div className="absolute inset-0 flex items-center justify-center bg-dark/20 group-hover:bg-dark/35 sleek pointer-events-none">
                        <div className="size-16 rounded-full bg-dark/70 flex items-center justify-center">
                            <svg width="20" height="24" viewBox="0 0 20 24" aria-hidden="true" className="text-light ml-1.5">
                                <path d="M0 0L20 12L0 24V0Z" fill="currentColor" />
                            </svg>
                        </div>
                    </div>

                    {/* Video badge */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-dark/75 text-light text-xs font-medium pointer-events-none select-none">
                        <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true" fill="currentColor">
                            <path d="M0 0L8 4.5L0 9V0Z" />
                        </svg>
                        VIDEO
                    </div>
                </div>
            </div>
        );
    };

    // =============================================================================
    // RENDER — Model3d
    // =============================================================================

    // 3D models render their previewImage as a fallback.
    // Clicking opens the lightbox which also renders the previewImage (3D viewer OOS).
    const renderModel3dItem = (item: ProductMediaItem & {__typename: "Model3d"}, index: number) => {
        return (
            <div
                key={item.id}
                className="relative w-full overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => openLightbox(index)}
                onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLightbox(index);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View 3D model ${index + 1}`}
            >
                <div className="relative w-full aspect-4/5">
                    {item.previewImage ? (
                        <img
                            src={item.previewImage.url}
                            alt={item.alt || `3D model ${index + 1}`}
                            className={cn("w-full h-full object-cover sleek", isAvailableForSale && "group-hover:scale-105")}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted" />
                    )}

                    {/* 3D badge — hexagon SVG icon */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-dark/75 text-light text-xs font-medium pointer-events-none select-none">
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M6 0.5L11 3.25V8.75L6 11.5L1 8.75V3.25L6 0.5Z" />
                            <path d="M6 0.5V6M6 6L11 3.25M6 6L1 3.25M6 6V11.5" strokeWidth="0.75" />
                        </svg>
                        3D
                    </div>
                </div>
            </div>
        );
    };

    // =============================================================================
    // RENDER DISPATCHER
    // =============================================================================

    const renderGalleryItem = (item: ProductMediaItem, index: number, forCarousel = false): React.ReactNode => {
        switch (item.__typename) {
            case "MediaImage":
                return renderImageItem(item, index, forCarousel);
            case "Video":
                return renderVideoItem(item, index);
            case "ExternalVideo":
                return renderExternalVideoItem(item, index);
            case "Model3d":
                return renderModel3dItem(item, index);
        }
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    if (galleryMedia.length === 0) {
        return <ProductImagePlaceholder aspectRatio="4/5" className="w-full rounded-lg" />;
    }

    return (
        <>
            {/* Mobile Carousel — swipeable, arrows hidden at 320px, visible at sm+ */}
            <div className="md:hidden">
                <Carousel
                    opts={{align: "start", loop: true, dragFree: true}}
                    className="w-full"
                >
                    <CarouselContent className="-ml-1.5 sm:-ml-2 md:-ml-3">
                        {galleryMedia.map((item, index) => (
                            <CarouselItem
                                key={item.id}
                                className={cn(
                                    "pl-1.5 sm:pl-2 md:pl-3",
                                    galleryMedia.length === 1
                                        ? "basis-full"
                                        : "basis-[92%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                                )}
                            >
                                {renderGalleryItem(item, index, true)}
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-1 sm:left-2 size-8 sm:size-10" />
                    <CarouselNext className="right-1 sm:right-2 size-8 sm:size-10" />
                </Carousel>
            </div>

            {/* Desktop Vertical Stack */}
            <div className="hidden md:flex flex-col gap-2">
                {galleryMedia.map((item, index) => renderGalleryItem(item, index, false))}
            </div>

            {/* Full-screen Lightbox — uses same galleryMedia array so indices align */}
            <ProductLightbox
                media={galleryMedia}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={closeLightbox}
            />
        </>
    );
}
