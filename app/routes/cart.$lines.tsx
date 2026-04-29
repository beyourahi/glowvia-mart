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

function isAgentArrival(searchParams: URLSearchParams): boolean {
    const utmSource = searchParams.get("utm_source") ?? "";
    const utmMedium = searchParams.get("utm_medium") ?? "";
    const agentId = searchParams.get("agent_id") ?? "";
    return AGENT_UTM_SOURCES.has(utmSource) || utmMedium === "ai" || Boolean(agentId);
}

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
