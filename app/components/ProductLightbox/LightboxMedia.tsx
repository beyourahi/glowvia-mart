/**
 * @fileoverview Product lightbox media renderer — images, videos, external embeds, and 3D models.
 *
 * Dispatches on `__typename` (Shopify discriminated union). No fixed aspect ratios are applied;
 * all media scales via `object-fit: contain` to preserve natural proportions.
 * Model3d falls back to a preview image — interactive 3D viewer is out of scope.
 *
 * @related
 * - ProductLightbox.tsx - Parent component
 */

import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import type {ProductMediaItem} from "types";

interface LightboxMediaProps {
    /** Media item to render */
    media: ProductMediaItem;
}

export function LightboxMedia({media}: LightboxMediaProps) {
    if (media.__typename === "Video") {
        // Prefer MP4 for widest browser compatibility; fall back to first source.
        const mp4Source = media.sources.find(s => s.mimeType === "video/mp4") || media.sources[0];

        if (!mp4Source) {
            return <div className="flex items-center justify-center text-light/70 text-sm">Video unavailable</div>;
        }

        return (
            <div className="relative max-w-full max-h-full animate-scale-fade">
                <video
                    src={mp4Source.url}
                    poster={media.previewImage?.url}
                    className={cn(
                        "max-w-full max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)]",
                        "w-auto h-auto object-contain rounded-lg"
                    )}
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-label={media.alt || "Product video"}
                >
                    <source src={mp4Source.url} type={mp4Source.mimeType} />
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    }

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
                    sizes="100vw"
                    loading="eager"
                />
            </div>
        );
    }

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

    // Model3d: interactive viewer is out of scope — render preview image only.
    if (media.__typename === "Model3d") {
        return (
            <div className="relative max-w-full max-h-full animate-scale-fade flex flex-col items-center gap-3">
                {media.previewImage ? (
                    <Image
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

    return <div className="flex items-center justify-center text-light/70 text-sm">Media unavailable</div>;
}
