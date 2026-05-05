/**
 * @fileoverview Recently Viewed — Agent Tool Bridge
 * Exposes recently-viewed product IDs from the request cookie for
 * server-side agent tool use (lookup_catalog can then fetch live data).
 */

/** Cookie name written by `lib/recently-viewed.ts` on product page views. */
const COOKIE_KEY = "recently_viewed";
/** Maximum number of product IDs to return; matches the write-side cap in `recently-viewed.ts`. */
const MAX_IDS = 10;

/**
 * Read recently viewed product IDs from the request cookie, server-side.
 *
 * The cookie stores a JSON array of `{id: string}` objects. This function
 * parses and validates the value, returning only the `id` strings up to
 * `MAX_IDS`. Returns an empty array on any parse failure.
 *
 * @param request - Incoming request carrying the `recently_viewed` cookie
 */
export function getRecentlyViewedIds(request: Request): string[] {
    const cookie = request.headers.get("cookie") ?? "";
    const match = cookie
        .split(";")
        .map(s => s.trim())
        .find(s => s.startsWith(`${COOKIE_KEY}=`));
    if (!match) return [];
    try {
        const raw = decodeURIComponent(match.slice(COOKIE_KEY.length + 1));
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return (parsed as unknown[])
            .filter((item): item is {id: string} => typeof item === "object" && item !== null && "id" in item)
            .slice(0, MAX_IDS)
            .map(item => item.id);
    } catch {
        return [];
    }
}
