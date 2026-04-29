import type {McpTool, McpToolHandler} from "../../types";
import type {UcpProduct} from "~/lib/agentic/ucp-catalog-types";

type ComparisonMatrix = {
    products: UcpProduct[];
    attributes: string[];
    comparison: Record<string, Record<string, string[]>>;
};

export const compareProductsTool: McpTool = {
    name: "compare_products",
    description:
        "Fetch 2–5 products by GID and build a side-by-side comparison matrix across all option attributes.",
    inputSchema: {
        type: "object",
        properties: {
            productIds: {
                type: "array",
                items: {type: "string"},
                minItems: 2,
                maxItems: 5,
                description: "Array of 2–5 Shopify product GIDs to compare"
            },
            context: {
                type: "object",
                properties: {
                    country: {type: "string"},
                    language: {type: "string"}
                }
            }
        },
        required: ["productIds"]
    }
};

export const compareProductsHandler: McpToolHandler = async (params, ctx) => {
    if (!ctx) throw new Error("Agent context required");

    const productIds = (params.productIds as string[]).slice(0, 5);
    const ctxParams = (params.context ?? {}) as {country?: string; language?: string};

    const products = await ctx.dataAdapter.bulkLookupProducts({
        ids: productIds,
        country: ctxParams.country ?? "US",
        language: ctxParams.language ?? "EN"
    });

    // Build union of all option attribute names across products
    const attributeSet = new Set<string>();
    for (const p of products) {
        for (const opt of p.options) {
            attributeSet.add(opt.name);
        }
    }
    const attributes = Array.from(attributeSet);

    // Build comparison map: productId → optionName → values[]
    const comparison: Record<string, Record<string, string[]>> = {};
    for (const p of products) {
        const byAttr: Record<string, string[]> = {};
        for (const attr of attributes) {
            const opt = p.options.find(o => o.name === attr);
            byAttr[attr] = opt ? opt.values : [];
        }
        comparison[p.id] = byAttr;
    }

    return {products, attributes, comparison} satisfies ComparisonMatrix;
};
