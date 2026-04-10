/**
 * @fileoverview Promise Utility Functions
 *
 * @description
 * Provides utility functions for safer promise handling in async operations.
 * These utilities help prevent common issues like:
 * - Promises that hang indefinitely due to network issues
 * - Unhandled promise rejections that break UI
 * - Loading states that never resolve
 *
 * @architecture
 * Used primarily in root.tsx for deferred data loading where promises
 * are passed to React Router's <Await> component. Without proper timeout
 * and error handling, hung promises cause permanent loading states.
 *
 * @related
 * - root.tsx - Uses these utilities for cart/auth data loading
 * - PageLayout.tsx - Renders deferred data with <Await>
 */

// =============================================================================
// TIMEOUT ERROR
// =============================================================================

/**
 * Custom error class for promise timeouts.
 * Allows distinguishing timeout errors from other error types.
 */
export class TimeoutError extends Error {
    constructor(
        message: string,
        public readonly timeoutMs: number
    ) {
        super(message);
        this.name = "TimeoutError";
    }
}

// =============================================================================
// WITH TIMEOUT
// =============================================================================

/**
 * Wraps a promise with a timeout, rejecting if the promise doesn't resolve
 * within the specified duration.
 *
 * Use this to prevent indefinite loading states when API calls hang.
 * Common scenarios:
 * - Slow/unresponsive Shopify API
 * - Network connectivity issues
 * - Stale cart IDs that cause API hangs
 *
 * @param promise - The promise to wrap with a timeout
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 10000)
 * @param errorMessage - Custom error message for timeout (optional)
 *
 * @returns Promise that resolves with the original result or rejects on timeout
 *
 * @throws TimeoutError if the promise doesn't resolve within timeoutMs
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await withTimeout(fetchCart(), 10000);
 *
 * // With custom error message
 * const result = await withTimeout(
 *   fetchCart(),
 *   10000,
 *   "Cart data took too long to load"
 * );
 *
 * // With fallback on timeout
 * const cart = await withTimeout(cart.get(), 10000).catch(() => null);
 * ```
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000, errorMessage?: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new TimeoutError(errorMessage || `Promise timed out after ${timeoutMs}ms`, timeoutMs));
            }, timeoutMs);
        })
    ]);
}

// =============================================================================
// WITH TIMEOUT AND FALLBACK
// =============================================================================

/**
 * Wraps a promise with a timeout AND a fallback value.
 * If the promise rejects or times out, returns the fallback instead of throwing.
 *
 * This is the safest option for non-critical data that shouldn't block rendering.
 * Perfect for:
 * - Auth status checks (fallback: false)
 * - Store credit balance (fallback: false)
 * - Cart suggestions (fallback: null)
 *
 * @param promise - The promise to wrap
 * @param fallback - Value to return if promise rejects or times out
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 10000)
 *
 * @returns Promise that always resolves (never rejects)
 *
 * @example
 * ```typescript
 * // Auth check with false fallback
 * const isLoggedIn = await withTimeoutAndFallback(
 *   customerAccount.isLoggedIn(),
 *   false,
 *   5000
 * );
 *
 * // Cart with null fallback
 * const cart = await withTimeoutAndFallback(
 *   cart.get(),
 *   null,
 *   10000
 * );
 * ```
 */
export function withTimeoutAndFallback<T, F>(
    promise: Promise<T>,
    fallback: F,
    timeoutMs: number = 10000
): Promise<T | F> {
    return withTimeout(promise, timeoutMs).catch(error => {
        // Log for debugging but don't throw
        if (error instanceof TimeoutError) {
            console.warn(`[Promise Timeout] ${error.message}`);
        } else {
            console.warn("[Promise Error]", error);
        }
        return fallback;
    });
}

// =============================================================================
// CART-SPECIFIC TIMEOUT CONSTANTS
// =============================================================================

/**
 * Default timeout values for various operations.
 * Tuned based on expected response times and user experience thresholds.
 *
 * Research shows users perceive delays > 10 seconds as system failure.
 * These values balance reliability with user experience.
 */
export const TIMEOUT_DEFAULTS = {
    /** Cart API operations - most critical, slightly longer timeout */
    CART: 10000, // 10 seconds
    /** Auth status checks - should be fast */
    AUTH: 5000, // 5 seconds
    /** Store credit balance - non-critical */
    STORE_CREDIT: 5000, // 5 seconds
    /** General API calls */
    API: 8000, // 8 seconds
    /** Footer menu - deferred, below the fold */
    FOOTER: 8000, // 8 seconds
    /** Cart suggestion products - deferred */
    SUGGESTIONS: 8000 // 8 seconds
} as const;
