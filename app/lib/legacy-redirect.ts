import {redirect} from "react-router";
import type {DataAdapter} from "~/lib/data-source";

/**
 * First-segment strings that correspond to existing routes.
 * Any two-segment URL starting with one of these is NOT a legacy
 * collection/product URL — skip the API check and fall through to 404.
 */
const KNOWN_ROUTE_PREFIXES = new Set([
    "account",
    "api",
    "blogs",
    "cart",
    "collections",
    "discount",
    "faq",
    "gallery",
    "offline",
    "policies",
    "products",
    "sale",
    "search",
    "sitemap",
    "wishlist"
]);

const PRODUCT_EXISTS_QUERY = `#graphql
    query ProductExists($handle: String!) {
        product(handle: $handle) {
            id
        }
    }
` as const;

/**
 * Checks whether the current request matches a legacy collection/product URL
 * pattern (e.g. /skincare/hydrating-serum) and redirects to the canonical
 * /products/{handle} route with a 301 if the product exists in Shopify.
 *
 * Returns silently if the URL doesn't match or the product doesn't exist,
 * allowing the caller to proceed with its normal 404 flow.
 */
export async function redirectLegacyProductUrl(
    request: Request,
    dataAdapter: DataAdapter
): Promise<void> {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/|\/$/g, "").split("/");

    if (segments.length !== 2) return;

    const [prefix, handle] = segments;

    // Skip known route prefixes and file-like paths (e.g. robots.txt)
    if (KNOWN_ROUTE_PREFIXES.has(prefix) || prefix.includes(".")) return;

    try {
        const {product} = await dataAdapter.query<{product: {id: string} | null}>(
            PRODUCT_EXISTS_QUERY,
            {
                variables: {handle},
                cache: dataAdapter.CacheLong()
            }
        );

        if (product) {
            throw redirect(`/products/${handle}${url.search}`, 301);
        }
    } catch (error) {
        // Re-throw redirects — they use throw-based control flow
        if (error instanceof Response) throw error;
        // Swallow API errors so the 404 fallback still works
    }
}
