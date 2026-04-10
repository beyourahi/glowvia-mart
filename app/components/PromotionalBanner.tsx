/**
 * @fileoverview Promotional banner component for hero images and videos
 *
 * @description
 * PromotionalBanner displays full-width promotional media (image or video) at the top of pages.
 * Automatically detects media type and renders appropriate component with optimized settings.
 * Commonly used for hero sections, campaign banners, and featured content.
 *
 * @features
 * - Auto-detection of media type (image vs video)
 * - Video autoplay with loop and mute for silent autoplay
 * - Responsive image optimization via Shopify Hydrogen Image
 * - Fixed height of 90dvh (dynamic viewport height) for immersive banner experience
 * - Object-fit cover for aspect ratio handling
 * - Lazy loading for images
 * - Auto-hides if no media provided
 *
 * @props
 * - media: Media object with url, type, mimeType, dimensions, sources
 * - className: Optional additional CSS classes
 *
 * @architecture
 * Component structure:
 * - PromotionalBanner: Main wrapper, handles media type detection
 * - VideoMedia: Renders video with autoplay/loop/muted
 * - ImageMedia: Renders optimized image via Hydrogen Image
 *
 * @related
 * - routes/_index.tsx - Fetches promotional banner from homepage metaobject
 * - Header.tsx - May be positioned below/above banner
 *
 * @example
 * ```tsx
 * <PromotionalBanner
 *   media={{
 *     type: "video",
 *     url: "https://cdn.shopify.com/video.mp4",
 *     mimeType: "video/mp4",
 *     sources: [{url: "https://cdn.shopify.com/video.mp4"}]
 *   }}
 * />
 * ```
 */

import {Image} from "@shopify/hydrogen";
import type {HeroMedia} from "types";
import {ParallaxLayer} from "~/components/motion/ParallaxLayer";

// ================================================================================
// Type Definitions
// ================================================================================

interface PromotionalBannerProps {
    media: HeroMedia | null | undefined;
    className?: string;
}

// ================================================================================
// Main Banner Component
// ================================================================================

/**
 * PromotionalBanner - Full-width media banner with auto type detection
 *
 * Renders promotional media (image or video) with responsive sizing and optimization.
 * Returns null if no media provided. Fixed height of 90dvh (dynamic viewport height)
 * creates an immersive, full-bleed banner experience.
 *
 * @param media - Media object with type, url, dimensions, sources
 * @param className - Optional CSS classes to add to section wrapper
 */
export function PromotionalBanner({media, className = ""}: PromotionalBannerProps) {
    // Don't render if no media
    if (!media || !media.url) {
        return null;
    }

    return (
        <section className={`w-full ${className}`}>
            {media.mediaType === "video" ? <VideoMedia media={media} /> : <ImageMedia media={media} />}
        </section>
    );
}

// ================================================================================
// Media Type Components
// ================================================================================

/**
 * VideoMedia - Renders video with autoplay/loop/muted
 *
 * Uses the video URL from HeroMedia.
 * Video is muted and autoplays for silent autoplay (required by browsers).
 * Plays inline on mobile devices. Loops continuously.
 * Fixed height of 90dvh (dynamic viewport height) for consistent banner sizing.
 *
 * @param media - HeroMedia object with video type
 */
function VideoMedia({media}: {media: HeroMedia & {mediaType: "video"}}) {
    return (
        <div className="w-full">
            <ParallaxLayer className="w-full" contentClassName="w-full" amplitude={24} scale={1.05}>
                <video autoPlay loop muted playsInline className="w-full h-auto object-contain">
                    <source src={media.url} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </ParallaxLayer>
        </div>
    );
}

/**
 * ImageMedia - Renders optimized image via Hydrogen Image component
 *
 * Uses Shopify Hydrogen's Image component for automatic optimization and responsive srcsets.
 * Lazy loads image for performance. Object-fit cover maintains aspect ratio.
 * Fixed height of 90dvh (dynamic viewport height) for consistent banner sizing.
 *
 * @param media - HeroMedia object with image type
 */
function ImageMedia({media}: {media: HeroMedia & {mediaType: "image"}}) {
    // Build image data object for Hydrogen Image component
    const imageData = {
        url: media.url,
        altText: media.altText || "Promotional banner",
        width: media.width || 1920,
        height: media.height || 640
    };

    return (
        <div className="w-full">
            <ParallaxLayer className="w-full" contentClassName="w-full" amplitude={24} scale={1.05}>
                <Image data={imageData} className="w-full h-auto object-contain" sizes="100vw" loading="lazy" />
            </ParallaxLayer>
        </div>
    );
}
