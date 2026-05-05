/**
 * @fileoverview /collections/all Redirect
 *
 * @description
 * Permanent redirect from the Shopify default `/collections/all` URL to the
 * storefront's custom all-products page. Preserves backward compatibility with
 * any links pointing to the default Shopify collection handle.
 *
 * @route GET /collections/all → 302 /collections/all-products
 *
 * @related
 * - collections.all-products.tsx - The actual all-products listing page
 */

import {redirect, type MetaFunction} from "react-router";

export const meta: MetaFunction = () => {
    return [
        {title: "Redirecting..."},
        {name: "robots", content: "noindex"}
    ];
};

export const loader = async () => {
    return redirect("/collections/all-products");
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
