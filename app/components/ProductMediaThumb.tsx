/**
 * @fileoverview Primary-media thumbnail renderer (video-first)
 *
 * @description
 * Small reusable primitive that renders a product's primary media asset in
 * surfaces smaller than a full product card: cart line items, quick-add
 * dialog/sheet slides, mini product tiles, recommendation rails.
 *
 * When the product's first media node is a Video, plays it muted+looped
 * with an image poster for instant paint. Otherwise renders a Hydrogen
 * Image. Respects prefers-reduced-motion and lazy-mounts the <video> via
 * IntersectionObserver so dozens of cart lines don't spawn dozens of
 * network-bound video decoders.
 *
 * @why-not-ProductCardVideo
 * ProductCardVideo is optimized for product cards (hardcoded 4:5 aspect,
 * card-specific hover scale, sizes attribute). Cart thumbnails are 1:1,
 * quick-add slides can be any aspect, and neither wants card hover
 * semantics. This primitive leaves layout to the caller.
 *
 * @related
 * - ProductCardVideo.tsx — full card video renderer (4:5, hover behaviors)
 * - getCardVideoMedia — detection helper in app/lib/product/product-card-media.ts
 */

import {useEffect, useRef, useState, type CSSProperties} from "react";
import {useInView} from "react-intersection-observer";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {getCardVideoMedia} from "~/lib/product/product-card-media";

type ThumbImage = {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
};

interface ProductMediaThumbProps {
    /** Product shape — only `media.nodes` is inspected. Loose type so every fragment works. */
    product: unknown;
    /** Image fallback when first media is not a video (or product has no media). */
    fallbackImage?: ThumbImage | null;
    /** Accessible alt text. */
    alt: string;
    /** Aspect ratio for both Hydrogen Image sizing and CSS. Matches the container. */
    aspectRatio?: string;
    /** Sizes attribute for the Hydrogen Image (ignored by video path). */
    sizes?: string;
    /** Explicit pixel width/height for the Hydrogen Image path (thumbnails). */
    width?: number;
    height?: number;
    /** Whether the image should eagerly load. Defaults to lazy. */
    loading?: "eager" | "lazy";
    /** Classes applied to the <img>/<video>/<poster> element (object-cover, transitions, etc.). */
    className?: string;
    /** Inline style forwarded to the media element (rarely needed). */
    style?: CSSProperties;
}

function pickSource(sources: Array<{url: string; mimeType: string}>): {url: string; mimeType: string} | undefined {
    return (
        sources.find(s => s.mimeType === "video/mp4") ??
        sources.find(s => s.mimeType === "video/webm") ??
        sources[0]
    );
}

/**
 * Render a product's primary media — video when first media is a Video,
 * image otherwise. No container; caller controls layout/overflow/rounding.
 */
export function ProductMediaThumb({
    product,
    fallbackImage,
    alt,
    aspectRatio = "1/1",
    sizes,
    width,
    height,
    loading = "lazy",
    className,
    style
}: ProductMediaThumbProps) {
    const video = getCardVideoMedia(product);
    const {ref, inView} = useInView({triggerOnce: true, rootMargin: "200px"});
    const [canPlay, setCanPlay] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    // Image path — no video, or no usable sources
    if (!video) {
        if (!fallbackImage) return null;
        return (
            <Image
                alt={alt}
                aspectRatio={aspectRatio}
                data={fallbackImage}
                height={height}
                width={width}
                loading={loading}
                sizes={sizes}
                className={className}
                style={style}
            />
        );
    }

    // Video path — lazy-mount the <video> once in view; poster paints immediately.
    const shouldMountVideo = !prefersReducedMotion && (loading === "eager" || inView);
    const source = pickSource(video.sources);
    const poster = video.previewImage;

    return (
        <div ref={ref} className="relative size-full">
            {/* Poster (placeholder) — always rendered for instant paint + zero CLS. */}
            {poster ? (
                <Image
                    alt={alt}
                    aspectRatio={aspectRatio}
                    data={{
                        id: poster.id ?? undefined,
                        url: poster.url,
                        altText: poster.altText ?? alt,
                        width: poster.width ?? undefined,
                        height: poster.height ?? undefined
                    }}
                    height={height}
                    width={width}
                    loading={loading}
                    sizes={sizes}
                    className={cn(
                        "absolute inset-0 size-full transition-opacity duration-500 ease-out",
                        canPlay ? "opacity-0" : "opacity-100",
                        className
                    )}
                    style={style}
                />
            ) : fallbackImage ? (
                <Image
                    alt={alt}
                    aspectRatio={aspectRatio}
                    data={fallbackImage}
                    height={height}
                    width={width}
                    loading={loading}
                    sizes={sizes}
                    className={cn(
                        "absolute inset-0 size-full transition-opacity duration-500 ease-out",
                        canPlay ? "opacity-0" : "opacity-100",
                        className
                    )}
                    style={style}
                />
            ) : null}

            {shouldMountVideo && source && (
                <video
                    key={source.url}
                    src={source.url}
                    poster={poster?.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    onCanPlay={() => setCanPlay(true)}
                    onPlaying={() => setCanPlay(true)}
                    className={cn(
                        "absolute inset-0 size-full pointer-events-none object-cover transition-opacity duration-500 ease-out",
                        canPlay ? "opacity-100" : "opacity-0",
                        className
                    )}
                    style={style}
                >
                    <source src={source.url} type={source.mimeType} />
                </video>
            )}
        </div>
    );
}
