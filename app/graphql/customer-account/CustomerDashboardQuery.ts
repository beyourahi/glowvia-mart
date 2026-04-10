/**
 * @fileoverview Customer Dashboard Query
 *
 * @description
 * GraphQL query for fetching recent orders to display on the account dashboard overview.
 * Provides a summary of the customer's 3 most recent orders with basic order details,
 * fulfillment status, and line item previews (first 4 items per order).
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @queries
 * - CUSTOMER_DASHBOARD_QUERY - Fetches the 3 most recent orders sorted by processed date
 *
 * @fragments
 * - DASHBOARD_ORDER_FRAGMENT - Order fields optimized for dashboard display (basic info, first 4 line items)
 *
 * @related
 * - app/routes/account.tsx - Uses this query to load dashboard data in parent layout
 * - app/components/OrderHistorySection.tsx - Displays the order preview cards
 *
 * @notes
 * Customer details (name, email, addresses) are already loaded by the parent account
 * layout, so this query only fetches order-specific data to avoid redundant requests.
 */

// Dashboard query - fetches recent orders for the account overview
// Customer details (including addresses) are already loaded by the parent layout

export const DASHBOARD_ORDER_FRAGMENT = `#graphql
  fragment DashboardOrder on Order {
    id
    name
    number
    processedAt
    financialStatus
    fulfillments(first: 1) {
      nodes {
        status
      }
    }
    totalPrice {
      amount
      currencyCode
    }
    lineItems(first: 4) {
      nodes {
        id
        title
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
export const CUSTOMER_DASHBOARD_QUERY = `#graphql
  ${DASHBOARD_ORDER_FRAGMENT}
  query CustomerDashboard($language: LanguageCode) @inContext(language: $language) {
    customer {
      orders(first: 3, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          ...DashboardOrder
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
` as const;
