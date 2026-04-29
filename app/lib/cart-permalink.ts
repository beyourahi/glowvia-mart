/**
 * @fileoverview Shopify cart permalink builder and parser
 *
 * @description
 * Pure helpers for constructing and parsing Shopify cart permalink URLs.
 * Used by both the agent tool layer (catalog MCP responses) and the merchant
 * layer (share buttons, reorder links).
 *
 * Cart permalink format: {storeUrl}/cart/{variantId}:{quantity}[,{variantId}:{quantity}...]
 * Optional query: ?discount=CODE
 *
 * @note Browser URL length limit (~2000 chars) applies to very large carts.
 * For >20 lines, create the cart server-side via Storefront API and use
 * the returned checkoutUrl instead.
 *
 * @related
 * - app/lib/agentic/catalog-shapes.ts - Uses buildCartPermalink for MCP tool responses
 * - app/routes/cart.$lines.tsx - Consumes cart permalink path segments
 */

export type CartPermalinkLine = {
    variantId: string;
    quantity?: number;
};

/**
 * Extract the numeric Shopify variant ID from a GID or pass through if already numeric.
 * "gid://shopify/ProductVariant/12345" → "12345"
 * "12345" → "12345"
 */
export function extractNumericVariantId(gid: string): string {
    const match = gid.match(/\/ProductVariant\/(\d+)$/);
    return match ? match[1] : gid;
}

/**
 * Build a Shopify cart permalink URL from one or more variant+quantity pairs.
 *
 * @example
 * buildCartPermalink("https://shop.myshopify.com", [{variantId: "12345", quantity: 2}])
 * // → "https://shop.myshopify.com/cart/12345:2"
 *
 * @example Multi-line
 * buildCartPermalink("https://shop.myshopify.com", [
 *     {variantId: "gid://shopify/ProductVariant/12345", quantity: 2},
 *     {variantId: "67890"}
 * ])
 * // → "https://shop.myshopify.com/cart/12345:2,67890:1"
 */
export function buildCartPermalink(
    storeUrl: string,
    lines: CartPermalinkLine | CartPermalinkLine[],
    options?: {discountCode?: string; attributes?: Record<string, string>}
): string {
    const lineArray = Array.isArray(lines) ? lines : [lines];
    const segments = lineArray
        .filter(l => l.variantId)
        .map(l => `${extractNumericVariantId(l.variantId)}:${l.quantity ?? 1}`)
        .join(",");

    const base = `${storeUrl.replace(/\/$/, "")}/cart/${segments}`;

    const params = new URLSearchParams();
    if (options?.discountCode) params.set("discount", options.discountCode);
    if (options?.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
            params.set(`attributes[${key}]`, value);
        }
    }

    const query = params.toString();
    return query ? `${base}?${query}` : base;
}

/**
 * Parse a cart permalink path segment into line objects.
 * Input: "12345:2,67890:1" (the {lines} param from cart.$lines.tsx)
 * Output: [{variantId: "12345", quantity: 2}, {variantId: "67890", quantity: 1}]
 *
 * Invalid or malformed entries are filtered out silently.
 */
export function parseCartPermalinkPath(path: string): CartPermalinkLine[] {
    return path
        .split(",")
        .map(segment => {
            const [rawId, rawQty] = segment.split(":");
            const variantId = rawId?.trim();
            const quantity = parseInt(rawQty ?? "1", 10);
            if (!variantId || !/^\d+$/.test(variantId) || !Number.isInteger(quantity) || quantity < 1) {
                return null;
            }
            return {variantId, quantity} satisfies CartPermalinkLine;
        })
        .filter((line): line is NonNullable<{variantId: string; quantity: number}> => line !== null);
}
