/**
 * @fileoverview Localized Resource Handle Redirection
 *
 * @description
 * Utility for redirecting to localized resource handles when the URL handle differs from
 * the canonical localized handle. Ensures users are redirected to the correct URL for their
 * locale (e.g., /products/english-handle → /products/french-handle for FR locale).
 *
 * @architecture
 * Localization Redirect Strategy:
 * - Compares URL handle with canonical data.handle from Shopify
 * - If mismatch detected, replaces handle in pathname
 * - Preserves search params and hash
 * - Throws React Router redirect (short-circuits loader execution)
 *
 * Use Cases:
 * - Product handles: /products/shirt vs /products/chemise
 * - Collection handles: /collections/summer vs /collections/ete
 * - Blog handles: /blogs/news vs /blogs/nouvelles
 * - Article handles: /blogs/news/article vs /blogs/nouvelles/article
 *
 * Integration with Routes:
 * - Called in route loaders after fetching resource
 * - Checks if URL handle matches Shopify localized handle
 * - Redirects if mismatch to ensure SEO and canonical URLs
 *
 * @dependencies
 * - react-router redirect function
 *
 * @related
 * - app/routes/products.$handle.tsx - Redirects to localized product handle
 * - app/routes/collections.$handle.tsx - Redirects to localized collection handle
 * - app/routes/blogs.$blogHandle.$articleHandle.tsx - Redirects to localized blog/article handles
 */

import {redirect} from "react-router";

export function redirectIfHandleIsLocalized(
    request: Request,
    ...localizedResources: Array<{
        handle: string;
        data: {handle: string} & unknown;
    }>
) {
    const url = new URL(request.url);
    let shouldRedirect = false;

    localizedResources.forEach(({handle, data}) => {
        if (handle !== data.handle) {
            url.pathname = url.pathname.replace(handle, data.handle);
            shouldRedirect = true;
        }
    });

    if (shouldRedirect) {
        throw redirect(url.toString());
    }
}
