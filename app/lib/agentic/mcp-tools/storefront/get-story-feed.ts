import type {McpTool, McpToolHandler} from "../../types";
import type {UcpProduct} from "~/lib/agentic/ucp-catalog-types";
import {toUcpProduct} from "~/lib/agentic/catalog-shapes";

// Inline query — story feed via TRENDING recommendations when a seed product is provided
const TRENDING_RECOMMENDATIONS_QUERY = `#graphql
  query TrendingRecommendations($productId: ID!, $intent: ProductRecommendationIntent!) {
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

// Inline query — best-selling products for seedless story feed
const STORY_FEED_QUERY = `#graphql
  query StoryFeed($first: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING, query: "available_for_sale:true") {
      nodes {
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
  }
` as const;

export const getStoryFeedTool: McpTool = {
    name: "get_story_feed",
    description:
        "Return a sequenced product feed for story-style shopping. Optionally seeded from a product GID via TRENDING recommendations; otherwise returns best-selling products.",
    inputSchema: {
        type: "object",
        properties: {
            productId: {type: "string", description: "Optional seed product GID for TRENDING recommendations"},
            limit: {type: "integer", minimum: 1, maximum: 10, description: "Number of story items (default 5)"},
            context: {
                type: "object",
                properties: {
                    country: {type: "string"},
                    language: {type: "string"}
                }
            }
        }
    }
};

export const getStoryFeedHandler: McpToolHandler = async (params, ctx) => {
    if (!ctx) throw new Error("Agent context required");

    const {productId, limit = 5} = params as {productId?: string; limit?: number};
    const cap = Math.min(Number(limit) || 5, 10);
    const ctxParams = (params.context ?? {}) as {country?: string; language?: string};

    let rawNodes: unknown[];

    if (productId) {
        // Seed provided: use TRENDING recommendations
        const result = await ctx.storefront.query(TRENDING_RECOMMENDATIONS_QUERY, {
            variables: {productId, intent: "TRENDING"},
            cache: ctx.dataAdapter.CacheShort()
        });
        rawNodes = (result.productRecommendations ?? []).slice(0, cap);
    } else {
        // No seed: fall back to best-selling products
        const result = await ctx.storefront.query(STORY_FEED_QUERY, {
            variables: {
                first: cap,
                country: ctxParams.country ?? "US",
                language: ctxParams.language ?? "EN"
            },
            cache: ctx.dataAdapter.CacheShort()
        });
        rawNodes = result.products?.nodes ?? [];
    }

    const stories = rawNodes.map((n, i) => ({
        position: i + 1,
        product: toUcpProduct(n as Parameters<typeof toUcpProduct>[0], "")
    })) satisfies Array<{position: number; product: UcpProduct}>;

    return {stories};
};
