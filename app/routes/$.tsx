/**
 * @fileoverview Catch-All 404 Route Handler
 *
 * @description
 * This is the "splat" route that catches all unmatched URLs in the application.
 * Any request that doesn't match a defined route will be handled here.
 * Instead of rendering a component, it throws a 404 Response which triggers
 * the ErrorBoundary in the parent layout (or root).
 *
 * @architecture
 * Route Matching Priority:
 * 1. Static routes (e.g., /cart, /search)
 * 2. Dynamic routes (e.g., /products/$handle)
 * 3. This catch-all route ($) - matches everything else
 *
 * @behavior
 * - Throws a 404 Response immediately in the loader
 * - The error is caught by the nearest ErrorBoundary
 * - ErrorPage component (in root.tsx) renders the 404 UI
 *
 * @seo
 * Proper 404 status codes are important for SEO:
 * - Search engines won't index 404 pages
 * - Helps identify broken links in search console
 *
 * @related
 * - root.tsx - Contains the ErrorBoundary that catches this error
 * - ErrorPage.tsx - The UI component shown for 404s
 * - server.ts - Checks for Shopify redirects before returning 404
 *
 * @see https://reactrouter.com/how-to/catchall-routes
 */

import type {MetaFunction} from "react-router";
import type {Route} from "./+types/$";
import {redirectLegacyProductUrl} from "~/lib/legacy-redirect";

export const meta: MetaFunction = () => {
    return [
        {title: "Page Not Found"},
        {name: "robots", content: "noindex"}
    ];
};

// =============================================================================
// LOADER
// =============================================================================

/**
 * Immediately throws a 404 Response for any unmatched route.
 *
 * @param request - The incoming HTTP request
 *
 * @throws Response - Always throws with 404 status
 *
 * @note Uses a generic "Not Found" message to avoid exposing URL paths
 *       in the error response.
 */
export async function loader({request, context}: Route.LoaderArgs) {
    await redirectLegacyProductUrl(request, context.dataAdapter);
    throw new Response("Not Found", {
        status: 404
    });
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Placeholder component - never actually rendered.
 *
 * The loader always throws before this component can render.
 * This export exists to satisfy React Router's route module requirements.
 */
export default function CatchAllPage() {
    return null;
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
