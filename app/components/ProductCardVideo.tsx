/**
 * @fileoverview Video renderer for product cards (video-first media)
 *
 * @description
 * Renders a short product video inline on a product card with a poster
 * placeholder for instant paint and zero layout shift. Used when the first
 * media asset on a product is a Video type.
 *
 * @behavior
 * - Placeholder (previewImage) paints immediately using Shopify Image
 * - Video element is lazy-mounted via IntersectionObserver (200px rootMargin)
 * - Video is muted, looped, playsInline — browser-policy safe autoplay
 * - preload="metadata" keeps bandwidth minimal until the user scrolls close
 * - On canPlay, the placeholder fades out and video fades in (500ms)
 * - Respects prefers-reduced-motion: on that preference, the poster remains
 *   and the video never autoplays (static preview only)
 * - pointer-events-none on the video prevents it from stealing card clicks
 * - aria-hidden on the video — poster image carries the alt text
 *
 * @rationale
 * Lazy-mount prevents dozens of videos loading on a collection grid at once.
 * MP4 is preferred, falling back to WebM, then any available source.
 *
 * @related
 * - ProductImageCarousel.tsx — image-based card media (fallback when no video)
 * - ProductItem.tsx — decides which renderer to use based on product.media[0]
 * - ProductImageGallery.tsx — full-PDP video rendering (with controls)
 */

import {useEffect, useRef, useState} from "react";
import {useInView} from "react-intersection-observer";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";

export interface ProductCardVideoSource {
    url: string;
    mimeType: string;
    width?: number | null;
    height?: number | null;
}

export interface ProductCardVideoPoster {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
}

interface ProductCardVideoProps {
    sources: ProductCardVideoSource[];
    previewImage?: ProductCardVideoPoster | null;
    alt?: string | null;
    productTitle: string;
    loading?: "eager" | "lazy";
    className?: string;
    isOutOfStock?: boolean;
}

/**
 * Pick the best-supported source.
 * MP4 is the broadest; WebM is smaller when available; otherwise fall back
 * to whatever Shopify returned first.
 */
function pickSource(sources: ProductCardVideoSource[]): ProductCardVideoSource | undefined {
    return (
        sources.find(s => s.mimeType === "video/mp4") ??
        sources.find(s => s.mimeType === "video/webm") ??
        sources[0]
    );
}

export function ProductCardVideo({
    sources,
    previewImage,
    alt,
    productTitle,
    loading = "lazy",
    className,
    isOutOfStock = false
}: ProductCardVideoProps) {
    // Start video mounting once the card is within 200px of the viewport.
    // triggerOnce: we don't need to unmount when scrolling away.
    const {ref, inView} = useInView({triggerOnce: true, rootMargin: "200px"});
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [canPlay, setCanPlay] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Respect user motion preference — never autoplay for those users.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const source = pickSource(sources);

    // Eager loading skips the viewport gate (e.g. above-the-fold hero cards).
    const shouldMountVideo = !prefersReducedMotion && (loading === "eager" || inView);

    // Poster data shape expected by Hydrogen <Image/>
    const posterData = previewImage
        ? {
              id: previewImage.id ?? undefined,
              url: previewImage.url,
              altText: previewImage.altText ?? alt ?? productTitle,
              width: previewImage.width ?? undefined,
              height: previewImage.height ?? undefined
          }
        : null;

    return (
        <div
            ref={ref}
            className={cn(
                "relative w-full overflow-hidden rounded-lg bg-muted/50 aspect-[4/5]",
                className
            )}
        >
            {/* Placeholder — always rendered for instant paint + CLS prevention. */}
            {posterData ? (
                <Image
                    alt={posterData.altText ?? productTitle}
                    aspectRatio="4/5"
                    data={posterData}
                    loading={loading}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover rounded-lg motion-image",
                        "transition-opacity duration-500 ease-out",
                        canPlay ? "opacity-0" : "opacity-100",
                        !isOutOfStock && "group-hover:scale-[1.03]"
                    )}
                />
            ) : (
                // No poster at all — fall back to a static skeleton shade.
                <ProductImagePlaceholder
                    aspectRatio="4/5"
                    className={cn(
                        "absolute inset-0 rounded-lg transition-opacity duration-500",
                        canPlay ? "opacity-0" : "opacity-100"
                    )}
                />
            )}

            {/* Video — lazy-mounted; fades in once it can play. */}
            {shouldMountVideo && source && (
                <video
                    key={source.url}
                    ref={videoRef}
                    src={source.url}
                    poster={previewImage?.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    onCanPlay={() => setCanPlay(true)}
                    onPlaying={() => setCanPlay(true)}
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover rounded-lg pointer-events-none",
                        "transition-opacity duration-500 ease-out",
                        canPlay ? "opacity-100" : "opacity-0",
                        !isOutOfStock && "group-hover:scale-[1.03] motion-image"
                    )}
                >
                    <source src={source.url} type={source.mimeType} />
                </video>
            )}
        </div>
    );
}
