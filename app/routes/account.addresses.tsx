/**
 * @fileoverview Address Management Redirect Route
 *
 * @description
 * Legacy route that redirects to the unified profile page.
 * Address management was consolidated into /account/profile for
 * a more cohesive account management experience.
 *
 * @route GET /account/addresses → Redirects to /account/profile
 *
 * @authentication
 * No authentication check needed - redirect is public.
 *
 * @data-loading
 * None - immediate redirect only.
 *
 * @related
 * - account.profile.tsx - Now contains address management
 * - CustomerAddressMutations.ts - Address CRUD operations
 */

import {redirect, type MetaFunction} from "react-router";
import type {Route} from "./+types/account.addresses";

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
 * Redirects all address page requests to profile page.
 *
 * @returns Redirect response to /account/profile
 */
export async function loader(_args: Route.LoaderArgs) {
    return redirect("/account/profile");
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Placeholder component - never rendered due to loader redirect.
 */
export default function Addresses() {
    return null;
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
