import type {McpTool, McpToolHandler} from "../../types";
import type {UcpProduct} from "~/lib/agentic/ucp-catalog-types";
import {toUcpProduct} from "~/lib/agentic/catalog-shapes";

// Inline query — not in codegen pipeline; used only by agent tools
const COMPLEMENTARY_RECOMMENDATIONS_QUERY = `#graphql
  query ComplementaryRecommendations($productId: ID!, $intent: ProductRecommendationIntent!) {
    productRecommendations(productId: $productId, intent: $intent) {
      id
      title
      handle
      availableForSale
      vendor
      productType
      tags
      description
      featuredImage { url altText width height }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      compareAtPriceRange {
        minVariantPrice { amount currencyCode }
      }
      options { name optionValues { name } }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          currentlyNotInStock
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          selectedOptions { name value }
          requiresShipping
          currentlyNotInStock
        }
      }
      isGiftCard
      collections(first: 3) { nodes { id handle title } }
    }
  }
` as const;

export const recommendComplementaryTool: McpTool = {
    name: "recommend_complementary",
    description:
        "Fetch complementary product recommendations (frequently bought together) for a given product GID.",
    inputSchema: {
        type: "object",
        properties: {
            productId: {type: "string", description: "Shopify product GID to base recommendations on"},
            limit: {type: "integer", minimum: 1, maximum: 10, description: "Max results (default 6)"}
        },
        required: ["productId"]
    }
};

export const recommendComplementaryHandler: McpToolHandler = async (params, ctx) => {
    if (!ctx) throw new Error("Agent context required");

    const {productId, limit = 6} = params as {productId: string; limit?: number};
    const cap = Math.min(Number(limit) || 6, 10);

    const result = await ctx.storefront.query(COMPLEMENTARY_RECOMMENDATIONS_QUERY, {
        variables: {productId, intent: "COMPLEMENTARY"},
        cache: ctx.dataAdapter.CacheShort()
    });

    const nodes: unknown[] = (result.productRecommendations ?? []).slice(0, cap);
    const products: UcpProduct[] = nodes.map(n => toUcpProduct(n as Parameters<typeof toUcpProduct>[0], ""));

    return {products};
};
