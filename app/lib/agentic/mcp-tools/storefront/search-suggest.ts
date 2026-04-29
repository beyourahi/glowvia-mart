import type {McpTool, McpToolHandler} from "../../types";

// Inline query — returns predictive query suggestions for zero-result fallback
const SEARCH_SUGGEST_QUERY = `#graphql
  query SearchSuggest($term: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    predictiveSearch(limit: 3, limitScope: EACH, query: $term, types: [QUERY]) {
      queries { text styledText }
    }
  }
` as const;

export const searchSuggestTool: McpTool = {
    name: "search_suggest",
    description:
        "Return up to 3 alternative search term suggestions. Use when a search_catalog call returns zero results.",
    inputSchema: {
        type: "object",
        properties: {
            query: {type: "string", description: "The original search term that returned no results"},
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

export const searchSuggestHandler: McpToolHandler = async (params, ctx) => {
    if (!ctx) throw new Error("Agent context required");

    const {query} = params as {query: string};
    const ctxParams = (params.context ?? {}) as {country?: string; language?: string};

    const result = await ctx.storefront.query(SEARCH_SUGGEST_QUERY, {
        variables: {
            term: String(query),
            country: ctxParams.country ?? "US",
            language: ctxParams.language ?? "EN"
        },
        cache: ctx.dataAdapter.CacheShort()
    });

    const queries: Array<{text: string}> = result.predictiveSearch?.queries ?? [];
    const suggestions = queries.map(q => q.text);

    return {suggestions};
};
