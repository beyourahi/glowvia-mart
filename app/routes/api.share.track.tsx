/**
 * @fileoverview Social Share Analytics Tracking API
 *
 * @description
 * Tracks social share events for analytics purposes. When users share
 * products or wishlists to social platforms, this endpoint records
 * the share for later analysis.
 *
 * @route POST /api/share/track
 *
 * @architecture
 * Request Flow:
 * 1. User clicks share button on product/wishlist
 * 2. Client sends share analytics data to this endpoint
 * 3. Rate limiting prevents abuse
 * 4. Data is validated and acknowledged
 * 5. (Future) Store in analytics database
 *
 * @rate-limiting
 * - 30 requests per IP per minute
 * - In-memory store (resets on worker restart)
 * - Returns 429 with Retry-After header when exceeded
 *
 * @data-collected
 * - platform: Which social platform (twitter, facebook, copy, etc.)
 * - productId: Product being shared
 * - productHandle: Product URL handle
 * - timestamp: When share occurred
 * - userAgent: Browser info (optional)
 * - referrer: Page URL (optional)
 *
 * @privacy
 * - IP used only for rate limiting (not stored)
 * - No personal identification data collected
 * - Aggregate analytics only
 *
 * @related
 * - lib/social-share.ts - Share utilities and platform config
 * - ProductShareButton.tsx - Product share UI
 * - WishlistShareDialog - Wishlist share UI
 */

import type {Route} from "./+types/api.share.track";
import {createRateLimiter, getClientIP, getRateLimitResponse} from "~/lib/rate-limit";

const limiter = createRateLimiter({windowMs: 60_000, maxRequests: 30});

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Type guard to validate analytics data structure.
 *
 * @param data - Unknown data to validate
 * @returns true if data matches expected analytics shape
 */
function isValidAnalyticsData(data: unknown): data is {
    platform: string;
    productId: string;
    productHandle: string;
    timestamp: number;
    userAgent?: string;
    referrer?: string;
} {
    if (!data || typeof data !== "object") return false;

    const obj = data as Record<string, unknown>;
    return (
        typeof obj.platform === "string" &&
        typeof obj.productId === "string" &&
        typeof obj.productHandle === "string" &&
        typeof obj.timestamp === "number"
    );
}

// =============================================================================
// LOADER
// =============================================================================

/**
 * Rejects non-POST requests. This endpoint is same-origin only
 * (called from social-share.tsx via fetch) — no CORS needed.
 */
export async function loader() {
    return new Response("Method not allowed", {
        status: 405,
        headers: {"Allow": "POST"}
    });
}

// =============================================================================
// ACTION
// =============================================================================

/**
 * Handles share tracking analytics requests.
 *
 * @param request - HTTP request with JSON analytics payload
 *
 * @returns JSON response indicating success or error
 *
 * @error-codes
 * - 400: Invalid request body or data structure
 * - 405: Non-POST method
 * - 429: Rate limit exceeded
 */
export async function action({request}: Route.ActionArgs) {
    const rateLimitResponse = getRateLimitResponse(limiter.check(getClientIP(request)));
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const data = await request.json();

        // Validate data structure
        if (!isValidAnalyticsData(data)) {
            return new Response(JSON.stringify({error: "Invalid analytics data"}), {
                status: 400,
                headers: {"Content-Type": "application/json"}
            });
        }

        // In production, store analytics in a database
        // For now, we just acknowledge the tracking request
        // You can add database storage here later

        return new Response(JSON.stringify({success: true}), {
            status: 200,
            headers: {"Content-Type": "application/json"}
        });
    } catch {
        return new Response(JSON.stringify({error: "Invalid request body"}), {
            status: 400,
            headers: {"Content-Type": "application/json"}
        });
    }
}
