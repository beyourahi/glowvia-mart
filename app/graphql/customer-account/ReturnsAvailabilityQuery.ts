/**
 * @fileoverview Returns Availability Query
 *
 * @description
 * Lightweight GraphQL query and detection logic to determine if the customer has access
 * to returns functionality. Checks recent fulfilled orders for returnable items to
 * intelligently detect if returns are enabled in the store. Used to conditionally
 * display returns UI in navigation and account pages.
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @queries
 * - RETURNS_AVAILABILITY_QUERY - Fetches recent orders with minimal return information
 *
 * @utilities
 * - checkReturnsEnabled() - Determines if returns should be shown based on order data
 *
 * @related
 * - app/routes/account.tsx - Uses this query to conditionally show "Returns" nav link
 * - app/routes/account.orders._index.tsx - Shows return button in expandable order cards
 *
 * @notes
 * The detection logic is "fail open" - if no orders exist or data is ambiguous, it defaults
 * to showing returns UI. This prevents hiding functionality that might be available.
 * Returns are considered disabled only if ALL fulfilled orders have "OTHER" as the
 * non-returnable reason, which indicates the merchant has disabled returns entirely.
 *
 * @algorithm
 * 1. If no orders, show returns UI (fail open)
 * 2. Filter to fulfilled orders only (can't return unfulfilled items)
 * 3. If any order has returnable items, returns are enabled
 * 4. If all orders have ONLY "OTHER" as non-returnable reason, returns are disabled
 * 5. Otherwise, show returns UI (fail open for edge cases)
 */

// Lightweight query to check if returns are available for the customer
// This checks recent fulfilled orders for returnable items to detect if returns are enabled
export const RETURNS_AVAILABILITY_QUERY = `#graphql
  query ReturnsAvailability(
    $first: Int
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          fulfillmentStatus
          returnInformation {
            returnableLineItems(first: 1) {
              nodes {
                quantity
              }
            }
            nonReturnableSummary {
              nonReturnableReasons
            }
          }
        }
      }
    }
  }
` as const;

// Helper function to determine if returns are enabled based on order data
export function checkReturnsEnabled(
    orders: Array<{
        fulfillmentStatus: string;
        returnInformation?: {
            returnableLineItems?: {
                nodes?: Array<{quantity: number}>;
            };
            nonReturnableSummary?: {
                nonReturnableReasons?: string[];
            } | null;
        };
    }>
): boolean {
    // If no orders exist, default to showing returns UI (fail open)
    if (!orders || orders.length === 0) {
        return true;
    }

    // Filter to only fulfilled orders (can't return unfulfilled items anyway)
    const fulfilledOrders = orders.filter(
        order => order.fulfillmentStatus !== "UNFULFILLED" && order.fulfillmentStatus !== "PENDING"
    );

    // If no fulfilled orders, default to showing returns UI
    if (fulfilledOrders.length === 0) {
        return true;
    }

    // Check if ANY fulfilled order has returnable items
    const hasReturnableItems = fulfilledOrders.some(
        order => (order.returnInformation?.returnableLineItems?.nodes?.length ?? 0) > 0
    );

    // If any order has returnable items, returns are enabled
    if (hasReturnableItems) {
        return true;
    }

    // Check the non-returnable reasons - if all are "OTHER", returns might be disabled
    // Other reasons like RETURNED, RETURN_WINDOW_EXPIRED, FINAL_SALE are normal
    const allHaveOtherReason = fulfilledOrders.every(order => {
        const reasons = order.returnInformation?.nonReturnableSummary?.nonReturnableReasons ?? [];
        // If reasons include only OTHER (or is empty with no returnable items), it suggests disabled
        return reasons.length > 0 && reasons.every(r => r === "OTHER");
    });

    // If all fulfilled orders have "OTHER" as the only reason, returns are likely disabled
    if (allHaveOtherReason) {
        return false;
    }

    // Default to showing returns UI (fail open)
    return true;
}
