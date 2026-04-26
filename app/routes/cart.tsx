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
 * - GiftCardCodesUpdate: Replace applied gift card codes
 * - GiftCardCodesAdd: Append gift card codes (2026.1.0+)
 * - GiftCardCodesRemove: Remove gift cards
 * - BuyerIdentityUpdate: Set customer info
 * - NoteUpdate: Add order notes
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
        return data(
            {cart: null, errors: ["No cart action provided"], warnings: [], analytics: {}},
            {status: 400}
        );
    }

    let status = 200;
    let result: CartQueryDataReturn;

    // TODO: Checkout MCP integration — implement when GA
    // Docs: https://shopify.dev/docs/agents/checkout/mcp
    // Gate: Shopify limited-partner preview as of 2026-04.
    //       No logic changes required here — Checkout MCP operates via a separate MCP
    //       server endpoint, not via CartForm. Cart permalinks (checkout URLs) are the
    //       current bridge between AI agents and Shopify checkout.
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
        case CartForm.ACTIONS.GiftCardCodesUpdate: {
            const formGiftCardCode = inputs.giftCardCode;
            const giftCardCodes = (formGiftCardCode ? [formGiftCardCode] : []) as string[];

            giftCardCodes.push(...inputs.giftCardCodes);

            result = await cart.updateGiftCardCodes(giftCardCodes);
            break;
        }
        case CartForm.ACTIONS.GiftCardCodesRemove: {
            const appliedGiftCardIds = inputs.giftCardCodes as string[];
            result = await cart.removeGiftCardCodes(appliedGiftCardIds);
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
