// Fragment for nodes lookup — agent-optimized product fields
export const AGENT_LOOKUP_PRODUCT_FRAGMENT = `#graphql
  fragment AgentLookupProduct on Product {
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
    variants(first: 10) {
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
        sellingPlanAllocations(first: 10) {
          nodes {
            sellingPlan {
              id
              name
              recurringDeliveries
              options {
                name
                value
              }
            }
          }
        }
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

export const LOOKUP_NODES_QUERY = `#graphql
  query LookupNodes(
    $ids: [ID!]!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      __typename
      ... on Product {
        ...AgentLookupProduct
      }
    }
  }
  ${AGENT_LOOKUP_PRODUCT_FRAGMENT}
` as const;
