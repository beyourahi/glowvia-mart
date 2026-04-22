/**
 * @fileoverview Product Item/Card Component
 *
 * @description
 * Reusable product card component used throughout the storefront for displaying
 * products in grids, carousels, and lists. Supports multiple display variants
 * and responsive typography scaling based on grid density.
 *
 * @features
 * - Card and list layout variants
 * - Image carousel with hover navigation
 * - Quick add to cart button
 * - Wishlist toggle button
 * - Discount badge display
 * - Responsive font sizing based on grid columns
 * - Lazy/eager loading for images
 *
 * @usage-locations
 * - Collection pages (grid view)
 * - Search results
 * - Related products sections
 * - Homepage curated collections
 * - Recently viewed sections
 *
 * @accessibility
 * - WCAG compliant font sizes (min 12px)
 * - Semantic link structure
 * - Alt text for product images
 * - Focus states for interactive elements
 *
 * @related
 * - ProductPrice.tsx - Price display component
 * - QuickAddButton.tsx - Add to cart action
 * - ProductImageCarousel.tsx - Image slider
 * - WishlistButton.tsx - Save to wishlist
 */

import * as React from "react";
import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import type {
    ProductItemFragment,
    CollectionItemFragment,
    CuratedProductFragment,
    CartSuggestionProductFragment,
    MoneyFragment
} from "storefrontapi.generated";
import {useVariantUrl} from "~/lib/variants";
import {ProductPrice} from "~/components/ProductPrice";
import {DiscountBadge} from "~/components/DiscountBadge";
import {QuickAddButton} from "~/components/QuickAddButton";
import {ProductImageCarousel} from "~/components/ProductImageCarousel";
import {ProductCardVideo} from "~/components/ProductCardVideo";
import {getCardVideoMedia} from "~/lib/product/product-card-media";
import {WishlistButton} from "~/components/WishlistButton";
import {PinIcon} from "~/components/PinIcon";
import {ProductBadgeStack} from "~/components/ProductBadge";
import {ProductTitle} from "~/components/ProductTitle";
import {analyzeProductDiscount, type DiscountBadgeInfo, type ProductWithVariants} from "~/lib/discounts";
import {getSpecialTags} from "~/lib/product-tags";
import {OUT_OF_STOCK_LABEL} from "~/lib/product/product-card-utils";
import {cn} from "~/lib/utils";
import type {GridColumns} from "~/lib/gridColumns";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";

// =============================================================================
// TYPOGRAPHY UTILITIES
// =============================================================================

/**
 * Get dynamic font size classes based on grid columns and view mode.
 *
 * Typography Scale (px):
 * - text-sm: 14px  | text-base: 16px  | text-lg: 18px
 * - text-xl: 20px  | text-2xl: 24px
 *
 * Font sizing strategy:
 * - 2-col: 18px → 20px → 24px titles, 16px prices
 * - 3-col: 16px titles, 16px prices
 * - 4-col: 14px → 16px titles, 16px prices
 * - list: 18px → 20px → 24px titles, 16px prices
 * - undefined: Default (matches 3-col for cohesive sizing)
 *
 * Bounds: Names 14-24px, Prices 16px (WCAG readable)
 */
export function getProductFontSizes(gridColumns: GridColumns | undefined, variant: "card" | "list") {
    // List variant - optimized for horizontal layout with full width
    // 18px → 20px → 24px titles, 16px prices
    if (variant === "list") {
        return {
            title: "text-lg sm:text-xl lg:text-2xl", // 18px → 20px → 24px
            price: "text-base" // 16px
        };
    }

    // Card variant with grid-based sizing
    switch (gridColumns) {
        case 2:
            // 2-col: 18px → 20px → 24px titles, 16px prices
            return {
                title: "text-lg sm:text-xl lg:text-2xl", // 18px → 20px → 24px
                price: "text-base" // 16px
            };
        case 3:
            // 3-col: 16px titles, 16px prices
            return {
                title: "text-base lg:text-base", // 16px
                price: "text-base" // 16px
            };
        case 4:
            // 4-col: 14px → 16px titles, 16px prices
            return {
                title: "text-sm sm:text-base lg:text-base", // 14px → 16px
                price: "text-base" // 16px
            };
        case 1:
        case undefined:
        default:
            // Default sizing for carousels, related products (matches 3-col collection default)
            // 16px titles, 16px prices — cohesive with collection page
            return {
                title: "text-base lg:text-base", // 16px
                price: "text-base" // 16px
            };
    }
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Layout variant types for ProductItem
 * - default: Standard product card (current behavior)
 * - featured: Larger card for hero sections (not yet implemented)
 * - compact: Smaller card with minimal padding (not yet implemented)
 * - bento-large: 2×2 grid space for bento layouts
 * - bento-small: 1×1 grid space for bento layouts
 */
type ProductItemLayoutVariant = "default" | "featured" | "compact" | "bento-large" | "bento-small";

/**
 * Image aspect ratio options
 */
type ImageAspectRatio = "square" | "portrait" | "landscape" | "auto";

interface ProductItemProps {
    product: CollectionItemFragment | ProductItemFragment | CuratedProductFragment | CartSuggestionProductFragment;
    loading?: "eager" | "lazy";
    className?: string;
    /**
     * Visual mode - card (vertical) or list (horizontal)
     */
    variant?: "card" | "list";
    index?: number;
    /**
     * Grid columns for dynamic font sizing.
     * - 2: Large fonts (spacious 2-column layout)
     * - 3: Medium fonts (balanced 3-column layout)
     * - 4: Smaller fonts (dense 4-column layout)
     * - undefined: Default sizing for pages without grid selector (carousels, related products)
     */
    gridColumns?: GridColumns;
    /** Optional override for discount percentage. If provided, shows "upto X% off" */
    discountPercentage?: number;

    // === NEW ENHANCEMENT PROPS ===

    /**
     * Layout variant for special card sizes/styles
     * @default "default"
     */
    layoutVariant?: ProductItemLayoutVariant;

    /**
     * Override default image aspect ratio
     * @default "auto" (uses aspect-4/5 for card, fixed dimensions for list)
     */
    imageAspectRatio?: ImageAspectRatio;

    /**
     * Compact mode - reduced padding, smaller text, minimal features
     * @default false
     */
    compactMode?: boolean;

    /**
     * Show/hide vendor name below title
     * @default true
     */
    showVendor?: boolean;

    /**
     * Show/hide all badges (discount, product badges)
     * @default true
     */
    showBadges?: boolean;

    /**
     * Show/hide quick add button
     * @default true
     */
    showQuickAdd?: boolean;

    /**
     * Show/hide wishlist button
     * @default true
     */
    showWishlist?: boolean;

    /**
     * Show/hide variant color swatches
     * @default true
     */
    showSwatches?: boolean;

    /**
     * Custom link URL override (e.g., for order history linking to order details)
     * @default null (uses /products/{handle})
     */
    customLink?: string | null;

    /**
     * Link target attribute
     * @default "_self"
     */
    linkTarget?: "_self" | "_blank";

    /**
     * Label above price (e.g., "Price Paid", "Sale Price")
     * @default null
     */
    priceLabel?: string | null;

    /**
     * Custom price override (e.g., historical order price)
     * @default null (uses product.priceRange)
     */
    customPrice?: MoneyFragment | null;

    /**
     * Hide compare-at price strikethrough
     * @default false
     */
    hideComparePrice?: boolean;

    /**
     * Additional metadata to display below price
     * @default []
     */
    metadata?: Array<{label: string; value: React.ReactNode}>;

    /**
     * Custom action buttons to replace/supplement default actions
     * @default null
     */
    customActions?: React.ReactNode | null;

    /**
     * Hide default actions (wishlist, quick add) - used with customActions
     * @default false
     */
    hideDefaultActions?: boolean;

    /**
     * Dark context mode - inverts colors for dark backgrounds (e.g., cart sheet)
     * Uses primary-foreground (light) instead of primary (dark) for text
     * @default false
     */
    darkContext?: boolean;

    /**
     * Show quick add button only on large screens (lg breakpoint and above)
     * Used in cart suggestions context to preserve mobile space
     * @default false
     */
    quickAddLargeScreenOnly?: boolean;

    /**
     * Skip opening cart drawer after quick add (used when already inside cart)
     * @default false
     */
    skipCartOpen?: boolean;

    /**
     * Order history context - changes QuickAddButton label to "Buy Again"
     * Used when displaying products from customer's order history
     * @default false
     */
    orderHistoryContext?: boolean;
    /**
     * Additional className forwarded directly to QuickAddButton — used for
     * context-specific overrides (e.g. height reduction in Cart Suggestions).
     * Merged on top of any compactMode-derived classes.
     * @default undefined
     */
    quickAddClassName?: string;
}

export function ProductItem({
    product,
    loading,
    className,
    variant = "card",
    index = 0,
    gridColumns,
    discountPercentage: discountPercentageProp,
    // New enhancement props with defaults
    layoutVariant = "default",
    imageAspectRatio = "auto",
    compactMode = false,
    showVendor = true,
    showBadges = true,
    showQuickAdd = true,
    showWishlist = true,
    showSwatches = true,
    customLink = null,
    linkTarget = "_self",
    priceLabel = null,
    customPrice = null,
    hideComparePrice = false,
    metadata = [],
    customActions = null,
    hideDefaultActions = false,
    darkContext = false,
    quickAddLargeScreenOnly = false,
    skipCartOpen = false,
    orderHistoryContext = false,
    quickAddClassName
}: ProductItemProps) {
    // Get dynamic font sizes based on grid columns and variant
    const fontSizes = getProductFontSizes(gridColumns, variant);
    const {canHover} = usePointerCapabilities();
    const variantUrl = useVariantUrl(product.handle);
    const featuredImage = product.featuredImage;

    // Determine final link URL (custom override or default product page)
    const linkUrl = customLink || variantUrl;

    // Get vendor if available and showVendor is true
    const vendorName = ("vendor" in product && showVendor ? product.vendor : undefined) as string | undefined;

    // Determine image aspect ratio class
    const getImageAspectClass = () => {
        if (imageAspectRatio === "auto") return "aspect-4/5"; // Default for cards
        if (imageAspectRatio === "square") return "aspect-square";
        if (imageAspectRatio === "portrait") return "aspect-[3/4]";
        if (imageAspectRatio === "landscape") return "aspect-video";
        return "aspect-4/5";
    };

    // Layout variant styling (for bento grid and other special layouts)
    const getLayoutVariantClasses = () => {
        switch (layoutVariant) {
            case "bento-large":
                return {
                    container: "col-span-2 row-span-2",
                    image: "aspect-[3/4]", // Portrait for large cards
                    text: compactMode ? "text-sm" : "text-base",
                    padding: compactMode ? "p-2" : "p-4"
                };
            case "bento-small":
                return {
                    container: "col-span-1 row-span-1",
                    image: "aspect-square",
                    text: "text-sm",
                    padding: "p-2"
                };
            case "compact":
                return {
                    container: "",
                    image: "aspect-square",
                    text: "text-sm",
                    padding: "p-2"
                };
            case "featured":
                return {
                    container: "",
                    image: "aspect-[3/4]",
                    text: "text-lg",
                    padding: "p-6"
                };
            case "default":
            default:
                return {
                    container: "",
                    image: getImageAspectClass(),
                    text: "",
                    padding: "" // No padding for default - preserves original ProductItem behavior
                };
        }
    };

    const layoutClasses = getLayoutVariantClasses();

    // Get all product images for carousel (with type narrowing)
    const productImages =
        "images" in product && product.images?.nodes?.length > 0
            ? product.images.nodes
            : featuredImage
              ? [featuredImage]
              : [];

    // Video-first media: if the first media asset on the product is a Video,
    // render it in place of the default product image. Falls back to images
    // for non-video products (preserves existing behavior).
    const cardVideoMedia = getCardVideoMedia(product);

    // Analyze discount from product variant data
    // If discountPercentageProp is provided, use legacy behavior
    const discountInfo: DiscountBadgeInfo | undefined = discountPercentageProp
        ? undefined
        : analyzeProductDiscount(product as ProductWithVariants);

    // Get special tags for badges and pin icon
    // Uses product.tags array from Shopify GraphQL
    const productTags = "tags" in product ? product.tags : undefined;
    const specialTags = getSpecialTags(productTags);

    // Stagger delay: cap at 12 items (480ms max) for elegant cascade without being too slow
    const staggerDelay = Math.min(index, 11) * 40;

    // OOS state: product.availableForSale is always present in all fragment types
    const isOutOfStock = !product.availableForSale;

    // List variant - horizontal layout
    if (variant === "list") {
        return (
            <Link
                to={linkUrl}
                target={linkTarget}
                prefetch="viewport"
                className={cn(
                    "flex items-center gap-4 md:gap-6 py-4 md:pl-6 no-underline cursor-pointer",
                    canHover ? "group motion-interactive motion-surface hover:bg-muted/30" : "motion-press active:bg-muted/30",
                    "animate-product-fade-in",
                    "relative overflow-visible",
                    compactMode && "py-2 gap-2 md:gap-3",
                    layoutClasses.container,
                    className
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {/* Pin icon - positioned relative to Link wrapper for highest z-index */}
                {specialTags.isPinned && <PinIcon size="default" className="absolute -top-2 -left-1 z-100" />}

                {/* Fixed dimensions for consistent list view layout */}
                {/* 80x100px mobile (4:5 ratio), 96x120px desktop */}
                <div className="relative w-20 h-25 md:w-24 md:h-30 shrink-0 overflow-hidden rounded-lg bg-muted/50">
                    {featuredImage ? (
                        <Image
                            alt={featuredImage.altText || product.title}
                            data={featuredImage}
                            loading={loading}
                            sizes="96px"
                            className={cn(
                                "w-full h-full object-cover motion-image rounded-lg",
                                canHover && "group-hover:scale-105"
                            )}
                        />
                    ) : (
                        <ProductImagePlaceholder compact className="w-full h-full rounded-lg" />
                    )}
                    {/* Hover overlay for list variant */}
                    <div className={cn(
                        "absolute inset-0 bg-primary/0 motion-overlay rounded-lg",
                        canHover && "group-hover:bg-primary/5"
                    )} />
                </div>

                {/* Product info inline */}
                <div className="flex-1 min-w-0 space-y-1">
                    {/* Badge row - discount badge + special tags inline */}
                    {showBadges && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* Discount badge */}
                            {discountPercentageProp ? (
                                <DiscountBadge percentage={discountPercentageProp} position="inline" />
                            ) : (
                                discountInfo &&
                                discountInfo.type !== "none" && (
                                    <DiscountBadge discountInfo={discountInfo} position="inline" />
                                )
                            )}
                            {/* Special tags badges - inline for list view */}
                            {specialTags.badgeTypes.map(type => (
                                <span
                                    key={type}
                                    className={cn(
                                        "text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded-full shadow-md",
                                        type === "premium" && "bg-secondary text-secondary-foreground",
                                        type === "preorder" && "bg-muted text-muted-foreground",
                                        type === "newArrival" && "bg-accent text-accent-foreground",
                                        type === "clearance" && "bg-destructive/20 text-foreground"
                                    )}
                                >
                                    {type === "premium"
                                        ? "Premium"
                                        : type === "preorder"
                                          ? "Pre-Order"
                                          : type === "newArrival"
                                            ? "New"
                                            : "Clearance"}
                                </span>
                            ))}
                        </div>
                    )}
                    <ProductTitle
                        title={product.title}
                        gridColumns={gridColumns}
                        variant="list"
                        compactMode={compactMode}
                        darkContext={darkContext}
                    />
                    {vendorName && !compactMode && (
                        <p
                            className={cn(
                                "text-sm truncate",
                                darkContext ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                        >
                            {vendorName}
                        </p>
                    )}
                    <div className="space-y-0.5">
                        {priceLabel && (
                            <p
                                className={cn(
                                    "text-sm",
                                    darkContext ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}
                            >
                                {priceLabel}
                            </p>
                        )}
                        <div
                            className={cn(
                                "font-mono tabular-nums",
                                darkContext ? "text-primary-foreground" : "text-primary",
                                fontSizes.price
                            )}
                        >
                            {customPrice ? (
                                <ProductPrice
                                    price={customPrice}
                                    maxPrice={hideComparePrice ? undefined : product.priceRange.maxVariantPrice}
                                    darkContext={darkContext}
                                />
                            ) : (
                                <ProductPrice
                                    product={product}
                                    showBadge={false}
                                    compactMode={compactMode}
                                    darkContext={darkContext}
                                />
                            )}
                        </div>
                    </div>
                    {/* Additional metadata display */}
                    {metadata.length > 0 && (
                        <div
                            className={cn(
                                "space-y-0.5 text-sm",
                                darkContext ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                        >
                            {metadata.map(item => (
                                <div key={item.label} className="flex items-center gap-1.5">
                                    <span className="font-medium">{item.label}:</span>
                                    <span>{item.value as React.ReactNode}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action button group - Custom actions or default (Quick Add + Wishlist) */}
                {customActions ? (
                    <div className="flex items-center gap-2 md:gap-3 shrink-0 md:mr-6">{customActions}</div>
                ) : !hideDefaultActions ? (
                    <div className="flex items-center gap-2 md:gap-3 shrink-0 md:mr-6">
                        {showQuickAdd && "variants" in product && (
                            <QuickAddButton
                                product={product}
                                iconOnlyMobile
                                largeScreenOnly={quickAddLargeScreenOnly}
                                skipCartOpen={skipCartOpen}
                                orderHistoryContext={orderHistoryContext}
                            />
                        )}
                        {showWishlist && (
                            <WishlistButton
                                productId={product.id}
                                productTitle={product.title}
                                variant="primary-outline"
                            />
                        )}
                    </div>
                ) : null}
            </Link>
        );
    }

    // Card variant - default grid layout
    return (
        <Link
            to={linkUrl}
            target={linkTarget}
            prefetch="viewport"
            className={cn(
                "block no-underline animate-product-fade-in cursor-pointer relative overflow-visible rounded-lg",
                canHover ? "group motion-surface" : "motion-press active:scale-[var(--motion-press-scale)]",
                // Muted visual treatment for out-of-stock products: reduced opacity + desaturated
                // opacity-[0.82] keeps text legible; saturate(0.65) signals unavailability without
                // making the card invisible — both preserve WCAG contrast minimums
                isOutOfStock && "opacity-[0.82] [filter:saturate(0.65)]",
                layoutClasses.container,
                className
            )}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            {/* Pin icon - positioned relative to Link wrapper to escape overflow-x-clip */}
            {/* Must be outside the image container which clips horizontal overflow */}
            {specialTags.isPinned && (
                <PinIcon size="default" className="absolute -top-2 -left-2 sm:-top-2.5 sm:-left-2.5 z-100" />
            )}

            {/* Product Image / Carousel */}
            {/* overflow-hidden clips the scaled image, rounded-lg matches card container */}
            <div
                className={cn(
                    "relative overflow-hidden rounded-lg bg-muted/50",
                    compactMode ? "mb-2" : "mb-3 sm:mb-4",
                    layoutClasses.padding
                )}
            >
                {/* Badge stack - OOS (topmost) + discount + special tags (below pin icon) */}
                {/* When pinned, push badges down to avoid collision with pin icon */}
                {showBadges && (
                    <div
                        className={cn(
                            "absolute left-2 z-20 flex flex-col items-start gap-1",
                            specialTags.isPinned ? "top-6 sm:top-7" : "top-2"
                        )}
                    >
                        {/* Out of Stock badge - rendered first so it sits topmost in the stack */}
                        {/* Uses secondary token (same as Premium badge) for neutral, non-alarming tone */}
                        {isOutOfStock && (
                            <span
                                className="inline-flex items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-destructive-foreground shadow-md"
                                role="status"
                                aria-label="Out of stock"
                            >
                                {OUT_OF_STOCK_LABEL}
                            </span>
                        )}
                        {/* Discount badge - primary, with emerald shimmer */}
                        {discountPercentageProp ? (
                            <DiscountBadge percentage={discountPercentageProp} position="inline" />
                        ) : (
                            discountInfo &&
                            discountInfo.type !== "none" && (
                                <DiscountBadge discountInfo={discountInfo} position="inline" />
                            )
                        )}
                        {/* Special tags badges - Premium, Pre-Order, New, Clearance */}
                        {specialTags.badgeTypes.length > 0 && <ProductBadgeStack types={specialTags.badgeTypes} />}
                    </div>
                )}

                {/* Wishlist button - top-right with enhanced touch target and discoverability
                     - animateOnParentHover enables subtle breathing animation when card is hovered
                     - Enhanced touch targets ensure WCAG 2.5.5 compliance on mobile */}
                {showWishlist && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
                        <WishlistButton
                            productId={product.id}
                            productTitle={product.title}
                            size={compactMode ? "sm" : "default"}
                            variant="floating"
                            animateOnParentHover
                        />
                    </div>
                )}

                {/* Product media — video first when available, otherwise image carousel */}
                {cardVideoMedia ? (
                    <ProductCardVideo
                        sources={cardVideoMedia.sources}
                        previewImage={cardVideoMedia.previewImage}
                        alt={cardVideoMedia.alt}
                        productTitle={product.title}
                        loading={loading}
                        isOutOfStock={isOutOfStock}
                    />
                ) : productImages.length > 0 ? (
                    <ProductImageCarousel images={productImages} productTitle={product.title} loading={loading} isOutOfStock={isOutOfStock} />
                ) : (
                    <ProductImagePlaceholder aspectRatio="4/5" />
                )}

                {/* OOS image treatment: semi-transparent overlay + diagonal strike-through */}
                {/* overflow-hidden on parent clips both to image bounds; pointer-events-none */}
                {/* preserves all click targets; z-[11]/z-[12] sits above image, below badges (z-20) */}
                {isOutOfStock && (
                    <>
                        <div
                            className="absolute inset-0 bg-white/40 pointer-events-none z-[11]"
                            aria-hidden="true"
                        />
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-none z-[12]"
                            viewBox="0 0 1 1"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <line
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                                stroke="rgba(0,0,0,0.28)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                    </>
                )}

                {/* Hover overlay - subtle darkening effect */}
                <div className={cn(
                    "absolute inset-0 bg-primary/0 motion-overlay pointer-events-none z-10",
                    canHover && !isOutOfStock && "group-hover:bg-primary/5"
                )} />

                {/* Quick Add Button or Custom Actions - full width at bottom, visible on mobile, show on hover for desktop */}
                {customActions ? (
                    <div className={cn(
                        "absolute bottom-0 left-0 right-0 p-2 sm:p-3 z-20 motion-overlay",
                        canHover && "md:opacity-0 md:group-hover:opacity-100"
                    )}>
                        {customActions}
                    </div>
                ) : !hideDefaultActions && showQuickAdd && "variants" in product ? (
                    <div className={cn(
                        "absolute bottom-0 left-0 right-0 p-2 sm:p-3 z-20 motion-overlay",
                        canHover && "md:opacity-0 md:group-hover:opacity-100"
                    )}>
                        <QuickAddButton
                            product={product}
                            fullWidth
                            largeScreenOnly={quickAddLargeScreenOnly}
                            skipCartOpen={skipCartOpen}
                            orderHistoryContext={orderHistoryContext}
                            className={cn(compactMode ? "text-sm sm:text-sm" : undefined, quickAddClassName)}
                        />
                    </div>
                ) : null}
            </div>

            {/* Product Details */}
            <div className={cn(
                "space-y-1",
                canHover ? "motion-link group-hover:text-primary" : "",
                compactMode && "space-y-0.5"
            )}>
                <ProductTitle
                    title={product.title}
                    gridColumns={gridColumns}
                    variant="card"
                    compactMode={compactMode}
                    darkContext={darkContext}
                />
                {vendorName && !compactMode && (
                    <p
                        className={cn(
                            "text-sm truncate",
                            darkContext ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                    >
                        {vendorName}
                    </p>
                )}
                <div className="space-y-0.5">
                    {priceLabel && (
                        <p
                            className={cn(
                                "text-sm",
                                darkContext ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                        >
                            {priceLabel}
                        </p>
                    )}
                    <div
                        className={cn(
                            "font-mono tabular-nums",
                            darkContext ? "text-primary-foreground" : "text-primary",
                            fontSizes.price
                        )}
                    >
                        {customPrice ? (
                            <ProductPrice
                                price={customPrice}
                                maxPrice={hideComparePrice ? undefined : product.priceRange.maxVariantPrice}
                                darkContext={darkContext}
                            />
                        ) : (
                            <ProductPrice
                                product={product}
                                showBadge={false}
                                compactMode={compactMode}
                                darkContext={darkContext}
                            />
                        )}
                    </div>
                </div>
                {/* Additional metadata display */}
                {metadata.length > 0 && (
                    <div
                        className={cn(
                            "space-y-0.5 text-sm",
                            darkContext ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                    >
                        {metadata.map(item => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <span className="font-medium">{item.label}:</span>
                                <span>{item.value as React.ReactNode}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
