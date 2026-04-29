import type {McpTool, McpToolHandler} from "../../types";

export const lookupCatalogTool: McpTool = {
    name: "lookup_catalog",
    description: "Fetch up to 10 products by Shopify GID. Returns all resolved products plus any unresolved IDs.",
    inputSchema: {
        type: "object",
        properties: {
            ids: {
                type: "array",
                items: {type: "string"},
                minItems: 1,
                maxItems: 10,
                description: "Array of Shopify product GIDs (e.g. gid://shopify/Product/123)"
            },
            context: {
                type: "object",
                properties: {
                    country: {type: "string"},
                    language: {type: "string"}
                }
            }
        },
        required: ["ids"]
    }
};

export const lookupCatalogHandler: McpToolHandler = async (params, ctx) => {
    if (!ctx) throw new Error("Agent context required");

    const ids = (params.ids as string[]).slice(0, 10);
    const ctxParams = (params.context ?? {}) as {country?: string; language?: string};

    const products = await ctx.dataAdapter.bulkLookupProducts({
        ids,
        country: ctxParams.country ?? "US",
        language: ctxParams.language ?? "EN"
    });

    const resolvedIds = new Set(products.map(p => p.id));
    const unresolved = ids.filter(id => !resolvedIds.has(id));

    return {products, unresolved};
};
