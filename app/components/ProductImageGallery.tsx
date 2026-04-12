/**
 * @fileoverview Product detail page image gallery with responsive layouts and lightbox
 *
 * @description
 * Dual-mode image gallery that adapts between mobile carousel and desktop vertical stack.
 * Handles loading states, variant image scrolling, and responsive image sizing.
 * Clicking any image opens a full-screen lightbox for detailed viewing.
 *
 * @features
 * - Mobile: Horizontal swipeable carousel with drag-free scrolling
 * - Desktop: Vertical stack of all images
 * - Individual loading skeletons for each image
 * - Smooth scroll to variant image when selection changes
 * - Responsive image sizing with srcset
 * - Eager loading for first image (LCP optimization)
 * - Lazy loading for subsequent images
 * - 4:5 aspect ratio for all images
 * - Wheel gesture support for carousel
 * - Full-screen lightbox on image click
 *
 * @props
 * - images: Array of product images to display
 * - selectedVariantImage: Currently selected variant's featured image (triggers scroll)
 * - media: Optional array of product media (images + videos) for lightbox
 *
 * @state
 * - loadedImages: Set of loaded image IDs for skeleton hiding
 * - imageRefs: Map of image elements for scrollIntoView
 * - lightboxOpen: Whether lightbox is currently open
 * - lightboxIndex: Index of media to show in lightbox
 *
 * @loading-strategy
 * - Uses native Image API for preloading (avoids SSR hydration issues)
 * - Shows skeleton while loading
 * - Fades in image when loaded
 * - Handles load errors gracefully
 *
 * @scroll-behavior
 * When selectedVariantImage changes:
 * 1. Finds corresponding image ref by ID
 * 2. Scrolls to image with smooth behavior
 * 3. Centers image in viewport (desktop only)
 *
 * @responsive-layout
 * - Mobile (<md): Carousel with 90% basis, arrows
 * - Desktop (>=md): Vertical stack, gap-2, no carousel
 *
 * @lightbox
 * - Click any image to open full-screen lightbox
 * - Lightbox uses media array (includes videos if available)
 * - Natural aspect ratio display in lightbox
 * - Arrow/keyboard/swipe navigation
 *
 * @related
 * - ProductImageCarousel.tsx - Card carousel (different use case)
 * - ~/routes/products.$handle.tsx - Product detail page
 * - ~/components/ProductLightbox - Full-screen media viewer
 * - Carousel components - Embla carousel wrappers
 */

import {useState, useEffect, useRef} from "react";
import {Image} from "@shopify/hydrogen";
import type {ProductImageGalleryProps, ProductMediaItem} from "types";
import {cn} from "~/lib/utils";
import {Skeleton} from "~/components/ui/skeleton";
import {Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext} from "~/components/ui/carousel";
import {ProductLightbox} from "~/components/ProductLightbox";

// =============================================================================
// PRODUCT IMAGE GALLERY
// =============================================================================

/**
 * ProductImageGallery - Responsive product image display with lightbox.
 *
 * Features:
 * - Mobile: Swipeable carousel (no arrows/dots)
 * - Desktop: All images visible in vertical stack
 * - Smooth scroll to variant image when variant selection changes (desktop)
 * - Individual loading states for each image
 * - Responsive sizing across all screen sizes
 * - Full-screen lightbox on image click
 */
export function ProductImageGallery({images, selectedVariantImage, media, isAvailableForSale = true}: ProductImageGalleryProps) {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    // Track loaded state for each image independently
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

    // Refs for scrolling to specific images
    const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // =============================================================================
    // LIGHTBOX STATE
    // =============================================================================

    // Lightbox open/closed state
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Index of media item to show in lightbox
    const [lightboxIndex, setLightboxIndex] = useState(0);

    /**
     * Open lightbox at specific index
     * Maps image index to corresponding media index
     */
    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    /**
     * Close lightbox
     */
    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    /**
     * Get media array for lightbox
     * Filters to only supported types (MediaImage, Video) and normalizes the data
     * Falls back to converting images to media format if media prop not provided
     */
    const lightboxMedia: ProductMediaItem[] = (() => {
        // Type guard for checking if item is a valid media object
        const isMediaItem = (item: unknown): item is ProductMediaItem => {
            if (typeof item !== "object" || item === null) return false;
            const obj = item as Record<string, unknown>;
            return obj.__typename === "MediaImage" || obj.__typename === "Video";
        };

        // If media array provided, filter and normalize it
        if (media && media.length > 0) {
            return media.filter(isMediaItem).map(item => {
                if (item.__typename === "MediaImage") {
                    return {
                        __typename: "MediaImage" as const,
                        id: item.id ?? "",
                        alt: item.alt ?? null,
                        image: item.image
                            ? {
                                  id: item.image.id ?? "",
                                  url: item.image.url,
                                  altText: item.image.altText ?? null,
                                  width: item.image.width ?? 0,
                                  height: item.image.height ?? 0
                              }
                            : null
                    };
                }
                // Video type
                return {
                    __typename: "Video" as const,
                    id: item.id ?? "",
                    alt: item.alt ?? null,
                    sources: item.sources ?? [],
                    previewImage: item.previewImage ?? null
                };
            });
        }

        // Fallback: convert images array to media format
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
    })();

    // =============================================================================
    // IMAGE PRELOADING
    // =============================================================================

    // Preload images using native Image API (fixes SSR hydration issue with Hydrogen Image onLoad)
    useEffect(() => {
        // Mark an image as loaded (defined inside useEffect to avoid dependency warning)
        const markImageLoaded = (imageKey: string) => {
            setLoadedImages(prev => {
                if (prev.has(imageKey)) return prev;
                return new Set(prev).add(imageKey);
            });
        };

        const cleanupFns: (() => void)[] = [];

        images.forEach((image, index) => {
            if (!image.url) return;

            const imageKey = image.id ?? `image-${index}`;
            const img = new window.Image();

            const handleLoad = () => markImageLoaded(imageKey);
            const handleError = () => markImageLoaded(imageKey); // Show content even on error

            img.onload = handleLoad;
            img.onerror = handleError;
            img.src = image.url;

            // If already cached, complete will be true synchronously
            if (img.complete) {
                markImageLoaded(imageKey);
            }

            cleanupFns.push(() => {
                img.onload = null;
                img.onerror = null;
            });
        });

        return () => cleanupFns.forEach(fn => fn());
    }, [images]);

    // =============================================================================
    // VARIANT IMAGE SCROLL
    // =============================================================================

    // Scroll to variant image when selection changes
    useEffect(() => {
        if (!selectedVariantImage?.id) return;

        const targetRef = imageRefs.current.get(selectedVariantImage.id);
        if (targetRef) {
            targetRef.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, [selectedVariantImage?.id]);

    // Store ref for an image element
    const setImageRef = (imageId: string, element: HTMLDivElement | null) => {
        if (element) {
            imageRefs.current.set(imageId, element);
        } else {
            imageRefs.current.delete(imageId);
        }
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    // Fallback when no images
    if (!images.length) {
        return (
            <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No image available</span>
            </div>
        );
    }

    // Reusable image item component
    //
    // L-09: Lightbox-based gallery is an intentional design choice — each image in the
    // PDP gallery shows a full-size product photo (not a generic button label) and acts
    // as a lightbox trigger. The lightbox itself has a dedicated thumbnail strip for
    // quick navigation (see LightboxThumbnails.tsx). This pattern follows the luxury
    // e-commerce convention of large hero images → fullscreen detail view.
    const renderImageItem = (image: (typeof images)[0], index: number, forCarousel = false) => {
        const imageKey = image.id ?? `image-${index}`;
        const isLoaded = loadedImages.has(imageKey);

        return (
            <div
                key={imageKey}
                ref={forCarousel ? undefined : el => setImageRef(imageKey, el)}
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
                aria-label={`View ${image.altText || `image ${index + 1}`} in fullscreen`}
            >
                {/* Image Container - 4:5 portrait aspect ratio */}
                <div className="relative w-full aspect-4/5">
                    {/* Loading Skeleton */}
                    {!isLoaded && <Skeleton className="absolute inset-0 z-10" />}

                    {/* Product Image - first image eager for LCP, rest lazy */}
                    <Image
                        alt={image.altText || `Product image ${index + 1}`}
                        data={image}
                        loading={index === 0 ? "eager" : "lazy"}
                        sizes="(min-width: 45em) 50vw, 100vw"
                        className={cn(
                            "sleek product-image w-full h-full object-cover",
                            !isLoaded && "opacity-0",
                            isAvailableForSale && "hover:scale-105"
                        )}
                    />

                    {/* Hover overlay - subtle darkening to indicate clickability */}
                    <div className={cn(
                        "absolute inset-0 bg-dark/0 motion-overlay pointer-events-none",
                        isAvailableForSale && "group-hover:bg-dark/5"
                    )} />
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Mobile Carousel - swipeable, arrows hidden at 320px, visible at sm+ */}
            <div className="md:hidden">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                        dragFree: true
                    }}
                    className="w-full"
                >
                    {/* Reduced left margin for 320px viewport */}
                    <CarouselContent className="-ml-1.5 sm:-ml-2 md:-ml-3">
                        {images.map((image, index) => (
                            <CarouselItem
                                key={image.id ?? `carousel-${index}`}
                                className={cn(
                                    "pl-1.5 sm:pl-2 md:pl-3",
                                    images.length === 1
                                        ? "basis-full"
                                        : "basis-[92%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                                )}
                            >
                                {renderImageItem(image, index, true)}
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {/* Navigation arrows - smaller positioning for 320px */}
                    <CarouselPrevious className="left-1 sm:left-2 size-8 sm:size-10" />
                    <CarouselNext className="right-1 sm:right-2 size-8 sm:size-10" />
                </Carousel>
            </div>

            {/* Desktop Vertical Stack */}
            <div className="hidden md:flex flex-col gap-2">
                {images.map((image, index) => renderImageItem(image, index, false))}
            </div>

            {/* Full-screen Lightbox */}
            {lightboxMedia.length > 0 && (
                <ProductLightbox
                    media={lightboxMedia}
                    initialIndex={lightboxIndex}
                    isOpen={lightboxOpen}
                    onClose={closeLightbox}
                />
            )}
        </>
    );
}
