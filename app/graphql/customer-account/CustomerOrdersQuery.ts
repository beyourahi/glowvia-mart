/**
 * @fileoverview Customer Orders Query with Pagination and Full Details
 *
 * @description
 * Provides GraphQL queries for fetching a customer's order history from
 * the Customer Account API. Includes comprehensive order details for
 * expandable order card display, eliminating the need for a separate
 * order detail page query.
 *
 * @api Customer Account API (requires authentication)
 * Orders are sorted by processed date (newest first) by default.
 *
 * @pagination
 * Uses Relay-style cursor pagination:
 * - first/after: Forward pagination
 * - last/before: Backward pagination
 *
 * @features
 * - Full line item details with images and pricing
 * - Discount allocations and totals
 * - Shipping address information
 * - Returns and returnable items
 * - Fulfillment status from first fulfillment
 *
 * @related
 * - account.orders._index.tsx - Order list page with expandable cards
 * - OrderHistorySection.tsx - Order history component
 *
 * @see https://shopify.dev/docs/api/customer/latest/objects/Order
 */

// =============================================================================
// FRAGMENTS
// =============================================================================

/**
 * Order fragment for list view with product carousel.
 *
 * Includes fields needed for order list display with OrderProductItem:
 * - Order identification (ID, name, number)
 * - Timestamps (processedAt)
 * - Status (fulfillmentStatus via first fulfillment)
 * - Line items with full product/variant data for "Buy Again" functionality
 *
 * Used by the /account/orders page which shows order number,
 * date/time, status badge, and product carousel with "Buy Again" buttons.
 *
 * @note productId and variantId are required for QuickAdd "Buy Again" button.
 * @note price is required for displaying product prices in the carousel.
 * @note name is required for order metadata display.
 */
export const ORDER_LIST_ITEM_FRAGMENT = `#graphql
  fragment OrderListItem on Order {
    id
    name
    number
    processedAt
    fulfillmentStatus
    fulfillments(first: 1) {
      nodes {
        status
      }
    }
    totalPrice {
      amount
      currencyCode
    }
    lineItems(first: 20) {
      nodes {
        id
        title
        name
        quantity
        productId
        variantId
        price {
          amount
          currencyCode
        }
        image {
          url
          altText
          width
          height
        }
        variantTitle
      }
    }
  }
` as const;

/**
 * Customer orders fragment for simplified list view.
 *
 * Features:
 * - Sorted by PROCESSED_AT (newest first)
 * - Cursor-based pagination for efficient loading
 * - No query parameter (search removed)
 *
 * @note Uses variables: $first, $last, $startCursor, $endCursor
 */
export const CUSTOMER_ORDERS_LIST_FRAGMENT = `#graphql
  fragment CustomerOrdersList on Customer {
    orders(
      sortKey: PROCESSED_AT,
      reverse: true,
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...OrderListItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
  ${ORDER_LIST_ITEM_FRAGMENT}
` as const;

/**
 * Order item fragment for list views with full details.
 *
 * Provides complete order data for expandable cards:
 * - Order identification (ID, number, confirmation)
 * - Pricing (subtotal, tax, total, discounts)
 * - Status (financial, fulfillment)
 * - Line items with full details
 * - Shipping address
 * - Returns and returnable items
 *
 * All nested structures are inlined to avoid fragment name conflicts with
 * CustomerOrderQuery.ts which is used for the return request page.
 */
export const ORDER_ITEM_FRAGMENT = `#graphql
  fragment OrderItem on Order {
    id
    name
    number
    confirmationNumber
    statusPageUrl
    processedAt
    financialStatus
    fulfillmentStatus

    # Fulfillment details from first fulfillment
    fulfillments(first: 1) {
      nodes {
        status
      }
    }

    # Pricing
    subtotal {
      amount
      currencyCode
    }
    totalTax {
      amount
      currencyCode
    }
    totalPrice {
      amount
      currencyCode
    }

    # Order-level discounts
    discountApplications(first: 10) {
      nodes {
        value {
          __typename
          ... on MoneyV2 {
            amount
            currencyCode
          }
          ... on PricingPercentageValue {
            percentage
          }
        }
      }
    }

    # Line items with full details
    lineItems(first: 50) {
      nodes {
        id
        title
        quantity
        price {
          amount
          currencyCode
        }
        discountAllocations {
          allocatedAmount {
            amount
            currencyCode
          }
          discountApplication {
            value {
              __typename
              ... on MoneyV2 {
                amount
                currencyCode
              }
              ... on PricingPercentageValue {
                percentage
              }
            }
          }
        }
        totalDiscount {
          amount
          currencyCode
        }
        image {
          altText
          height
          url
          id
          width
        }
        variantTitle
      }
    }

    # Shipping address
    shippingAddress {
      name
      formatted(withName: true)
      formattedArea
    }
  }
` as const;

/**
 * Customer orders fragment with pagination support.
 *
 * Features:
 * - Sorted by PROCESSED_AT (newest first)
 * - Cursor-based pagination for efficient loading
 * - Query parameter for order search/filtering
 *
 * @note Uses variables: $first, $last, $startCursor, $endCursor, $query
 */
export const CUSTOMER_ORDERS_FRAGMENT = `#graphql
  fragment CustomerOrders on Customer {
    orders(
      sortKey: PROCESSED_AT,
      reverse: true,
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      query: $query
    ) {
      nodes {
        ...OrderItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
` as const;

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Paginated customer orders query with full order details.
 *
 * @param $endCursor - Cursor for forward pagination
 * @param $first - Number of items to fetch (forward)
 * @param $last - Number of items to fetch (backward)
 * @param $startCursor - Cursor for backward pagination
 * @param $query - Optional search/filter query string
 * @param $language - Language code for localized content
 *
 * @see https://shopify.dev/docs/api/customer/latest/queries/customer
 */
export const CUSTOMER_ORDERS_QUERY = `#graphql
  ${CUSTOMER_ORDERS_FRAGMENT}
  query CustomerOrders(
    $endCursor: String
    $first: Int
    $last: Int
    $startCursor: String
    $query: String
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      ...CustomerOrders
    }
  }
` as const;

/**
 * Simplified paginated customer orders query for list view.
 *
 * Unlike CUSTOMER_ORDERS_QUERY, this query:
 * - Fetches only minimal order fields (no line items, pricing, discounts)
 * - Does not support search/filter (no $query parameter)
 * - Optimized for fast loading of order list page
 *
 * @param $endCursor - Cursor for forward pagination
 * @param $first - Number of items to fetch (forward)
 * @param $last - Number of items to fetch (backward)
 * @param $startCursor - Cursor for backward pagination
 * @param $language - Language code for localized content
 */
export const CUSTOMER_ORDERS_LIST_QUERY = `#graphql
  ${CUSTOMER_ORDERS_LIST_FRAGMENT}
  query CustomerOrdersList(
    $endCursor: String
    $first: Int
    $last: Int
    $startCursor: String
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      ...CustomerOrdersList
    }
  }
` as const;
