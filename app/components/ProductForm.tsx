/**
 * @fileoverview Product variant and purchase options form component
 *
 * @description
 * Comprehensive product purchase form that handles variant selection, quantity management,
 * subscription options, and add-to-cart functionality. Adapts layout based on whether
 * the product has displayable variant options.
 *
 * @features
 * - Dynamic variant option selection (color, size, etc.) with swatch support
 * - Quantity selector with min/max constraints
 * - Subscription and one-time purchase toggle for products with selling plans
 * - Automatic URL parameter syncing for variant and subscription selection
 * - Intelligent layout: single variant products show label + quantity side-by-side,
 *   multi-variant products show options + quantity in a row
 * - Integration with cart drawer (opens on add to cart)
 * - Support for cross-product variant navigation (isDifferentProduct links)
 * - Price display with subscription discounts
 * - Wishlist and share button integration
 *
 * @props
 * - productOptions: Mapped variant options from Shopify
 * - selectedVariant: Currently selected product variant
 * - shareButton: Optional share functionality component
 * - wishlistButton: Optional wishlist toggle component
 * - sellingPlanGroups: Available subscription plans for the product
 * - selectedSellingPlan: Currently selected subscription plan
 *
 * @state
 * - quantity: Selected quantity (1-10 default range)
 * - purchaseType: "one-time" or "subscription" mode
 *
 * @dependencies
 * - AddToCartButton: Handles cart line submission
 * - QuantitySelector: Increment/decrement quantity control
 * - SellingPlanSelector: Subscription frequency selector
 * - useAside: Cart drawer control
 * - URL params: Syncs variant and selling_plan to URL
 *
 * @layout
 * Two layout modes based on product configuration:
 * 1. Single variant (no displayable options): Label and quantity side-by-side, CTA below
 * 2. Multi-variant: Option pills and quantity in row, CTA below
 *
 * @related
 * - AddToCartButton.tsx - Cart submission
 * - QuantitySelector.tsx - Quantity control
 * - SellingPlanSelector.tsx - Subscription options
 * - ProductPrice.tsx - Price display
 */

import {useState, useEffect, useMemo, useCallback} from "react";
import {Link, useNavigate, useLocation} from "react-router";
import {type MappedProductOptions} from "@shopify/hydrogen";
import {AddToCartButton} from "./AddToCartButton";
import {useAside} from "./Aside";
import {cn} from "~/lib/utils";
import type {ProductFragment} from "storefrontapi.generated";
import {QuantitySelector} from "./QuantitySelector";
import {Money} from "~/components/Money";
import {
    SellingPlanSelector,
    type SellingPlanFragment,
    calculateSellingPlanPrice,
    getSellingPlanDiscount
} from "./SellingPlanSelector";
import {ColorSwatch, hasSwatch} from "~/components/ui/color-swatch";
import {hasSpecialTag} from "~/lib/product-tags";

const FALLBACK_PRODUCT_CONTENT = {
    addToCartStandard: "Add to Bag",
    addToCartPreorder: "Pre-Order",
    addToCartSoldOut: "Sold Out",
    addToCartSubscribe: "Subscribe",
    addToCartOffline: "Unavailable Offline",
    offlineHelperText: "Connect to the internet to add items to your bag",
    selectFrequency: "Select delivery frequency",
    stockInStock: "In Stock",
    stockOutOfStock: "Out of Stock",
    stockLowTemplate: "Only {quantity} left",
    purchaseTypeLabel: "Purchase Type",
    oneTimeLabel: "One-time purchase",
    subscribeSaveLabel: "Subscribe & Save",
    savePercentageTemplate: "Save {percent}%",
    sizeGuideCta: "Size Guide",
    quantityLabel: "Quantity",
    tabDescription: "Description",
    tabShipping: "Shipping",
    tabReviews: "Reviews",
    badgeNew: "New",
    badgeSale: "Sale",
    badgeBestseller: "Bestseller",
    badgeClearance: "Clearance",
    badgePremium: "Premium",
    badgePreorder: "Pre-Order",
    badgeLimited: "Limited Edition",
    shareButtonLabel: "Share",
    wishlistAddLabel: "Add to wishlist",
    wishlistRemoveLabel: "Remove from wishlist",
    relatedProductsTitle: "You might also like"
} as const;

type PurchaseType = "one-time" | "subscription";

// =============================================================================
// MAIN PRODUCT FORM COMPONENT
// =============================================================================

export function ProductForm({
    productOptions,
    selectedVariant,
    shareButton,
    wishlistButton,
    sizeChartButton,
    sellingPlanGroups,
    selectedSellingPlan,
    tags
}: {
    productOptions: MappedProductOptions[];
    selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"];
    shareButton?: React.ReactNode;
    /** Optional wishlist button - pass WishlistButton component with product ID */
    wishlistButton?: React.ReactNode;
    /** Optional size chart button - pass SizeChartButton component when product has size chart data */
    sizeChartButton?: React.ReactNode;
    sellingPlanGroups?: ProductFragment["sellingPlanGroups"];
    selectedSellingPlan?: SellingPlanFragment | null;
    /** Product tags for special behaviors (e.g., preorder) */
    tags?: string[];
}) {
    const navigate = useNavigate();
    const {search, pathname} = useLocation();
    const {open} = useAside();
    const [quantity, setQuantity] = useState(1);
    const [purchaseType, setPurchaseType] = useState<PurchaseType>("one-time");
    const productContent = FALLBACK_PRODUCT_CONTENT;

    // =============================================================================
    // QUANTITY LIMIT LOGIC
    // =============================================================================

    /**
     * Maximum quantity that can be added to cart for this variant.
     *
     * @note quantityAvailable comes from Shopify's Storefront API and is automatically
     * capped by Shopify's built-in "Add-to-cart limit" setting (Settings → Checkout).
     * If inventory tracking is disabled, this will be null (unlimited).
     *
     * @returns undefined for unlimited, number for capped quantity
     */
    const maxQuantity = selectedVariant?.quantityAvailable ?? undefined;

    /**
     * Reset quantity to 1 when variant changes to prevent selecting more than available.
     * This handles edge cases like switching from a variant with 50 available to one with 3.
     */
    useEffect(() => {
        setQuantity(1);
    }, [selectedVariant?.id]);

    /**
     * Low stock threshold - show warning when 5 or fewer items remain.
     * Only shown when inventory is tracked (quantityAvailable is not null).
     */
    const isLowStock = maxQuantity !== undefined && maxQuantity > 0 && maxQuantity <= 5;

    // =============================================================================
    // SELLING PLAN LOGIC
    // =============================================================================

    // Check if product has selling plans available for the selected variant
    const hasSellingPlans =
        sellingPlanGroups &&
        sellingPlanGroups.nodes.length > 0 &&
        selectedVariant?.sellingPlanAllocations?.nodes &&
        selectedVariant.sellingPlanAllocations.nodes.length > 0;

    // Sync purchase type with URL param
    useEffect(() => {
        const params = new URLSearchParams(search);
        if (params.has("selling_plan")) {
            setPurchaseType("subscription");
        }
    }, [search]);

    // Clear selling plan from URL when switching to one-time
    const handlePurchaseTypeChange = useCallback(
        (type: PurchaseType) => {
            setPurchaseType(type);
            if (type === "one-time") {
                const params = new URLSearchParams(search);
                params.delete("selling_plan");
                void navigate(`${pathname}?${params.toString()}`, {
                    replace: true,
                    preventScrollReset: true
                });
            }
        },
        [search, pathname, navigate]
    );

    // =============================================================================
    // VARIANT FILTERING & DISPLAY LOGIC
    // =============================================================================

    // Filter options to only show available variants
    const filteredOptions = useMemo(
        () =>
            productOptions
                .map(option => ({
                    ...option,
                    optionValues: option.optionValues.filter(value => value.available)
                }))
                .filter(option => option.optionValues.length > 0),
        [productOptions]
    );

    // Check if there are any displayable variant options (options with more than 1 value)
    const hasDisplayableVariants = filteredOptions.some(option => option.optionValues.length > 1);

    // Check if this is a single variant product and get the variant info
    const isSingleVariant = !hasDisplayableVariants;
    // Show option group name labels only when multiple groups are visible — single-group products stay label-free
    const showOptionLabels = filteredOptions.filter(o => o.optionValues.length > 1).length > 1;
    const singleVariantLabel =
        isSingleVariant && selectedVariant?.title && selectedVariant.title !== "Default Title"
            ? selectedVariant.title
            : null;

    // =============================================================================
    // PRICING & BUTTON STATE
    // =============================================================================

    // Calculate subscription price if applicable
    const subscriptionPrice =
        selectedSellingPlan && selectedVariant?.price
            ? calculateSellingPlanPrice(selectedVariant.price, selectedSellingPlan)
            : null;

    // Get max discount percentage from available selling plans
    const maxDiscount = hasSellingPlans
        ? Math.max(
              ...sellingPlanGroups.nodes.flatMap(group =>
                  group.sellingPlans.nodes.map(plan => getSellingPlanDiscount(plan) ?? 0)
              )
          )
        : 0;

    // Determine button state and text
    const isSubscriptionMode = purchaseType === "subscription";
    const needsSellingPlan = isSubscriptionMode && !selectedSellingPlan;

    // Check if this is a preorder product
    const isPreorder = hasSpecialTag(tags, "preorder");

    const getButtonText = () => {
        if (!selectedVariant?.availableForSale) return productContent.addToCartSoldOut;
        if (needsSellingPlan) return productContent.selectFrequency;
        if (isSubscriptionMode) return productContent.addToCartSubscribe;
        // Use preorder text for preorder products
        return isPreorder ? productContent.addToCartPreorder : productContent.addToCartStandard;
    };

    // Build cart line with optional selling plan — memoized to avoid new array reference every render
    const cartLines = useMemo(
        () =>
            selectedVariant
                ? [
                      {
                          merchandiseId: selectedVariant.id,
                          quantity,
                          selectedVariant,
                          ...(isSubscriptionMode && selectedSellingPlan
                              ? {sellingPlanId: selectedSellingPlan.id}
                              : {})
                      }
                  ]
                : [],
        [selectedVariant, quantity, isSubscriptionMode, selectedSellingPlan]
    );

    // Determine price to show on button
    const displayPrice = isSubscriptionMode && subscriptionPrice ? subscriptionPrice : selectedVariant?.price;

    // =============================================================================
    // ADD TO CART BUTTON
    // =============================================================================

    // Stable callback for opening the cart drawer — only changes if open() identity changes
    const handleOpenCart = useCallback(() => {
        open("cart");
    }, [open]);

    const addToCartButton = (
        <AddToCartButton
            disabled={!selectedVariant || !selectedVariant.availableForSale || needsSellingPlan}
            onClick={handleOpenCart}
            lines={cartLines}
            price={displayPrice}
            compareAtPrice={isSubscriptionMode ? selectedVariant?.price : selectedVariant?.compareAtPrice}
        >
            {getButtonText()}
        </AddToCartButton>
    );

    // =============================================================================
    // PURCHASE TYPE TOGGLE (SUBSCRIPTION)
    // =============================================================================

    // Purchase type toggle component
    const purchaseTypeToggle = hasSellingPlans && (
        <div className="space-y-3 pb-4 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground">{productContent.purchaseTypeLabel}</p>
            <div className="grid grid-cols-2 gap-3">
                {/* One-time option */}
                <button
                    type="button"
                    onClick={() => handlePurchaseTypeChange("one-time")}
                    className={cn(
                        "flex select-none flex-col items-start p-3 rounded-xl border-2 text-left sleek",
                        purchaseType === "one-time"
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/50"
                    )}
                >
                    <span className="font-medium text-sm">{productContent.oneTimeLabel}</span>
                    {selectedVariant?.price && (
                        <span className="text-sm text-muted-foreground font-mono tabular-nums">
                            <Money data={selectedVariant.price} />
                        </span>
                    )}
                </button>

                {/* Subscription option */}
                <button
                    type="button"
                    onClick={() => handlePurchaseTypeChange("subscription")}
                    className={cn(
                        "flex select-none flex-col items-start p-3 rounded-xl border-2 text-left sleek",
                        purchaseType === "subscription"
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/50"
                    )}
                >
                    <span className="font-medium text-sm">{productContent.subscribeSaveLabel}</span>
                    {maxDiscount > 0 && (
                        <span className="text-sm text-green-600 font-medium">
                            {productContent.savePercentageTemplate.replace("{percent}", String(maxDiscount))}
                        </span>
                    )}
                </button>
            </div>

            {/* Frequency selector - shown when subscription is selected */}
            {purchaseType === "subscription" && (
                <SellingPlanSelector
                    sellingPlanGroups={sellingPlanGroups}
                    selectedSellingPlan={selectedSellingPlan ?? null}
                    selectedVariant={selectedVariant}
                    className="pt-2"
                />
            )}
        </div>
    );

    // =============================================================================
    // LAYOUT RENDERING
    // =============================================================================

    // Layout for products without displayable variants:
    // Single variant label on left with quantity on right (like variant row), Add to Cart below
    if (!hasDisplayableVariants) {
        return (
            <div className="space-y-3 sm:space-y-4 w-full">
                {/* Size Chart link - shown above variant options for easy discovery */}
                {sizeChartButton && <div className="pb-1">{sizeChartButton}</div>}

                {/* Purchase type toggle for subscription products */}
                {purchaseTypeToggle}

                {/* Single variant row - stacked on mobile, side-by-side on desktop */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {singleVariantLabel && (
                            <div className="inline-flex min-h-11 items-center rounded-full border-2 border-primary bg-primary px-2.5 sm:px-4 py-1.5 text-sm sm:text-base lg:text-lg font-medium text-primary-foreground">
                                {singleVariantLabel}
                            </div>
                        )}
                    </div>
                    <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={maxQuantity} />
                </div>

                {/* Low stock warning */}
                {isLowStock && (
                    <p className="text-sm text-amber-600 font-medium">
                        {productContent.stockLowTemplate.replace("{quantity}", String(maxQuantity))}
                    </p>
                )}

                {/* Add to Cart + Share + Wishlist button row */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1">{addToCartButton}</div>
                    {wishlistButton && <div className="shrink-0">{wishlistButton}</div>}
                    {shareButton && <div className="shrink-0">{shareButton}</div>}
                </div>
            </div>
        );
    }

    // Layout for products with variants:
    // Variant options + quantity on top row, Add to Cart below
    return (
        <div className="space-y-3 sm:space-y-4 w-full">
            {/* Size Chart link - shown above variant options for easy discovery */}
            {sizeChartButton && <div className="pb-1">{sizeChartButton}</div>}

            {/* Purchase type toggle for subscription products */}
            {purchaseTypeToggle}

            {/* Product Options - each option type on its own line, flex-wrap for 320px */}
            <div className="space-y-3">
                {filteredOptions.map(option => {
                    if (option.optionValues.length === 1) return null;

                    return (
                        <div key={option.name} className="space-y-1.5">
                            {showOptionLabels && (
                                <p className="text-[11px] sm:text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                                    {option.name}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {option.optionValues.map(value => {
                                const {
                                    name,
                                    handle,
                                    variantUriQuery,
                                    selected,
                                    available,
                                    exists,
                                    isDifferentProduct,
                                    swatch
                                } = value;

                                // Check if this option has a color/image swatch
                                const hasSwatchData = hasSwatch(swatch);

                                // Pill button styling - consistent for both swatch and non-swatch options
                                // Reduced padding and text size for 320px viewport while maintaining 44px touch target
                                const buttonClasses = cn(
                                    "inline-flex min-h-11 select-none items-center justify-center gap-1.5 sm:gap-2 rounded-full border-2 px-2.5 sm:px-4 py-1.5 text-sm sm:text-base lg:text-lg font-medium sleek hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
                                    selected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
                                    exists && available ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                                );

                                // Button content: swatch circle + name, or just name
                                const optionContent = hasSwatchData ? (
                                    <span className="inline-flex items-center gap-2">
                                        <ColorSwatch swatch={swatch} name={name} size="sm" selected={selected} />
                                        <span>{name}</span>
                                    </span>
                                ) : (
                                    <span>{name}</span>
                                );

                                if (isDifferentProduct) {
                                    return (
                                        <Link
                                            key={option.name + name}
                                            prefetch="viewport"
                                            preventScrollReset
                                            replace
                                            to={`/products/${handle}?${variantUriQuery}`}
                                            className={buttonClasses}
                                        >
                                            {optionContent}
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={option.name + name}
                                        type="button"
                                        disabled={!exists || !available}
                                        className={buttonClasses}
                                        onClick={() => {
                                            if (!selected) {
                                                void navigate(`?${variantUriQuery}`, {
                                                    replace: true,
                                                    preventScrollReset: true
                                                });
                                            }
                                        }}
                                    >
                                        {optionContent}
                                    </button>
                                );
                            })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Low stock warning */}
            {isLowStock && (
                <p className="text-sm text-amber-600 font-medium">
                    {productContent.stockLowTemplate.replace("{quantity}", String(maxQuantity))}
                </p>
            )}

            {/* Quantity Selector + Wishlist + Share row */}
            <div className="pt-2 flex items-center justify-between gap-3">
                <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={maxQuantity} />
                <div className="flex items-center gap-2">
                    {wishlistButton && <div className="shrink-0">{wishlistButton}</div>}
                    {shareButton && <div className="shrink-0">{shareButton}</div>}
                </div>
            </div>

            {/* Add to Cart button - full width */}
            <div>{addToCartButton}</div>
        </div>
    );
}

// ProductOptionSwatch has been replaced by the unified ColorSwatchButton component
// from ~/components/ui/color-swatch.tsx for consistent swatch rendering across the app
