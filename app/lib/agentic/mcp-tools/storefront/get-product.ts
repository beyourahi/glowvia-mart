import type {McpTool, McpToolHandler} from "../../types";
import type {UcpProduct} from "~/lib/agentic/ucp-catalog-types";

export const getProductTool: McpTool = {
    name: "get_product",
    description:
        "Fetch a single product by Shopify GID with full variant and image detail. Optionally match a specific variant via selectedOptions.",
    inputSchema: {
        type: "object",
        properties: {
            id: {type: "string", description: "Shopify product GID (e.g. gid://shopify/Product/123)"},
            selectedOptions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: {type: "string"},
                        value: {type: "string"}
                    },
                    required: ["name", "value"]
                },
                description: "Option name/value pairs to select a specific variant"
            },
            context: {
                type: "object",
                properties: {
                    country: {type: "string"},
                    language: {type: "string"}
                }
            }
        },
        required: ["id"]
    }
};

type SelectedOption = {name: string; value: string};

export const getProductHandler: McpToolHandler = async (params, ctx) => {
    if (!ctx) throw new Error("Agent context required");

    const {id, selectedOptions} = params as {
        id: string;
        selectedOptions?: SelectedOption[];
    };
    const ctxParams = (params.context ?? {}) as {country?: string; language?: string};

    const ucpProduct: UcpProduct | null = await ctx.dataAdapter.lookupProduct({
        id,
        country: ctxParams.country ?? "US",
        language: ctxParams.language ?? "EN"
    });

    if (!ucpProduct) throw new Error(`Product not found: ${id}`);

    // Determine variant selection state
    let selectionState: "MATCH" | "FALLBACK" = "FALLBACK";
    if (selectedOptions && selectedOptions.length > 0) {
        // Attempt to find a variant whose selectedOptions fully match
        const match = ucpProduct.variants.find(v =>
            selectedOptions.every(opt =>
                v.selectedOptions.some(vo => vo.name === opt.name && vo.value === opt.value)
            )
        );
        if (match) selectionState = "MATCH";
    }

    return {...ucpProduct, selectionState};
};
