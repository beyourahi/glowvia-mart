/**
 * @fileoverview Product Recommendations API Endpoint
 *
 * @description
 * Returns Shopify's algorithmic product recommendations for a given product ID.
 * Used by the PDP `RelatedProducts` section to surface complementary items.
 *
 * @route GET /api/product.recommendations?productId=<gid>
 *
 * @authentication None — public endpoint.
 *
 * @rate-limiting 30 requests per IP per minute (sliding window).
 *
 * @query-params
 * - productId (required) — full Shopify product GID (gid://shopify/Product/...)
 *
 * @returns JSON `{products: ProductRecommendation[]}` — includes OOS products so
 * shoppers can browse and wishlist them even when a variant is unavailable.
 *
 * @related
 * - components/product/RelatedProducts.tsx - Consumer of this endpoint on the PDP
 * - lib/rate-limit.ts - Rate limiter factory and IP extraction
 */

import type {Route} from "./+types/api.product.recommendations";
import {createRateLimiter, getClientIP, getRateLimitResponse} from "~/lib/rate-limit";

const limiter = createRateLimiter({windowMs: 60_000, maxRequests: 30});

/**
 * Returns product recommendations for the given product GID.
 * Rate-limited per IP; responds 400 when productId is missing, 500 on query failure.
 */
export const loader = async ({request, context}: Route.LoaderArgs) => {
    const rateLimitResponse = getRateLimitResponse(limiter.check(getClientIP(request)));
    if (rateLimitResponse) return rateLimitResponse;

    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");

    if (!productId) {
        return new Response(JSON.stringify({error: "productId is required"}), {
            status: 400,
            headers: {"Content-Type": "application/json"}
        });
    }

    try {
        const {productRecommendations} = await context.dataAdapter.query(PRODUCT_RECOMMENDATIONS_QUERY, {
            variables: {productId},
            cache: context.dataAdapter.CacheShort()
        });

        // Return all recommendations including OOS so shoppers can browse and wishlist them
        const available = productRecommendations ?? [];
        return new Response(JSON.stringify({products: available}), {
            status: 200,
            headers: {"Content-Type": "application/json"}
        });
    } catch (error) {
        console.error("[api.product.recommendations] Error:", error);
        return new Response(JSON.stringify({error: "Failed to fetch recommendations"}), {
            status: 500,
            headers: {"Content-Type": "application/json"}
        });
    }
};

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations(
    $country: CountryCode
    $language: LanguageCode
    $productId: ID!
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      id
      title
      handle
      availableForSale
      featuredImage {
        id
        url
        altText
        width
        height
      }
      images(first: 4) {
        nodes {
          id
          url
          altText
          width
          height
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 20) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;
