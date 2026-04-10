/**
 * @fileoverview Multi-image carousel for product cards
 *
 * @description
 * Embla-based carousel component for displaying multiple product images on product cards.
 * Features arrow navigation and keyboard support. Falls back to static image for
 * single-image products.
 *
 * @features
 * - Arrow button navigation (desktop only, shown on hover)
 * - Keyboard navigation support (arrow keys)
 * - Looping carousel behavior
 * - Lazy loading for non-first images
 * - Hover effects (scale transition, arrow fade-in)
 * - Drag scrolling disabled (arrow-only navigation)
 * - 4:5 aspect ratio images
 *
 * @props
 * - images: Array of product images
 * - productTitle: Product name for alt text
 * - loading: "eager" or "lazy" (default: "lazy") - controls first image loading
 * - className: Additional CSS classes
 *
 * @state
 * - api: Embla carousel API instance
 *
 * @navigation
 * - Desktop arrows: Hidden by default, shown on group hover
 * - Prevents event bubbling to avoid triggering parent link clicks
 *
 * @accessibility
 * - ARIA labels on navigation buttons
 * - Keyboard support via Embla
 *
 * @related
 * - ~/components/ui/carousel.tsx - Embla wrapper components
 * - ProductItem.tsx - Uses this carousel
 * - ProductImageGallery.tsx - Full product page image display
 */

import {useState} from "react";
import {Image} from "@shopify/hydrogen";
import {Carousel, CarouselContent, CarouselItem, type CarouselApi} from "~/components/ui/carousel";
import {ArrowLeft, ArrowRight} from "lucide-react";
import {cn} from "~/lib/utils";

type ProductImage = {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
};

interface ProductImageCarouselProps {
    images: ProductImage[];
    productTitle: string;
    loading?: "eager" | "lazy";
    className?: string;
}

// =============================================================================
// PRODUCT IMAGE CAROUSEL
// =============================================================================

/**
 * ProductImageCarousel - Multi-image carousel for product cards
 *
 * Features:
 * - Arrow button navigation only (no trackpad/mouse drag scrolling)
 * - Keyboard navigation (arrow keys)
 * - Lazy loading for non-first images
 *
 * Falls back to static image for products with only one image.
 */
export function ProductImageCarousel({images, productTitle, loading = "lazy", className}: ProductImageCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();

    // =============================================================================
    // RENDER
    // =============================================================================

    // Single image - no carousel needed
    if (images.length <= 1) {
        const image = images[0];
        if (!image) {
            return <div className={cn("aspect-4/5 bg-muted/50 rounded-lg", className)} />;
        }

        return (
            <div className={cn("relative w-full overflow-hidden rounded-lg", className)}>
                <Image
                    alt={image.altText || productTitle}
                    aspectRatio="4/5"
                    data={image}
                    loading={loading}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="sleek product-image h-auto w-full object-cover group-hover:scale-[1.03] rounded-lg"
                />
            </div>
        );
    }

    // Multiple images - render carousel
    return (
        <div className={cn("relative w-full overflow-hidden rounded-lg", className)}>
            <Carousel
                setApi={setApi}
                opts={{
                    align: "start",
                    loop: true,
                    skipSnaps: false,
                    containScroll: "trimSnaps",
                    watchDrag: false // Disable trackpad/mouse drag - only arrow navigation
                }}
                className="w-full rounded-lg"
            >
                <CarouselContent className="ml-0">
                    {images.map((image, index) => (
                        <CarouselItem key={image.id ?? `product-image-${index}`} className="pl-0 basis-full">
                            <div className="overflow-hidden rounded-lg">
                                <Image
                                    alt={image.altText || `${productTitle} - Image ${index + 1}`}
                                    aspectRatio="4/5"
                                    data={image}
                                    loading={index === 0 ? loading : "lazy"}
                                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                                    className="sleek product-image h-auto w-full object-cover group-hover:scale-[1.03] rounded-lg"
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Navigation arrows - div[role=button] avoids illegal button-in-button nesting when
                this carousel renders inside an interactive parent (e.g., FullScreenSearch results).
                tabIndex and onKeyDown preserve full keyboard accessibility. */}
            <div
                role="button"
                tabIndex={0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 motion-overlay bg-primary border-0 hover:bg-primary/90 cursor-pointer"
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
                aria-label="Previous image"
            >
                <ArrowLeft className="size-4 text-primary-foreground" />
            </div>
            <div
                role="button"
                tabIndex={0}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 motion-overlay bg-primary border-0 hover:bg-primary/90 cursor-pointer"
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
                aria-label="Next image"
            >
                <ArrowRight className="size-4 text-primary-foreground" />
            </div>
        </div>
    );
}
