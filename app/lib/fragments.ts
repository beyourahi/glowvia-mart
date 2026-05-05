/**
 * @fileoverview GraphQL Fragments for Storefront API Queries
 *
 * @description
 * Contains reusable GraphQL fragments for the Shopify Storefront API.
 * These fragments define the data structure for common entities like
 * cart lines, menus, shop info, and collections. Using fragments ensures
 * consistent data fetching across the application and makes queries more
 * maintainable.
 *
 * @architecture
 * Fragments are composed hierarchically:
 * - Base fragments (Money, MenuItem) are small and focused
 * - Complex fragments (CartLine, Menu) compose base fragments
 * - Query fragments (HEADER_QUERY, FOOTER_QUERY) use all relevant fragments
 *
 * @usage
 * Import fragments and interpolate into GraphQL queries:
 * ```typescript
 * const MY_QUERY = `#graphql
 *   query MyQuery {
 *     cart { ...CartApiQuery }
 *   }
 *   ${CART_QUERY_FRAGMENT}
 * `;
 * ```
 *
 * @dependencies
 * - Shopify Storefront API (2026-04 version)
 *
 * @related
 * - context.ts - Uses CART_QUERY_FRAGMENT for cart operations
 * - root.tsx - Uses HEADER_QUERY, FOOTER_QUERY for layout data
 * - metaobject-fragments.ts - Fragments for CMS metaobjects
 *
 * @api-docs
 * https://shopify.dev/docs/api/storefront/latest/queries/cart
 */

// =============================================================================
// CART FRAGMENTS
// =============================================================================

/**
 * Complete cart query fragment with all cart data.
 *
 * Includes:
 * - Money formatting (currency, amount)
 * - Cart lines (regular and componentizable)
 * - Product variant info (price, image, options)
 * - Selling plan allocations (subscriptions)
 * - Gift cards, discount codes
 * - Buyer identity
 * - Cost breakdown (subtotal, tax, duty)
 *
 * @note CartLine and CartLineComponent are nearly identical but represent
 * different cart line types in the Storefront API.
 */
export const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        quantityAvailable
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
          media(first: 5) {
            nodes {
              __typename
              ... on MediaImage {
                id
                alt
                image { id url altText width height }
              }
              ... on Video {
                id
                alt
                sources { url mimeType width height }
                previewImage { id url altText width height }
              }
            }
          }
        }
        selectedOptions {
          name
          value
        }
      }
    }
    parentRelationship {
      parent {
        id
        merchandise {
          ... on ProductVariant {
            title
            product {
              title
              handle
            }
          }
        }
      }
    }
    discountAllocations {
      discountedAmount {
        ...Money
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    sellingPlanAllocation {
      sellingPlan {
        id
        name
        options {
          name
          value
        }
      }
      priceAdjustments {
        perDeliveryPrice {
          amount
          currencyCode
        }
      }
    }
  }
  fragment CartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        quantityAvailable
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
          media(first: 5) {
            nodes {
              __typename
              ... on MediaImage {
                id
                alt
                image { id url altText width height }
              }
              ... on Video {
                id
                alt
                sources { url mimeType width height }
                previewImage { id url altText width height }
              }
            }
          }
        }
        selectedOptions {
          name
          value
        }
      }
    }
    discountAllocations {
      discountedAmount {
        ...Money
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    sellingPlanAllocation {
      sellingPlan {
        id
        name
        options {
          name
          value
        }
      }
      priceAdjustments {
        perDeliveryPrice {
          amount
          currencyCode
        }
      }
    }
    lineComponents {
      ...CartLine
    }
  }
  fragment CartApiQuery on Cart {
    updatedAt
    id
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        ...Money
      }
      balance {
        ...Money
      }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
        ...CartLineComponent
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
` as const;

// =============================================================================
// MENU FRAGMENTS
// =============================================================================

/**
 * Menu fragment for navigation menus.
 *
 * Supports two-level menu hierarchy:
 * - ParentMenuItem: Top-level menu items
 * - ChildMenuItem: Nested items under a parent
 *
 * Used by header and footer navigation.
 */
const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const;

// =============================================================================
// LAYOUT QUERIES
// =============================================================================

/**
 * Shop identity fragment for header/layout use.
 * Provides brand identity data (name, logo, domain) for the navbar and SEO.
 */
const SHOP_FRAGMENT = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
    paymentSettings {
      currencyCode
    }
  }
` as const;

/**
 * Header data query - fetches shop identity and the main navigation menu.
 *
 * @param $headerMenuHandle - Handle of the header menu in Shopify admin
 * @param $country - Country code for localized content
 * @param $language - Language code for localized content
 *
 * Used in root.tsx loader to fetch layout data.
 */
export const HEADER_QUERY = `#graphql
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${SHOP_FRAGMENT}
  ${MENU_FRAGMENT}
` as const;

/**
 * Footer data query - fetches footer navigation menu.
 *
 * @param $footerMenuHandle - Handle of the footer menu in Shopify admin
 * @param $country - Country code for localized content
 * @param $language - Language code for localized content
 */
export const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;

// =============================================================================
// CART SUGGESTION QUERIES
// =============================================================================

/**
 * Cart suggestions query - fetches best-selling products for cart recommendations.
 *
 * Used to display product suggestions in the cart drawer when the cart is empty
 * or as upsell recommendations alongside existing cart items.
 *
 * @param $country - Country code for localized pricing
 * @param $language - Language code for localized content
 *
 * @note Fetches first 16 available products sorted by BEST_SELLING.
 */
export const CART_SUGGESTIONS_QUERY = `#graphql
  fragment CartSuggestionProduct on Product {
    id
    title
    handle
    availableForSale
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
    featuredImage {
      id
      url
      altText
      width
      height
    }
    media(first: 5) {
      nodes {
        __typename
        ... on MediaImage {
          id
          alt
          image {
            id
            url
            altText
            width
            height
          }
        }
        ... on Video {
          id
          alt
          sources {
            url
            mimeType
            width
            height
          }
          previewImage {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
    variants(first: 20) {
      nodes {
        id
        title
        availableForSale
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

  query CartSuggestions(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 16, sortKey: BEST_SELLING, query: "available_for_sale:true") {
      nodes {
        ...CartSuggestionProduct
      }
    }
  }
` as const;

// =============================================================================
// COLLECTION QUERIES
// =============================================================================

/**
 * Menu collections query - fetches collections and products for navigation.
 *
 * Used to populate:
 * - Collection dropdown in header menu
 * - Product type filters
 * - Availability indicators
 *
 * @note Fetches first 250 collections with 1 available product each (existence check only).
 * allProducts fetches 250 products with 3 variants for search terms, discount count, and popular products.
 */
export const MENU_COLLECTIONS_QUERY = `#graphql
  query MenuCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    collections(first: 250, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        image {
          id
          url
          altText
          width
          height
        }
        products(first: 1, filters: [{available: true}]) {
          nodes {
            id
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }
    allProducts: products(first: 250, query: "available_for_sale:true") {
      nodes {
        id
        handle
        title
        productType
        availableForSale
        featuredImage {
          id
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
        variants(first: 3) {
          nodes {
            availableForSale
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
      pageInfo {
        hasNextPage
      }
    }
  }
` as const;

// =============================================================================
// SIDEBAR COLLECTIONS QUERY
// =============================================================================

/**
 * Sidebar collections query - fetches collections and all available products
 * for the sidebar navigation on collection/product/sale pages.
 *
 * Single canonical definition shared across all routes that render a sidebar.
 * Returned as a deferred Promise so it does not block above-fold rendering.
 *
 * - collections.products(first:250): accurate per-collection counts for filter sidebar
 * - allProducts(first:250): full catalog slice for discount counting without over-fetching
 */
export const SIDEBAR_COLLECTIONS_QUERY = `#graphql
  query SidebarCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 250, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        products(first: 250) {
          nodes {
            id
          }
        }
      }
    }
    allProducts: products(first: 250, query: "available_for_sale:true") {
      nodes {
        id
        availableForSale
        variants(first: 3) {
          nodes {
            availableForSale
            price {
              amount
            }
            compareAtPrice {
              amount
            }
          }
        }
      }
    }
  }
` as const;

