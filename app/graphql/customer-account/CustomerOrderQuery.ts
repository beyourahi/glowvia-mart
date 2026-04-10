/**
 * @fileoverview Customer Order Detail Query
 *
 * @description
 * Comprehensive GraphQL query for fetching complete order details including line items,
 * pricing, discounts, shipping address, returns, and return eligibility information.
 * Used on the order detail page to display full order information and manage returns.
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @queries
 * - CUSTOMER_ORDER_QUERY - Fetches complete order details by order ID
 *
 * @fragments
 * - Order - Complete order information including pricing, shipping, returns, and return eligibility
 * - OrderLineItemFull - Line item with pricing, discounts, variant, and image
 * - OrderMoney - Money value with amount and currency code
 * - DiscountApplication - Discount details (fixed or percentage)
 *
 * @related
 * - app/routes/account.orders.$id.tsx - Displays full order details
 * - app/routes/account.orders.$id.return.tsx - Uses returnInformation for creating returns
 * - app/components/CartMain.tsx - Similar pricing structure for cart display
 *
 * @notes
 * This query includes return information to determine which items can be returned and
 * displays existing returns. The returnInformation field checks up to 100 returnable
 * line items to support large orders.
 */

// NOTE: https://shopify.dev/docs/api/customer/latest/queries/order
export const CUSTOMER_ORDER_QUERY = `#graphql
  fragment OrderMoney on MoneyV2 {
    amount
    currencyCode
  }
  fragment DiscountApplication on DiscountApplication {
    value {
      __typename
      ... on MoneyV2 {
        ...OrderMoney
      }
      ... on PricingPercentageValue {
        percentage
      }
    }
  }
  fragment OrderLineItemFull on LineItem {
    id
    title
    quantity
    price {
      ...OrderMoney
    }
    discountAllocations {
      allocatedAmount {
        ...OrderMoney
      }
      discountApplication {
        ...DiscountApplication
      }
    }
    totalDiscount {
      ...OrderMoney
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
  fragment Order on Order {
    id
    name
    confirmationNumber
    statusPageUrl
    fulfillmentStatus
    processedAt
    fulfillments(first: 1) {
      nodes {
        status
      }
    }
    totalTax {
      ...OrderMoney
    }
    totalPrice {
      ...OrderMoney
    }
    subtotal {
      ...OrderMoney
    }
    shippingAddress {
      name
      formatted(withName: true)
      formattedArea
    }
    discountApplications(first: 100) {
      nodes {
        ...DiscountApplication
      }
    }
    lineItems(first: 100) {
      nodes {
        ...OrderLineItemFull
      }
    }
    returns(first: 10) {
      nodes {
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
              image {
                altText
                url
                width
                height
              }
            }
          }
        }
      }
    }
    returnInformation {
      returnableLineItems(first: 100) {
        nodes {
          quantity
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
      }
      nonReturnableSummary {
        nonReturnableReasons
      }
    }
  }
  query Order($orderId: ID!, $language: LanguageCode)
    @inContext(language: $language) {
    order(id: $orderId) {
      ... on Order {
        ...Order
      }
    }
  }
` as const;
