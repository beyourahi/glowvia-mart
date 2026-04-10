/**
 * @fileoverview Wishlist Redirect Route
 *
 * @description
 * Permanent redirect from /wishlist to /account/wishlist.
 * The canonical wishlist page now lives under the account layout
 * at /account/wishlist, which is publicly accessible.
 *
 * @route GET /wishlist → 301 → /account/wishlist
 *
 * @related
 * - account.wishlist.tsx - Canonical wishlist page
 * - FullScreenMenu.tsx - Updated link to /account/wishlist
 */

import {redirect, type MetaFunction} from "react-router";
import type {Route} from "./+types/wishlist";

export const meta: MetaFunction = () => {
    return [
        {title: "Redirecting..."},
        {name: "robots", content: "noindex"}
    ];
};

export async function loader(_args: Route.LoaderArgs) {
    return redirect("/account/wishlist", {status: 301});
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
