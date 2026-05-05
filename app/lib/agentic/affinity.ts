/**
 * @fileoverview Server-Side Affinity Scoring
 * Re-ranks collection product nodes based on customer order history.
 * Gracefully degrades to original order for anonymous users.
 */

/** Per-product purchase history signal used for affinity scoring. */
export type AffinitySignal = {
    productId: string;
    purchaseCount: number;
    lastPurchasedAt?: string;
};

/** Product extended with a computed affinity score (higher = stronger purchase history). */
export type ScoredProduct<T extends {id: string}> = T & {_affinityScore: number};

/**
 * Re-rank products by purchase affinity.
 *
 * Products with matching affinity signals are sorted to the top by score
 * (purchaseCount + 1 bonus for having a recency timestamp). Products with no
 * signal receive a score of 0 and maintain their relative order at the end.
 *
 * @param products - Original product list (e.g. from a collection query)
 * @param signals - Purchase history signals derived from customer order lines
 * @returns New array sorted by affinity score descending
 */
export function scoreProducts<T extends {id: string}>(
    products: T[],
    signals: AffinitySignal[]
): ScoredProduct<T>[] {
    const signalMap = new Map<string, AffinitySignal>(signals.map(s => [s.productId, s]));

    return products
        .map(p => {
            const signal = signalMap.get(p.id);
            const score = signal ? signal.purchaseCount + (signal.lastPurchasedAt ? 1 : 0) : 0;
            return {...p, _affinityScore: score};
        })
        .sort((a, b) => b._affinityScore - a._affinityScore);
}

/**
 * Aggregate raw order line items into per-product affinity signals.
 *
 * Multiple order lines for the same product are merged: quantities are summed
 * and the most recent `processedAt` timestamp is kept.
 *
 * @param orderLines - Flat list of order line items from the Customer Account API
 * @returns Deduplicated, aggregated affinity signals keyed by product ID
 */
export function extractAffinitySignals(
    orderLines: Array<{productId: string; quantity: number; processedAt?: string}>
): AffinitySignal[] {
    const byProduct = new Map<string, AffinitySignal>();
    for (const line of orderLines) {
        const existing = byProduct.get(line.productId);
        if (existing) {
            existing.purchaseCount += line.quantity;
            if (line.processedAt && (!existing.lastPurchasedAt || line.processedAt > existing.lastPurchasedAt)) {
                existing.lastPurchasedAt = line.processedAt;
            }
        } else {
            byProduct.set(line.productId, {
                productId: line.productId,
                purchaseCount: line.quantity,
                lastPurchasedAt: line.processedAt,
            });
        }
    }
    return Array.from(byProduct.values());
}
