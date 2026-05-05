/**
 * Server-level handler for agent requests — called directly from server.ts
 * before React Router rendering to return raw UCP JSON without HTML wrapping.
 *
 * Why this exists: React Router 7 renders the React tree (meta, component) even
 * when a loader returns a Response for document requests. Intercepting here
 * bypasses rendering entirely.
 */

import {toUcpProductPage} from "~/lib/agentic/catalog-shapes";

// Products-only search query — articles/collections not needed for agent responses.
// Not tagged #graphql to avoid codegen picking it up (it uses raw field selection,
// not the shared SearchProduct fragment, so code-gen would generate duplicate types).
const AGENT_SEARCH_QUERY = `
  query AgentProductSearch(
    $term: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $term
      types: [PRODUCT]
      first: $first
      unavailableProducts: SHOW
    ) {
      nodes {
        ... on Product {
          id
          title
          handle
          description
          availableForSale
          vendor
          productType
          tags
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          compareAtPriceRange {
            minVariantPrice { amount currencyCode }
          }
          options {
            name
            values
          }
          variants(first: 5) {
            nodes {
              id
              title
              availableForSale
              selectedOptions { name value }
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

// Single product by handle — same field shape as the search query for consistency.
// Not tagged #graphql to avoid codegen picking it up.
const AGENT_PRODUCT_QUERY = `
  query AgentProductPage(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      description
      availableForSale
      vendor
      productType
      tags
      featuredImage {
        url
        altText
        width
        height
      }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      compareAtPriceRange {
        minVariantPrice { amount currencyCode }
      }
      options {
        name
        values
      }
      variants(first: 5) {
        nodes {
          id
          title
          availableForSale
          selectedOptions { name value }
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
        }
      }
    }
  }
` as const;

type AgentContext = {
    dataAdapter: any;
    env: {PUBLIC_STORE_DOMAIN?: string};
};

/**
 * Handle a `GET /search?agent=true&q=<term>` request by executing a product search
 * and returning a UCP JSON response without going through React Router rendering.
 *
 * @param request - Incoming request (reads `q` query parameter)
 * @param context - Hydrogen context with `dataAdapter` and `env`
 */
export async function handleAgentSearchRequest(
    request: Request,
    context: AgentContext
): Promise<Response> {
    const url = new URL(request.url);
    const term = (url.searchParams.get("q") ?? "").trim();

    if (!term) {
        return new Response(
            JSON.stringify({products: [], pageInfo: {hasNextPage: false, endCursor: null}}),
            {headers: {"Content-Type": "application/x-ucp+json", "Cache-Control": "no-store"}}
        );
    }

    try {
        const result = await context.dataAdapter.query(AGENT_SEARCH_QUERY, {
            variables: {term, first: 24},
            cache: context.dataAdapter.CacheShort()
        });

        const productsConnection = (result as any).products;
        const storeUrl = context.env.PUBLIC_STORE_DOMAIN
            ? `https://${context.env.PUBLIC_STORE_DOMAIN}`
            : "";

        const ucpPage = toUcpProductPage(productsConnection as any, storeUrl);
        return new Response(JSON.stringify(ucpPage), {
            headers: {"Content-Type": "application/x-ucp+json", "Cache-Control": "no-store"}
        });
    } catch (error) {
        console.error("[agent-server] Search request failed:", error);
        return new Response(
            JSON.stringify({products: [], pageInfo: {hasNextPage: false, endCursor: null}}),
            {status: 500, headers: {"Content-Type": "application/x-ucp+json", "Cache-Control": "no-store"}}
        );
    }
}

/**
 * Handle a `GET /products/:handle` request from an agent by fetching the product
 * by handle and returning a single-product UCP JSON response.
 *
 * @param request - Incoming request (reads handle from the pathname)
 * @param context - Hydrogen context with `dataAdapter` and `env`
 */
export async function handleAgentProductRequest(
    request: Request,
    context: AgentContext
): Promise<Response> {
    const url = new URL(request.url);
    const handle = url.pathname.replace(/^\/products\//, "").split("/")[0];

    if (!handle) {
        return new Response(
            JSON.stringify({error: "Missing product handle"}),
            {status: 400, headers: {"Content-Type": "application/x-ucp+json", "Cache-Control": "no-store"}}
        );
    }

    try {
        const result = await context.dataAdapter.query(AGENT_PRODUCT_QUERY, {
            variables: {handle},
            cache: context.dataAdapter.CacheShort()
        });

        const product = (result as any).product;
        if (!product) {
            return new Response(
                JSON.stringify({error: "Product not found"}),
                {status: 404, headers: {"Content-Type": "application/x-ucp+json", "Cache-Control": "no-store"}}
            );
        }

        const storeUrl = context.env.PUBLIC_STORE_DOMAIN
            ? `https://${context.env.PUBLIC_STORE_DOMAIN}`
            : "";

        const connection = {nodes: [product], pageInfo: {hasNextPage: false, endCursor: null}};
        const ucpPage = toUcpProductPage(connection as any, storeUrl);
        return new Response(JSON.stringify(ucpPage), {
            headers: {"Content-Type": "application/x-ucp+json", "Cache-Control": "no-store"}
        });
    } catch (error) {
        console.error("[agent-server] Product request failed:", error);
        return new Response(
            JSON.stringify({error: "Internal server error"}),
            {status: 500, headers: {"Content-Type": "application/x-ucp+json", "Cache-Control": "no-store"}}
        );
    }
}
