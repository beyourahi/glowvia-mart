/**
 * @fileoverview OAuth Callback Route
 *
 * @description
 * Handles OAuth callback after customer authorizes the application.
 * Processes authorization code and establishes session.
 *
 * @route GET /account/authorize
 *
 * @authentication
 * OAuth code exchange handled automatically.
 * Uses underscore prefix (account_) to stay outside account layout.
 *
 * @data-loading
 * - Extracts authorization code from URL params
 * - Exchanges code for access token
 * - Creates customer session
 * - Redirects to /account on success
 *
 * @related
 * - account_.login.tsx - OAuth initiator
 * - account_.logout.tsx - Session destroyer
 * - lib/context.ts - Customer Account API client
 */

import type {Route} from "./+types/account_.authorize";

// =============================================================================
// LOADER
// =============================================================================

/**
 * Processes OAuth authorization callback from Shopify.
 *
 * @param context - Hydrogen context with customer account client
 *
 * @returns Redirect to /account on success, or error response
 *
 * @note The authorize() method handles:
 *       - Extracting authorization code from URL
 *       - Exchanging code for access token
 *       - Creating/updating session
 *       - Redirecting to intended destination
 */
export async function loader({context}: Route.LoaderArgs) {
    return context.customerAccount.authorize();
}
