/**
 * @fileoverview Media renderer for product lightbox (images and videos)
 *
 * @description
 * Renders product media at natural aspect ratio using object-fit: contain.
 * Uses TypeScript discriminated union (__typename) for type-safe rendering.
 *
 * @media-types
 * - MediaImage: Static product images via Hydrogen Image component
 * - Video: Product videos via native HTML5 video element
 *
 * @aspect-ratio
 * CRITICAL: This component does NOT apply fixed aspect ratios.
 * Images and videos scale to fit the viewport while maintaining
 * their natural proportions. Uses object-fit: contain.
 *
 * @video-handling
 * - Uses native HTML5 video element (no external player)
 * - Selects MP4 source when available, falls back to first source
 * - Shows preview image as poster frame
 * - Custom play/pause overlay button
 * - Pauses automatically when navigating to another media
 *
 * @accessibility
 * - Images: alt text from product data or fallback
 * - Videos: aria-label, visible controls
 * - Play/pause button: 64px touch target with clear icon
 *
 * @related
 * - ProductLightbox.tsx - Parent that manages playback state
 * - LightboxThumbnails.tsx - Shows preview images for videos
 */

import * as React from "react";
import {Image} from "@shopify/hydrogen";
import {PlayIcon, PauseIcon} from "lucide-react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import type {ProductMediaItem} from "types";

// =============================================================================
// COMPONENT INTERFACE
// =============================================================================

interface LightboxMediaProps {
    /** Media item to render (image or video) */
    media: ProductMediaItem;
    /** Whether video is currently playing */
    isVideoPlaying: boolean;
    /** Callback when video starts playing */
    onVideoPlay: () => void;
    /** Callback when video pauses or ends */
    onVideoPause: () => void;
    /** Ref to video element for external control */
    videoRef: React.RefObject<HTMLVideoElement>;
}

// =============================================================================
// LIGHTBOX MEDIA COMPONENT
// =============================================================================

/**
 * LightboxMedia - Render product image or video at natural aspect ratio
 *
 * @description
 * Detects media type via __typename and renders appropriate element.
 * All media scales responsively within viewport bounds while
 * maintaining natural proportions (no cropping or distortion).
 *
 * @example
 * ```tsx
 * <LightboxMedia
 *   media={currentMedia}
 *   isVideoPlaying={isPlaying}
 *   onVideoPlay={() => setIsPlaying(true)}
 *   onVideoPause={() => setIsPlaying(false)}
 *   videoRef={videoRef}
 * />
 * ```
 */
export function LightboxMedia({media, isVideoPlaying, onVideoPlay, onVideoPause, videoRef}: LightboxMediaProps) {
    // ==========================================================================
    // VIDEO PLAYBACK TOGGLE
    // ==========================================================================

    const togglePlayback = () => {
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            void videoRef.current.play();
            onVideoPlay();
        } else {
            videoRef.current.pause();
            onVideoPause();
        }
    };

    // ==========================================================================
    // RENDER VIDEO
    // ==========================================================================

    if (media.__typename === "Video") {
        // Find mp4 source (preferred for compatibility) or fallback to first
        const mp4Source = media.sources.find(s => s.mimeType === "video/mp4") || media.sources[0];

        // Handle missing video source
        if (!mp4Source) {
            return <div className="flex items-center justify-center text-light/70 text-sm">Video unavailable</div>;
        }

        return (
            <div className="relative max-w-full max-h-full animate-scale-fade">
                {/* Native HTML5 video element
                    Note: Product videos from Shopify typically don't include caption tracks.
                    The aria-label provides context for screen readers. */}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                    ref={videoRef}
                    src={mp4Source.url}
                    poster={media.previewImage?.url}
                    className={cn(
                        // Natural aspect ratio - no fixed dimensions
                        "max-w-full max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)]",
                        "w-auto h-auto object-contain rounded-lg"
                    )}
                    onPlay={onVideoPlay}
                    onPause={onVideoPause}
                    onEnded={onVideoPause}
                    playsInline
                    controls={false} // Using custom play/pause button
                    aria-label={media.alt || "Product video"}
                >
                    <source src={mp4Source.url} type={mp4Source.mimeType} />
                    Your browser does not support the video tag.
                </video>

                {/* Custom play/pause overlay button
                    Shows always when paused, fades on hover when playing */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayback}
                    className={cn(
                        // Centered in video
                        "absolute inset-0 m-auto",
                        // Large touch target
                        "size-16 md:size-20 rounded-full",
                        // Semi-transparent dark background
                        "bg-dark/60 hover:bg-dark/80 text-light",
                        // Hide when playing (show on hover)
                        "transition-opacity duration-200",
                        isVideoPlaying && "opacity-0 hover:opacity-100",
                        // Focus ring for keyboard users
                        "focus-visible:ring-light focus-visible:opacity-100"
                    )}
                    aria-label={isVideoPlaying ? "Pause video" : "Play video"}
                >
                    {isVideoPlaying ? (
                        <PauseIcon className="size-8 md:size-10" />
                    ) : (
                        <PlayIcon className="size-8 md:size-10" />
                    )}
                </Button>
            </div>
        );
    }

    // ==========================================================================
    // RENDER IMAGE (MediaImage type)
    // ==========================================================================

    if (media.__typename === "MediaImage" && media.image) {
        return (
            <div className="relative max-w-full max-h-full animate-scale-fade">
                <Image
                    data={media.image}
                    alt={media.alt || media.image.altText || "Product image"}
                    className={cn(
                        // Natural aspect ratio - no fixed dimensions
                        "max-w-full max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)]",
                        "w-auto h-auto object-contain rounded-lg"
                    )}
                    // Full viewport width for srcset selection
                    sizes="100vw"
                    // Eager load since this is the focused content
                    loading="eager"
                />
            </div>
        );
    }

    // ==========================================================================
    // RENDER EXTERNAL VIDEO (YouTube / Vimeo embed)
    // ==========================================================================

    if (media.__typename === "ExternalVideo") {
        return (
            <div className="relative w-full max-w-4xl animate-scale-fade flex flex-col items-center gap-3">
                {/*
                 * Sandboxed iframe prevents the embedded page from accessing the parent.
                 * allow-scripts + allow-same-origin are the minimum required by YouTube/Vimeo.
                 * aspect-video (16:9) is the universal default for embeds; no fixed height set.
                 */}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <iframe
                        src={media.embedUrl}
                        title={media.alt || "Product video"}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                    />
                </div>
            </div>
        );
    }

    // ==========================================================================
    // RENDER MODEL 3D (preview image fallback — 3D viewer out of scope)
    // ==========================================================================

    if (media.__typename === "Model3d") {
        return (
            <div className="relative max-w-full max-h-full animate-scale-fade flex flex-col items-center gap-3">
                {media.previewImage ? (
                    <img
                        src={media.previewImage.url}
                        alt={media.alt || "3D model preview"}
                        className="max-w-full max-h-[calc(100vh-220px)] w-auto h-auto object-contain rounded-lg"
                    />
                ) : (
                    <div className="w-64 h-80 bg-dark/30 rounded-lg flex items-center justify-center">
                        <span className="text-light/50 text-sm">No preview available</span>
                    </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark/60 text-light/80 text-xs font-medium">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M6 0.5L11 3.25V8.75L6 11.5L1 8.75V3.25L6 0.5Z" />
                        <path d="M6 0.5V6M6 6L11 3.25M6 6L1 3.25M6 6V11.5" strokeWidth="0.75" />
                    </svg>
                    3D model — interactive viewer not available
                </div>
            </div>
        );
    }

    // ==========================================================================
    // FALLBACK - Unsupported or missing media
    // ==========================================================================

    return <div className="flex items-center justify-center text-light/70 text-sm">Media unavailable</div>;
}
