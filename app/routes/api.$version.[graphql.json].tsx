/**
 * @fileoverview GraphQL API Proxy Route
 *
 * @description
 * Proxies GraphQL requests to Shopify's Storefront API through the checkout
 * domain. This enables client-side GraphQL queries while keeping API tokens
 * secure on the server side.
 *
 * @route POST /api/:version/graphql.json
 *
 * @architecture
 * Request Flow:
 * 1. Client sends GraphQL query to this route
 * 2. Route forwards request to Shopify's checkout domain
 * 3. Response is streamed back to client
 * 4. Headers are preserved for proper content negotiation
 *
 * @versioning
 * The $version parameter allows targeting specific API versions:
 * - /api/2024-01/graphql.json
 * - /api/2024-04/graphql.json
 * - /api/unstable/graphql.json
 *
 * This enables gradual API version migration and testing.
 *
 * @use-cases
 * - Client-side data fetching without exposing API tokens
 * - Cart operations from browser JavaScript
 * - Real-time search suggestions
 * - Dynamic product loading
 *
 * @security
 * - API tokens are kept server-side (not exposed to client)
 * - Request body and headers are passed through unchanged
 * - No additional validation needed as Shopify validates queries
 *
 * @related
 * - lib/context.ts - Server-side storefront client (direct API access)
 * - components/SearchFormPredictive.tsx - Example client-side usage
 *
 * @see https://shopify.dev/docs/api/storefront
 */

import type {Route} from "./+types/api.$version.[graphql.json]";

// =============================================================================
// ACTION
// =============================================================================

/**
 * Proxies GraphQL requests to Shopify's Storefront API.
 *
 * @param params - Route params containing API version
 * @param context - Hydrogen context with environment variables
 * @param request - Incoming request with GraphQL query body
 *
 * @returns Proxied response from Shopify's GraphQL endpoint
 *
 * @note Uses checkout domain (not store domain) for API access.
 *       Response body is streamed for optimal performance.
 */
const VALID_VERSION_PATTERN = /^\d{4}-\d{2}$|^unstable$/;

const ALLOWED_HEADERS = [
    "content-type",
    "accept",
    "x-shopify-storefront-access-token",
    "x-sdk-version",
    "x-sdk-variant"
];

const MAX_BODY_SIZE = 100_000; // 100KB

export async function action({params, context, request}: Route.ActionArgs) {
    // Validate API version parameter (YYYY-MM or "unstable")
    if (!params.version || !VALID_VERSION_PATTERN.test(params.version)) {
        return new Response(
            JSON.stringify({error: "Invalid API version"}),
            {status: 400, headers: {"Content-Type": "application/json"}}
        );
    }

    // Reject oversized request bodies
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        return new Response(
            JSON.stringify({error: "Request too large"}),
            {status: 413, headers: {"Content-Type": "application/json"}}
        );
    }

    // Forward only allowlisted headers to Shopify (strip cookies, auth, ambient headers)
    const forwardHeaders = new Headers();
    for (const name of ALLOWED_HEADERS) {
        const value = request.headers.get(name);
        if (value) forwardHeaders.set(name, value);
    }

    const response = await fetch(`https://${context.env.PUBLIC_CHECKOUT_DOMAIN}/api/${params.version}/graphql.json`, {
        method: "POST",
        body: request.body,
        headers: forwardHeaders
    });

    return new Response(response.body, {headers: new Headers(response.headers)});
}
