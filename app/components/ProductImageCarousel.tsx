/**
 * @fileoverview Multi-media carousel for product cards
 *
 * @description
 * Embla-based carousel component for displaying multiple product media items
 * (images + Shopify videos) on product cards. Features arrow navigation and
 * keyboard support. Falls back to static rendering for single-item products.
 *
 * @features
 * - Arrow button navigation (desktop only, shown on hover)
 * - Keyboard navigation support (arrow keys)
 * - Looping carousel behavior
 * - Lazy loading for non-first images
 * - Video support — autoplays muted/looped only when card is in viewport
 *   and pauses when scrolled away (IntersectionObserver driven)
 * - Hover effects (scale transition, arrow fade-in)
 * - Drag scrolling disabled (arrow-only navigation)
 * - 4:5 aspect ratio
 *
 * @props
 * - images: Legacy — array of product images (used when `media` is absent)
 * - media: Optional — array of Shopify media nodes (MediaImage | Video)
 * - productTitle: Product name for alt text
 * - loading: "eager" or "lazy" (default: "lazy") - controls first image loading
 * - className: Additional CSS classes
 * - isOutOfStock: Applies OOS visual treatment
 *
 * @related
 * - ~/components/ui/carousel.tsx - Embla wrapper components
 * - ProductItem.tsx - Uses this carousel
 * - ProductImageGallery.tsx - Full product page image display
 */

import {useEffect, useMemo, useRef, useState} from "react";
import {Image} from "@shopify/hydrogen";
import {Carousel, CarouselContent, CarouselItem, type CarouselApi} from "~/components/ui/carousel";
import {ArrowLeft, ArrowRight, Play} from "lucide-react";
import {cn} from "~/lib/utils";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";

// =============================================================================
// TYPES
// =============================================================================

type ProductImage = {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
};

/** Raw Shopify media node — accepts loose shapes so any GraphQL fragment works. */
type RawMediaNode =
    | {
          __typename?: "MediaImage";
          id?: string | null;
          image?: ProductImage | null;
      }
    | {
          __typename?: "Video";
          id?: string | null;
          sources?: Array<{url?: string | null; mimeType?: string | null} | null> | null;
          previewImage?: ProductImage | null;
      }
    | {__typename?: string; [key: string]: unknown};

/** Carousel-ready media — discriminated union. */
type SlideItem =
    | {type: "image"; key: string; image: ProductImage}
    | {
          type: "video";
          key: string;
          sources: Array<{url: string; mimeType: string}>;
          poster: ProductImage | null;
      };

interface ProductImageCarouselProps {
    images: ProductImage[];
    /** Shopify media nodes — when present, takes precedence over `images`. */
    media?: RawMediaNode[] | null;
    productTitle: string;
    loading?: "eager" | "lazy";
    className?: string;
    isOutOfStock?: boolean;
    /**
     * Set when the parent renders a bottom-anchored action overlay (Quick Add,
     * customActions). Lifts the pagination indicator above the reserved
     * action region so the two never collide.
     *
     * Below `md`: always lifted (action overlay is always visible on mobile).
     * `md`+: stays low by default, shifts up on `group-hover` to track the
     * button's fade-in.
     */
    hasBottomAction?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function normalizeSlides(media: RawMediaNode[] | null | undefined, images: ProductImage[]): SlideItem[] {
    // Prefer media when provided — it carries videos.
    if (media && media.length > 0) {
        const slides: SlideItem[] = [];
        media.forEach((node, index) => {
            if (!node) return;
            const typename = node.__typename;
            if (typename === "Video") {
                const rawSources = (node as {sources?: Array<{url?: string | null; mimeType?: string | null} | null>}).sources;
                const sources = (rawSources ?? [])
                    .filter((s): s is {url: string; mimeType: string} => Boolean(s?.url && s?.mimeType))
                    .map(s => ({url: s.url, mimeType: s.mimeType}));
                if (sources.length === 0) return;
                const poster = (node as {previewImage?: ProductImage | null}).previewImage ?? null;
                const key = (node as {id?: string | null}).id ?? `video-${index}`;
                slides.push({type: "video", key, sources, poster});
                return;
            }
            if (typename === "MediaImage") {
                const image = (node as {image?: ProductImage | null}).image;
                if (!image?.url) return;
                const key = (node as {id?: string | null}).id ?? `image-${index}`;
                slides.push({type: "image", key, image});
            }
        });
        if (slides.length > 0) return slides;
    }
    // Fallback: static images only.
    return images
        .filter(img => img?.url)
        .map((img, index) => ({
            type: "image",
            key: img.id ?? `image-${index}`,
            image: img
        } as SlideItem));
}

// =============================================================================
// VIDEO SLIDE
// =============================================================================

function VideoSlide({
    slide,
    productTitle,
    isActive,
    cardInView,
    isOutOfStock
}: {
    slide: Extract<SlideItem, {type: "video"}>;
    productTitle: string;
    isActive: boolean;
    cardInView: boolean;
    isOutOfStock: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [sourcesLoaded, setSourcesLoaded] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const shouldPlay = cardInView && isActive;

    useEffect(() => {
        if (shouldPlay && !sourcesLoaded) setSourcesLoaded(true);
    }, [shouldPlay, sourcesLoaded]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (shouldPlay) {
            const playPromise = video.play();
            if (playPromise !== undefined && typeof (playPromise as Promise<void>).catch === "function") {
                (playPromise as Promise<void>).catch(() => {});
            }
        } else {
            video.pause();
        }
    }, [shouldPlay, sourcesLoaded]);

    const posterUrl = slide.poster?.url;

    return (
        <div className="relative h-full w-full overflow-hidden rounded-lg">
            {/* Poster layer — holds its aspect until the video can paint. */}
            {posterUrl && !isReady && (
                <Image
                    src={posterUrl}
                    alt={slide.poster?.altText || productTitle}
                    className={cn(
                        "absolute inset-0 h-full w-full rounded-lg object-cover",
                        isOutOfStock && "opacity-60"
                    )}
                    loading="lazy"
                    decoding="async"
                />
            )}
            {sourcesLoaded && (
                <video
                    ref={videoRef}
                    className={cn(
                        "sleek product-image h-full w-full rounded-lg object-cover",
                        isOutOfStock ? "opacity-60" : "group-hover:scale-[1.03]",
                        isReady ? "opacity-100" : "opacity-0"
                    )}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={posterUrl}
                    aria-label={`${productTitle} video`}
                    onCanPlay={() => setIsReady(true)}
                >
                    {slide.sources.map(s => (
                        <source key={s.url} src={s.url} type={s.mimeType} />
                    ))}
                </video>
            )}
            {/* "Video" affordance so users know this slide is playable. */}
            <div className="pointer-events-none absolute bottom-2 right-2 z-[4] flex items-center gap-1 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-md">
                <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                <span className="sr-only">Video</span>
            </div>
        </div>
    );
}

// =============================================================================
// IMAGE SLIDE
// =============================================================================

function ImageSlide({
    image,
    productTitle,
    loading,
    isOutOfStock,
    index
}: {
    image: ProductImage;
    productTitle: string;
    loading: "eager" | "lazy";
    isOutOfStock: boolean;
    index: number;
}) {
    return (
        <div className="overflow-hidden rounded-lg">
            <Image
                alt={image.altText || (index === 0 ? productTitle : `${productTitle} - Image ${index + 1}`)}
                aspectRatio="4/5"
                data={image}
                loading={loading}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className={cn(
                    "sleek product-image h-auto w-full rounded-lg object-cover",
                    !isOutOfStock && "group-hover:scale-[1.03]"
                )}
            />
        </div>
    );
}

// =============================================================================
// PRODUCT IMAGE CAROUSEL
// =============================================================================

/**
 * ProductImageCarousel — Multi-media carousel for product cards
 *
 * Features:
 * - Arrow button navigation only (no trackpad/mouse drag scrolling)
 * - Keyboard navigation (arrow keys)
 * - Lazy loading for non-first images
 * - Video autoplay gated by viewport visibility
 *
 * Falls back to static render for single-media products.
 */
export function ProductImageCarousel({
    images,
    media,
    productTitle,
    loading = "lazy",
    className,
    isOutOfStock = false,
    hasBottomAction = false
}: ProductImageCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [activeIndex, setActiveIndex] = useState(0);
    const [cardInView, setCardInView] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const slides = useMemo(() => normalizeSlides(media, images), [media, images]);

    // Wire Embla API for active-slide tracking (drives video play/pause).
    useEffect(() => {
        if (!api) return;
        const sync = () => setActiveIndex(api.selectedScrollSnap());
        sync();
        api.on("select", sync);
        api.on("reInit", sync);
        return () => {
            api.off("select", sync);
            api.off("reInit", sync);
        };
    }, [api]);

    // Viewport visibility — pause videos when the card scrolls away.
    useEffect(() => {
        const node = containerRef.current;
        if (!node || typeof IntersectionObserver === "undefined") {
            setCardInView(true);
            return;
        }
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    setCardInView(entry.isIntersecting);
                }
            },
            {threshold: 0.25, rootMargin: "150px 0px"}
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // =============================================================================
    // RENDER
    // =============================================================================

    // Empty — placeholder keeps the 4:5 slot stable.
    if (slides.length === 0) {
        return <ProductImagePlaceholder aspectRatio="4/5" className={cn("rounded-lg", className)} />;
    }

    // Single media — skip carousel machinery for cleaner DOM + better LCP.
    if (slides.length === 1) {
        const slide = slides[0];
        return (
            <div ref={containerRef} className={cn("relative w-full overflow-hidden rounded-lg aspect-[4/5]", className)}>
                {slide.type === "video" ? (
                    <VideoSlide
                        slide={slide}
                        productTitle={productTitle}
                        isActive
                        cardInView={cardInView}
                        isOutOfStock={isOutOfStock}
                    />
                ) : (
                    <ImageSlide
                        image={slide.image}
                        productTitle={productTitle}
                        loading={loading}
                        isOutOfStock={isOutOfStock}
                        index={0}
                    />
                )}
            </div>
        );
    }

    // Multiple items — render carousel.
    return (
        <div ref={containerRef} className={cn("relative w-full overflow-hidden rounded-lg", className)}>
            <Carousel
                setApi={setApi}
                opts={{
                    align: "start",
                    loop: true,
                    skipSnaps: false,
                    containScroll: "trimSnaps",
                }}
                className="w-full rounded-lg"
            >
                <CarouselContent className="ml-0">
                    {slides.map((slide, index) => (
                        <CarouselItem key={slide.key} className="pl-0 basis-full">
                            {/* Each slide gets a 4:5 slot so switching between image/video causes no layout shift. */}
                            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg">
                                {slide.type === "video" ? (
                                    <VideoSlide
                                        slide={slide}
                                        productTitle={productTitle}
                                        isActive={index === activeIndex}
                                        cardInView={cardInView}
                                        isOutOfStock={isOutOfStock}
                                    />
                                ) : (
                                    <ImageSlide
                                        image={slide.image}
                                        productTitle={productTitle}
                                        loading={index === 0 ? loading : "lazy"}
                                        isOutOfStock={isOutOfStock}
                                        index={index}
                                    />
                                )}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Navigation arrows — div[role=button] avoids illegal button-in-button nesting
                when this carousel renders inside an interactive parent (e.g. FullScreenSearch results).
                tabIndex and onKeyDown preserve full keyboard accessibility. */}
            <div
                role="button"
                tabIndex={0}
                className={cn(
                    "absolute left-2 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full hidden md:flex items-center justify-center motion-overlay bg-primary border-0 hover:bg-primary/90 cursor-pointer",
                    isOutOfStock ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    api?.scrollPrev();
                }}
                onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        api?.scrollPrev();
                    }
                }}
                aria-label="Previous media"
            >
                <ArrowLeft className="size-4 text-primary-foreground" />
            </div>
            <div
                role="button"
                tabIndex={0}
                className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full hidden md:flex items-center justify-center motion-overlay bg-primary border-0 hover:bg-primary/90 cursor-pointer",
                    isOutOfStock ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    api?.scrollNext();
                }}
                onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        api?.scrollNext();
                    }
                }}
                aria-label="Next media"
            >
                <ArrowRight className="size-4 text-primary-foreground" />
            </div>

            {/* Pagination dots — always-visible so multi-media is discoverable on mobile.
                When `hasBottomAction` is set, the indicator is lifted above the Quick Add /
                customActions overlay region to avoid collision. The `md:` variants keep the
                indicator low on desktop until hover reveals the button, mirroring its fade-in. */}
            <div
                className={cn(
                    "pointer-events-none absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-background/75 px-1.5 py-1 backdrop-blur-md transition-[bottom] duration-200 ease-out",
                    hasBottomAction
                        ? "bottom-14 sm:bottom-16 md:bottom-2 md:group-hover:bottom-[4.5rem]"
                        : "bottom-2"
                )}
                aria-hidden="true"
            >
                {slides.map((slide, index) => (
                    <span
                        key={slide.key}
                        className={cn(
                            "h-1 rounded-full transition-all duration-200",
                            index === activeIndex ? "w-3 bg-foreground" : "w-1 bg-foreground/40"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
