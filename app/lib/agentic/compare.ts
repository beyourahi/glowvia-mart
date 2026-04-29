/**
 * @fileoverview Product Comparison Matrix
 * Builds a normalized comparison matrix from UCP products for the
 * compare_products MCP tool and the /compare UI route.
 */

import type {UcpProduct} from "./ucp-catalog-types";

export type ComparisonAttribute = {
    label: string;
    values: (string | null)[];
};

export type ComparisonMatrix = {
    products: {id: string; title: string; handle: string; featuredImage: string | null}[];
    attributes: ComparisonAttribute[];
};

export function buildComparisonMatrix(products: UcpProduct[]): ComparisonMatrix {
    const productSummaries = products.map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        featuredImage: p.featuredImage?.url ?? null,
    }));

    const attributes: ComparisonAttribute[] = [
        {
            label: "Price",
            values: products.map(p => `${p.priceRange.minVariantPrice.currencyCode} ${p.priceRange.minVariantPrice.amount}`),
        },
        {
            label: "Brand",
            values: products.map(p => p.vendor ?? null),
        },
        {
            label: "Type",
            values: products.map(p => p.productType ?? null),
        },
        {
            label: "Available",
            values: products.map(p => (p.availableForSale ? "In Stock" : "Out of Stock")),
        },
    ];

    return {products: productSummaries, attributes};
}
