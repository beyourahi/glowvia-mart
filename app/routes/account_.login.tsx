/**
 * @fileoverview Login Route
 *
 * @description
 * Initiates OAuth login flow for customer authentication.
 * Redirects to Shopify's hosted login page.
 *
 * @route GET /account/login
 *
 * @authentication
 * None required - this is the login entry point.
 * Uses underscore prefix (account_) to stay outside account layout.
 *
 * @data-loading
 * None - immediate redirect to Shopify OAuth authorization.
 * Includes country code for localized login experience.
 *
 * @related
 * - account_.authorize.tsx - OAuth callback handler
 * - account_.logout.tsx - Logout handler
 * - lib/context.ts - Customer Account API client
 */

import type {Route} from "./+types/account_.login";
import {STORE_COUNTRY_CODE} from "~/lib/store-locale";

// =============================================================================
// LOADER
// =============================================================================

/**
 * Initiates OAuth login by redirecting to Shopify's login page.
 *
 * @param context - Hydrogen context with customer account client and i18n
 *
 * @returns Redirect response to Shopify's OAuth authorization endpoint
 *
 * @note The login() method handles:
 *       - Generating PKCE code verifier/challenge
 *       - Creating state parameter for CSRF protection
 *       - Building authorization URL with all required params
 *       - Storing PKCE verifier in session for later verification
 */
export async function loader({request, context}: Route.LoaderArgs) {
    return context.customerAccount.login({
        // Pass country code for localized login experience
        countryCode: STORE_COUNTRY_CODE
    });
}
