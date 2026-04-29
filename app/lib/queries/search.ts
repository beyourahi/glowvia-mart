// Agent-optimized product search query for search_catalog MCP tool
export const AGENT_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment AgentSearchProduct on Product {
    id
    title
    handle
    vendor
    availableForSale
    productType
    tags
    description
    featuredImage {
      url
      altText
      width
      height
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
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    options {
      name
      optionValues {
        name
      }
    }
    variants(first: 5) {
      nodes {
        id
        title
        availableForSale
        currentlyNotInStock
        quantityAvailable
        requiresShipping
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
        sku
      }
    }
    isGiftCard
    collections(first: 5) {
      nodes {
        id
        handle
        title
      }
    }
  }
` as const;

export const AGENT_SEARCH_QUERY = `#graphql
  query AgentSearch(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $first: Int!
    $after: String
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $term
      types: [PRODUCT]
      first: $first
      after: $after
      unavailableProducts: SHOW
    ) {
      nodes {
        ... on Product {
          ...AgentSearchProduct
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${AGENT_SEARCH_PRODUCT_FRAGMENT}
` as const;
