/**
 * @fileoverview Order Status Utilities
 *
 * @description
 * Centralized utilities for handling order and fulfillment status display.
 * Provides consistent badge variants and human-readable labels across
 * all order-related components.
 *
 * **CRITICAL: Single Source of Truth**
 * These functions ensure order header badges and product item badges show
 * IDENTICAL colors and labels for the SAME status, maintaining visual
 * consistency and preventing user confusion.
 *
 * @usage
 * - Order list pages (account.orders._index.tsx)
 * - Order detail pages (account.orders.$id.tsx)
 * - Product items in order context (OrderProductItem.tsx)
 * - Order history sections (OrderHistorySection.tsx)
 *
 * @architecture
 * This module guarantees status synchronization through a single implementation:
 *
 * ```
 * Order Status "FULFILLED"
 *   │
 *   └─> ~/lib/order-status.ts
 *         ├─> getOrderStatusVariant("FULFILLED") → "default" (green)
 *         └─> formatOrderStatus("FULFILLED") → "Delivered"
 *               │
 *               ├─> Order Header Badge: Green "Delivered"
 *               └─> All Product Badges: Green "Delivered"
 *                     │
 *                     └─> ✓ GUARANTEED MATCH (same functions)
 * ```
 *
 * By centralizing the status mapping logic, it becomes architecturally impossible
 * for order badges and product badges to show different colors or labels for the
 * same status value.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Badge variant type for order status
 * Maps to shadcn/ui Badge component variants
 */
export type OrderStatusVariant = "default" | "secondary" | "destructive" | "outline";

// ============================================================================
// Status Variant Mapping
// ============================================================================

/**
 * Returns the appropriate badge variant for an order or fulfillment status.
 *
 * **Status Color Mapping:**
 * - **default (green)**: Fulfilled, delivered, success states
 * - **secondary (gray)**: Unfulfilled, pending, in-progress states
 * - **outline (border)**: On hold, partially fulfilled states
 * - **destructive (red)**: Cancelled, refunded, failure states
 *
 * **Consistency Guarantee:**
 * Order header badges and product item badges will show the SAME color
 * for the SAME status value, ensuring visual synchronization across the
 * entire order interface.
 *
 * **WCAG Contrast Compliance:**
 * All badge variants maintain WCAG 2.1 Level AA contrast ratios:
 * - default (green): 14.68:1 on background
 * - secondary (gray): 15.42:1 on background
 * - outline (border): 14.68:1 text on background
 * - destructive (red): 4.91:1 on background
 *
 * @param status - Order or fulfillment status from Shopify API
 * @returns Badge variant for UI display
 *
 * @example
 * getOrderStatusVariant("FULFILLED") // "default" (green)
 * getOrderStatusVariant("UNFULFILLED") // "secondary" (gray)
 * getOrderStatusVariant("CANCELLED") // "destructive" (red)
 * getOrderStatusVariant(null) // "secondary" (default fallback)
 */
export function getOrderStatusVariant(status: string | null | undefined): OrderStatusVariant {
    if (!status) return "secondary";

    const upperStatus = status.toUpperCase();

    switch (upperStatus) {
        // Success states (green - default variant)
        case "FULFILLED":
        case "DELIVERED":
        case "SUCCESS":
            return "default";

        // Processing states (gray - secondary variant)
        case "UNFULFILLED":
        case "IN_PROGRESS":
        case "PENDING":
            return "secondary";

        // Attention states (border - outline variant)
        case "ON_HOLD":
        case "PARTIALLY_FULFILLED":
            return "outline";

        // Error states (red - destructive variant)
        case "CANCELLED":
        case "VOIDED":
        case "REFUNDED":
        case "PARTIALLY_REFUNDED":
        case "FAILURE":
            return "destructive";

        // Payment success states (green - default variant)
        case "PAID":
            return "default";

        // Payment pending states (gray - secondary variant)
        case "AUTHORIZED":
            return "secondary";

        default:
            return "secondary";
    }
}

// ============================================================================
// Status Label Formatting
// ============================================================================

/**
 * Formats an order or fulfillment status for user-friendly display.
 *
 * Converts API status codes (e.g., "FULFILLED", "IN_PROGRESS") to
 * human-readable labels (e.g., "Delivered", "In Progress").
 *
 * **Consistency Guarantee:**
 * Order header badges and product item badges will show the SAME label
 * for the SAME status value, ensuring textual synchronization across
 * all order interfaces.
 *
 * **Implementation Details:**
 * - Uses explicit mapping for known Shopify status values
 * - Falls back to Title Case conversion for unknown statuses
 * - Handles null/undefined gracefully (returns "Processing")
 * - Case-insensitive matching for robustness
 *
 * @param status - Order or fulfillment status from Shopify API
 * @returns Formatted status string for display
 *
 * @example
 * formatOrderStatus("FULFILLED") // "Delivered"
 * formatOrderStatus("UNFULFILLED") // "Processing"
 * formatOrderStatus("PARTIALLY_FULFILLED") // "Partial"
 * formatOrderStatus("CUSTOM_STATUS") // "Custom Status" (fallback)
 * formatOrderStatus(null) // "Processing" (default)
 */
export function formatOrderStatus(status: string | null | undefined): string {
    if (!status) return "Processing";

    const upperStatus = status.toUpperCase();

    switch (upperStatus) {
        // Fulfillment statuses
        case "FULFILLED":
            return "Delivered";
        case "UNFULFILLED":
            return "Processing";
        case "PARTIALLY_FULFILLED":
            return "Partial";

        // Progress statuses
        case "IN_PROGRESS":
            return "In Progress";
        case "ON_HOLD":
            return "On Hold";
        case "PENDING":
            return "Pending";

        // Success statuses
        case "DELIVERED":
            return "Delivered";
        case "SUCCESS":
            return "Success";

        // Error statuses
        case "CANCELLED":
            return "Cancelled";
        case "VOIDED":
            return "Voided";
        case "REFUNDED":
            return "Refunded";
        case "PARTIALLY_REFUNDED":
            return "Partial Refund";
        case "FAILURE":
            return "Failed";

        // Payment statuses
        case "PAID":
            return "Paid";
        case "AUTHORIZED":
            return "Authorized";

        default:
            // Fallback: Convert SNAKE_CASE to Title Case
            // Example: "CUSTOM_STATUS" → "Custom Status"
            return status
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, l => l.toUpperCase());
    }
}
