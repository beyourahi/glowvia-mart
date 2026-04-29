import type {McpToolRegistry} from "../../types";
import {searchCatalogTool, searchCatalogHandler} from "./search-catalog";
import {lookupCatalogTool, lookupCatalogHandler} from "./lookup-catalog";
import {getProductTool, getProductHandler} from "./get-product";
import {searchSuggestTool, searchSuggestHandler} from "./search-suggest";
import {listSortOptionsTool, listSortOptionsHandler} from "./list-sort-options";

export const storefrontToolRegistry: McpToolRegistry = new Map([
    ["search_catalog", {tool: searchCatalogTool, handler: searchCatalogHandler}],
    ["lookup_catalog", {tool: lookupCatalogTool, handler: lookupCatalogHandler}],
    ["get_product", {tool: getProductTool, handler: getProductHandler}],
    ["search_suggest", {tool: searchSuggestTool, handler: searchSuggestHandler}],
    ["list_sort_options", {tool: listSortOptionsTool, handler: listSortOptionsHandler}]
]);
