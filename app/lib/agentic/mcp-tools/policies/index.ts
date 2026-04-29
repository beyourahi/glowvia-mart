import type {McpToolRegistry} from "../../types";
import {searchPoliciesAndFaqsTool, searchPoliciesAndFaqsHandler} from "./search-policies-and-faqs";

export const policiesToolRegistry: McpToolRegistry = new Map([
    [
        "search_shop_policies_and_faqs",
        {
            tool: searchPoliciesAndFaqsTool,
            handler: searchPoliciesAndFaqsHandler
        }
    ]
]);
