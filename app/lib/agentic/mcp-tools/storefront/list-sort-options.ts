import type {McpTool, McpToolHandler} from "../../types";

const COLLECTION_SORT_OPTIONS = [
    {key: "MANUAL", label: "Featured", description: "Store default ordering"},
    {key: "BEST_SELLING", label: "Best selling", description: "Sort by sales popularity"},
    {key: "TITLE_ASC", label: "A to Z", description: "Alphabetical ascending"},
    {key: "TITLE_DESC", label: "Z to A", description: "Alphabetical descending"},
    {key: "PRICE_ASC", label: "Price: low to high", description: "Cheapest first"},
    {key: "PRICE_DESC", label: "Price: high to low", description: "Most expensive first"},
    {key: "CREATED_ASC", label: "Newest", description: "Most recently added"},
    {key: "CREATED_DESC", label: "Oldest", description: "Oldest first"}
] as const;

export const listSortOptionsTool: McpTool = {
    name: "list_sort_options",
    description:
        "Return all supported collection sort keys with human-readable labels. No API call — static response.",
    inputSchema: {
        type: "object",
        properties: {}
    }
};

export const listSortOptionsHandler: McpToolHandler = async (_params, _ctx) => {
    return {sortOptions: COLLECTION_SORT_OPTIONS};
};
