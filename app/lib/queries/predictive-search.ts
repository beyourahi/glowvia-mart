export const AGENT_PREDICTIVE_PRODUCT_FRAGMENT = `#graphql
  fragment AgentPredictiveProduct on Product {
    __typename
    id
    title
    handle
    availableForSale
    vendor
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
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
` as const;

export const AGENT_PREDICTIVE_SEARCH_QUERY = `#graphql
  query AgentPredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $term: String!
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit
      limitScope: EACH
      query: $term
      types: [PRODUCT]
      unavailableProducts: SHOW
    ) {
      products {
        ...AgentPredictiveProduct
      }
    }
  }
  ${AGENT_PREDICTIVE_PRODUCT_FRAGMENT}
` as const;
