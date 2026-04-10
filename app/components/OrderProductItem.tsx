/**
 * @fileoverview OrderProductItem - Wrapper for ProductItem in order contexts
 *
 * @description
 * Wraps ProductItem component to handle order-specific display requirements.
 * Converts Customer Account API order types to ProductItem-compatible format
 * and adds order-specific business logic (line totals, order metadata, linking).
 *
 * @features
 * - **Type Conversion**: Bridges Customer Account API types to ProductItemFragment
 * - **Line Total Calculation**: Calculates price × quantity for order details
 * - **Order Metadata**: Displays order number, date, status badges
 * - **Context-Aware Linking**: Links to order details or product page based on context
 * - **Flexible Display**: Supports both carousel (homepage) and order return contexts
 *
 * @contexts
 * 1. **Homepage Carousel** (OrderHistorySection):
 *    - Shows product image with order metadata overlay
 *    - Links to individual product pages (e.g., /products/{handle})
 *    - Displays order number, date, fulfillment status badge
 *    - Shows "Buy Again" quick add button
 *    - Compact, simplified presentation
 *
 * 2. **Order Return Page** (account.orders.$id.return):
 *    - Shows full product details with variant title
 *    - Displays unit price, quantity, and calculated line total
 *    - Supports both card (mobile) and list (desktop) layouts
 *
 * @related
 * - ProductItem.tsx - Core product display component
 * - OrderHistorySection.tsx - Homepage order history carousel
 * - account.orders._index.tsx - Order list with expandable cards
 * - account.orders.$id.return.tsx - Order return request page
 * - graphql/customer-account/CustomerOrderHistoryQuery.ts - Order history data
 * - graphql/customer-account/CustomerOrdersQuery.ts - Order list data
 */

import type {MoneyFragment} from "storefrontapi.generated";
import type {OrderHistoryProduct} from "~/graphql/customer-account/CustomerOrderHistoryQuery";
import type {OrderLineItemFullFragment} from "customer-accountapi.generated";
import {ProductItem} from "~/components/ProductItem";
import {Badge} from "~/components/ui/badge";
import {getOrderStatusVariant, formatOrderStatus} from "~/lib/order-status";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";

// ============================================================================
// Types
// ============================================================================

/**
 * Display context for OrderProductItem
 * - carousel: Homepage order history carousel (simplified, order metadata overlay)
 * - orderDetails: Order details page (full info, line totals)
 */
type OrderProductContext = "carousel" | "orderDetails";

/**
 * Props for OrderProductItem component
 */
interface OrderProductItemProps {
    /**
     * Display context - determines behavior and information shown
     */
    context: OrderProductContext;

    /**
     * Product data from order history (for carousel context)
     */
    orderHistoryProduct?: OrderHistoryProduct;

    /**
     * Line item data from order details (for orderDetails context)
     */
    lineItem?: OrderLineItemFullFragment;

    /**
     * Visual variant - card (vertical) or list (horizontal)
     * @default "card"
     */
    variant?: "card" | "list";

    /**
     * Index for staggered animations
     */
    index?: number;

    /**
     * Loading state for images
     */
    loading?: "eager" | "lazy";

    /**
     * Optional custom link URL
     * - For carousel: typically "/account/orders"
     * - For orderDetails: typically "/account/orders/{orderId}" or null (non-clickable)
     */
    customLink?: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts OrderHistoryProduct to ProductItemFragment-compatible format
 *
 * Creates a variant node if variantId is available, enabling QuickAdd "Buy Again"
 * functionality. Without a variantId, the product will show as unavailable.
 *
 * Uses the product handle (fetched from Storefront API in the route loader) to enable
 * linking to individual product pages from the order history carousel.
 */
function convertOrderHistoryProductToFragment(
    orderProduct: OrderHistoryProduct
): import("storefrontapi.generated").ProductItemFragment {
    // Use actual price from order history, fallback to 0 if not available
    const displayPrice = orderProduct.price || {amount: "0", currencyCode: "USD"};

    // Create a variant node if we have a variantId (enables QuickAdd "Buy Again")
    // The variantId from Customer Account API is the merchandiseId needed for cart mutations
    const variantNodes = orderProduct.variantId
        ? [
              {
                  id: orderProduct.variantId,
                  availableForSale: true, // Assume available; if not, Shopify will reject the mutation
                  title: orderProduct.name,
                  price: displayPrice,
                  compareAtPrice: null,
                  selectedOptions: []
              }
          ]
        : [];

    return {
        id: orderProduct.productId,
        title: orderProduct.name,
        handle: orderProduct.handle || "", // Use actual product handle for linking
        availableForSale: variantNodes.length > 0,
        featuredImage: orderProduct.image
            ? {
                  id: orderProduct.image.url,
                  url: orderProduct.image.url,
                  altText: orderProduct.image.altText || orderProduct.name,
                  width: orderProduct.image.width || 400,
                  height: orderProduct.image.height || 500
              }
            : null,
        priceRange: {
            minVariantPrice: displayPrice,
            maxVariantPrice: displayPrice
        },
        variants: {
            nodes: variantNodes
        },
        tags: []
    } as unknown as import("storefrontapi.generated").ProductItemFragment;
}

/**
 * Converts OrderLineItemFullFragment to ProductItemFragment-compatible format
 */
function convertLineItemToFragment(
    lineItem: OrderLineItemFullFragment
): import("storefrontapi.generated").ProductItemFragment {
    return {
        id: lineItem.id,
        title: lineItem.title,
        handle: "", // Order line items don't have handles
        featuredImage: lineItem.image
            ? {
                  id: lineItem.image.url,
                  url: lineItem.image.url,
                  altText: lineItem.image.altText || lineItem.title,
                  width: lineItem.image.width || 400,
                  height: lineItem.image.height || 500
              }
            : null,
        priceRange: {
            minVariantPrice: lineItem.price || {amount: "0", currencyCode: "USD"},
            maxVariantPrice: lineItem.price || {amount: "0", currencyCode: "USD"}
        },
        variants: {
            nodes: []
        },
        tags: []
    } as unknown as import("storefrontapi.generated").ProductItemFragment;
}

/**
 * Calculates line item total (price × quantity)
 * Note: Uses type assertion to bridge Customer Account API MoneyV2 to Storefront API MoneyFragment
 */
function calculateLineTotal(lineItem: OrderLineItemFullFragment): MoneyFragment | null {
    if (!lineItem.price) return null;
    const unitPrice = parseFloat(lineItem.price.amount);
    const quantity = lineItem.quantity;
    const totalAmount = (unitPrice * quantity).toFixed(2);
    return {
        amount: totalAmount,
        currencyCode: lineItem.price.currencyCode
    } as MoneyFragment;
}

// Status helper functions have been moved to ~/lib/order-status.ts
// for centralized management and guaranteed synchronization between
// order header badges and product item badges across the application.

// ============================================================================
// Main Component
// ============================================================================

/**
 * OrderProductItem - Wrapper for ProductItem in order contexts
 *
 * Handles two distinct contexts:
 * 1. **Carousel** (homepage): Simplified display with order metadata overlay
 * 2. **Order Details**: Full line item display with quantity and calculated totals
 *
 * @example
 * // Homepage carousel context
 * <OrderProductItem
 *   context="carousel"
 *   orderHistoryProduct={product}
 *   customLink="/account/orders"
 * />
 *
 * @example
 * // Order details page context
 * <OrderProductItem
 *   context="orderDetails"
 *   lineItem={lineItem}
 *   variant="list"
 *   customLink={`/account/orders/${orderId}`}
 * />
 */
export function OrderProductItem({
    context,
    orderHistoryProduct,
    lineItem,
    variant = "card",
    index = 0,
    loading = "lazy",
    customLink = null
}: OrderProductItemProps) {
    // ========================================================================
    // Context: Homepage Carousel (OrderHistorySection)
    // ========================================================================
    if (context === "carousel" && orderHistoryProduct) {
        const productFragment = convertOrderHistoryProductToFragment(orderHistoryProduct);
        const formattedDate = new Date(orderHistoryProduct.orderDate).toLocaleDateString(STORE_FORMAT_LOCALE, {
            month: "short",
            day: "numeric"
        });

        return (
            <div className="relative">
                <ProductItem
                    product={productFragment}
                    variant={variant}
                    index={index}
                    loading={loading}
                    customLink={customLink}
                    // Carousel-specific configuration
                    compactMode={true}
                    showVendor={false}
                    showBadges={false}
                    showQuickAdd={true}
                    showWishlist={false}
                    showSwatches={false}
                    hideComparePrice={false} // Show compare price when available
                    hideDefaultActions={false}
                    orderHistoryContext={true} // Shows "Buy Again" button label
                    // Order metadata displayed separately below
                    metadata={[
                        {
                            label: "Order",
                            value: `#${orderHistoryProduct.orderNumber} · ${formattedDate}`
                        }
                    ]}
                />

                {/* Fulfillment Status Badge - Positioned absolute over image */}
                <Badge
                    variant={getOrderStatusVariant(orderHistoryProduct.fulfillmentStatus)}
                    className="absolute top-2 right-2 z-10"
                >
                    {formatOrderStatus(orderHistoryProduct.fulfillmentStatus)}
                </Badge>
            </div>
        );
    }

    // ========================================================================
    // Context: Order Return Page (account.orders.$id.return)
    // ========================================================================
    if (context === "orderDetails" && lineItem) {
        const productFragment = convertLineItemToFragment(lineItem);
        const lineTotal = calculateLineTotal(lineItem);

        // Build metadata array for order line items
        const orderMetadata: Array<{label: string; value: React.ReactNode}> = [];

        // Add variant title if present
        if (lineItem.variantTitle) {
            orderMetadata.push({
                label: "Variant",
                value: lineItem.variantTitle
            });
        }

        // Add quantity
        orderMetadata.push({
            label: "Qty",
            value: lineItem.quantity.toString()
        });

        // Add line total if calculated
        if (lineTotal) {
            orderMetadata.push({
                label: "Total",
                value: (
                    <span className="font-mono tabular-nums font-semibold">
                        {lineTotal.currencyCode} {lineTotal.amount}
                    </span>
                )
            });
        }

        return (
            <ProductItem
                product={productFragment}
                variant={variant}
                index={index}
                loading={loading}
                customLink={customLink}
                // Order details configuration
                compactMode={false}
                showVendor={false}
                showBadges={false}
                showQuickAdd={false}
                showWishlist={false}
                showSwatches={false}
                hideComparePrice={true}
                hideDefaultActions={true}
                // Show unit price with label - safely convert nullable price to MoneyFragment
                priceLabel="Unit Price"
                customPrice={
                    lineItem.price
                        ? ({amount: lineItem.price.amount, currencyCode: lineItem.price.currencyCode} as MoneyFragment)
                        : undefined
                }
                // Display order-specific metadata
                metadata={orderMetadata}
            />
        );
    }

    // Fallback: should never reach here if props are correct
    console.warn("OrderProductItem: Invalid context or missing data", {context, orderHistoryProduct, lineItem});
    return null;
}
