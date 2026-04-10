/**
 * @fileoverview Contact Form API Route
 *
 * @description
 * Server-side POST endpoint for contact form submissions. Validates input,
 * applies rate limiting and honeypot spam protection, and returns structured
 * success/error responses. Does not send email — the merchant configures
 * their own email forwarding, webhook, or CRM integration.
 *
 * @route POST /api/contact
 *
 * @architecture
 * Request Flow:
 * 1. Rate limit check (3 requests per 60s per IP)
 * 2. Parse form data
 * 3. Honeypot check — if filled, silently return success (bot fooled)
 * 4. Validate required fields (name, email, message) and lengths
 * 5. Return success or structured field-level errors
 *
 * @security
 * - Rate limiting: 3 requests/minute per client IP (in-memory, per-isolate)
 * - Honeypot: invisible "website" field catches bots that auto-fill all inputs
 * - Input validation: length caps prevent abuse (name: 100, email: 254, subject: 200, message: 5000)
 * - No user data is stored or forwarded — template is validation-only
 *
 * @error-handling
 * - GET/other methods: 405 Method Not Allowed
 * - Rate limit exceeded: 429 Too Many Requests
 * - Validation failure: 400 with field-level errors array
 * - Unexpected error: 500 with generic message
 *
 * @related
 * - routes/contact.tsx - Frontend form UI that POSTs here
 * - lib/rate-limit.ts - Shared rate limiting utilities
 * - routes/api.newsletter.tsx - Similar API pattern
 */

import {data} from "react-router";
import type {Route} from "./+types/api.contact";
import {createRateLimiter, getClientIP, getRateLimitResponse} from "~/lib/rate-limit";

const limiter = createRateLimiter({windowMs: 60_000, maxRequests: 3});

/** Only POST is allowed — return 405 for GET and other methods */
export async function loader() {
    return new Response("Method Not Allowed", {
        status: 405,
        headers: {Allow: "POST"}
    });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTHS = {name: 100, email: 254, subject: 200, message: 5000} as const;

type FieldError = {field: string; message: string};

function validateContactForm(formData: FormData): {errors: FieldError[]; honeypotTriggered: boolean} {
    const errors: FieldError[] = [];

    // Honeypot check — if filled, it's a bot. Return no errors so caller can silently succeed.
    const honeypot = formData.get("website");
    if (honeypot && typeof honeypot === "string" && honeypot.trim().length > 0) {
        return {errors: [], honeypotTriggered: true};
    }

    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const subject = (formData.get("subject") as string | null)?.trim() ?? "";
    const message = (formData.get("message") as string | null)?.trim() ?? "";

    // Required fields
    if (!name) {
        errors.push({field: "name", message: "Name is required"});
    } else if (name.length > MAX_FIELD_LENGTHS.name) {
        errors.push({field: "name", message: `Name must be ${MAX_FIELD_LENGTHS.name} characters or fewer`});
    }

    if (!email) {
        errors.push({field: "email", message: "Email is required"});
    } else if (!EMAIL_REGEX.test(email)) {
        errors.push({field: "email", message: "Please enter a valid email address"});
    } else if (email.length > MAX_FIELD_LENGTHS.email) {
        errors.push({field: "email", message: `Email must be ${MAX_FIELD_LENGTHS.email} characters or fewer`});
    }

    if (subject.length > MAX_FIELD_LENGTHS.subject) {
        errors.push({field: "subject", message: `Subject must be ${MAX_FIELD_LENGTHS.subject} characters or fewer`});
    }

    if (!message) {
        errors.push({field: "message", message: "Message is required"});
    } else if (message.length > MAX_FIELD_LENGTHS.message) {
        errors.push({field: "message", message: `Message must be ${MAX_FIELD_LENGTHS.message} characters or fewer`});
    }

    return {errors, honeypotTriggered: false};
}

export const action = async ({request}: Route.ActionArgs) => {
    const rateLimitResponse = getRateLimitResponse(limiter.check(getClientIP(request)));
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const formData = await request.formData();
        const {errors, honeypotTriggered} = validateContactForm(formData);

        // Honeypot was filled — silently return success to fool the bot
        if (honeypotTriggered) {
            return data({success: true, message: "Thank you for your message! We'll get back to you soon."});
        }

        if (errors.length > 0) {
            return data({success: false, errors}, {status: 400});
        }

        // Template storefront: validate and accept, but don't send email.
        // The merchant configures their own email forwarding, webhook, or CRM integration.
        return data({
            success: true,
            message: "Thank you for your message! We'll get back to you soon."
        });
    } catch {
        return data(
            {success: false, errors: [{field: "form", message: "Something went wrong. Please try again."}]},
            {status: 500}
        );
    }
};
