/**
 * @fileoverview Cart Route
 *
 * @description
 * Handles all CartForm mutations via the `action` and renders the full-page cart
 * view exclusively for AI agent sessions.
 *
 * Normal browser navigation to `/cart` redirects to "/" — the cart UI lives in
 * the aside drawer managed by the root layout. The full cart page is only rendered
 * when `cart.$lines.tsx` detected an agent arrival and wrote a session key.
 *
 * @route POST /cart (CartForm mutations)
 * @route GET /cart (page view — agent sessions only)
 *
 * @architecture
 * Action: dispatches CartForm mutations (add/update/remove lines, discount codes,
 * gift cards, buyer identity, note). Returns UCP JSON when the request carries
 * agent headers; otherwise returns cart data with a 303 redirect when `redirectTo`
 * is present (used by BuyNowButton).
 *
 * Loader: detects agent session via `agentSessionId` session key and either
 * returns cart data (agent sessions) or issues a 302 redirect to "/" (browsers).
 *
 * @security
 * The `redirectTo` field is validated: only `__checkout_url__` and relative paths
 * starting with "/" (but not "//") are accepted to prevent open-redirect attacks.
 *
 * @related
 * - cart.$lines.tsx - Cart permalink handler that creates the agent session
 * - components/cart/CartMain.tsx - Cart UI component (includes AgentArrivalBanner)
 * - components/cart/AgentCartView.tsx - Agent-native cart rendering
 * - lib/cart-utils.ts - CART_FETCHER_KEY, useCartMutationPending, useLineItemMutating
 */

import {data, type HeadersFunction} from "react-router";
import {Suspense} from "react";
import {Await, useRouteLoaderData} from "react-router";
import type {Route} from "./+types/cart";
import type {CartQueryDataReturn} from "@shopify/hydrogen";
import {CartForm} from "@shopify/hydrogen";
import {isAgentRequest} from "~/lib/agentic/agent-request";
import {RouteErrorBoundary} from "~/components/RouteErrorBoundary";
import {CartMain, CartLoadingSkeleton} from "~/components/cart/CartMain";
import type {RootLoader} from "~/root";
import type {CartApiQueryFragment} from "storefrontapi.generated";

export const meta: Route.MetaFunction = () => [
    {title: "Cart"},
    {name: "robots", content: "noindex"}
];

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

/**
 * Dispatches CartForm mutations and returns updated cart data.
 *
 * For agent requests (identified by `isAgentRequest()`): returns UCP JSON with
 * `application/x-ucp+json` content type, using 422 on cart errors.
 * For browser requests: sets cart ID cookie and optionally redirects to
 * `redirectTo` destination (validated against open-redirect attack vectors).
 */
export const action = async ({request, context}: Route.ActionArgs) => {
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

            const discountCodes = (formDiscountCode ? [formDiscountCode] : []) as string[];

            discountCodes.push(...inputs.discountCodes);

            result = await cart.updateDiscountCodes(discountCodes);
            break;
        }
        case CartForm.ACTIONS.GiftCardCodesUpdate: {
            const formGiftCardCode = inputs.giftCardCode;

            const giftCardCodes = (formGiftCardCode ? [formGiftCardCode] : []) as string[];

            giftCardCodes.push(...inputs.giftCardCodes);

            result = await cart.updateGiftCardCodes(giftCardCodes);
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
        default:
            throw new Error(`${action} cart action is not defined`);
    }

    const cartId = result?.cart?.id;
    const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
    const {cart: cartResult, errors, warnings} = result;

    if (isAgentRequest(request)) {
        const agentHeaders = new Headers(headers);
        agentHeaders.set("Content-Type", "application/x-ucp+json");
        agentHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
        return new Response(
            JSON.stringify({cart: cartResult, errors, warnings}),
            {status: errors?.length ? 422 : 200, headers: agentHeaders}
        );
    }

    // Validate redirectTo to prevent open redirect attacks.
    // Only allow: the special "__checkout_url__" token, or relative paths starting with "/"
    // (but not "//" which is a protocol-relative URL). Reject external URLs, javascript:, data:, etc.
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

    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

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
};

export async function loader({context, request}: Route.LoaderArgs) {
    const {cart, session} = context;

    // Detect AI agent cart arrival via session key written by cart.$lines.tsx.
    // When hasAgentSession=true, render the cart page so AgentArrivalBanner is shown.
    const hasAgentSession = Boolean(session.get("agentSessionId"));

    if (request.headers.get("Accept")?.includes("text/html") && !hasAgentSession) {
        return new Response(null, {status: 302, headers: {Location: "/", "Cache-Control": "no-cache, no-store, must-revalidate"}});
    }

    const cartData = await cart.get();

    return data(
        {...cartData},
        {headers: {"Cache-Control": "no-cache, no-store, must-revalidate"}}
    );
}

// =============================================================================
// CART PAGE — rendered only when ?_agent=1 is present
// =============================================================================

/**
 * CartPage — full-page cart view rendered exclusively for agent-arrival sessions.
 *
 * Normal cart navigation redirects to "/" (the aside drawer handles cart display).
 * When `cart.$lines.tsx` detects an AI agent arrival, it writes session keys and
 * redirects to /cart (clean URL), which bypasses the redirect and renders this page
 * so the buyer can review the cart with the AgentArrivalBanner before checkout.
 *
 * CartMain handles AgentArrivalBanner rendering via useAgentSurface() from the
 * AgentSurfaceProvider — no URL flag or explicit banner placement is needed here.
 */
export default function CartPage() {
    const rootData = useRouteLoaderData<RootLoader>("root");

    if (!rootData) return null;

    return (
        <main className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
            <Suspense fallback={<CartLoadingSkeleton />}>
                <Await resolve={rootData.cart}>
                    {cart => (
                        <CartMain
                            cart={cart as CartApiQueryFragment | null}
                            layout="page"
                        />
                    )}
                </Await>
            </Suspense>
        </main>
    );
}

export {RouteErrorBoundary as ErrorBoundary};
