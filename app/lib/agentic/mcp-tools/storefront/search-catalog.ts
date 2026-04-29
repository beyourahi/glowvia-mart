import type {McpTool, McpToolHandler} from "../../types";

export const searchCatalogTool: McpTool = {
    name: "search_catalog",
    description: "Search the product catalog by keyword. Returns UCP-shaped products with pagination.",
    inputSchema: {
        type: "object",
        properties: {
            query: {type: "string", description: "Search term"},
            limit: {type: "integer", minimum: 1, maximum: 50, description: "Number of results (default 10)"},
            after: {type: "string", description: "Pagination cursor from previous response"},
            context: {
                type: "object",
                properties: {
                    country: {type: "string"},
                    language: {type: "string"}
                }
            }
        },
        required: ["query"]
    }
};

export const searchCatalogHandler: McpToolHandler = async (params, ctx) => {
    if (!ctx) throw new Error("Agent context required");

    const {query, limit = 10, after} = params as {query: string; limit?: number; after?: string};
    const ctxParams = (params.context ?? {}) as {country?: string; language?: string};

    return ctx.dataAdapter.searchCatalog({
        term: String(query),
        first: Math.min(Number(limit) || 10, 50),
        after: after ?? undefined,
        country: ctxParams.country ?? "US",
        language: ctxParams.language ?? "EN"
    });
};
