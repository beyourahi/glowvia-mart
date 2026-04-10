/**
 * @fileoverview Account Catch-All Route
 *
 * @description
 * Catches all undefined routes within /account/* namespace and redirects
 * to main account page. No authentication check - account pages are
 * publicly accessible with conditional content.
 *
 * @route GET /account/*
 *
 * @data-loading
 * None - redirects to /account immediately.
 *
 * @related
 * - account._index.tsx - Account dashboard destination
 * - account.tsx - Account layout
 */

import {redirect, type MetaFunction} from "react-router";
import type {Route} from "./+types/account.$";

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
 * Handles unmatched account routes by redirecting to account dashboard.
 *
 * @returns Redirect to /account
 */
export async function loader(_args: Route.LoaderArgs) {
    return redirect("/account");
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
