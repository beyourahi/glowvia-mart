/**
 * @fileoverview Order Return Request Mutations
 *
 * @description
 * Provides GraphQL mutations for initiating product returns via the
 * Customer Account API. Allows customers to request returns for
 * eligible order items with reason selection.
 *
 * @api Customer Account API (requires authentication)
 *
 * @return-flow
 * 1. Customer views order and selects "Return" on eligible items
 * 2. Customer selects reason for each item
 * 3. ORDER_REQUEST_RETURN_MUTATION submits the request
 * 4. Return object created with status tracking
 * 5. Customer receives return instructions (if approved)
 *
 * @eligibility
 * Not all items are returnable. Check return policy and item status
 * before showing return option. See ReturnsAvailabilityQuery.ts.
 *
 * @related
 * - account.orders.$id.return.tsx - Return initiation page
 * - ReturnsAvailabilityQuery.ts - Check return eligibility
 * - CustomerReturnsQuery.ts - List existing returns
 *
 * @see https://shopify.dev/docs/api/customer/latest/mutations/orderRequestReturn
 */

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Request a return for order items.
 *
 * @param $orderId - The order containing items to return
 * @param $requestedLineItems - Array of items with quantities and reasons
 * @param $language - Language code for error messages
 *
 * @returns Created return object or userErrors
 */
export const ORDER_REQUEST_RETURN_MUTATION = `#graphql
  mutation orderRequestReturn(
    $orderId: ID!
    $requestedLineItems: [RequestedLineItemInput!]!
    $language: LanguageCode
  ) @inContext(language: $language) {
    orderRequestReturn(
      orderId: $orderId
      requestedLineItems: $requestedLineItems
    ) {
      return {
        id
        name
        status
        createdAt
        returnLineItems(first: 20) {
          nodes {
            id
            quantity
            returnReason
            lineItem {
              id
              title
              variantTitle
            }
          }
        }
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

// =============================================================================
// RETURN REASONS
// =============================================================================

/**
 * Predefined return reason options for the return form.
 *
 * Value is sent to Shopify API, label is displayed in UI.
 * Order matters - most common reasons should be first.
 */
export const RETURN_REASONS = [
    {value: "UNWANTED", label: "Changed my mind"},
    {value: "WRONG_ITEM", label: "Received wrong item"},
    {value: "DEFECTIVE", label: "Damaged or defective"},
    {value: "NOT_AS_DESCRIBED", label: "Not as described"},
    {value: "SIZE_TOO_SMALL", label: "Size too small"},
    {value: "SIZE_TOO_LARGE", label: "Size too large"},
    {value: "COLOR", label: "Color didn't match"},
    {value: "STYLE", label: "Style didn't match"},
    {value: "OTHER", label: "Other reason"}
] as const;

export type ReturnReasonValue = (typeof RETURN_REASONS)[number]["value"];
