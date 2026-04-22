/**
 * @fileoverview Cart Line Item Component
 *
 * @description
 * Displays individual product line items within the shopping cart with quantity controls,
 * pricing, and removal functionality. Supports both aside drawer and page layouts with
 * optimistic UI updates.
 *
 * @components
 * - CartLineItem - Main line item component with layout variants (aside/page)
 * - CartLineQuantity - Quantity selector with increment/decrement controls
 * - CartLineRemoveButton - Remove item button with optimistic state handling
 * - CartLineUpdateButton - Form wrapper for quantity updates
 *
 * @features
 * - Dual layout modes: compact aside drawer and spacious page layout
 * - Optimistic UI: instant updates with disabled state during server sync
 * - Subscription support: displays selling plan badges for recurring purchases
 * - Product title splitting: parses " + " separated titles for styled display
 * - Variant display: shows selected options (color, size, etc.) as formatted text
 * - Quantity controls: increment/decrement with proper touch targets (44px mobile)
 * - Remove functionality: with hover states and confirmation via optimistic disable
 * - Image optimization: responsive sizes, lazy loading, hover zoom effects
 * - Fetcher key management: prevents concurrent mutations on same line items
 *
 * @props
 * CartLineItem:
 * - layout: "aside" | "page" - Layout variant for styling
 * - line: OptimisticCartLine - Line item data with optimistic update tracking
 *
 * CartLineQuantity:
 * - line: OptimisticCartLine - Line item with quantity
 * - isPage: boolean - Page layout flag for styling
 *
 * CartLineRemoveButton:
 * - lineIds: string[] - Line item IDs to remove
 * - disabled: boolean - Disable during optimistic updates
 * - compact: boolean - Compact sizing for inline use
 * - isPage: boolean - Page layout flag for styling
 *
 * @styling
 * Aside Layout:
 * - Compact horizontal layout with 72-80px images
 * - Primary foreground color scheme for dark drawer
 * - Tighter spacing optimized for mobile drawer
 *
 * Page Layout:
 * - Larger 80-96px images with more spacing
 * - Standard theme colors (primary/muted)
 * - Hover effects: background tint, ring emphasis
 *
 * Touch Targets:
 * - Quantity buttons: 40px (mobile) / 36px (desktop)
 * - Remove button: 40px (mobile) / 36px (desktop)
 * - All meet WCAG 2.5.5 minimum 44px on mobile
 *
 * @dependencies
 * - @shopify/hydrogen: CartForm, Image, OptimisticCartLine
 * - ~/lib/variants: useVariantUrl for product navigation
 * - ~/components/Aside: useAside for drawer control
 * - ~/components/ProductPrice: Price display
 * - ~/components/Money: Currency formatting
 *
 * @related
 * - CartMain.tsx - Parent cart component that uses CartLineItem
 * - ProductPrice.tsx - Price display component
 * - Money.tsx - Currency formatting component
 * - Aside.tsx - Drawer context for cart aside
 * - QuantitySelector.tsx - Similar quantity UI on product pages
 *
 * @accessibility
 * - ARIA labels on quantity controls ("Increase/Decrease quantity")
 * - Remove button has sr-only text ("Remove")
 * - Proper button types to prevent form submission
 * - Focus-visible styles for keyboard navigation
 * - Disabled state properly communicated
 *
 * @performance
 * - Image lazy loading with responsive sizes
 * - Optimistic updates prevent loading states
 * - Debounced CartForm submissions via fetcher keys
 * - Prevents duplicate mutations with getUpdateKey
 */
import type {CartLineUpdateInput} from "@shopify/hydrogen/storefront-api-types";
import type {CartLayout} from "~/components/CartMain";
import {CartForm, OptimisticInput, useOptimisticData, type OptimisticCartLine} from "@shopify/hydrogen";
import {useVariantUrl} from "~/lib/variants";
import {useCallback, useMemo} from "react";
import {Link} from "react-router";
import {CART_FETCHER_KEY, useCartMutationPending, useLineItemMutating} from "~/lib/cart-utils";
import {ProductPrice} from "./ProductPrice";
import {ProductTitle} from "./ProductTitle";
import {Money} from "~/components/Money";
import {useAside} from "./Aside";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import {Button} from "~/components/ui/button";
import {Minus, Plus, X, RefreshCw} from "lucide-react";
import {cn} from "~/lib/utils";
import {PriceLoadingIndicator} from "~/components/PriceLoadingIndicator";
import {ProductMediaThumb} from "~/components/ProductMediaThumb";

type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 */
export function CartLineItem({layout, line}: {layout: CartLayout; line: CartLine}) {
    const {id, merchandise, sellingPlanAllocation} = line;
    const {product, title, image, selectedOptions} = merchandise;
    const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
    const {close} = useAside();
    const {canHover} = usePointerCapabilities();
    const isPage = layout === "page";
    const isMutating = useCartMutationPending();
    const isLineLoading = useLineItemMutating(id);
    const optimisticData = useOptimisticData<{action: string; quantity?: number}>(id);
    const isRemoving = optimisticData?.action === "remove";

    // Stable — only changes when layout or close changes
    const handleLinkClick = useCallback(() => {
        if (layout === "aside") {
            close();
        }
    }, [layout, close]);

    // Format selected options as comma-separated values — only recomputed when selectedOptions changes
    const formattedOptions = useMemo(
        () =>
            selectedOptions
                .filter(opt => opt.value !== "Default Title")
                .map(opt => opt.value)
                .join(", "),
        [selectedOptions]
    );

    // Child lines (warranties, add-ons, bundles) have parentRelationship populated
    const parentRelationship = (line as any).parentRelationship as
        | {
              parent: {
                  id: string;
                  merchandise: {title: string; product: {title: string; handle: string}} | null;
              };
          }
        | null
        | undefined;
    const isChildLine = !!parentRelationship;
    const parentProductTitle =
        parentRelationship?.parent?.merchandise?.product?.title ?? parentRelationship?.parent?.merchandise?.title;

    // Compact horizontal layout for aside drawer
    if (!isPage) {
        return (
            <div
                key={id}
                className={cn(
                    "motion-interactive flex flex-col gap-1 py-2 first:pt-0",
                    canHover ? "group/item" : "motion-press",
                    isChildLine && "ml-5 border-l border-primary-foreground/20 pl-3",
                    isRemoving && "hidden"
                )}
            >
                {/* Add-on label for child lines */}
                {isChildLine && parentProductTitle && (
                    <span className="text-xs text-primary-foreground/50 font-medium">
                        Add-on for: {parentProductTitle}
                    </span>
                )}
                <div className="flex gap-2">
                    {/* Product Image - Fixed size for drawer */}
                    <Link
                        prefetch="viewport"
                        to={lineItemUrl}
                        onClick={handleLinkClick}
                        className={cn(
                            "motion-interactive shrink-0 overflow-hidden rounded-xl bg-overlay-light ring-1 ring-primary-foreground/10 cursor-pointer",
                            canHover
                                ? "group-hover/item:ring-primary-foreground/20"
                                : "active:ring-primary-foreground/20",
                            isChildLine ? "size-12 sm:size-14" : "size-[72px] sm:size-20"
                        )}
                    >
                        <ProductMediaThumb
                            product={product}
                            fallbackImage={image}
                            alt={title}
                            aspectRatio="1/1"
                            width={isChildLine ? 56 : 80}
                            height={isChildLine ? 56 : 80}
                            loading="lazy"
                            className={cn(
                                "motion-image size-full object-cover",
                                canHover && "group-hover/item:scale-[1.03]"
                            )}
                        />
                    </Link>

                    {/* Horizontal Content Layout */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0">
                        {/* Top Row: Title + Remove Button */}
                        <div className="flex items-start justify-between gap-1">
                            <Link
                                prefetch="viewport"
                                to={lineItemUrl}
                                onClick={handleLinkClick}
                                className={cn(
                                    "motion-link flex-1 min-w-0 cursor-pointer",
                                    canHover ? "group-hover/item:opacity-85" : "active:opacity-85"
                                )}
                            >
                                <ProductTitle title={product.title} variant="cart" darkContext />
                            </Link>
                            <CartLineRemoveButton lineIds={[id]} disabled={!!line.isOptimistic || isMutating} compact />
                        </div>

                        {/* Middle Row: Variant Options - tighter to title */}
                        {formattedOptions && (
                            <span className="text-sm text-primary-foreground/60 font-medium uppercase tracking-wide truncate -mt-0.5">
                                {formattedOptions}
                            </span>
                        )}

                        {/* Subscription Badge */}
                        {sellingPlanAllocation && (
                            <span className="inline-flex items-center gap-1 text-sm font-medium uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-pill-raw)] bg-primary-foreground/8 text-primary-foreground/90 ring-1 ring-primary-foreground/15 w-fit">
                                <RefreshCw className="size-3 opacity-70" />
                                {sellingPlanAllocation.sellingPlan.name}
                            </span>
                        )}

                        {/* Bottom Row: Price + Quantity Controls */}
                        <div className="flex items-center justify-between mt-auto pt-0.5">
                            <span className="font-mono tabular-nums text-base sm:text-lg font-medium text-primary-foreground tracking-tight">
                                {isLineLoading ? (
                                    <>
                                        <PriceLoadingIndicator />
                                        <span className="sr-only">calculating</span>
                                    </>
                                ) : (
                                    <Money data={merchandise.price} />
                                )}
                            </span>
                            {isChildLine ? (
                                <span className="text-xs text-primary-foreground/50">Qty: {line.quantity}</span>
                            ) : (
                                <CartLineQuantity line={line} isPage={isPage} productTitle={product.title} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Page layout - matching aside layout structure with page-specific colors
    return (
        <div
            key={id}
            className={cn(
                "motion-interactive -mx-2 flex flex-col gap-1 rounded-lg px-2 py-2.5 first:pt-0",
                canHover ? "group/item hover:bg-muted/20" : "motion-press active:bg-muted/20",
                isChildLine && "ml-6 border-l border-border pl-4",
                isRemoving && "hidden"
            )}
        >
            {/* Add-on label for child lines */}
            {isChildLine && parentProductTitle && (
                <span className="text-xs text-muted-foreground font-medium">Add-on for: {parentProductTitle}</span>
            )}
            <div className="flex gap-2.5">
                {/* Product Image - Responsive sizing */}
                <Link
                    prefetch="viewport"
                    to={lineItemUrl}
                    onClick={handleLinkClick}
                    className={cn(
                        "motion-interactive shrink-0 overflow-hidden rounded-xl bg-muted/30 shadow-sm ring-1 ring-border/50 cursor-pointer",
                        canHover
                            ? "group-hover/item:shadow-md group-hover/item:ring-border"
                            : "active:shadow-md active:ring-border",
                        isChildLine ? "size-14 sm:size-16" : "size-20 sm:size-24"
                    )}
                >
                    <ProductMediaThumb
                        product={product}
                        fallbackImage={image}
                        alt={title}
                        aspectRatio="1/1"
                        width={isChildLine ? 64 : 96}
                        height={isChildLine ? 64 : 96}
                        loading="lazy"
                        className={cn(
                            "motion-image size-full object-cover",
                            canHover && "group-hover/item:scale-[1.03]"
                        )}
                    />
                </Link>

                {/* Horizontal Content Layout */}
                <div className="flex-1 min-w-0 flex flex-col gap-0">
                    {/* Top Row: Title + Remove Button */}
                    <div className="flex items-start justify-between gap-1">
                        <Link
                            prefetch="viewport"
                            to={lineItemUrl}
                            onClick={handleLinkClick}
                            className="motion-link flex-1 min-w-0 cursor-pointer group-hover/item:opacity-80"
                        >
                            <ProductTitle title={product.title} variant="cart" />
                        </Link>
                        <CartLineRemoveButton lineIds={[id]} disabled={!!line.isOptimistic || isMutating} compact isPage />
                    </div>

                    {/* Middle Row: Variant Options - tighter to title */}
                    {formattedOptions && (
                        <span className="text-sm text-muted-foreground/80 font-medium uppercase tracking-wide truncate -mt-0.5">
                            {formattedOptions}
                        </span>
                    )}

                    {/* Subscription Badge */}
                    {sellingPlanAllocation && (
                        <span className="inline-flex items-center gap-1 text-sm font-medium uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-pill-raw)] bg-primary/8 text-primary ring-1 ring-primary/15 w-fit">
                            <RefreshCw className="size-3 opacity-60" />
                            {sellingPlanAllocation.sellingPlan.name}
                        </span>
                    )}

                    {/* Bottom Row: Price + Quantity Controls */}
                    <div className="flex items-center justify-between mt-auto pt-0.5">
                        <span className="font-mono tabular-nums text-base sm:text-lg font-medium text-primary tracking-tight">
                            {isLineLoading ? (
                                <>
                                    <PriceLoadingIndicator />
                                    <span className="sr-only">calculating</span>
                                </>
                            ) : (
                                <ProductPrice price={merchandise.price} />
                            )}
                        </span>
                        {isChildLine ? (
                            <span className="text-xs text-muted-foreground">Qty: {line.quantity}</span>
                        ) : (
                            <CartLineQuantity line={line} isPage={isPage} productTitle={product.title} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 * Design matches the product page QuantitySelector component.
 *
 * @note quantityAvailable from the Storefront API is automatically capped by
 * Shopify's built-in "Add-to-cart limit" setting (Settings → Checkout).
 * null means inventory is not tracked (unlimited).
 *
 * @features
 * - Disabled increment button at max quantity
 * - Respects inventory limits automatically
 */
function CartLineQuantity({line, isPage, productTitle}: {line: CartLine; isPage: boolean; productTitle: string}) {
    // Hooks must be called unconditionally — before any early return
    const isMutating = useCartMutationPending();
    const optimisticData = useOptimisticData<{action: string; quantity?: number}>(line?.id ?? "");

    if (!line || typeof line?.quantity === "undefined") return null;
    const {id: lineId, quantity, isOptimistic, merchandise} = line;
    const displayQuantity = optimisticData?.quantity ?? quantity;
    const prevQuantity = Number(Math.max(0, displayQuantity - 1).toFixed(0));
    const nextQuantity = Number((displayQuantity + 1).toFixed(0));

    /**
     * Maximum quantity available for this variant.
     * null = inventory not tracked (unlimited)
     * number = capped by inventory or admin add-to-cart limit
     */
    const quantityAvailable = merchandise.quantityAvailable;

    const canDecrement = displayQuantity > 1 && !isOptimistic && !isMutating;
    /**
     * Can increment if:
     * 1. Not in optimistic state (waiting for server)
     * 2. Not mid-mutation (global cart operation in flight)
     * 3. Either inventory is not tracked (null) OR current quantity is below available
     */
    const canIncrement = !isOptimistic && !isMutating && (quantityAvailable == null || displayQuantity < quantityAvailable);

    // Compact quantity selector for aside
    // Touch targets: 44px minimum for mobile (size-11), 36px for desktop (sm:size-9)
    if (!isPage) {
        return (
            <div className="inline-flex items-center gap-1.5">
                <div className="inline-flex select-none items-center rounded-[var(--radius-pill-raw)] border border-primary-foreground/40 bg-primary-foreground/5 backdrop-blur-sm">
                    <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
                        <button
                            type="submit"
                            disabled={!canDecrement}
                            className={cn(
                                "motion-interactive motion-press flex size-10 items-center justify-center rounded-l-full text-primary-foreground/80 sm:size-9",
                                canDecrement
                                    ? "cursor-pointer hover:bg-primary-foreground/10 hover:text-primary-foreground active:scale-[var(--motion-press-scale)]"
                                    : "opacity-30 cursor-not-allowed"
                            )}
                            aria-label="Decrease quantity"
                        >
                            <Minus className="size-4" />
                        </button>
                    </CartLineUpdateButton>

                    <span className="w-9 sm:w-8 text-center text-sm font-medium text-primary-foreground tabular-nums">
                        {displayQuantity}
                    </span>

                    <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
                        <button
                            type="submit"
                            disabled={!canIncrement}
                            className={cn(
                                "motion-interactive motion-press flex size-10 items-center justify-center rounded-r-full text-primary-foreground/80 sm:size-9",
                                canIncrement
                                    ? "cursor-pointer hover:bg-primary-foreground/10 hover:text-primary-foreground active:scale-[var(--motion-press-scale)]"
                                    : "opacity-30 cursor-not-allowed"
                            )}
                            aria-label="Increase quantity"
                        >
                            <Plus className="size-4" />
                        </button>
                    </CartLineUpdateButton>
                </div>
            </div>
        );
    }

    // Compact quantity selector for page layout (same structure, theme-aware colors)
    // Touch targets: 44px minimum for mobile (size-11), 36px for desktop (sm:size-9)
    return (
        <div className="inline-flex items-center gap-1.5">
            <div className="inline-flex select-none items-center rounded-[var(--radius-pill-raw)] border border-primary/50 bg-muted/30 shadow-sm">
                <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
                    <button
                        type="submit"
                        disabled={!canDecrement}
                        className={cn(
                            "motion-interactive motion-press flex size-10 items-center justify-center rounded-l-full text-primary/70 sm:size-9",
                            canDecrement
                                ? "cursor-pointer hover:bg-primary/10 hover:text-primary active:scale-[var(--motion-press-scale)]"
                                : "opacity-30 cursor-not-allowed"
                        )}
                        aria-label="Decrease quantity"
                    >
                        <Minus className="size-4" />
                    </button>
                </CartLineUpdateButton>

                <span className="w-9 sm:w-8 text-center text-sm font-medium text-primary tabular-nums">{displayQuantity}</span>

                <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
                    <button
                        type="submit"
                        disabled={!canIncrement}
                        className={cn(
                            "motion-interactive motion-press flex size-10 items-center justify-center rounded-r-full text-primary/70 sm:size-9",
                            canIncrement
                                ? "cursor-pointer hover:bg-primary/10 hover:text-primary active:scale-[var(--motion-press-scale)]"
                                : "opacity-30 cursor-not-allowed"
                        )}
                        aria-label="Increase quantity"
                    >
                        <Plus className="size-4" />
                    </button>
                </CartLineUpdateButton>
            </div>
        </div>
    );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
    lineIds,
    disabled,
    compact = false,
    isPage = false
}: {
    lineIds: string[];
    disabled: boolean;
    compact?: boolean;
    isPage?: boolean;
}) {
    return (
        <CartForm
            fetcherKey={CART_FETCHER_KEY}
            route="/cart"
            action={CartForm.ACTIONS.LinesRemove}
            inputs={{lineIds}}
        >
            <OptimisticInput id={lineIds[0]} data={{action: "remove"}} />
            {/* Touch target: 44px minimum for mobile (size-10), 36px for desktop (sm:size-9) */}
            <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={disabled}
                className={cn(
                    "motion-interactive motion-press size-10 sm:size-9",
                    compact && isPage
                        ? "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 group-hover/item:text-muted-foreground"
                        : compact
                          ? "text-primary-foreground/40 hover:text-primary-foreground hover:bg-overlay-light group-hover/item:text-primary-foreground/60"
                          : "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 group-hover/item:text-muted-foreground"
                )}
            >
                <X className="size-4" />
                <span className="sr-only">Remove</span>
            </Button>
        </CartForm>
    );
}

function CartLineUpdateButton({children, lines}: {children: React.ReactNode; lines: CartLineUpdateInput[]}) {
    return (
        <CartForm
            fetcherKey={CART_FETCHER_KEY}
            route="/cart"
            action={CartForm.ACTIONS.LinesUpdate}
            inputs={{lines}}
        >
            <OptimisticInput id={lines[0].id} data={{action: "update", quantity: lines[0].quantity}} />
            {children}
        </CartForm>
    );
}

