/**
 * @fileoverview ExploreCollectionsSection - Interactive collection preview cards
 *
 * @description
 * Collection showcase with hover/tap expansion effect on desktop and carousel on mobile.
 * Features adaptive layouts, responsive images, and touch-optimized interactions.
 *
 * @features
 * - **Desktop Expansion**: Hover/tap to expand cards with content reveal (flex-1 → flex-2)
 * - **Mobile Carousel**: Drag-to-scroll Embla Carousel for tablets and phones
 * - **Responsive Layouts**: Fixed-height desktop (420px-520px), carousel mobile/tablet
 * - **Touch Optimization**: Tap-once-to-expand, tap-twice-to-navigate on touch devices
 * - **Image Optimization**: Shopify Image with responsive srcset/sizes
 * - **CMS Integration**: Section title from site_settings metaobject
 *
 * @props
 * - collections: ExploreCollectionFragment[] - Shopify collections with images, titles, descriptions
 *
 * @related
 * - storefrontapi.generated.d.ts - ExploreCollectionFragment GraphQL type
 * - lib/site-content-context.ts - Section title configuration
 */

import {useState} from "react";
import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {cn} from "~/lib/utils";
import type {ExploreCollectionFragment} from "storefrontapi.generated";
import {useSectionHeadings} from "~/lib/site-content-context";

// ============================================================================
// Types and Utilities
// ============================================================================

interface ExploreCollectionsSectionProps {
    collections: ExploreCollectionFragment[];
}

/**
 * Format collection title to create a shorter marketing-style title
 * e.g., "Gentle Care Collection" -> "Gentle Care"
 * e.g., "New Arrivals" -> "New Arrivals"
 */
function formatShortTitle(title: string): string {
    // Remove common suffixes
    const suffixes = [" Collection", " Products", " Items", " Line"];
    let shortTitle = title;

    for (const suffix of suffixes) {
        if (shortTitle.endsWith(suffix)) {
            shortTitle = shortTitle.slice(0, -suffix.length);
            break;
        }
    }

    return shortTitle;
}

/**
 * Truncate description to a reasonable length for display
 */
function truncateDescription(description: string | null, maxLength: number = 80): string {
    if (!description) return "";
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength).trim() + "...";
}

export function ExploreCollectionsSection({collections}: ExploreCollectionsSectionProps) {
    // Track which card is expanded on touch devices (tap-to-expand)
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const {canHover} = usePointerCapabilities();
    const {collectionsTitle} = useSectionHeadings();

    // Handle tap on touch devices - toggle expansion
    const handleCardTap = (index: number) => {
        setExpandedIndex(prev => (prev === index ? null : index));
    };

    if (!collections || collections.length === 0) {
        return null;
    }

    return (
        <section className="py-12 md:py-16 lg:py-20">
            {/* Header - stacks on mobile, inline on tablet+ */}
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="m-0 font-serif text-xl font-medium text-primary md:text-3xl lg:text-4xl">
                    {collectionsTitle}
                </h2>
                <Link
                    to="/collections"
                    className={cn(
                        "motion-interactive motion-press hidden w-fit rounded-[var(--radius-pill-raw)] border-2 border-primary px-3 py-1.5 font-sans text-sm font-medium text-primary active:scale-[var(--motion-press-scale)] cursor-pointer sm:block sm:px-4 sm:py-2",
                        canHover
                            ? "hover:bg-primary hover:text-primary-foreground hover:no-underline"
                            : "active:bg-primary active:text-primary-foreground"
                    )}
                >
                    View all
                </Link>
            </div>

            {/* Desktop: Flex container with hover/tap expansion */}
            {/* Uses lg: breakpoint (1024px) to ensure tablets get carousel instead */}
            <div className="hidden lg:block">
                <div className="flex h-[420px] gap-3 xl:h-[480px] 2xl:h-[520px]">
                    {collections.map((collection, index) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                            isExpanded={expandedIndex === index}
                            onTap={() => handleCardTap(index)}
                        />
                    ))}
                </div>
            </div>

            {/* Mobile & Tablet: Embla Carousel (up to lg breakpoint) */}
            <div className="lg:hidden">
                <Carousel
                    opts={{align: "start", dragFree: true, loop: true}}
                    plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                    className="w-full"
                >
                    <CarouselContent className="-ml-3 sm:-ml-4">
                        {collections.map(collection => (
                            <CarouselItem key={collection.id} className="basis-[80%] sm:basis-[45%] pl-3 sm:pl-4">
                                <MobileCollectionCard collection={collection} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>

                {/* Mobile-only View all button - below carousel */}
                <div className="mt-6 flex justify-center sm:hidden">
                    <Link
                        to="/collections"
                        className={cn(
                            "motion-interactive motion-press rounded-[var(--radius-pill-raw)] border-2 border-primary px-3 sm:px-4 py-2 font-sans text-sm font-medium text-primary active:scale-[var(--motion-press-scale)] cursor-pointer",
                            canHover
                                ? "hover:bg-primary hover:text-primary-foreground hover:no-underline"
                                : "active:bg-primary active:text-primary-foreground"
                        )}
                    >
                        View all
                    </Link>
                </div>
            </div>
        </section>
    );
}

interface CollectionCardProps {
    collection: ExploreCollectionFragment;
    isExpanded: boolean;
    onTap: () => void;
}

/**
 * Desktop collection card with hover expansion effect
 * Supports both hover (mouse) and tap (touch) interactions
 *
 * Uses CSS @media (hover: hover) to detect hover capability:
 * - Hover devices: expand on hover, navigate on click
 * - Touch devices: tap once to expand/preview, tap again to navigate
 */
function CollectionCard({collection, isExpanded, onTap}: CollectionCardProps) {
    const {canHover} = usePointerCapabilities();
    const shortTitle = formatShortTitle(collection.title);
    const description = truncateDescription(collection.description);

    // Handle click: on touch devices, first tap expands, second tap navigates
    // On hover devices, click always navigates (expansion is via hover)
    const handleClick = (e: React.MouseEvent) => {
        // Check if this is a touch device (no hover capability)
        // We use matchMedia for reliable detection
        if (!canHover && !isExpanded) {
            // Touch device and card not expanded - expand instead of navigate
            e.preventDefault();
            onTap();
        }
        // Otherwise, let the Link navigate normally
    };

    return (
        <Link
            to={`/collections/${collection.handle}`}
            prefetch="viewport"
            onClick={handleClick}
            className={cn(
                "relative flex-1 cursor-pointer",
                "motion-interactive-strong",
                canHover
                    ? "group hover:flex-2 hover:no-underline"
                    : "motion-press active:scale-[var(--motion-press-scale)]",
                isExpanded && "flex-2"
            )}
        >
            {/* h-full instead of aspect-[3/4] so height stays fixed, only width changes on hover */}
            <div className="relative h-full overflow-hidden rounded-2xl">
                {/* Background Image - eager loading for above-fold section */}
                {collection.image && (
                    <Image
                        alt={collection.image.altText || collection.title}
                        data={collection.image}
                        loading="eager"
                        sizes="(min-width: 1024px) 25vw, 75vw"
                        className={cn(
                            "motion-image absolute inset-0 h-full w-full object-cover",
                            canHover && "group-hover:scale-[1.03]",
                            isExpanded && "scale-105"
                        )}
                    />
                )}

                {/* Fallback background if no image */}
                {!collection.image && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30" />
                )}

                {/* Gradient overlay - stronger gradient for better text readability */}
                <div
                    className={cn(
                        "motion-interactive absolute inset-0",
                        "bg-linear-to-t from-dark/80 via-dark/30 to-transparent",
                        canHover && "opacity-0 group-hover:opacity-100",
                        isExpanded && "opacity-100"
                    )}
                />

                {/* Text content - slides up on hover/tap */}
                <div
                    className={cn(
                        "absolute bottom-0 left-0 right-0 p-4 xl:p-5",
                        "motion-interactive translate-y-full",
                        canHover && "group-hover:translate-y-0",
                        isExpanded && "translate-y-0"
                    )}
                >
                    <h3 className="font-sans text-lg font-medium text-light drop-shadow-sm xl:text-xl 2xl:text-2xl">
                        {shortTitle}
                    </h3>
                    {description && (
                        <p className="mt-1 line-clamp-2 text-sm text-light/90 drop-shadow-sm">{description}</p>
                    )}
                </div>

                {/* Always-visible title at bottom (when not expanded) */}
                <div
                    className={cn(
                        "motion-interactive absolute bottom-4 left-4 right-4 xl:bottom-5 xl:left-5 xl:right-5",
                        canHover && "group-hover:opacity-0",
                        isExpanded && "opacity-0"
                    )}
                >
                    <h3 className="font-sans text-lg font-medium text-light drop-shadow-md xl:text-xl 2xl:text-2xl">
                        {shortTitle}
                    </h3>
                </div>
            </div>
        </Link>
    );
}

/**
 * Mobile & Tablet collection card - always shows text content (no hover state)
 * Used in carousel for screens < 1024px
 */
function MobileCollectionCard({collection}: {collection: ExploreCollectionFragment}) {
    const shortTitle = formatShortTitle(collection.title);
    const description = truncateDescription(collection.description, 80);

    return (
        <Link
            to={`/collections/${collection.handle}`}
            prefetch="viewport"
            className="group motion-link motion-press block hover:no-underline active:scale-[var(--motion-press-scale)] cursor-pointer"
        >
            {/* Consistent 3:4 aspect ratio across all mobile/tablet sizes */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl sm:rounded-3xl">
                {/* Background Image - lazy for carousel items below first viewport */}
                {collection.image && (
                    <Image
                        alt={collection.image.altText || collection.title}
                        data={collection.image}
                        loading="lazy"
                        sizes="(min-width: 768px) 45vw, (min-width: 640px) 55vw, 72vw"
                        className="motion-image absolute inset-0 h-full w-full object-cover group-active:scale-[1.03]"
                    />
                )}

                {/* Fallback background if no image */}
                {!collection.image && (
                    <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/30" />
                )}

                {/* Gradient overlay - always visible, stronger for readability */}
                <div className="absolute inset-0 bg-linear-to-t from-dark/75 via-dark/25 to-transparent" />

                {/* Text content - always visible with responsive sizing */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5">
                    <h3 className="font-sans text-base font-medium text-light drop-shadow-sm sm:text-lg md:text-xl">
                        {shortTitle}
                    </h3>
                    {description && (
                        <p className="mt-1 line-clamp-2 text-sm text-light/85 drop-shadow-sm sm:text-sm">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
