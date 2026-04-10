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
 * - Shopify Storefront API (2026-01 version)
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
        }
        selectedOptions {
          name
          value
        }
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
 * Header data query - fetches the main navigation menu and shop info.
 *
 * @param $headerMenuHandle - Handle of the header menu in Shopify admin
 * @param $country - Country code for localized content
 * @param $language - Language code for localized content
 *
 * Used in root.tsx loader to fetch layout data.
 * Includes shop data for analytics (shop.id, shop.name) and fallback brand info.
 */
export const HEADER_QUERY = `#graphql
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
  }
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
 * @note Fetches first 50 collections and 250 products per collection.
 * May need pagination for stores with many collections.
 */
export const MENU_COLLECTIONS_QUERY = `#graphql
  query MenuCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    collections(first: 50, sortKey: TITLE) {
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
        products(first: 250) {
          nodes {
            id
          }
        }
      }
    }
    allProducts: products(first: 250) {
      pageInfo {
        hasNextPage
      }
      nodes {
        id
        title
        productType
        availableForSale
        variants(first: 10) {
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

