/**
 * @fileoverview search_shop_policies_and_faqs MCP tool
 * Phase 3: Implements the Shopify-spec Policy & FAQs Tool.
 * @see https://shopify.dev/docs/agents/catalog/policy-and-faqs-tool
 */

import type {McpTool, McpToolHandler} from "../../types";
import {buildPolicyCorpus, rankCorpus} from "./policy-corpus";

export const searchPoliciesAndFaqsTool: McpTool = {
    name: "search_shop_policies_and_faqs",
    description: "Search shop policies and FAQs for relevant information. Use this tool to answer questions about shipping, returns, privacy, terms of service, and other store policies.",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Natural-language query about policies or FAQs"
            },
            limit: {
                type: "integer",
                description: "Maximum number of results to return (1-20, default 5)"
            },
            context: {
                type: "object",
                description: "Optional locale/country context",
                properties: {
                    locale: {type: "string"},
                    country: {type: "string"}
                }
            }
        },
        required: ["query"]
    }
};

export const searchPoliciesAndFaqsHandler: McpToolHandler = async (params, ctx) => {
    const query = typeof params.query === "string" ? params.query.trim() : "";
    const limit = typeof params.limit === "number" ? Math.min(Math.max(params.limit, 1), 20) : 5;

    if (!query) {
        return {results: [], query: "", total: 0};
    }

    if (!ctx) {
        return {results: [], query, total: 0, error: "No storefront context available"};
    }

    const corpus = await buildPolicyCorpus(ctx);
    const results = rankCorpus(corpus, query, limit);

    return {
        results,
        query,
        total: results.length
    };
};
