export const AGENT_PRODUCT_FRAGMENT = `#graphql
  fragment AgentProduct on Product {
    id
    title
    handle
    vendor
    availableForSale
    productType
    tags
    description
    descriptionHtml
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 10) {
      nodes {
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
    variants(first: 20) {
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
    requiresSellingPlan
    metafields(identifiers: [
      {namespace: "custom", key: "material"},
      {namespace: "custom", key: "fabric"},
      {namespace: "custom", key: "fit"},
      {namespace: "custom", key: "pattern"},
      {namespace: "custom", key: "style"},
      {namespace: "custom", key: "length"},
      {namespace: "custom", key: "weight"}
    ]) {
      namespace
      key
      value
      type
    }
  }
` as const;

export const PRODUCT_BY_ID_QUERY = `#graphql
  query ProductById(
    $id: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(id: $id) {
      ...AgentProduct
    }
  }
  ${AGENT_PRODUCT_FRAGMENT}
` as const;
