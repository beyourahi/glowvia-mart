/**
 * @fileoverview In-Memory JWKS Cache
 *
 * Fetches and caches JSON Web Key Sets for agent JWT signature verification.
 * Cache TTL is 1 hour — long enough to avoid per-request fetches while still
 * picking up key rotations within a reasonable window. Each isolate maintains
 * its own cache (no shared state across Cloudflare Workers isolates).
 */

/** Minimal JWK representation covering RSA and EC public key fields. */
export type JwkKey = {
    kty: string;
    kid?: string;
    use?: string;
    alg?: string;
    n?: string;
    e?: string;
    x?: string;
    y?: string;
    crv?: string;
};

/** Parsed JWKS document returned by an issuer's `/.well-known/jwks.json` endpoint. */
export type JwksDocument = {
    keys: JwkKey[];
};

type CacheEntry = {
    doc: JwksDocument;
    fetchedAt: number;
};

/** Cache TTL: 1 hour in milliseconds. Balances key-rotation freshness against fetch cost. */
const TTL_MS = 3_600_000;

const cache = new Map<string, CacheEntry>();

/**
 * Fetch and cache a JWKS document from the given URL.
 *
 * Returns the cached document if it was fetched within the TTL window.
 * Throws if the HTTP request fails or the response is missing a `keys` array.
 *
 * @param jwksUrl - Full URL to the JWKS endpoint (e.g. `https://issuer/.well-known/jwks.json`)
 */
export async function getJwks(jwksUrl: string): Promise<JwksDocument> {
    const entry = cache.get(jwksUrl);
    if (entry && Date.now() - entry.fetchedAt < TTL_MS) {
        return entry.doc;
    }

    const response = await fetch(jwksUrl, {
        headers: {"Accept": "application/json"}
    });

    if (!response.ok) {
        throw new Error(`JWKS fetch failed: ${response.status} ${response.statusText}`);
    }

    const doc = await response.json() as JwksDocument;

    if (!Array.isArray(doc.keys)) {
        throw new Error("JWKS response missing keys array");
    }

    cache.set(jwksUrl, {doc, fetchedAt: Date.now()});
    return doc;
}
