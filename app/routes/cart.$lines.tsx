/**
 * @fileoverview Cart Permalink Handler
 *
 * @description
 * Handles Shopify-style cart permalink URLs of the form:
 * `/cart/{variantId}:{quantity},{variantId}:{quantity}?discount=CODE`
 *
 * Creates a new cart from the encoded line items and either:
 * - Redirects AI agents to `/cart` after writing session metadata, or
 * - Redirects regular shoppers directly to the Shopify checkout URL.
 *
 * @route GET /cart/:lines
 *
 * @params
 * - lines — comma-separated `variantId:quantity` pairs (numeric IDs only)
 *
 * @query-params
 * - discount — optional discount code applied to the new cart
 * - utm_source / utm_medium — agent detection signals
 * - agent_id — explicit agent identifier written to session when present
 *
 * @side-effects
 * For agent arrivals: writes `agentSessionId` and `agentArrivalAt` to the
 * session so `AgentSurfaceProvider` can detect agent state on subsequent requests.
 *
 * @related
 * - cart.tsx - Cart page rendered for agent-session arrivals
 * - lib/cart-permalink.ts - Cart permalink URL builders
 * - lib/session.ts - Session key constants
 * - components/cart/AgentArrivalBanner.tsx - Agent banner shown on /cart
 */

import {redirect} from "react-router";
import type {Route} from "./+types/cart.$lines";
import {AGENT_SESSION_ID_KEY, AGENT_ARRIVAL_AT_KEY} from "~/lib/session";

export const meta: Route.MetaFunction = () => [
    {title: "Redirecting..."},
    {name: "robots", content: "noindex"}
];

// Agent arrival detection — UTM sources and explicit agent_id params that signal
// the buyer was sent here by an AI shopping assistant, not organic navigation.
const AGENT_UTM_SOURCES = new Set(["ai-agent", "ai_agent", "chatgpt", "perplexity", "gemini", "copilot", "claude"]);

/**
 * Returns true when the request carries signals indicating it was initiated by
 * an AI shopping agent rather than a human browser session.
 *
 * Checks: `utm_source` against known agent values, `utm_medium=ai`, and any
 * non-empty `agent_id` query parameter.
 */
function isAgentArrival(searchParams: URLSearchParams): boolean {
    const utmSource = searchParams.get("utm_source") ?? "";
    const utmMedium = searchParams.get("utm_medium") ?? "";
    const agentId = searchParams.get("agent_id") ?? "";
    return AGENT_UTM_SOURCES.has(utmSource) || utmMedium === "ai" || Boolean(agentId);
}

/**
 * Parses the cart permalink, creates the cart, and redirects the visitor.
 *
 * Line items with non-numeric variant IDs or quantities < 1 are silently dropped.
 * Redirects to "/" when no valid lines remain. Throws 410 if cart creation fails
 * (e.g. expired variant IDs).
 */
export async function loader({request, context, params}: Route.LoaderArgs) {
    const {cart} = context;
    const {lines} = params;

    if (!lines) return redirect("/");

    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    const agentArrival = isAgentArrival(searchParams);

    const linesMap = lines
        .split(",")
        .map(line => {
            const lineDetails = line.split(":");
            const variantId = lineDetails[0];
            const quantity = parseInt(lineDetails[1], 10);

            if (!/^\d+$/.test(variantId) || !Number.isInteger(quantity) || quantity < 1) {
                return null;
            }

            return {
                merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
                quantity
            };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null);

    if (linesMap.length === 0) return redirect("/");

    const discount = searchParams.get("discount");

    const result = await cart.create({
        lines: linesMap,
        discountCodes: discount ? [discount] : []
    });

    const cartResult = result.cart;

    if (result.errors?.length || !cartResult) {
        throw new Response("Link may be expired. Try checking the URL.", {
            status: 410
        });
    }

    const cartHeaders = new Headers(cart.setCartId(cartResult.id) as HeadersInit);

    // Agent arrivals: write session keys so the AgentSurfaceProvider can detect
    // agent state from session (no URL flag needed). Redirect to /cart clean.
    // Non-agent arrivals: preserve original behavior — redirect straight to Shopify checkout.
    if (agentArrival) {
        context.session.set(AGENT_SESSION_ID_KEY, searchParams.get("agent_id") || ("anon-" + Date.now()));
        context.session.set(AGENT_ARRIVAL_AT_KEY, String(Date.now()));
        cartHeaders.append("Set-Cookie", await context.session.commit());
        return redirect("/cart", {headers: cartHeaders});
    }

    if (cartResult.checkoutUrl) {
        return redirect(cartResult.checkoutUrl, {headers: cartHeaders});
    }

    throw new Error("No checkout URL found");
}

export default function Component() {
    return null;
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
