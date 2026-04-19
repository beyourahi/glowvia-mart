/**
 * @fileoverview Cart summary component with shipping progress, order notes, and checkout
 *
 * @description
 * Cart summary that displays free shipping progress, order notes, and checkout button.
 * Supports both cart page and cart drawer (aside) layouts with different styling.
 *
 * @features
 * - Free shipping progress bar with threshold tracking
 * - Visual celebration when free shipping is unlocked (animated icons, glow effects)
 * - Order note textarea with debounced auto-save (800ms delay)
 * - Store credit notification for logged-in users
 * - Checkout button with price display and total
 * - Loading state on free shipping progress during cart mutations (matches checkout pattern)
 * - Offline detection with disabled state and warning
 * - Responsive layouts for page vs drawer with theme-aware styling
 * - Progress milestone markers at 25%, 50%, 75%
 * - Encouraging message when close to free shipping (70%+)
 *
 * @props
 * - cart: Cart data from Shopify API
 * - layout: "page" or "aside" (drawer) - determines styling
 * - isLoggedIn: Whether user is authenticated
 * - hasStoreCredit: Whether user has available store credit
 * - shippingConfig: Free shipping threshold configuration
 *
 * @state
 * - Order note value with debounced save (local state + fetcher)
 *
 * @dependencies
 * - CartForm: Shopify cart action forms (Hydrogen)
 * - useNetworkStatus: Detects online/offline status
 * - Money: Currency formatting component
 * - Progress: Free shipping progress bar (shadcn)
 * - useFetcher: React Router fetcher for non-blocking submissions
 *
 * @free-shipping-logic
 * - Calculates progress: (subtotal / threshold) * 100
 * - Shows remaining amount needed
 * - Milestone markers at 25%, 50%, 75%
 * - Celebration animation when unlocked (bounce, pulse, glow)
 * - Encouraging message when close (70%+ progress)
 * - Different styling for page vs aside (success vs success-on-dark)
 * - Loading state: replaces amount with "Calculating..." + spinner during cart mutations
 * - Progress bar dims (opacity-50) during recalculation to signal pending state
 * - "Almost there" message hidden during mutations to avoid stale encouragement
 *
 * @offline-handling
 * - useNetworkStatus hook for real-time detection
 * - Checkout button disabled when offline
 * - Warning message with WifiOff icon above button
 * - Prevents checkout attempts that would fail
 * - Cart actions (add/remove) also disabled
 *
 * @architecture
 * Main component: CartSummary - wrapper with layout switching
 * Sub-components:
 * - FreeShippingProgress: Animated progress tracker
 * - CartCheckoutActions: Checkout button with offline detection
 * - CartOrderNote: Debounced note textarea
 *
 * @accessibility
 * - Proper labels on all inputs
 * - Loading states indicated visually and in text
 * - 44px minimum touch targets
 * - Color not sole indicator (icons + text)
 * - ARIA labels on interactive elements
 *
 * @related
 * - ~/lib/shipping.ts - Free shipping calculations
 * - ~/routes/cart.tsx - Cart action handlers
 * - CartForm (Hydrogen) - Form submissions
 * - Money.tsx - Price formatting with currency symbol
 * - useNetworkStatus - Online/offline detection hook
 * - CartMain.tsx - Renders CartSummary with props
 */

import type {CartSummaryProps} from "types";
import {CartForm} from "@shopify/hydrogen";
import {Money} from "~/components/Money";
import {useEffect, useRef, useState} from "react";
import {useFetcher, useFetchers} from "react-router";
import {Progress} from "~/components/ui/progress";
import {Wallet, Check, Truck, Loader2, Sparkles, PartyPopper, WifiOff} from "lucide-react";
import {Textarea} from "~/components/ui/textarea";
import {cn} from "~/lib/utils";
import {qualifiesForFreeShipping, remainingForFreeShipping} from "~/lib/shipping";
import {formatPrice} from "~/lib/currency-formatter";
import {useNetworkStatus} from "~/hooks/useNetworkStatus";

const FALLBACK_CART_CONTENT = {
    cartDrawerTitle: "Your Bag",
    cartPageTitle: "Shopping Bag",
    itemCountSingular: "item",
    itemCountPlural: "items",
    emptyCartHeading: "Your bag is empty",
    emptyCartCta: "Continue Shopping",
    quantityLabel: "Quantity",
    removeLabel: "Remove",
    subtotalLabel: "Subtotal",
    shippingLabel: "Shipping",
    taxLabel: "Tax",
    totalLabel: "Total",
    taxShippingNotice: "Taxes and shipping calculated at checkout",
    discountPlaceholder: "Enter discount code",
    discountApplyButton: "Apply",
    discountApplied: "Discount applied",
    discountError: "Invalid discount code",
    freeShippingLabel: "Free Shipping",
    freeShippingUnlocked: "You've unlocked free shipping!",
    freeShippingAwayTemplate: "{amount} away from free shipping",
    freeShippingAlmost: "You're almost there!",
    freeShippingCalculating: "Calculating...",
    orderNotesPlaceholder: "Add a note to your order",
    checkoutButton: "Checkout",
    checkoutCalculating: "Calculating...",
    checkoutOfflineWarning: "Connect to the internet to checkout",
    storeCreditNotice: "Store credit will be applied at checkout",
    closeButton: "Close",
    suggestionsTitle: "Complete your look"
} as const;

const FALLBACK_UI_MESSAGES = {
    loadingSaving: "Saving..."
} as const;

// =============================================================================
// CART MUTATION STATE HOOK
// =============================================================================

/**
 * Global fetcher key used by all cart mutations.
 * Must match the key used in CartLineItem.tsx and other cart components.
 */
const CART_FETCHER_KEY = "cart-mutation";

/**
 * Detects if any cart mutation is currently in flight.
 * Used to show "Calculating..." state on the subtotal while
 * waiting for the server to return updated totals.
 *
 * @returns true if a cart mutation (add/update/remove) is pending
 */
function useCartMutationPending(): boolean {
    const fetchers = useFetchers();
    return fetchers.some(fetcher => fetcher.key === CART_FETCHER_KEY && fetcher.state !== "idle");
}

// =============================================================================
// MAIN CART SUMMARY COMPONENT
// =============================================================================

export function CartSummary({cart, layout, isLoggedIn, hasStoreCredit, shippingConfig}: CartSummaryProps) {
    const isPage = layout === "page";
    const cartContent = FALLBACK_CART_CONTENT;

    // Compact aside summary - fixed at bottom of cart drawer
    if (!isPage) {
        return (
            <div className="shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 space-y-2 border-t border-primary-foreground/10">
                {/* Free Shipping Progress - compact version */}
                {shippingConfig?.freeShippingThreshold && <FreeShippingProgress cart={cart} shippingConfig={shippingConfig} isPage={isPage} />}

                {/* Order Note Section - compact */}
                <CartOrderNote note={cart?.note} isPage={false} />

                {/* Store Credit Notification - compact */}
                {isLoggedIn && hasStoreCredit && (
                    <p className="text-sm sm:text-sm text-primary-foreground/90 flex items-center gap-1 sm:gap-1.5">
                        <Wallet className="size-3 sm:size-3.5 shrink-0" />
                        {cartContent.storeCreditNotice}
                    </p>
                )}

                {/* Checkout button with price */}
                <CartCheckoutActions
                    checkoutUrl={cart?.checkoutUrl}
                    isPage={isPage}
                    subtotal={cart?.cost?.subtotalAmount}
                />
            </div>
        );
    }

    // Page summary - compact layout matching aside structure with page colors
    return (
        <div className="space-y-2.5 sm:space-y-3 rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
            {/* Free Shipping Progress */}
            {shippingConfig?.freeShippingThreshold && <FreeShippingProgress cart={cart} shippingConfig={shippingConfig} isPage={isPage} />}

            {/* Order Note Section */}
            <CartOrderNote note={cart?.note} isPage={true} />

            {/* Store Credit Notification */}
            {isLoggedIn && hasStoreCredit && (
                <p className="text-sm sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-1.5">
                    <Wallet className="size-3 sm:size-3.5 shrink-0" />
                    {cartContent.storeCreditNotice}
                </p>
            )}

            {/* Checkout button with price */}
            <CartCheckoutActions
                checkoutUrl={cart?.checkoutUrl}
                isPage={isPage}
                subtotal={cart?.cost?.subtotalAmount}
            />

            <p className="text-sm sm:text-sm text-center text-muted-foreground">{cartContent.taxShippingNotice}</p>
        </div>
    );
}

// =============================================================================
// FREE SHIPPING PROGRESS
// =============================================================================

/**
 * Animated free shipping progress tracker with celebration effects.
 * Shows progress bar, milestone markers, and celebration when threshold reached.
 */
interface FreeShippingProgressProps {
    cart: CartSummaryProps["cart"];
    shippingConfig: NonNullable<CartSummaryProps["shippingConfig"]>;
    isPage?: boolean;
}

function FreeShippingProgress({cart, shippingConfig, isPage = true}: FreeShippingProgressProps) {
    const cartContent = FALLBACK_CART_CONTENT;
    const isMutating = useCartMutationPending();
    const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount || "0");
    const threshold = shippingConfig.freeShippingThreshold ?? 0;
    const progress = Math.min((subtotal / threshold) * 100, 100);
    const remaining = remainingForFreeShipping(subtotal, threshold);
    const qualified = qualifiesForFreeShipping(subtotal, threshold);

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-busy={isMutating}
            className={cn(
                "relative overflow-hidden rounded-xl p-2.5 sm:p-3 transition-all duration-500",
                qualified
                    ? isPage
                        ? "bg-success/10 ring-1 ring-success/20"
                        : "bg-success-on-dark/20 ring-1 ring-success-on-dark/30"
                    : isPage
                      ? "bg-muted/40"
                      : "bg-primary-foreground/[0.07]"
            )}
        >
            {/* Success celebration glow effect */}
            {qualified && (
                <div
                    className={cn(
                        "absolute inset-0 opacity-30 animate-pulse",
                        isPage
                            ? "bg-linear-to-r from-transparent via-success/20 to-transparent"
                            : "bg-linear-to-r from-transparent via-success-on-dark/20 to-transparent"
                    )}
                />
            )}

            <div className="relative space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        {qualified ? (
                            <div className="relative">
                                <PartyPopper
                                    className={cn(
                                        "size-4 sm:size-5 shrink-0 animate-bounce",
                                        isPage ? "text-success" : "text-success-on-dark"
                                    )}
                                    style={{animationDuration: "1s"}}
                                />
                                <Sparkles
                                    className={cn(
                                        "absolute -top-1 -right-1 size-2.5 sm:size-3",
                                        isPage ? "text-success/80" : "text-success-on-dark/80",
                                        "animate-pulse"
                                    )}
                                />
                            </div>
                        ) : (
                            <Truck
                                className={cn(
                                    "size-3.5 sm:size-4 shrink-0 transition-colors",
                                    isPage ? "text-muted-foreground" : "text-primary-foreground/70"
                                )}
                            />
                        )}
                        <span
                            className={cn(
                                "text-sm sm:text-sm font-medium truncate transition-colors",
                                qualified
                                    ? isPage
                                        ? "text-success"
                                        : "text-success-on-dark"
                                    : isPage
                                      ? "text-foreground"
                                      : "text-primary-foreground"
                            )}
                        >
                            {cartContent.freeShippingLabel}
                        </span>
                    </div>
                    {qualified ? (
                        <span
                            className={cn(
                                "flex items-center gap-1.5 text-sm sm:text-sm font-semibold shrink-0",
                                isPage ? "text-success" : "text-success-on-dark"
                            )}
                        >
                            <span
                                className={cn(
                                    "flex items-center justify-center size-4 sm:size-5 rounded-full",
                                    isPage
                                        ? "bg-success text-success-foreground"
                                        : "bg-success-on-dark text-success-on-dark-foreground",
                                    "animate-success-pulse"
                                )}
                            >
                                <Check className="size-2.5 sm:size-3" strokeWidth={3} />
                            </span>
                            {cartContent.freeShippingUnlocked}
                        </span>
                    ) : isMutating ? (
                        <span
                            className={cn(
                                "flex items-center gap-1.5 text-sm sm:text-sm shrink-0 animate-pulse",
                                isPage ? "text-muted-foreground" : "text-primary-foreground/70"
                            )}
                        >
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                            <span>{cartContent.freeShippingCalculating}</span>
                        </span>
                    ) : (
                        <span
                            className={cn(
                                "text-sm sm:text-sm shrink-0",
                                isPage ? "text-muted-foreground" : "text-primary-foreground/70"
                            )}
                        >
                            {cartContent.freeShippingAwayTemplate.replace("{amount}", formatPrice(remaining, shippingConfig.currencyCode))}
                        </span>
                    )}
                </div>

                {/* Enhanced progress bar - dims during recalculation */}
                <div
                    className={cn("relative transition-opacity duration-300", isMutating && !qualified && "opacity-50")}
                >
                    <Progress
                        value={progress}
                        className={cn(
                            "h-2 sm:h-2.5 transition-all duration-500",
                            qualified
                                ? isPage
                                    ? "bg-success/20"
                                    : "bg-success-on-dark/20"
                                : isPage
                                  ? "bg-muted"
                                  : "bg-primary-foreground/20"
                        )}
                        indicatorClassName={cn(
                            "transition-all duration-700 ease-out",
                            qualified
                                ? isPage
                                    ? "bg-linear-to-r from-success/80 via-success to-success/90 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                    : "bg-linear-to-r from-success-on-dark/80 via-success-on-dark to-success-on-dark/90 shadow-[0_0_8px_rgba(160,230,180,0.5)]"
                                : isPage
                                  ? "bg-linear-to-r from-primary/70 via-primary to-primary/80"
                                  : "bg-primary-foreground"
                        )}
                    />

                    {/* Progress milestone markers for visual interest */}
                    <div className="absolute inset-0 flex items-center justify-between px-0.5 pointer-events-none">
                        {[25, 50, 75].map(milestone => (
                            <div
                                key={milestone}
                                className={cn(
                                    "w-0.5 h-1 rounded-full transition-colors duration-300",
                                    progress >= milestone
                                        ? qualified
                                            ? isPage
                                                ? "bg-success-foreground/40"
                                                : "bg-success-on-dark-foreground/40"
                                            : isPage
                                              ? "bg-primary-foreground/40"
                                              : "bg-primary/40"
                                        : isPage
                                          ? "bg-muted-foreground/20"
                                          : "bg-primary-foreground/10"
                                )}
                                style={{marginLeft: `${milestone}%`}}
                            />
                        ))}
                    </div>
                </div>

                {/* Encouraging message when close to threshold - hidden during recalculation */}
                {!qualified && !isMutating && progress >= 70 && (
                    <p
                        className={cn(
                            "text-sm sm:text-sm font-medium animate-pulse",
                            isPage ? "text-primary/80" : "text-primary-foreground/80"
                        )}
                    >
                        {cartContent.freeShippingAlmost} 🎉
                    </p>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// CHECKOUT ACTIONS
// =============================================================================

/**
 * Checkout button with price display, mutation loading state, and offline detection.
 *
 * Shows "Calculating..." with a spinner on the price when cart mutations are in flight.
 * This provides instant feedback that the total is being updated, rather than
 * showing a stale price until the server responds.
 *
 * @param checkoutUrl - Shopify checkout URL
 * @param isPage - Page layout (true) or aside drawer (false) for styling
 * @param subtotal - Cart subtotal amount and currency
 */
function CartCheckoutActions({
    checkoutUrl,
    isPage,
    subtotal
}: {
    checkoutUrl?: string;
    isPage: boolean;
    subtotal?: {amount?: string; currencyCode?: string} | null;
}) {
    const {isOnline} = useNetworkStatus();
    const isMutating = useCartMutationPending();
    const cartContent = FALLBACK_CART_CONTENT;

    if (!checkoutUrl) return null;

    const hasSubtotal = subtotal?.amount && subtotal?.currencyCode;

    // Shared button/link styles
    // Aside: warm accent-subtle (cream/gold) creates premium warmth against the dark drawer
    // accent-foreground on accent-subtle = ~12:1 contrast (WCAG AAA) ✓
    // accent-subtle on primary (drawer bg) = ~5.5:1 contrast (WCAG AA) ✓
    const baseStyles = cn(
        "motion-interactive motion-press w-full inline-flex min-h-11 select-none items-center justify-between rounded-[var(--radius-pill-raw)] border-2 px-3 text-base font-medium active:scale-[var(--motion-press-scale)] sm:px-4 sm:text-lg",
        isPage ? "border-primary bg-primary text-primary-foreground py-3" : "border-accent bg-accent text-accent-foreground py-2.5"
    );

    // When offline: Show disabled button with warning
    if (!isOnline) {
        return (
            <div className="space-y-2">
                {/* Offline warning */}
                <div
                    className={cn(
                        "flex items-center justify-center gap-1.5 text-sm",
                        isPage ? "text-destructive" : "text-primary-foreground/80"
                    )}
                >
                    <WifiOff className="size-3.5" aria-hidden="true" />
                    <span>{cartContent.checkoutOfflineWarning}</span>
                </div>
                {/* Disabled checkout button */}
                <button disabled className={cn(baseStyles, "opacity-50 cursor-not-allowed")}>
                    {/* Price on the left */}
                    <span className="flex items-center font-mono tabular-nums">
                        {hasSubtotal ? (
                            <Money data={{amount: subtotal.amount!, currencyCode: subtotal.currencyCode!}} />
                        ) : (
                            "-"
                        )}
                    </span>
                    {/* Checkout text with offline icon */}
                    <span className="flex items-center gap-1.5">
                        <WifiOff className="size-4" aria-hidden="true" />
                        {cartContent.checkoutButton}
                    </span>
                </button>
            </div>
        );
    }

    // Online: Normal checkout link
    // Price display logic inlined to avoid creating components during render
    const priceDisplay = isMutating ? (
        <span className="flex items-center gap-1.5 text-sm sm:text-base opacity-80">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>{cartContent.checkoutCalculating}</span>
        </span>
    ) : hasSubtotal ? (
        <Money data={{amount: subtotal.amount!, currencyCode: subtotal.currencyCode!}} />
    ) : (
        <>-</>
    );

    return (
        <a
            href={checkoutUrl}
            target="_self"
            className={cn(baseStyles, isPage ? "hover:bg-primary/90" : "hover:bg-accent/80")}
        >
            {/* Price on the left - shows calculating message during mutations */}
            <span className="flex items-center font-mono tabular-nums">{priceDisplay}</span>
            {/* Checkout text on the right */}
            <span>{cartContent.checkoutButton}</span>
        </a>
    );
}

// =============================================================================
// ORDER NOTE
// =============================================================================

/**
 * Order note component with debounced auto-save.
 * Allows customers to add special instructions for their order.
 */
function CartOrderNote({note, isPage}: {note?: string | null; isPage: boolean}) {
    const [value, setValue] = useState(note || "");
    const noteFetcher = useFetcher({key: "note-update"});
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const cartContent = FALLBACK_CART_CONTENT;
    const uiMessages = FALLBACK_UI_MESSAGES;

    const isLoading = noteFetcher.state !== "idle";

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const handleChange = (newValue: string) => {
        setValue(newValue);

        // Debounced auto-save
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            const formData = new FormData();
            // CartForm.getFormInput() parses cartFormInput as JSON to extract {action, inputs}
            // Both action and inputs must be inside the cartFormInput JSON object
            formData.append(
                "cartFormInput",
                JSON.stringify({
                    action: CartForm.ACTIONS.NoteUpdate,
                    inputs: {}
                })
            );
            // The note is read directly from formData in the action handler
            formData.append("note", newValue);
            void noteFetcher.submit(formData, {
                method: "POST",
                action: "/cart"
            });
        }, 800);
    };

    return (
        <CartForm route="/cart" action={CartForm.ACTIONS.NoteUpdate}>
            <div className="space-y-1.5 sm:space-y-2">
                <Textarea
                    name="note"
                    value={value}
                    onChange={e => handleChange(e.target.value)}
                    placeholder={cartContent.orderNotesPlaceholder}
                    className={cn(
                        "min-h-16 sm:min-h-20 resize-none",
                        !isPage &&
                            "bg-primary-foreground/[0.07] border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/70 focus-visible:border-primary-foreground/50 focus-visible:ring-primary-foreground/30"
                    )}
                />
                {isLoading && (
                    <span
                        className={cn(
                            "flex items-center gap-1 text-sm",
                            isPage ? "text-muted-foreground" : "text-primary-foreground/60"
                        )}
                    >
                        <Loader2 className="size-3 animate-spin" />
                        {uiMessages.loadingSaving}
                    </span>
                )}
            </div>
        </CartForm>
    );
}
