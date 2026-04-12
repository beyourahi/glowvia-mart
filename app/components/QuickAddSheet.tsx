/**
 * @fileoverview Mobile variant selection bottom sheet for quick add to cart
 *
 * @description
 * Mobile-optimized bottom sheet for selecting product variants (max-width: 767px).
 * Features vertical layout with product thumbnail, tags, variant pills, quantity
 * selector, and add to cart button. Matches QuickAddDialog functionality for mobile.
 *
 * @features
 * - Mobile bottom sheet with drag handle indicator
 * - Product thumbnail with tags in header
 * - Pill-style variant option buttons
 * - Auto-selects first available variant on open
 * - Integrated quantity selector
 * - Add to cart button with price display
 * - Auto-closes on successful add (no cart drawer interruption)
 * - Body scroll lock when open
 * - Event bubbling prevention (safe inside clickable cards)
 * - Max height: 85dvh for comfortable scrolling
 * - Lenis scroll prevention for smooth scrolling
 *
 * @props
 * - product: QuickAddProduct - Product data with variants
 * - open: boolean - Sheet open state (controlled)
 * - onOpenChange: (open: boolean) => void - Sheet state change handler
 *
 * @usage
 * ```tsx
 * <QuickAddSheet
 *   product={product}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 *
 * @related
 * - QuickAddButton.tsx - Trigger button component
 * - QuickAddDialog.tsx - Desktop modal variant
 * - QuantitySelector.tsx - Quantity input component
 * - CartForm - Shopify Hydrogen cart mutation component
 *
 * @architecture
 * - Controlled sheet state from parent component
 * - Local state for selected variant and quantity
 * - useFetcher for cart submission (explicit control)
 * - Auto-reset state on close
 * - Auto-select first variant on open
 * - Sheet closes on successful submission (cart drawer does not open)
 * - Reuses utility functions from QuickAddDialog
 *
 * @see {@link https://shopify.dev/docs/api/hydrogen/2024-01/components/cartform}
 */

import {useState, useEffect, useMemo, useCallback} from "react";
import {useFetcher} from "react-router";
import {CartForm} from "@shopify/hydrogen";
import {Loader2, Share2} from "lucide-react";
import {cn} from "~/lib/utils";
import {useScrollLock} from "~/hooks/useScrollLock";
import {Money} from "~/components/Money";
import {QuantitySelector} from "~/components/QuantitySelector";
import {Badge} from "~/components/ui/badge";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter} from "~/components/ui/sheet";
import {ColorSwatch} from "~/components/ui/color-swatch";
import {isColorOption, getSwatchFromColorName, hasColorMapping} from "~/lib/color-name-map";
import {WishlistButton} from "~/components/WishlistButton";
import {SizeChartButtonCompact} from "~/components/SizeChartButton";
import type {SizeChartData} from "~/lib/size-chart";
import {toast} from "sonner";
import {filterDisplayTags, getButtonLabel} from "~/lib/product-tags";
import {parseProductTitle} from "~/lib/product";
import {OUT_OF_STOCK_LABEL} from "~/lib/product/product-card-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Types for the quick add sheet (matching QuickAddDialog types)
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

interface QuickAddProduct {
    id: string;
    title: string;
    handle: string;
    tags?: string[];
    featuredImage?: QuickAddImage | null;
    images?: {
        nodes: QuickAddImage[];
    };
    priceRange: {
        minVariantPrice: {amount: string; currencyCode: string};
        maxVariantPrice: {amount: string; currencyCode: string};
    };
    variants: {
        nodes: QuickAddVariant[];
    };
}

interface QuickAddSheetProps {
    product: QuickAddProduct;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Optional size chart data - if provided, shows size guide button */
    sizeChart?: SizeChartData | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * QuickAddSheet - Mobile bottom sheet for variant selection
 *
 * @param product - Product data with variants
 * @param open - Sheet open state (controlled by parent)
 * @param onOpenChange - Callback when sheet should open/close
 * @returns Mobile bottom sheet with vertical layout and variant selection
 *
 * Layout:
 * - Header: Product thumbnail (16x20) + title + tags + price
 * - Body: Variant option pills (scrollable if many options)
 * - Footer: Quantity selector + add to cart button
 * - Max height: 85dvh with drag handle indicator
 * - Bottom sheet slides up from bottom
 *
 * State Management:
 * - Local state for selected variant ID and quantity
 * - Auto-selects first available variant when sheet opens
 * - Resets state when sheet closes
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
 * - Closes sheet after successful add
 * - Loading state with spinner
 *
 * Scroll Handling:
 * - useScrollLock prevents background Lenis scrolling (ref-counted)
 * - data-lenis-prevent on SheetBody
 * - Drag handle for gesture-based closing
 */
export function QuickAddSheet({product, open, onOpenChange, sizeChart}: QuickAddSheetProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

    // Filter out special tags (pin, premium, preorder, etc.) for display
    // These are shown as badges on product cards, not in the tags list
    const displayTags = filterDisplayTags(product.tags);

    // Get appropriate button label ("Pre Order" for preorder products)
    const buttonLabel = getButtonLabel(product.tags, "Get it now");

    // Lock Lenis smooth scroll when sheet is open (native scroll lock handled by Radix)
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

    // Auto-select first available variant when sheet opens
    useEffect(() => {
        if (open && availableVariants.length > 0 && !selectedVariantId) {
            setSelectedVariantId(availableVariants[0].id);
        }
    }, [open, availableVariants, selectedVariantId]);

    // Reset state when sheet closes
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="max-h-[85dvh]"
                hideCloseButton
                onClick={stopPropagation}
                onPointerDown={stopPropagation}
            >
                {/* Drag handle indicator */}
                <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>

                <SheetHeader>
                    <div className="flex items-start gap-3">
                        {/* Product thumbnail */}
                        {product.featuredImage?.url && (
                            <div className="w-16 h-20 shrink-0 overflow-hidden rounded-lg bg-muted/50">
                                <img
                                    src={product.featuredImage.url}
                                    alt={product.featuredImage.altText || product.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Product title and price */}
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="font-sans text-xl font-medium leading-snug text-primary line-clamp-2 mb-0">
                                <span>{primary}</span>
                                {secondary && <span>, {secondary}</span>}
                            </SheetTitle>
                            {/* Product Tags - under the title (special tags filtered out) */}
                            {displayTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {displayTags.map((tag: string) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-sm border text-primary font-semibold px-2 uppercase"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                                <span className="font-mono tabular-nums text-sm text-primary">
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
                        </div>
                    </div>
                </SheetHeader>

                <SheetBody className="py-4" data-lenis-prevent>
                    {/* Variant options - each option type on its own line */}
                    {optionGroups.length > 0 && (
                        <div className="space-y-4">
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
                                                "inline-flex min-h-10 select-none items-center justify-center gap-2 rounded-full border-2 px-3 py-1.5 text-base font-medium sleek hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
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
                    )}
                </SheetBody>

                <SheetFooter className="border-none flex-col gap-3">
                    {/* Quantity selector + Wishlist + Share row */}
                    {selectedVariant && selectedVariant.availableForSale && (
                        <div className="flex items-center justify-between gap-3">
                            <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={10} />
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
                    )}

                    {/* Add to cart button - full width */}
                    {selectedVariant && selectedVariant.availableForSale ? (
                        <QuickAddCartButton
                            variant={selectedVariant}
                            quantity={quantity}
                            buttonLabel={buttonLabel}
                            onSuccess={handleCartSuccess}
                        />
                    ) : availableVariants.length === 0 ? (
                        <div className="w-full min-h-12 inline-flex items-center justify-center rounded-full border-2 border-muted bg-muted/50 px-3 sm:px-4 py-2 text-lg font-medium text-muted-foreground">
                            {OUT_OF_STOCK_LABEL}
                        </div>
                    ) : null}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components & Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cart button using useFetcher directly for explicit control over submission
 * (Same implementation as QuickAddDialog's cart button)
 */
function QuickAddCartButton({
    variant,
    quantity,
    onSuccess,
    buttonLabel
}: {
    variant: QuickAddVariant;
    quantity: number;
    onSuccess: () => void;
    /** Button label text - "Get it now" or "Pre Order" for preorder products */
    buttonLabel: string;
}) {
    // Use global cart fetcher key to prevent concurrent mutations
    // that cause "cart conflicted with another request" errors
    const fetcher = useFetcher({key: "cart-mutation"});
    const isLoading = fetcher.state !== "idle";

    // Close sheet and open cart on success
    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data) {
            onSuccess();
        }
    }, [fetcher.state, fetcher.data, onSuccess]);

    // Stable handler — only changes when variant.id, quantity, or isLoading changes
    const handleAddToCart = useCallback(() => {
        if (isLoading || !variant.availableForSale) return;

        // CartForm.getFormInput expects: { cartFormInput: JSON.stringify({ action, inputs }) }
        void fetcher.submit(
            {
                cartFormInput: JSON.stringify({
                    action: CartForm.ACTIONS.LinesAdd,
                    inputs: {
                        lines: [{merchandiseId: variant.id, quantity}]
                    }
                })
            },
            {method: "POST", action: "/cart"}
        );
    }, [fetcher, isLoading, variant.availableForSale, variant.id, quantity]);

    return (
        <button
            type="button"
            onClick={handleAddToCart}
            disabled={isLoading || !variant.availableForSale}
            className={cn(
                "w-full min-h-12 inline-flex select-none items-center justify-between gap-4 rounded-full border-2 border-primary bg-transparent px-3 sm:px-4 py-2 text-lg font-medium text-primary sleek",
                "hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground",
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

/**
 * Group variants by their option names
 * Returns all option values, with availability info for filtering during render
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
