/**
 * @fileoverview Cart Resource Route (/cart)
 *
 * @description
 * Resource route that handles all cart mutations via form submissions.
 * No UI component - cart is accessed via the cart drawer (aside) only.
 * Handles all cart operations:
 * - Add/update/remove line items
 * - Apply discount codes
 * - Apply/remove gift cards
 * - Update buyer identity
 * - Add order notes
 * - Custom unified promo code handler
 *
 * @url-pattern /cart (resource route - no UI)
 *
 * @architecture
 * Action-Based Mutations:
 * - Cart operations are handled via form submissions from CartForm components
 * - CartForm.getFormInput extracts action and inputs
 * - Results include cart data and any errors
 *
 * Data Loading:
 * - Loader provides cart data for resource requests
 * - Cart drawer gets data from root loader
 *
 * @actions
 * - LinesAdd: Add products to cart
 * - LinesUpdate: Change quantities
 * - LinesRemove: Remove items
 * - DiscountCodesUpdate: Apply discount codes
 * - GiftCardCodesAdd: Append gift card codes (2026.1.0+)
 * - GiftCardCodesRemove: Remove gift cards
 * - BuyerIdentityUpdate: Set customer info
 * - NoteUpdate: Add order notes
 * - CustomPromoCodeApply: Unified promo handler
 *
 * @related
 * - CartMain.tsx - Cart drawer UI
 * - CartSummary.tsx - Order totals and checkout
 * - CartLineItem.tsx - Individual cart item
 * - AddToCartButton.tsx - Triggers LinesAdd action
 * - Aside.tsx - Cart drawer container
 */

import {data, type HeadersFunction, type MetaFunction} from "react-router";
import type {Route} from "./+types/cart";

import type {CartQueryDataReturn} from "@shopify/hydrogen";
import {CartForm} from "@shopify/hydrogen";

export const meta: MetaFunction = () => {
    return [
        {title: "Cart"},
        {name: "robots", content: "noindex"}
    ];
};

// =============================================================================
// HEADERS
// =============================================================================

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
    const {cart} = context;

    const formData = await request.formData();

    const {action, inputs} = CartForm.getFormInput(formData);

    if (!action) {
        throw new Error("No action provided");
    }

    let status = 200;
    let result: CartQueryDataReturn;

    switch (action) {
        case CartForm.ACTIONS.LinesAdd:
            result = await cart.addLines(inputs.lines);
            break;
        case CartForm.ACTIONS.LinesUpdate:
            result = await cart.updateLines(inputs.lines);
            break;
        case CartForm.ACTIONS.LinesRemove:
            result = await cart.removeLines(inputs.lineIds);
            break;
        case CartForm.ACTIONS.BuyerIdentityUpdate: {
            result = await cart.updateBuyerIdentity({
                ...inputs.buyerIdentity
            });
            break;
        }
        case CartForm.ACTIONS.NoteUpdate: {
            const note = String(formData.get("note") || "");
            result = await cart.updateNote(note);
            break;
        }
        case CartForm.ACTIONS.DiscountCodesUpdate: {
            const formDiscountCode = inputs.discountCode;

            // User inputted discount code
            const discountCodes = (formDiscountCode ? [formDiscountCode] : []) as string[];

            // Combine discount codes already applied on cart
            discountCodes.push(...inputs.discountCodes);

            result = await cart.updateDiscountCodes(discountCodes);
            break;
        }
        case CartForm.ACTIONS.GiftCardCodesAdd: {
            const giftCardCodes = inputs.giftCardCodes as string[];
            result = await cart.addGiftCardCodes(giftCardCodes);
            break;
        }
        case CartForm.ACTIONS.GiftCardCodesRemove: {
            const appliedGiftCardIds = inputs.giftCardCodes as string[];
            result = await cart.removeGiftCardCodes(appliedGiftCardIds);
            break;
        }
        case "CustomPromoCodeApply": {
            // Unified promo code: tries discount first, then gift card
            const promoCode = String(formData.get("promoCode") || "").trim();

            // Parse the JSON arrays from form data
            let existingDiscountCodes: string[] = [];
            let existingGiftCardCodes: string[] = [];
            try {
                const discountCodesStr = formData.get("discountCodes");
                const giftCardCodesStr = formData.get("giftCardCodes");
                if (discountCodesStr) {
                    const parsed = JSON.parse(String(discountCodesStr));
                    if (Array.isArray(parsed)) existingDiscountCodes = parsed as string[];
                }
                if (giftCardCodesStr) {
                    const parsed = JSON.parse(String(giftCardCodesStr));
                    if (Array.isArray(parsed)) existingGiftCardCodes = parsed as string[];
                }
            } catch {
                // Fallback to empty arrays if parsing fails
            }

            if (!promoCode) {
                // No code entered - just return current discount codes state
                result = await cart.updateDiscountCodes(existingDiscountCodes);
                break;
            }

            // Step 1: Try as discount code first
            const discountResult = await cart.updateDiscountCodes([promoCode, ...existingDiscountCodes]);

            // Check if the code was applied successfully as a discount
            const discountApplied = discountResult.cart?.discountCodes?.some(
                code => code.code.toLowerCase() === promoCode.toLowerCase() && code.applicable
            );

            if (discountApplied) {
                // Success as discount code
                result = discountResult;
                break;
            }

            // Step 2: Not a valid discount - remove it from discount codes and try as gift card
            // Remove the invalid discount code (defensive: don't let cleanup failure block gift card attempt)
            try {
                await cart.updateDiscountCodes(existingDiscountCodes);
            } catch {
                // Cleanup failed — cart may still have the invalid discount code.
                // Proceed to gift card attempt regardless.
            }

            // Try as gift card
            const giftCardResult = await cart.updateGiftCardCodes([promoCode, ...existingGiftCardCodes]);

            // Return the gift card result - if invalid, it will have userErrors
            // The frontend will handle displaying appropriate error messages
            result = giftCardResult;
            break;
        }
        default:
            throw new Error(`${action} cart action is not defined`);
    }

    const cartId = result?.cart?.id;
    const headers = cartId ? cart.setCartId(cartId) : new Headers();
    const {cart: cartResult, errors, warnings} = result;

    const redirectTo = formData.get("redirectTo") ?? null;
    if (typeof redirectTo === "string") {
        let destination: string | null = null;
        if (redirectTo === "__checkout_url__") {
            destination = cartResult?.checkoutUrl ?? null;
        } else if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
            destination = redirectTo;
        }
        if (destination) {
            status = 303;
            headers.set("Location", destination);
        }
    }

    return data(
        {
            cart: cartResult,
            errors,
            warnings,
            analytics: {
                cartId
            }
        },
        {status, headers}
    );
}

export async function loader({context, request}: Route.LoaderArgs) {
    const {cart} = context;

    // Document requests (browser navigation): redirect to homepage.
    // The cart UI is the drawer — there is no full-page cart view.
    if (request.headers.get("Accept")?.includes("text/html")) {
        return new Response(null, {
            status: 302,
            headers: {Location: "/"}
        });
    }

    // Fetch/resource requests (from CartForm): return cart data
    return await cart.get();
}

// =============================================================================
// NO UI COMPONENT
// =============================================================================

/**
 * Resource route — cart UI is the drawer.
 * This component should never render (loader redirects document requests).
 */
export default function Cart() {
    // Resource route — cart UI is the drawer.
    // This component should never render (loader redirects document requests).
    return null;
}
