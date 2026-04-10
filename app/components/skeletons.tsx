/**
 * @fileoverview Skeleton Loading Components
 *
 * @description
 * Comprehensive library of skeleton components for loading states across the application.
 * All skeletons match the layout and dimensions of their real content counterparts to
 * prevent layout shift during loading. Includes product, article, collection, cart, and
 * order skeletons with staggered fade-in animations.
 *
 * @related
 * - ~/components/ui/skeleton - Base Skeleton primitive component
 * - ~/components/ProductItem - Real product card that skeleton mimics
 * - ~/components/blog/ArticleCard - Real article card that skeleton mimics
 */

import {Skeleton} from "~/components/ui/skeleton";
import {Card, CardContent} from "~/components/ui/card";
import {cn} from "~/lib/utils";

// ================================================================================
// Constants
// ================================================================================

/**
 * Static arrays to avoid array index key warnings
 * Used as keys for temporary skeleton placeholders in carousels/grids
 */
const SKELETON_4_IDS = ["sk-1", "sk-2", "sk-3", "sk-4"] as const;
const SKELETON_3_IDS = ["sk-1", "sk-2", "sk-3"] as const;

// ================================================================================
// Product Skeletons
// ================================================================================

/**
 * ProductCardSkeleton - Matches ProductItem card variant
 *
 * Uses 4:5 aspect ratio to match product images.
 * Includes image skeleton + two text lines (title and price).
 *
 * @param className - Optional CSS classes
 * @param index - Index for stagger animation delay
 * @param animate - Whether to apply fade-in animation (default: true)
 */
export function ProductCardSkeleton({
    className,
    index = 0,
    animate = true
}: {
    className?: string;
    index?: number;
    animate?: boolean;
}) {
    const staggerDelay = Math.min(index, 7) * 50;

    return (
        <div
            className={cn(animate && "animate-product-fade-in", className)}
            style={animate ? {animationDelay: `${staggerDelay}ms`} : undefined}
        >
            <Skeleton className="aspect-4/5 w-full rounded-2xl mb-3 sm:mb-4" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    );
}

/**
 * Product list item skeleton - matches ProductItem list variant
 * Horizontal layout with image + text
 */
export function ProductListSkeleton({
    className,
    index = 0,
    animate = true
}: {
    className?: string;
    index?: number;
    animate?: boolean;
}) {
    const staggerDelay = Math.min(index, 7) * 50;

    return (
        <div
            className={cn(
                "flex items-center gap-4 md:gap-6 py-4 pl-4 md:pl-6 border-b border-border/50",
                animate && "animate-product-fade-in",
                className
            )}
            style={animate ? {animationDelay: `${staggerDelay}ms`} : undefined}
        >
            <Skeleton className="w-20 h-[100px] md:w-24 md:h-[120px] shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-10 w-24 shrink-0 mr-4 md:mr-6 rounded-md" />
        </div>
    );
}

/**
 * Carousel skeleton - used for product carousels
 * Shows 4 skeleton items by default
 */
export function ProductCarouselSkeleton({count = 4, className}: {count?: number; className?: string}) {
    return (
        <div className={cn("flex gap-2 md:gap-3 overflow-hidden", className)}>
            {SKELETON_4_IDS.slice(0, count).map((id, index) => (
                <Card
                    key={id}
                    className="border-0 shadow-none py-0 overflow-hidden shrink-0 w-[55.5%] sm:w-[45%] lg:w-[32%]"
                >
                    <Skeleton className="aspect-4/5 w-full" />
                    <CardContent className="p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Grid skeleton - for product grids with configurable columns
 */
export function ProductGridSkeleton({
    count = 4,
    columns = 3,
    className
}: {
    count?: number;
    columns?: 1 | 2 | 3 | 4;
    className?: string;
}) {
    const gridClass =
        columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-4" : "grid-cols-3";

    return (
        <div className={cn("grid gap-2 sm:gap-3", gridClass, className)}>
            {Array.from({length: count}).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key -- Static skeleton items with configurable count
                <ProductCardSkeleton key={`grid-sk-${index}`} index={index} />
            ))}
        </div>
    );
}

/**
 * Article card skeleton - matches ArticleCard component
 * Uses 4:3 aspect ratio for article images
 */
export function ArticleCardSkeleton({
    className,
    index = 0,
    animate = true
}: {
    className?: string;
    index?: number;
    animate?: boolean;
}) {
    const staggerDelay = Math.min(index, 7) * 50;

    return (
        <div
            className={cn(animate && "animate-product-fade-in", className)}
            style={animate ? {animationDelay: `${staggerDelay}ms`} : undefined}
        >
            <Skeleton className="aspect-4/3 w-full rounded-2xl mb-4" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
            </div>
        </div>
    );
}

/**
 * Article carousel skeleton
 */
export function ArticleCarouselSkeleton({count = 4, className}: {count?: number; className?: string}) {
    return (
        <div className={cn("flex gap-2 md:gap-3 overflow-hidden", className)}>
            {SKELETON_4_IDS.slice(0, count).map((id, index) => (
                <Card
                    key={id}
                    className="border-0 shadow-none py-0 overflow-hidden shrink-0 w-[80%] sm:w-[45%] lg:w-[32%]"
                >
                    <Skeleton className="aspect-4/3 w-full" />
                    <CardContent className="p-3 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Collection card skeleton - matches SearchCollectionCard
 * Uses square aspect ratio
 */
export function CollectionCardSkeleton({
    className,
    index = 0,
    animate = true
}: {
    className?: string;
    index?: number;
    animate?: boolean;
}) {
    const staggerDelay = Math.min(index, 7) * 50;

    return (
        <div
            className={cn(animate && "animate-product-fade-in", className)}
            style={animate ? {animationDelay: `${staggerDelay}ms`} : undefined}
        >
            <Skeleton className="aspect-square w-full rounded-xl mb-3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2 mt-1" />
        </div>
    );
}

/**
 * Cart item skeleton - for cart drawer loading state
 */
export function CartItemSkeleton({index = 0}: {index?: number}) {
    const staggerDelay = Math.min(index, 7) * 50;

    return (
        <div className="flex gap-4 animate-product-fade-in" style={{animationDelay: `${staggerDelay}ms`}}>
            <Skeleton className="size-20 sm:size-24 rounded-md bg-overlay-light-hover shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-overlay-light-hover" />
                <Skeleton className="h-3 w-1/2 bg-overlay-light-hover" />
                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-8 w-24 bg-overlay-light-hover rounded-md" />
                    <Skeleton className="h-4 w-16 bg-overlay-light-hover" />
                </div>
            </div>
        </div>
    );
}

/**
 * Cart loading skeleton - for cart drawer
 */
export function CartLoadingSkeleton({itemCount = 3}: {itemCount?: number}) {
    return (
        <div className="space-y-4 p-4">
            {SKELETON_3_IDS.slice(0, itemCount).map((id, index) => (
                <CartItemSkeleton key={id} index={index} />
            ))}
            {/* Cart summary skeleton */}
            <div className="border-t border-border pt-4 mt-4 space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20 bg-overlay-light-hover" />
                    <Skeleton className="h-4 w-24 bg-overlay-light-hover" />
                </div>
                <Skeleton className="h-12 w-full bg-overlay-light-hover rounded-md" />
            </div>
        </div>
    );
}

/**
 * Order card skeleton - for account order history
 */
export function OrderCardSkeleton({index = 0}: {index?: number}) {
    const staggerDelay = Math.min(index, 7) * 50;

    return (
        <Card
            className="rounded-xl py-0 overflow-hidden animate-product-fade-in"
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex gap-2 mb-4">
                    <Skeleton className="size-12 rounded-lg" />
                    <Skeleton className="size-12 rounded-lg" />
                    <Skeleton className="size-12 rounded-lg" />
                </div>
                <div className="space-y-1 mb-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
            </CardContent>
        </Card>
    );
}

/**
 * Section header skeleton - for section titles
 */
export function SectionHeaderSkeleton({className}: {className?: string}) {
    return (
        <div className={cn("flex items-center justify-between mb-6 md:mb-8", className)}>
            <Skeleton className="h-8 md:h-10 w-48 md:w-64" />
            <Skeleton className="h-4 w-20" />
        </div>
    );
}

/**
 * Hero section skeleton - for homepage hero
 */
export function HeroSkeleton({className}: {className?: string}) {
    return (
        <div className={cn("relative w-full", className)}>
            <Skeleton className="aspect-video w-full rounded-none md:rounded-2xl" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <Skeleton className="h-12 w-3/4 max-w-lg bg-white/20" />
                <Skeleton className="h-6 w-1/2 max-w-md bg-white/20" />
                <Skeleton className="h-12 w-40 bg-white/20 rounded-full" />
            </div>
        </div>
    );
}

/**
 * Testimonial card skeleton
 */
export function TestimonialSkeleton({index = 0}: {index?: number}) {
    const staggerDelay = Math.min(index, 7) * 50;

    return (
        <Card className="p-6 animate-product-fade-in" style={{animationDelay: `${staggerDelay}ms`}}>
            <div className="flex items-center gap-3 mb-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
            </div>
        </Card>
    );
}

/**
 * Instagram post skeleton
 */
export function InstagramPostSkeleton({index = 0}: {index?: number}) {
    const staggerDelay = Math.min(index, 7) * 50;

    return (
        <div className="animate-product-fade-in" style={{animationDelay: `${staggerDelay}ms`}}>
            <Skeleton className="aspect-square w-full rounded-lg" />
        </div>
    );
}

/**
 * Related products carousel skeleton
 * Used in product pages and cart for recommended items
 * Matches the carousel layout with responsive widths
 */
export function RelatedProductsSkeleton({count = 4, className}: {count?: number; className?: string}) {
    return (
        <div className={cn("flex gap-2 md:gap-3 overflow-hidden", className)}>
            {SKELETON_4_IDS.slice(0, count).map((id, index) => (
                <Card
                    key={id}
                    className="border-0 shadow-none py-0 overflow-hidden shrink-0 basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%] animate-product-fade-in"
                    style={{animationDelay: `${Math.min(index, 7) * 50}ms`}}
                >
                    <Skeleton className="aspect-4/5 w-full" />
                    <CardContent className="p-0 pt-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Recently viewed products carousel skeleton
 * Used in homepage and product pages for browsing history
 * Matches the carousel layout with responsive widths
 */
export function RecentlyViewedSkeleton({count = 4, className}: {count?: number; className?: string}) {
    return (
        <div className={cn("flex gap-2 md:gap-3 overflow-hidden", className)}>
            {SKELETON_4_IDS.slice(0, count).map((id, index) => (
                <Card
                    key={id}
                    className="border-0 shadow-none py-0 overflow-hidden shrink-0 basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%] animate-product-fade-in"
                    style={{animationDelay: `${Math.min(index, 7) * 50}ms`}}
                >
                    <Skeleton className="aspect-4/5 w-full" />
                    <CardContent className="p-0 pt-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
