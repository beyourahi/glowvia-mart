/**
 * @fileoverview Desktop variant selection dialog for quick add to cart
 *
 * @description
 * Modal dialog for selecting product variants on desktop (md breakpoint and above).
 * Features horizontal layout with images on left and options on right, pill-style
 * variant selectors, quantity control, and add to cart button.
 *
 * @features
 * - Horizontal layout: Images left, options right (desktop optimized)
 * - Vertical scrolling image gallery with smooth scroll
 * - Pill-style variant option buttons
 * - Auto-selects first available variant on open
 * - Integrated quantity selector
 * - Add to cart with price display
 * - Auto-closes on successful add (no cart drawer interruption)
 * - Body scroll lock when open
 * - Event bubbling prevention (safe inside clickable cards)
 * - Tag badges above product title (shared ProductTagList primitive)
 * - Lenis scroll prevention for smooth scrolling
 *
 * @props
 * - product: QuickAddProduct - Product data with variants and images
 * - open: boolean - Dialog open state (controlled)
 * - onOpenChange: (open: boolean) => void - Dialog state change handler
 *
 * @usage
 * ```tsx
 * <QuickAddDialog
 *   product={product}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 *
 * @related
 * - QuickAddButton.tsx - Trigger button component
 * - QuickAddSheet.tsx - Mobile bottom sheet variant
 * - QuantitySelector.tsx - Quantity input component
 * - CartForm - Shopify Hydrogen cart mutation component
 *
 * @architecture
 * - Controlled dialog state from parent component
 * - Local state for selected variant and quantity
 * - useFetcher for cart submission (explicit control)
 * - Auto-reset state on close
 * - Auto-select first variant on open
 * - Dialog closes on successful submission (cart drawer does not open)
 *
 * @see {@link https://shopify.dev/docs/api/hydrogen/2024-01/components/cartform}
 */

import {useState, useEffect, useMemo, useCallback, useRef} from "react";
import {useFetcher} from "react-router";
import {CartForm, Image} from "@shopify/hydrogen";
import {Loader2, Share2} from "lucide-react";
import {cn} from "~/lib/utils";
import {useScrollLock} from "~/hooks/useScrollLock";
import {Money} from "~/components/Money";
import {QuantitySelector} from "~/components/QuantitySelector";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "~/components/ui/dialog";
import {ColorSwatch} from "~/components/ui/color-swatch";
import {isColorOption, getSwatchFromColorName, hasColorMapping} from "~/lib/color-name-map";
import {WishlistButton} from "~/components/WishlistButton";
import {SizeChartButtonCompact} from "~/components/SizeChartButton";
import type {SizeChartData} from "~/lib/size-chart";
import {toast} from "sonner";
import {getButtonLabel} from "~/lib/product-tags";
import {BuyNowButton} from "~/components/BuyNowButton";
import {ProductTagList} from "~/components/product/ProductTagList";
import {parseProductTitle} from "~/lib/product";
import {OUT_OF_STOCK_LABEL} from "~/lib/product/product-card-utils";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";
import {getCardVideoMedia, type CardVideoMedia} from "~/lib/product/product-card-media";
import {extractImagesFromMedia} from "~/lib/media-utils";
import {ProductMediaThumb} from "~/components/ProductMediaThumb";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Types for the quick add dialog (matching QuickAddButton types)
 */
interface QuickAddVariant {
    id: string;
    availableForSale: boolean;
    title?: string;
    selectedOptions?: Array<{name: string; value: string}>;
    price: {amount: string; currencyCode: string};
    compareAtPrice?: {amount: string; currencyCode: string} | null;
}

interface QuickAddImage {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
}

/**
 * Loose media shape — accepts the raw Shopify media union (MediaImage | Video)
 * from any product fragment that fetches `media(first: N) { nodes { ... } }`.
 * getCardVideoMedia reads __typename to decide if the first node is a Video.
 */
type QuickAddMediaNode = {
    __typename?: string | null;
    [key: string]: unknown;
};

interface QuickAddProduct {
    id: string;
    title: string;
    handle: string;
    tags?: string[];
    featuredImage?: QuickAddImage | null;
    images?: {
        nodes: QuickAddImage[];
    };
    media?: {
        nodes: QuickAddMediaNode[];
    } | null;
    priceRange: {
        minVariantPrice: {amount: string; currencyCode: string};
        maxVariantPrice: {amount: string; currencyCode: string};
    };
    variants: {
        nodes: QuickAddVariant[];
    };
}

interface QuickAddDialogProps {
    product: QuickAddProduct;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Optional size chart data - if provided, shows size guide button */
    sizeChart?: SizeChartData | null;
}

interface QuickAddCartButtonProps {
    variant: QuickAddVariant;
    quantity: number;
    onSuccess: () => void;
    buttonLabel: string;
    productId: string;
    productTitle: string;
    productHandle: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * QuickAddDialog - Desktop modal for variant selection
 *
 * @param product - Product data with variants and images
 * @param open - Dialog open state (controlled by parent)
 * @param onOpenChange - Callback when dialog should open/close
 * @returns Desktop dialog with horizontal layout and variant selection
 *
 * Layout:
 * - Left side: Vertical scrolling image gallery (60dvh height)
 * - Right side: Product info, variant options, quantity, add to cart
 * - Max width: 3xl (48rem)
 * - Responsive images with aspect-4/5 ratio
 *
 * State Management:
 * - Local state for selected variant ID and quantity
 * - Auto-selects first available variant when dialog opens
 * - Resets state when dialog closes
 * - useFetcher for explicit cart submission control
 *
 * Variant Selection:
 * - groupVariantsByOption() creates option groups (Color, Size, etc.)
 * - findVariantByOptions() finds matching variant for selection
 * - Only available variants are selectable (disabled state otherwise)
 * - Pill-style buttons with selected/unselected states
 *
 * Cart Integration:
 * - useFetcher submits CartForm.ACTIONS.LinesAdd
 * - Opens cart drawer on successful submission
 * - Closes dialog after successful add
 * - Loading state with spinner
 *
 * Scroll Handling:
 * - useScrollLock prevents background Lenis scrolling (ref-counted)
 * - data-lenis-prevent on scrollable areas
 * - Smooth vertical scroll for images
 */
export function QuickAddDialog({product, open, onOpenChange, sizeChart}: QuickAddDialogProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

    // Labels: add-to-cart uses "Add to Bag", buy-now uses "Get it now" (both respect preorder)
    const buttonLabel = getButtonLabel(product.tags, "Add to Bag");
    const buyNowLabel = getButtonLabel(product.tags, "Get it now");

    // Lock Lenis smooth scroll when dialog is open (native scroll lock handled by Radix)
    useScrollLock(open);

    // Get available variants — memoized so the useEffect dep below is stable
    const availableVariants = useMemo(
        () => product.variants.nodes.filter(v => v.availableForSale),
        [product.variants.nodes]
    );

    // Handle share button click
    const handleShare = useCallback(async () => {
        const productUrl = `${window.location.origin}/products/${product.handle}`;

        // Try Web Share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    url: productUrl
                });
                return;
            } catch {
                // User cancelled or error, fall through to clipboard
            }
        }

        // Fallback to clipboard copy
        try {
            await navigator.clipboard.writeText(productUrl);
            toast.success("Link copied to clipboard!");
        } catch {
            toast.error("Failed to copy link");
        }
    }, [product.handle, product.title]);

    // Get all product images — prefer media (already fetched) over the redundant images field
    const productImages: QuickAddImage[] = (() => {
        const mediaImages = extractImagesFromMedia(product.media?.nodes as Parameters<typeof extractImagesFromMedia>[0]);
        if (mediaImages.length > 0) return mediaImages;
        if (product.featuredImage) return [product.featuredImage];
        return [];
    })();

    // Detect primary-media video — first slide in the gallery when the first
    // media node is a Video. Parity with product cards (video-first rendering).
    const primaryVideo: CardVideoMedia | null = getCardVideoMedia(product);

    // Auto-select first available variant when dialog opens
    useEffect(() => {
        if (open && availableVariants.length > 0 && !selectedVariantId) {
            setSelectedVariantId(availableVariants[0].id);
        }
    }, [open, availableVariants, selectedVariantId]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setQuantity(1);
            setSelectedVariantId(null);
        }
    }, [open]);

    // Get the selected variant
    const selectedVariant = product.variants.nodes.find(v => v.id === selectedVariantId);

    // Group variants by option name for display
    const optionGroups = groupVariantsByOption(product.variants.nodes);

    // Get current selection for each option
    const currentSelections = getSelectedOptionsFromVariant(selectedVariant);

    const {primary, secondary} = parseProductTitle(product.title);

    // Stop event propagation to prevent Link navigation (React synthetic events bubble through portals)
    const stopPropagation = useCallback((e: React.MouseEvent | React.PointerEvent) => e.stopPropagation(), []);

    // Stable callback passed to QuickAddCartButton so it doesn't trigger re-renders
    const handleCartSuccess = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-3xl! p-2! overflow-hidden"
                showCloseButton={false}
                onClick={stopPropagation}
                onPointerDown={stopPropagation}
            >
                <div className="flex flex-col md:flex-row h-[60dvh]">
                    {/* Product images - left side with vertical scroll */}
                    <div
                        className="w-full md:w-1/2 shrink-0 h-full overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        data-lenis-prevent
                    >
                        {primaryVideo || productImages.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {/* Primary-media video slide — mirrors product-card video-first
                                    behavior on every screen size. Muted + playsInline so iOS
                                    Safari and Android browsers autoplay inline. */}
                                {primaryVideo && (
                                    <div className="relative w-full overflow-hidden bg-muted/50 rounded-lg">
                                        <div className="aspect-4/5 w-full">
                                            <ProductMediaThumb
                                                product={product}
                                                fallbackImage={product.featuredImage}
                                                alt={primaryVideo.alt || product.title}
                                                aspectRatio="4/5"
                                                loading="eager"
                                                className="size-full object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                                {productImages.map((image, index) => (
                                    <div
                                        key={image.id || index}
                                        className="relative w-full overflow-hidden bg-muted/50 rounded-lg"
                                    >
                                        <div className="aspect-4/5 w-full">
                                            <Image
                                                data={{url: image.url, altText: image.altText || `${product.title} - Image ${index + 1}`}}
                                                sizes="(min-width: 1024px) 40vw, 100vw"
                                                aspectRatio="4/5"
                                                loading={index === 0 ? "eager" : "lazy"}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ProductImagePlaceholder aspectRatio="4/5" className="rounded-lg" />
                        )}
                    </div>

                    {/* Product info and options - right side */}
                    <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-y-auto" data-lenis-prevent>
                        <DialogHeader className="text-left pr-10">
                            {/* Product Tags - above the title (special tags filtered out)
                                Uses the shared ProductTagList primitive for consistent styling,
                                spacing, and semantics across the PDP and both Quick Add surfaces. */}
                            <ProductTagList tags={product.tags} className="mb-1.5" />
                            <DialogTitle className="font-sans text-2xl sm:text-3xl font-medium leading-snug text-primary mb-0">
                                <span>{primary}</span>
                                {secondary && <span>, {secondary}</span>}
                            </DialogTitle>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="font-mono tabular-nums text-base text-primary">
                                    {selectedVariant ? (
                                        <Money data={selectedVariant.price} />
                                    ) : (
                                        <>
                                            <Money data={product.priceRange.minVariantPrice} />
                                            {product.priceRange.minVariantPrice.amount !==
                                                product.priceRange.maxVariantPrice.amount && (
                                                <>
                                                    {" - "}
                                                    <Money data={product.priceRange.maxVariantPrice} />
                                                </>
                                            )}
                                        </>
                                    )}
                                </span>
                                {sizeChart && <SizeChartButtonCompact sizeChart={sizeChart} />}
                            </div>
                        </DialogHeader>

                        {/* Variant options - each option type on its own line */}
                        <div className="flex-1 mt-4 space-y-4">
                            {optionGroups.map(group => {
                                // Check if this is a color-type option
                                const isColor = isColorOption(group.name);

                                return (
                                    <div key={group.name} className="flex flex-wrap gap-2">
                                        {group.values.map(value => {
                                            const isSelected = currentSelections[group.name] === value.value;
                                            const variant = findVariantByOptions(product.variants.nodes, {
                                                ...currentSelections,
                                                [group.name]: value.value
                                            });
                                            const isAvailable = variant?.availableForSale ?? false;

                                            // For color options, try to get swatch data from color name
                                            const swatchData = isColor
                                                ? getSwatchFromColorName(value.value)
                                                : undefined;
                                            const hasSwatchData = isColor && hasColorMapping(value.value);

                                            // Pill button styling - consistent for all options
                                            const buttonClasses = cn(
                                                "inline-flex min-h-10 min-w-10 select-none items-center justify-center gap-2 rounded-full border-2 px-3 sm:px-4 py-1.5 text-base sm:text-lg font-medium sleek hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
                                                isSelected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
                                                !isAvailable && "opacity-50 cursor-not-allowed"
                                            );

                                            // Button content: swatch circle + name, or just name
                                            const optionContent =
                                                hasSwatchData && swatchData ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <ColorSwatch
                                                            color={swatchData.color}
                                                            name={value.value}
                                                            size="sm"
                                                            selected={isSelected}
                                                        />
                                                        <span>{value.value}</span>
                                                    </span>
                                                ) : (
                                                    <span>{value.value}</span>
                                                );

                                            return (
                                                <button
                                                    key={value.value}
                                                    type="button"
                                                    disabled={!isAvailable}
                                                    onClick={() => {
                                                        if (variant && isAvailable) {
                                                            setSelectedVariantId(variant.id);
                                                        }
                                                    }}
                                                    className={buttonClasses}
                                                >
                                                    {optionContent}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add to cart section - quantity + wishlist + share row, then cart button */}
                        {selectedVariant && selectedVariant.availableForSale ? (
                            <div className="mt-6 pt-4 space-y-3">
                                {/* Quantity selector + Wishlist + Share row */}
                                <div className="flex items-center justify-between gap-3">
                                    <QuantitySelector
                                        quantity={quantity}
                                        onQuantityChange={setQuantity}
                                        min={1}
                                        max={10}
                                    />
                                    <div className="flex items-center gap-2">
                                        <WishlistButton
                                            productId={product.id}
                                            productTitle={product.title}
                                            variant="primary-outline"
                                            size="default"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void handleShare()}
                                            className="flex min-h-10 min-w-10 select-none items-center justify-center rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground active:scale-95"
                                            aria-label="Share product"
                                        >
                                            <Share2 className="size-5" />
                                        </button>
                                    </div>
                                </div>
                                {/* Add to Bag — adds to cart and opens cart drawer */}
                                <QuickAddCartButton
                                    variant={selectedVariant}
                                    quantity={quantity}
                                    buttonLabel={buttonLabel}
                                    onSuccess={handleCartSuccess}
                                    productId={product.id}
                                    productTitle={product.title}
                                    productHandle={product.handle}
                                />
                                {/* Get it now — Buy Now, redirects directly to checkout */}
                                <BuyNowButton
                                    lines={[{merchandiseId: selectedVariant.id, quantity}]}
                                    price={selectedVariant.price}
                                    compareAtPrice={selectedVariant.compareAtPrice}
                                    label={buyNowLabel}
                                    className="min-h-12 text-lg"
                                />
                            </div>
                        ) : availableVariants.length === 0 ? (
                            <div className="mt-6 pt-4">
                                <div className="w-full min-h-12 inline-flex items-center justify-center rounded-full border-2 border-muted bg-muted/50 px-3 sm:px-4 py-2 text-lg font-medium text-muted-foreground">
                                    {OUT_OF_STOCK_LABEL}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cart button using useFetcher directly for explicit control over submission
 *
 * @param variant - Selected variant to add to cart
 * @param quantity - Quantity to add
 * @param onSuccess - Callback when cart addition succeeds
 * @returns Add to cart button with price, loading state, and submit handler
 *
 * Uses useFetcher instead of CartForm for explicit submission control.
 * This allows proper success detection and callback triggering.
 *
 * CartForm Input Format:
 * - cartFormInput: JSON.stringify({ action, inputs })
 * - action: CartForm.ACTIONS.LinesAdd
 * - inputs: { lines: [{ merchandiseId, quantity }] }
 *
 * State Management:
 * - isLoading: fetcher.state !== "idle"
 * - Success detection: fetcher.state === "idle" && fetcher.data
 * - Calls onSuccess() when submission completes successfully
 */
function QuickAddCartButton({
    variant,
    quantity,
    onSuccess,
    buttonLabel,
    productId,
    productTitle,
    productHandle
}: QuickAddCartButtonProps) {
    // Use global cart fetcher key to prevent concurrent mutations
    // that cause "cart conflicted with another request" errors
    const fetcher = useFetcher({key: "cart-mutation"});
    const isLoading = fetcher.state !== "idle";

    // Guard: only close when THIS instance submitted — not on stale data from prior mutations.
    // Without this, opening the dialog after a previous add-to-cart fires onSuccess() immediately
    // because fetcher.data is already truthy from the shared "cart-mutation" key.
    const hasSubmittedRef = useRef(false);

    // Close dialog and open cart on success
    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data && hasSubmittedRef.current) {
            hasSubmittedRef.current = false;
            onSuccess();
        }
    }, [fetcher.state, fetcher.data, onSuccess]);

    // Stable handler — only changes when variant.id, quantity, or isLoading changes
    const handleAddToCart = useCallback(() => {
        if (isLoading || !variant.availableForSale) return;

        hasSubmittedRef.current = true;

        // CartForm.getFormInput expects: { cartFormInput: JSON.stringify({ action, inputs }) }
        void fetcher.submit(
            {
                cartFormInput: JSON.stringify({
                    action: CartForm.ACTIONS.LinesAdd,
                    inputs: {
                        lines: [
                                {
                                    merchandiseId: variant.id,
                                    quantity,
                                    selectedVariant: {
                                        ...variant,
                                        product: {id: productId, title: productTitle, handle: productHandle}
                                    }
                                }
                            ]
                    }
                })
            },
            {method: "POST", action: "/cart"}
        );
    }, [fetcher, isLoading, variant, quantity, productId, productTitle, productHandle]);

    return (
        <button
            type="button"
            onClick={handleAddToCart}
            disabled={isLoading || !variant.availableForSale}
            className={cn(
                "w-full min-h-12 inline-flex select-none items-center justify-between gap-4 rounded-full border-2 border-primary bg-primary px-3 sm:px-4 py-2 text-lg font-medium text-primary-foreground sleek",
                "hover:bg-primary/90",
                (isLoading || !variant.availableForSale) && "opacity-50 cursor-not-allowed"
            )}
        >
            <span className="flex items-center gap-2">
                <Money data={variant.price} />
                {variant.compareAtPrice &&
                    parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount) && (
                        <s className="text-sm opacity-60">
                            <Money data={variant.compareAtPrice} />
                        </s>
                    )}
            </span>
            <span className="flex items-center gap-2">
                {isLoading && <Loader2 className="size-5 animate-spin" />}
                {variant.availableForSale ? buttonLabel : OUT_OF_STOCK_LABEL}
            </span>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Group variants by their option names
 *
 * @param variants - Array of product variants
 * @returns Array of option groups with values and availability
 *
 * Returns all option values, with availability info for filtering during render.
 * Groups variants by option name (Color, Size, Material, etc.) and tracks
 * which option values have at least one available variant.
 *
 * Example output:
 * [
 *   { name: "Color", values: [
 *     { value: "Blue", variantId: "123", hasAvailableVariant: true },
 *     { value: "Red", variantId: "456", hasAvailableVariant: false }
 *   ]},
 *   { name: "Size", values: [...] }
 * ]
 */
function groupVariantsByOption(
    variants: QuickAddVariant[]
): Array<{name: string; values: Array<{value: string; variantId: string; hasAvailableVariant: boolean}>}> {
    const optionMap = new Map<string, Map<string, {variantId: string; hasAvailableVariant: boolean}>>();

    for (const variant of variants) {
        if (!variant.selectedOptions) continue;

        for (const option of variant.selectedOptions) {
            if (!optionMap.has(option.name)) {
                optionMap.set(option.name, new Map());
            }
            const existing = optionMap.get(option.name)!.get(option.value);
            if (!existing) {
                // First time seeing this option value
                optionMap.get(option.name)!.set(option.value, {
                    variantId: variant.id,
                    hasAvailableVariant: variant.availableForSale
                });
            } else if (variant.availableForSale && !existing.hasAvailableVariant) {
                // Update to mark as available if we find an available variant
                optionMap.get(option.name)!.set(option.value, {
                    variantId: variant.id,
                    hasAvailableVariant: true
                });
            }
        }
    }

    // Convert to array format, filter out options with only one available value
    const result: Array<{
        name: string;
        values: Array<{value: string; variantId: string; hasAvailableVariant: boolean}>;
    }> = [];

    for (const [name, values] of optionMap) {
        // Only include option values that have at least one available variant
        const availableValues = Array.from(values.entries())
            .filter(([, info]) => info.hasAvailableVariant)
            .map(([value, info]) => ({
                value,
                variantId: info.variantId,
                hasAvailableVariant: info.hasAvailableVariant
            }));

        // Show options with 1+ available values
        if (availableValues.length > 0) {
            result.push({name, values: availableValues});
        }
    }

    return result;
}

/**
 * Get selected options from a variant
 *
 * @param variant - Variant to extract options from
 * @returns Object mapping option names to selected values
 *
 * Converts variant.selectedOptions array to object for easier lookup.
 * Used to determine current selection state for each option group.
 *
 * Example:
 * Input: variant.selectedOptions = [
 *   { name: "Color", value: "Blue" },
 *   { name: "Size", value: "Large" }
 * ]
 * Output: { "Color": "Blue", "Size": "Large" }
 */
function getSelectedOptionsFromVariant(variant: QuickAddVariant | undefined): Record<string, string> {
    if (!variant?.selectedOptions) return {};

    const selections: Record<string, string> = {};
    for (const option of variant.selectedOptions) {
        selections[option.name] = option.value;
    }
    return selections;
}

/**
 * Find a variant that matches the given option selections
 *
 * @param variants - Array of all product variants
 * @param selections - Object mapping option names to desired values
 * @returns Matching variant or undefined if not found
 *
 * Used when user clicks an option button to find the corresponding variant.
 * Matches all options in selections object against variant.selectedOptions.
 *
 * Example:
 * selections = { "Color": "Blue", "Size": "Large" }
 * Returns variant with Color=Blue AND Size=Large
 */
function findVariantByOptions(
    variants: QuickAddVariant[],
    selections: Record<string, string>
): QuickAddVariant | undefined {
    return variants.find(variant => {
        if (!variant.selectedOptions) return false;

        for (const option of variant.selectedOptions) {
            if (selections[option.name] && selections[option.name] !== option.value) {
                return false;
            }
        }
        return true;
    });
}
