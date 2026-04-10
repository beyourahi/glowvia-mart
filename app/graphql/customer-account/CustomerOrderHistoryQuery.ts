/**
 * @fileoverview Customer Order History Query
 *
 * @description
 * GraphQL query and helper utilities for fetching customer order history with line items.
 * Used to display recently purchased products in the homepage order history carousel.
 * Includes deduplication logic to show unique products across multiple orders.
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @queries
 * - CUSTOMER_ORDER_HISTORY_QUERY - Fetches recent orders with line items for product carousel
 *
 * @fragments
 * - ORDER_HISTORY_ORDER_FRAGMENT - Order fields with fulfillment status and line items (first 10)
 * - ORDER_HISTORY_LINE_ITEM_FRAGMENT - Line item details including product ID and image
 *
 * @utilities
 * - extractOrderHistoryProducts() - Extracts and deduplicates products from orders, max 16 unique items
 * - OrderHistoryProduct type - Normalized product data for carousel display
 *
 * @related
 * - app/routes/_index.tsx - Uses this query to load order history for homepage carousel
 * - app/components/OrderHistorySection.tsx - Displays the product carousel
 *
 * @notes
 * The extraction function prioritizes showing unique products (by productId) and filters
 * out items without images since the carousel is image-focused.
 */

// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
// Fetches recent orders with line items for the homepage order history carousel

import type {CustomerOrderHistoryQuery} from "customer-accountapi.generated";
import type {CurrencyCode} from "@shopify/hydrogen/customer-account-api-types";

export const ORDER_HISTORY_LINE_ITEM_FRAGMENT = `#graphql
  fragment OrderHistoryLineItem on LineItem {
    id
    name
    title
    productId
    variantId
    quantity
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
  }
` as const;

export const ORDER_HISTORY_ORDER_FRAGMENT = `#graphql
  fragment OrderHistoryOrder on Order {
    id
    name
    number
    processedAt
    financialStatus
    fulfillmentStatus
    lineItems(first: 10) {
      nodes {
        ...OrderHistoryLineItem
      }
    }
  }
  ${ORDER_HISTORY_LINE_ITEM_FRAGMENT}
` as const;

// Query to fetch recent orders with line items for homepage carousel
export const CUSTOMER_ORDER_HISTORY_QUERY = `#graphql
  ${ORDER_HISTORY_ORDER_FRAGMENT}
  query CustomerOrderHistory(
    $first: Int!
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          ...OrderHistoryOrder
        }
      }
    }
  }
` as const;

// Type for extracted order history product (used in component)
export interface OrderHistoryProduct {
    id: string;
    lineItemId: string;
    productId: string | null;
    /** Variant ID for cart mutations (merchandiseId) */
    variantId: string | null;
    /** Product handle for linking to product pages */
    handle: string | null;
    name: string;
    image: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
    price: {
        amount: string;
        currencyCode: CurrencyCode;
    } | null;
    orderDate: string;
    orderNumber: string;
    orderName: string;
    fulfillmentStatus: string;
}

// Type alias for the order nodes from the generated query
type OrderHistoryOrderNode = CustomerOrderHistoryQuery["customer"]["orders"]["nodes"][number];

// Helper function to extract unique products from order history
export function extractOrderHistoryProducts(
    orders: OrderHistoryOrderNode[],
    maxProducts: number = 16
): OrderHistoryProduct[] {
    const seenProductIds = new Set<string>();
    const products: OrderHistoryProduct[] = [];

    for (const order of orders) {
        for (const lineItem of order.lineItems.nodes) {
            // Skip if we've already seen this product (deduplicate)
            if (lineItem.productId && seenProductIds.has(lineItem.productId)) {
                continue;
            }

            // Skip items without images
            if (!lineItem.image?.url) {
                continue;
            }

            // Add to seen set if has productId
            if (lineItem.productId) {
                seenProductIds.add(lineItem.productId);
            }

            products.push({
                id: `${order.id}-${lineItem.id}`,
                lineItemId: lineItem.id,
                productId: lineItem.productId ?? null,
                variantId: lineItem.variantId ?? null,
                handle: null, // Will be populated by route loader via Storefront API
                name: lineItem.name || lineItem.title,
                image: {
                    url: lineItem.image.url,
                    altText: lineItem.image.altText,
                    width: lineItem.image.width,
                    height: lineItem.image.height
                },
                price: lineItem.price ?? null,
                orderDate: order.processedAt,
                orderNumber: String(order.number),
                orderName: order.name,
                fulfillmentStatus: order.fulfillmentStatus
            });

            // Stop if we've reached the max
            if (products.length >= maxProducts) {
                return products;
            }
        }
    }

    return products;
}
