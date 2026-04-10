/**
 * @fileoverview Newsletter Subscription API Route
 *
 * @description
 * Handles newsletter subscription requests by creating a customer account
 * with marketing consent enabled. Uses Shopify's Customer API to manage
 * subscribers, ensuring they receive marketing emails.
 *
 * @route POST /api/newsletter
 *
 * @architecture
 * Request Flow:
 * 1. User submits email via newsletter form
 * 2. Email is validated (format check)
 * 3. Customer account is created with acceptsMarketing: true
 * 4. Success/error response is returned
 *
 * @implementation-note
 * Shopify requires a password to create a customer account.
 * Since newsletter subscribers don't need account access,
 * a secure random password is generated and never shared.
 *
 * @ux-considerations
 * - "Already subscribed" errors are treated as success
 * - This prevents confusion for users who resubscribe
 * - Provides positive reinforcement regardless of status
 *
 * @error-handling
 * - Empty/missing email: 400 with "Email is required"
 * - Invalid email format: 400 with validation message
 * - Already subscribed: 200 with "already subscribed" message
 * - API error: 500 with generic error message
 *
 * @security
 * - Email is validated before API call
 * - Generated passwords are cryptographically random
 * - No password is ever returned to the client
 * - CSRF protection via POST method
 *
 * @related
 * - components/NewsletterForm.tsx - Frontend form component
 * - components/Footer.tsx - Where newsletter form is displayed
 *
 * @see https://shopify.dev/docs/api/storefront/latest/mutations/customerCreate
 */

import {data} from "react-router";
import type {Route} from "./+types/api.newsletter";
import {createRateLimiter, getClientIP, getRateLimitResponse} from "~/lib/rate-limit";

const limiter = createRateLimiter({windowMs: 60_000, maxRequests: 5});

// =============================================================================
// GRAPHQL MUTATIONS
// =============================================================================

/**
 * Creates a new customer with email and marketing consent.
 *
 * The customer is created with acceptsMarketing: true to enable
 * newsletter delivery. Password is required by API but never used.
 */
const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
` as const;

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generates a cryptographically random password for newsletter subscribers.
 *
 * @returns 24-character random password
 *
 * @note This password is never shared with the user. It exists only
 *       because Shopify's Customer API requires a password.
 *       Newsletter subscribers use this account only for email marketing,
 *       not for authentication.
 */
function generateSecurePassword(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const randomBytes = crypto.getRandomValues(new Uint8Array(24));
    let password = "";
    for (let i = 0; i < 24; i++) {
        password += chars.charAt(randomBytes[i] % chars.length);
    }
    return password;
}

// =============================================================================
// ACTION
// =============================================================================

/**
 * Handles newsletter subscription form submissions.
 *
 * @param request - HTTP request with form data (email field)
 * @param context - Hydrogen context with storefront client
 *
 * @returns JSON response with success status and message
 *
 * @response-format
 * Success: { success: true, message: "Thank you for subscribing!" }
 * Already exists: { success: true, message: "You're already subscribed!" }
 * Error: { success: false, error: "Error message" }
 */
export async function loader() {
    return new Response("Method not allowed", {
        status: 405,
        headers: {"Allow": "POST"}
    });
}

export async function action({request, context}: Route.ActionArgs) {
    const rateLimitResponse = getRateLimitResponse(limiter.check(getClientIP(request)));
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await request.formData();
    const email = formData.get("email");

    if (!email || typeof email !== "string") {
        return data({success: false, error: "Email is required"}, {status: 400});
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return data({success: false, error: "Please enter a valid email address"}, {status: 400});
    }

    try {
        const response = await context.storefront.mutate(CUSTOMER_CREATE_MUTATION, {
            variables: {
                input: {
                    email,
                    password: generateSecurePassword(),
                    acceptsMarketing: true
                }
            }
        });

        const {customerCreate} = response;
        const errors = customerCreate?.customerUserErrors;

        if (errors && errors.length > 0) {
            const error = errors[0];

            // Handle "already exists" gracefully - still count as success for UX
            if (error.code === "TAKEN" || error.code === "CUSTOMER_DISABLED") {
                return data({
                    success: true,
                    message: "You're already subscribed! Thank you for your interest."
                });
            }

            return data({success: false, error: error.message}, {status: 400});
        }

        return data({
            success: true,
            message: "Thank you for subscribing!"
        });
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return data({success: false, error: "Something went wrong. Please try again."}, {status: 500});
    }
}
