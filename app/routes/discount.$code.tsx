/**
 * @fileoverview Discount Code Application Route
 *
 * @description
 * Applies a discount code to the customer's cart via URL. Enables shareable
 * discount links for marketing campaigns, influencer partnerships, and
 * promotional emails.
 *
 * @route GET /discount/:code
 *
 * @url-format
 * /discount/{discount_code}[?redirect={path}]
 *
 * @examples
 * Basic discount:       /discount/SAVE20
 * With redirect:        /discount/SAVE20?redirect=/products
 * With return_to:       /discount/SAVE20?return_to=/collections/sale
 *
 * @use-cases
 * - Email marketing campaigns with exclusive codes
 * - Influencer affiliate links
 * - Social media promotions
 * - Abandoned cart recovery emails
 * - VIP customer exclusive offers
 *
 * @behavior
 * 1. Extract discount code from URL path
 * 2. Apply discount to existing cart (or create new cart)
 * 3. Set cart ID in cookie
 * 4. Redirect to specified destination (or home)
 *
 * @security
 * - External URLs are blocked to prevent phishing
 * - URLs with "//" are rejected (open redirect protection)
 * - Only relative paths are allowed for redirect
 *
 * @query-params
 * - redirect: Path to redirect after applying discount
 * - return_to: Alternative name for redirect (Shopify compatibility)
 *
 * @related
 * - cart.$lines.tsx - Cart creation with discount support
 * - cart.tsx - Cart page where discounts are displayed
 * - CartSummary.tsx - Shows applied discounts
 *
 * @see https://shopify.dev/docs/api/storefront/latest/mutations/cartDiscountCodesUpdate
 */

import {redirect, type MetaFunction} from "react-router";
import type {Route} from "./+types/discount.$code";

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
 * Applies discount code and redirects to specified destination.
 *
 * @param request - HTTP request (for redirect query params)
 * @param context - Hydrogen context with cart client
 * @param params - Route params with discount code
 *
 * @returns 303 Redirect to destination with cart cookie
 *
 * @security Blocks external URL redirects to prevent phishing attacks
 */
export async function loader({request, context, params}: Route.LoaderArgs) {
    const {cart} = context;
    const {code} = params;

    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    let redirectParam = searchParams.get("redirect") || searchParams.get("return_to") || "/";

    // Validate redirect is a safe relative path (not an external URL)
    try {
        const parsed = new URL(redirectParam, "http://localhost");
        if (parsed.origin !== "http://localhost") {
            redirectParam = "/";
        }
    } catch {
        redirectParam = "/";
    }
    if (!redirectParam.startsWith("/")) {
        redirectParam = "/";
    }

    searchParams.delete("redirect");
    searchParams.delete("return_to");

    const qs = searchParams.toString();
    const redirectUrl = qs ? `${redirectParam}?${qs}` : redirectParam;

    if (!code) {
        return redirect(redirectUrl);
    }

    const result = await cart.updateDiscountCodes([code]);
    const cartId = result.cart?.id;
    const headers = cartId ? cart.setCartId(cartId) : new Headers();

    // Using set-cookie on a 303 redirect will not work if the domain origin have port number (:3000)
    // If there is no cart id and a new cart id is created in the progress, it will not be set in the cookie
    // on localhost:3000
    return redirect(redirectUrl, {
        status: 303,
        headers
    });
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
