/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Limitation: On Workers/Oxygen each isolate has its own Map, so this provides
 * burst protection within an isolate but not global rate limiting. This is the
 * best available approach without external state (Redis/KV).
 */

interface RateLimitConfig {
    /** Sliding window duration in milliseconds. */
    windowMs: number;
    /** Maximum number of requests allowed within the window. */
    maxRequests: number;
}

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

interface RateLimitResult {
    allowed: boolean;
    /** Remaining requests in the current window. */
    remaining: number;
    /** Milliseconds until the client may retry; null when allowed. */
    retryAfterMs: number | null;
}

/**
 * Maximum number of tracked IP entries before eviction.
 * Prevents unbounded memory growth when the store receives traffic from many unique IPs.
 */
const MAX_ENTRIES = 10_000;
let checkCount = 0;

/**
 * Create a sliding-window in-memory rate limiter.
 *
 * Each returned limiter has its own isolated `Map`, so different routes
 * (e.g. `/api/mcp` and `/api/share/track`) can have independent limits.
 *
 * Cleanup runs every 100 checks to evict expired entries and cap the store
 * at `MAX_ENTRIES`. On Cloudflare Workers each isolate has its own Map,
 * so this provides burst protection within an isolate only — not globally.
 *
 * @param config - Window duration and request cap
 * @returns Object with a single `check(key)` method
 */
export function createRateLimiter(config: RateLimitConfig) {
    const store = new Map<string, RateLimitEntry>();

    function cleanup() {
        const cutoff = Date.now() - config.windowMs * 2;
        for (const [key, entry] of store) {
            if (entry.windowStart < cutoff) store.delete(key);
        }
        // Evict oldest entries if store exceeds cap
        if (store.size > MAX_ENTRIES) {
            const sorted = [...store.entries()].sort((a, b) => a[1].windowStart - b[1].windowStart);
            const toRemove = sorted.slice(0, store.size - MAX_ENTRIES);
            for (const [key] of toRemove) store.delete(key);
        }
    }

    function check(key: string): RateLimitResult {
        checkCount++;
        if (checkCount % 100 === 0) cleanup();

        const now = Date.now();
        const entry = store.get(key);

        if (!entry || now - entry.windowStart >= config.windowMs) {
            store.set(key, {count: 1, windowStart: now});
            return {allowed: true, remaining: config.maxRequests - 1, retryAfterMs: null};
        }

        if (entry.count < config.maxRequests) {
            entry.count++;
            return {allowed: true, remaining: config.maxRequests - entry.count, retryAfterMs: null};
        }

        const retryAfterMs = config.windowMs - (now - entry.windowStart);
        return {allowed: false, remaining: 0, retryAfterMs};
    }

    return {check};
}

/**
 * Extract the client IP from a Cloudflare Workers request.
 *
 * Prefers `CF-Connecting-IP` (set by Cloudflare) over `X-Forwarded-For`
 * (set by reverse proxies, potentially spoofable). Falls back to `"unknown"`
 * when neither header is present (e.g. local dev without Wrangler).
 *
 * @param request - Incoming HTTP request
 */
export function getClientIP(request: Request): string {
    return (
        request.headers.get("CF-Connecting-IP") ??
        request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
        "unknown"
    );
}

/**
 * Build a 429 Too Many Requests response from a rate limit result.
 *
 * Returns null when the request is allowed, so callers can use the
 * short-circuit pattern: `const rejected = getRateLimitResponse(check(ip)); if (rejected) return rejected;`
 *
 * @param result - Result from the limiter's `check()` call
 */
export function getRateLimitResponse(result: RateLimitResult): Response | null {
    if (result.allowed) return null;

    const retryAfterSeconds = Math.ceil((result.retryAfterMs ?? 0) / 1000);
    return new Response(JSON.stringify({error: "Too many requests. Please try again later."}), {
        status: 429,
        headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSeconds)
        }
    });
}
