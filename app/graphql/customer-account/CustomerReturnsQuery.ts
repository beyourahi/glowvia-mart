/**
 * @fileoverview Customer Returns Query
 *
 * @description
 * GraphQL query and helper utilities for fetching customer return history. Retrieves
 * orders with their associated returns, including return status, line items, and reasons.
 * Includes status configuration and display utilities for consistent return status UI.
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @queries
 * - CUSTOMER_RETURNS_QUERY - Fetches orders with returns, paginated and sorted by date
 *
 * @fragments
 * - OrderWithReturns - Order basic info with nested returns
 * - ReturnInfo - Return details with status and line items (up to 20 items)
 * - ReturnLineItem - Returned item with quantity, reason, and product details
 *
 * @utilities
 * - RETURN_STATUS_CONFIG - Status display configuration (label, variant, description)
 * - getReturnStatusConfig() - Maps return status to display configuration
 * - ReturnStatus type - Union of valid return status values
 *
 * @related
 * - app/routes/account.returns._index.tsx - Displays paginated returns history
 * - app/routes/account.orders._index.tsx - Shows returns in expandable order cards
 *
 * @notes
 * Returns can have statuses: REQUESTED, OPEN, CLOSED, DECLINED, CANCELLED. Each status
 * maps to a specific badge variant for consistent visual feedback.
 */

// Query to fetch orders with returns for the returns history page
// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Return
export const CUSTOMER_RETURNS_QUERY = `#graphql
  fragment ReturnLineItem on ReturnLineItem {
    id
    quantity
    returnReason
    lineItem {
      id
      title
      variantTitle
      image {
        altText
        url
        width
        height
      }
    }
  }
  fragment ReturnInfo on Return {
    id
    name
    status
    createdAt
    returnLineItems(first: 20) {
      nodes {
        ...ReturnLineItem
      }
    }
  }
  fragment OrderWithReturns on Order {
    id
    name
    number
    processedAt
    returns(first: 10) {
      nodes {
        ...ReturnInfo
      }
    }
  }
  query CustomerReturns(
    $first: Int
    $after: String
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      orders(
        sortKey: PROCESSED_AT
        reverse: true
        first: $first
        after: $after
      ) {
        nodes {
          ...OrderWithReturns
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
` as const;

// Return status display helpers
export const RETURN_STATUS_CONFIG = {
    REQUESTED: {
        label: "Requested",
        variant: "secondary" as const,
        description: "Return request submitted"
    },
    OPEN: {
        label: "In Progress",
        variant: "secondary" as const,
        description: "Return is being processed"
    },
    CLOSED: {
        label: "Completed",
        variant: "default" as const,
        description: "Return has been completed"
    },
    DECLINED: {
        label: "Declined",
        variant: "destructive" as const,
        description: "Return request was declined"
    },
    CANCELLED: {
        label: "Cancelled",
        variant: "outline" as const,
        description: "Return was cancelled"
    }
} as const;

export type ReturnStatus = keyof typeof RETURN_STATUS_CONFIG;

export function getReturnStatusConfig(status: string) {
    return (
        RETURN_STATUS_CONFIG[status as ReturnStatus] ?? {
            label: status,
            variant: "outline" as const,
            description: ""
        }
    );
}
