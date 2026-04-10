/**
 * @fileoverview Wishlist Products API Route
 *
 * @description
 * Fetches product data for wishlist items. Since wishlist IDs are stored
 * in localStorage (client-side), products must be fetched after hydration.
 * This endpoint accepts product GIDs and returns full product data.
 *
 * @route POST /api/wishlist-products
 *
 * @architecture
 * Why client-side fetch is needed:
 * 1. Wishlist is stored in localStorage (not accessible server-side)
 * 2. Page initially renders empty/skeleton
 * 3. After hydration, client reads localStorage
 * 4. Client POSTs product IDs to this endpoint
 * 5. Server fetches products via Storefront API
 * 6. Client receives and renders products
 *
 * @security
 * - Limited to 50 products max to prevent abuse
 * - No authentication required (public product data)
 * - Product IDs are validated as proper GIDs
 *
 * @performance
 * - Uses nodes() query for batch fetching (single API call)
 * - Returns all needed product fields for ProductItem component
 * - Filters out null/deleted products
 *
 * @related
 * - wishlist.tsx - Public wishlist page (uses this API)
 * - account.wishlist.tsx - Account wishlist page (uses this API)
 * - wishlist.share.tsx - Shared wishlist (fetches server-side)
 * - lib/wishlist-context.tsx - Wishlist state management
 *
 * @see https://shopify.dev/docs/api/storefront/latest/queries/nodes
 */

import type {Route} from "./+types/api.wishlist-products";
import type {ProductItemFragment} from "storefrontapi.generated";
import {createRateLimiter, getClientIP, getRateLimitResponse} from "~/lib/rate-limit";

const limiter = createRateLimiter({windowMs: 60_000, maxRequests: 20});

// =============================================================================
// ACTION
// =============================================================================

/**
 * Fetches products by their GIDs for wishlist display.
 *
 * @param request - HTTP request with form data containing product IDs
 * @param context - Hydrogen context with storefront client
 *
 * @returns JSON with products array and optional error
 *
 * @request-format
 * FormData with "ids" field containing JSON array of GIDs:
 * ```
 * ids: '["gid://shopify/Product/123", "gid://shopify/Product/456"]'
 * ```
 */
export async function action({request, context}: Route.ActionArgs) {
    const rateLimitResponse = getRateLimitResponse(limiter.check(getClientIP(request)));
    if (rateLimitResponse) return rateLimitResponse;

    const {dataAdapter} = context;

    try {
        const formData = await request.formData();
        const idsString = formData.get("ids");

        if (!idsString || typeof idsString !== "string") {
            return Response.json({products: [], error: null});
        }

        let ids: unknown;
        try {
            ids = JSON.parse(idsString);
        } catch {
            return Response.json({products: [], error: "Invalid JSON"}, {status: 400});
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return Response.json({products: [], error: null});
        }

        const GID_PATTERN = /^gid:\/\/shopify\/Product\/\d+$/;
        const validIds = ids.filter(
            (id): id is string => typeof id === "string" && GID_PATTERN.test(id)
        );

        if (validIds.length === 0) {
            return Response.json({products: [], error: null});
        }

        const limitedIds = validIds.slice(0, 50);

        const response = await dataAdapter.query(WISHLIST_PRODUCTS_QUERY, {
            variables: {ids: limitedIds}
        });

        const {nodes} = response;

        // Filter out null nodes (deleted products) and non-Product types
        const products = nodes.filter(
            (node: any): node is ProductItemFragment => node !== null && node.__typename === "Product"
        );

        return Response.json({products, error: null});
    } catch (error) {
        console.error("[Wishlist API] Error:", error);
        return Response.json({products: [], error: "Failed to fetch products"}, {status: 500});
    }
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Batch product fetch query using nodes().
 *
 * Uses the nodes() query which accepts an array of IDs and returns
 * all matching objects in a single API call. This is more efficient
 * than fetching products individually.
 *
 * @fragment WishlistProduct includes all fields needed by ProductItem:
 * - Basic info (id, title, handle, availability)
 * - Images (featured + first 4 for gallery)
 * - Pricing (range + compare at for sales)
 * - Variants (for cart add and option display)
 */
const WISHLIST_PRODUCTS_QUERY = `#graphql
    fragment WishlistProduct on Product {
        __typename
        id
        title
        handle
        availableForSale
        featuredImage {
            id
            url
            altText
            width
            height
        }
        images(first: 4) {
            nodes {
                id
                url
                altText
                width
                height
            }
        }
        priceRange {
            minVariantPrice {
                amount
                currencyCode
            }
            maxVariantPrice {
                amount
                currencyCode
            }
        }
        compareAtPriceRange {
            minVariantPrice {
                amount
                currencyCode
            }
        }
        variants(first: 100) {
            nodes {
                id
                title
                availableForSale
                selectedOptions {
                    name
                    value
                }
                price {
                    amount
                    currencyCode
                }
                compareAtPrice {
                    amount
                    currencyCode
                }
            }
        }
    }

    query WishlistProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
            ... on Product {
                ...WishlistProduct
            }
        }
    }
` as const;
