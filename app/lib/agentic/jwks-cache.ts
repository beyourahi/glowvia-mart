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

export type JwksDocument = {
    keys: JwkKey[];
};

type CacheEntry = {
    doc: JwksDocument;
    fetchedAt: number;
};

const TTL_MS = 3_600_000;

const cache = new Map<string, CacheEntry>();

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
