/**
 * @fileoverview Quick Cart Creation and Checkout Redirect Route
 *
 * @description
 * Creates a new cart with specified products and immediately redirects to
 * checkout. Enables shareable "Buy Now" links with products pre-loaded.
 * Commonly used for email campaigns, social sharing, and affiliate links.
 *
 * @route GET /cart/:variantId:quantity[,variantId:quantity...]
 *
 * @url-format
 * /cart/{variant_id}:{quantity}[,{variant_id}:{quantity}...]
 *
 * @examples
 * Single product:    /cart/41007289663544:1
 * Multiple products: /cart/41007289663544:1,41007289696312:2
 * With discount:     /cart/41007289663544:1?discount=SAVE10
 *
 * @use-cases
 * - Email campaigns with "Buy Now" buttons
 * - Social media shopping links
 * - Affiliate marketing links
 * - QR codes on physical products
 * - Subscription renewal links
 *
 * @behavior
 * 1. Parse variant IDs and quantities from URL
 * 2. Create new cart with specified items
 * 3. Apply discount code if provided
 * 4. Set cart ID in cookie for session persistence
 * 5. Redirect to Shopify checkout
 *
 * @error-handling
 * - No lines parameter: Redirects to /cart
 * - Invalid variant IDs: Returns 410 Gone
 * - Cart creation failure: Returns 410 Gone
 * - No checkout URL: Throws error
 *
 * @related
 * - cart.tsx - Cart resource route (handles cart mutations)
 * - discount.$code.tsx - Discount application route
 * - lib/context.ts - Cart API client
 *
 * @see https://shopify.dev/docs/custom-storefronts/building-with-the-storefront-api/cart
 */

import {redirect, type MetaFunction} from "react-router";
import type {Route} from "./+types/cart.$lines";

export const meta: MetaFunction = () => {
    return [
        {title: "Redirecting..."},
        {name: "robots", content: "noindex"}
    ];
};

// =============================================================================
// LOADER
// =============================================================================

/**
 * Creates a cart from URL parameters and redirects to checkout.
 *
 * @param request - HTTP request (for discount query params)
 * @param context - Hydrogen context with cart client
 * @param params - Route params with lines (variantId:quantity pairs)
 *
 * @returns Redirect to Shopify checkout
 *
 * @throws Response 410 if cart creation fails (expired/invalid link)
 * @throws Error if no checkout URL is returned
 */
export async function loader({request, context, params}: Route.LoaderArgs) {
    const {cart} = context;
    const {lines} = params;
    // Redirect to home if no lines provided (cart page no longer exists)
    if (!lines) return redirect("/");
    const linesMap = lines.split(",").map(line => {
        const lineDetails = line.split(":");
        const variantId = lineDetails[0];
        const quantity = parseInt(lineDetails[1], 10);

        if (!variantId || !/^\d+$/.test(variantId) || isNaN(quantity) || quantity < 1) {
            return null;
        }

        return {
            merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
            quantity
        };
    }).filter(Boolean);

    // If all lines were invalid, redirect to home
    if (linesMap.length === 0) return redirect("/");

    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);

    const discount = searchParams.get("discount");
    const discountArray = discount ? [discount] : [];

    // create a cart
    const result = await cart.create({
        lines: linesMap,
        discountCodes: discountArray
    });

    const cartResult = result.cart;

    if (result.errors?.length || !cartResult) {
        throw new Response("Link may be expired. Try checking the URL.", {
            status: 410
        });
    }

    // Update cart id in cookie
    const headers = cart.setCartId(cartResult.id);

    // redirect to checkout
    if (cartResult.checkoutUrl) {
        return redirect(cartResult.checkoutUrl, {headers});
    } else {
        throw new Error("No checkout URL found");
    }
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Placeholder component - never rendered.
 *
 * The loader always redirects before reaching component render.
 * This export satisfies React Router's route module requirements.
 */
export default function Component() {
    return null;
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
