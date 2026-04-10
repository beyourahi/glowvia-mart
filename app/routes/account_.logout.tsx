/**
 * @fileoverview Logout Route
 *
 * @description
 * Handles customer logout by destroying session and clearing credentials.
 * Uses POST action to prevent CSRF and accidental logout.
 *
 * @route POST /account/logout
 *
 * @authentication
 * Session destruction handled by action.
 * Uses underscore prefix (account_) to stay outside account layout.
 *
 * @data-loading
 * - Loader: Redirects GET requests to home (prevents accidental logout)
 * - Action: Performs actual logout via POST (secure)
 *
 * @related
 * - account_.login.tsx - Login initiator
 * - account_.authorize.tsx - OAuth callback
 * - lib/context.ts - Customer Account client
 */

import {redirect} from "react-router";
import type {Route} from "./+types/account_.logout";

// =============================================================================
// LOADER
// =============================================================================

/**
 * Handles GET requests to /account/logout.
 *
 * Redirects to home instead of logging out. This prevents:
 * - Accidental logout via browser prefetch
 * - Logout via bookmark or shared link
 * - CSRF attacks via img src or similar
 *
 * @returns Redirect to homepage
 */
export async function loader() {
    return redirect("/");
}

// =============================================================================
// ACTION
// =============================================================================

/**
 * Handles POST requests to perform actual logout.
 *
 * @param context - Hydrogen context with customer account client
 *
 * @returns Redirect to homepage with session cleared
 *
 * @note The logout() method handles:
 *       - Invalidating the session token
 *       - Clearing session cookie
 *       - Redirecting to post-logout destination
 */
export async function action({context}: Route.ActionArgs) {
    return context.customerAccount.logout();
}
