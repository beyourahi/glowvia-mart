/**
 * @fileoverview Mobile-only product hero section with distinctive coral/orange background
 *
 * @description
 * Full-height mobile product form with redesigned UX featuring coral background,
 * white variant options, and combined price/CTA button. Replaces standard desktop
 * product form on mobile for better conversion and visual appeal.
 *
 * @features
 * - Mobile-only display (hidden on md breakpoint and above)
 * - Full viewport height (100dvh - header height)
 * - Distinctive coral/orange background (bg-primary)
 * - White pill-shaped variant options
 * - Integrated quantity selector
 * - Combined price + CTA button
 * - Subscription support via selling plans
 * - Auto-opens cart drawer on add
 * - Swatch support (color/image) for variant options
 *
 * @props
 * - productOptions: MappedProductOptions[] - Available product options from Hydrogen
 * - selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"] - Currently selected variant
 * - selectedSellingPlan: SellingPlanFragment | null - Active subscription plan
 * - title: string - Product title for display
 * - id: string (optional) - DOM ID for scroll targeting (default: "product-hero-mobile")
 *
 * @usage
 * ```tsx
 * <ProductHeroMobile
 *   productOptions={productOptions}
 *   selectedVariant={selectedVariant}
 *   selectedSellingPlan={selectedSellingPlan}
 *   title={product.title}
 * />
 * ```
 *
 * @related
 * - StickyMobileGetNow.tsx - Sticky button that scrolls to this section
 * - SellingPlanSelector.tsx - Subscription frequency selector
 * - ProductPage.tsx - Parent product detail page
 * - CartForm - Shopify Hydrogen cart mutation component
 *
 * @architecture
 * - URL-based variant state (?variant=123) via productOptions
 * - Subscription state via ?selling_plan query parameter
 * - CartForm handles optimistic UI and cart mutations
 * - Aside context manages cart drawer state
 *
 * @see {@link https://shopify.dev/docs/api/hydrogen/2024-01/components/cartform}
 */

import {useState, useEffect} from "react";
import {Link, useNavigate, useLocation} from "react-router";
import {CartForm, type MappedProductOptions, type OptimisticCartLineInput} from "@shopify/hydrogen";
import type {FetcherWithComponents} from "react-router";
import {cn} from "~/lib/utils";
import type {ProductFragment} from "storefrontapi.generated";
import {Money} from "~/components/Money";
import {Minus, Plus} from "lucide-react";
import {useAside} from "./Aside";
import {type SellingPlanFragment, calculateSellingPlanPrice} from "./SellingPlanSelector";
import {ColorSwatch, hasSwatch} from "~/components/ui/color-swatch";
import {hasSpecialTag} from "~/lib/product-tags";
import {ProductTitle} from "~/components/ProductTitle";

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ProductHeroMobile - Full-height mobile-only product hero section
 *
 * @param productOptions - Mapped product options with availability from Hydrogen
 * @param selectedVariant - Currently selected variant from URL state
 * @param selectedSellingPlan - Active subscription plan (if in subscription mode)
 * @param title - Product title for display
 * @param id - DOM ID for scroll targeting (used by StickyMobileGetNow)
 * @returns Mobile product form with coral background and white UI elements
 *
 * Design characteristics:
 * - Full viewport height minus header (100dvh - var(--header-height))
 * - Coral/orange background (bg-primary)
 * - White pill-shaped variant options (selected vs unselected states)
 * - White quantity selector and add-to-cart button
 * - Serif product title for elegance
 * - Vertical scroll when content exceeds viewport
 *
 * Variant Selection:
 * - Filters to show only available variants
 * - Selected: bg-primary-foreground text-primary (filled white)
 * - Unselected: border-primary-foreground text-primary-foreground (outline white)
 * - Cross-product variants navigate to different product pages (Link)
 * - Same-product variants update URL query params (navigate)
 *
 * Cart Integration:
 * - Builds OptimisticCartLineInput with merchandiseId and quantity
 * - Includes sellingPlanId when in subscription mode
 * - Opens cart drawer immediately on submission (before server response)
 * - CartForm handles optimistic UI updates
 */
export function ProductHeroMobile({
    productOptions,
    selectedVariant,
    selectedSellingPlan,
    title,
    id = "product-hero-mobile",
    tags
}: {
    productOptions: MappedProductOptions[];
    selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"];
    selectedSellingPlan?: SellingPlanFragment | null;
    title: string;
    id?: string;
    /** Product tags for special behaviors (e.g., preorder) */
    tags?: string[];
}) {
    const navigate = useNavigate();
    const {search} = useLocation();
    const {open} = useAside();
    const [quantity, setQuantity] = useState(1);

    // Reset fetcher loading state on bfcache restore (back navigation from checkout).
    const [forceIdle, setForceIdle] = useState(false);
    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) setForceIdle(true);
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    // Filter options to only show available variants
    const filteredOptions = productOptions
        .map(option => ({
            ...option,
            optionValues: option.optionValues.filter(value => value.available)
        }))
        .filter(option => option.optionValues.length > 0);

    // Suppress Shopify's synthetic "Default Title" placeholder — products without real
    // variants have a single option named "Title" with one value "Default Title". Hide it
    // from the UI while selectedVariant keeps it programmatically active for cart/checkout.
    const visibleOptions = filteredOptions.filter(
        option => !(option.optionValues.length === 1 && option.optionValues[0].name === "Default Title")
    );

    // Show group name labels only when multiple option groups are visible (mirrors ProductForm logic)
    const showOptionLabels = visibleOptions.filter(o => o.optionValues.length > 1).length > 1;

    // Determine purchase mode and pricing
    const isSubscriptionMode = new URLSearchParams(search).has("selling_plan");
    const subscriptionPrice =
        selectedSellingPlan && selectedVariant?.price
            ? calculateSellingPlanPrice(selectedVariant.price, selectedSellingPlan)
            : null;
    const displayPrice = isSubscriptionMode && subscriptionPrice ? subscriptionPrice : selectedVariant?.price;

    // Build cart line
    const cartLines: OptimisticCartLineInput[] = selectedVariant
        ? [
              {
                  merchandiseId: selectedVariant.id,
                  quantity,
                  selectedVariant,
                  ...(isSubscriptionMode && selectedSellingPlan ? {sellingPlanId: selectedSellingPlan.id} : {})
              }
          ]
        : [];

    // Check if this is a preorder product
    const isPreorder = hasSpecialTag(tags, "preorder");

    const getButtonText = () => {
        if (!selectedVariant?.availableForSale) return "Sold out";
        if (isSubscriptionMode && !selectedSellingPlan) return "Select frequency";
        if (isSubscriptionMode) return "Subscribe";
        // Use "Pre Order" for preorder products
        return isPreorder ? "Pre Order" : "Get it Now";
    };

    return (
        <section
            id={id}
            className="md:hidden flex flex-col bg-primary px-3 sm:px-4 pb-8 sm:pb-10 pt-6 sm:pt-8 overflow-y-auto"
        >
            {/* Product Title - two-part split with serif font */}
            <ProductTitle title={title} variant="mobile-hero" className="mb-6" />

            {/* Variant Options - each option type on its own line */}
            {visibleOptions.length > 0 && (
                <div className="space-y-3 mb-32">
                    {visibleOptions.map(option => (
                        <div key={option.name} className="space-y-1.5">
                            {showOptionLabels && (
                                <p className="text-[11px] font-semibold tracking-widest uppercase text-primary-foreground/70">
                                    {option.name}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-3">
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

                                // Pill button styling - consistent for mobile hero (white on coral)
                                // Selected: foreground bg, primary text
                                // Unselected: transparent bg, white border, white text
                                const pillClasses = cn(
                                    "inline-flex min-h-12 select-none items-center justify-center gap-2 rounded-full px-4 py-2 text-lg font-medium sleek",
                                    "active:scale-95",
                                    selected
                                        ? "bg-primary-foreground text-primary"
                                        : "bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10",
                                    exists && available ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                                );

                                // Button content: swatch circle + name, or just name
                                const optionContent = hasSwatchData ? (
                                    <span className="inline-flex items-center gap-2">
                                        <ColorSwatch
                                            swatch={swatch}
                                            name={name}
                                            size="sm"
                                            selected={selected}
                                            onPrimaryBackground={true}
                                        />
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
                                            className={pillClasses}
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
                                        className={pillClasses}
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
                    ))}
                </div>
            )}

            {/* Quantity Selector - White styling */}
            <MobileQuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={10} />

            {/* Add to Cart Button - White with orange text */}
            <div className="mt-4">
                <CartForm
                    fetcherKey="cart-mutation"
                    route="/cart"
                    inputs={{lines: cartLines}}
                    action={CartForm.ACTIONS.LinesAdd}
                >
                    {(fetcher: FetcherWithComponents<any>) => {
                        const isDisabled =
                            !selectedVariant ||
                            !selectedVariant.availableForSale ||
                            (isSubscriptionMode && !selectedSellingPlan) ||
                            (!forceIdle && fetcher.state !== "idle");

                        return (
                            <button
                                type="submit"
                                onClick={() => { setForceIdle(false); open("cart"); }}
                                disabled={isDisabled}
                                className={cn(
                                    "w-full min-h-14 inline-flex select-none items-center justify-between gap-4 rounded-full bg-primary-foreground px-4 py-3 text-lg font-medium text-primary sleek",
                                    "hover:bg-primary-foreground/90 active:scale-[0.98]",
                                    isDisabled && "opacity-60 cursor-not-allowed"
                                )}
                            >
                                {/* Price on the left */}
                                <span className="font-medium">{displayPrice && <Money data={displayPrice} />}</span>
                                {/* Button text on the right */}
                                <span className="whitespace-nowrap">{getButtonText()}</span>
                            </button>
                        );
                    }}
                </CartForm>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mobile Quantity Selector with white styling on orange background
 *
 * @param quantity - Current quantity value
 * @param onQuantityChange - Callback when quantity changes
 * @param min - Minimum allowed quantity (default: 1)
 * @param max - Maximum allowed quantity (optional)
 * @returns Rounded pill-style quantity selector
 *
 * Styling:
 * - White background (bg-primary-foreground) on coral parent
 * - Coral text color (text-primary) for contrast
 * - Rounded-full pill shape
 * - Disabled state with reduced opacity
 * - Active touch feedback (active:bg-primary/10)
 *
 * Accessibility:
 * - aria-label on increment/decrement buttons
 * - Disabled state when at min/max boundaries
 * - 44px minimum touch target (min-h-12)
 */
function MobileQuantitySelector({
    quantity,
    onQuantityChange,
    min = 1,
    max
}: {
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    min?: number;
    max?: number;
}) {
    const handleDecrement = () => {
        if (quantity > min) {
            onQuantityChange(quantity - 1);
        }
    };

    const handleIncrement = () => {
        if (max === undefined || quantity < max) {
            onQuantityChange(quantity + 1);
        }
    };

    const canDecrement = quantity > min;
    const canIncrement = max === undefined || quantity < max;

    return (
        <div className="inline-flex w-fit select-none items-center justify-between rounded-full bg-primary-foreground">
            <button
                type="button"
                onClick={handleDecrement}
                disabled={!canDecrement}
                className={cn(
                    "flex min-h-12 items-center justify-center px-4 py-2 text-primary rounded-l-full active:bg-primary/10",
                    canDecrement ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Decrease quantity"
            >
                <Minus className="size-5" />
            </button>
            <span className="min-w-10 px-2 text-xl font-medium text-primary text-center tabular-nums">{quantity}</span>
            <button
                type="button"
                onClick={handleIncrement}
                disabled={!canIncrement}
                className={cn(
                    "flex min-h-12 items-center justify-center px-4 py-2 text-primary rounded-r-full active:bg-primary/10",
                    canIncrement ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Increase quantity"
            >
                <Plus className="size-5" />
            </button>
        </div>
    );
}

// MobileProductOptionSwatch has been replaced by the unified ColorSwatchButton component
// from ~/components/ui/color-swatch.tsx for consistent swatch rendering across the app
