import {Package} from "lucide-react";
import {cn} from "~/lib/utils";

interface ProductImagePlaceholderProps {
    /** Applies an aspect-ratio utility class. Omit when the parent container already constrains height. */
    aspectRatio?: "4/5" | "square";
    /** Compact mode for small containers (list view): shows only icon, no label. */
    compact?: boolean;
    className?: string;
}

/**
 * ProductImagePlaceholder — minimal image absence state.
 *
 * Soft muted gradient + Package icon (Lucide, already used in the codebase) + small label.
 * Compact mode hides the label and uses a smaller icon for tight containers (list view).
 *
 * Used in:
 * - ProductImageCarousel (single-image, no src)
 * - ProductItem card variant (empty images array)
 * - ProductItem list variant (no featuredImage)
 * - ProductImageGallery (empty galleryMedia)
 */
export function ProductImagePlaceholder({aspectRatio, compact = false, className}: ProductImagePlaceholderProps) {
    const aspectClass = aspectRatio === "4/5" ? "aspect-4/5" : aspectRatio === "square" ? "aspect-square" : undefined;

    return (
        <div
            role="img"
            aria-label="Product image unavailable"
            className={cn(
                "flex flex-col items-center justify-center bg-gradient-to-br from-muted/70 to-muted/30",
                compact ? "gap-0" : "gap-2",
                aspectClass,
                className
            )}
        >
            <Package className={cn("text-foreground/20", compact ? "size-5" : "size-7")} />
            {!compact && (
                <span className="select-none text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    No image
                </span>
            )}
        </div>
    );
}
