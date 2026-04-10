/**
 * @fileoverview Subscription frequency selector with URL-based state management
 *
 * @description
 * Displays subscription plan options (delivery frequency) for products with selling
 * plans. Uses URL query parameters (?selling_plan=gid://...) for state management.
 * Filters plans based on selected variant availability.
 *
 * @features
 * - URL-based state via ?selling_plan query parameter
 * - Variant-aware plan filtering (only shows available plans)
 * - Pill-style buttons matching variant selector design
 * - Selected state styling (filled vs outline)
 * - Price adjustment calculation (percentage, fixed, absolute)
 * - Support for multiple plan groups (subscriptions, pre-orders, etc.)
 *
 * @props
 * - sellingPlanGroups: ProductFragment["sellingPlanGroups"] - Plan groups from Shopify
 * - selectedSellingPlan: SellingPlanFragment | null - Currently selected plan
 * - selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"] - Current variant
 * - className: string (optional) - Additional Tailwind classes
 *
 * @usage
 * ```tsx
 * <SellingPlanSelector
 *   sellingPlanGroups={product.sellingPlanGroups}
 *   selectedSellingPlan={selectedSellingPlan}
 *   selectedVariant={selectedVariant}
 * />
 * ```
 *
 * @related
 * - ProductPage.tsx - Product detail page with subscription support
 * - ProductHeroMobile.tsx - Mobile product form with subscription
 * - app/routes/products.$handle.tsx - Loader that fetches selling plans
 *
 * @architecture
 * - URL state: ?selling_plan=gid://shopify/SellingPlan/123
 * - Variant allocations: Each variant has sellingPlanAllocations
 * - Plan filtering: Only show plans available for selected variant
 * - Price calculation: Apply plan adjustments to variant price
 *
 * @see {@link https://shopify.dev/docs/apps/selling-strategies/subscriptions}
 */

import {useLocation, useNavigate} from "react-router";
import {cn} from "~/lib/utils";
import type {ProductFragment} from "storefrontapi.generated";
import type {MoneyV2} from "@shopify/hydrogen/storefront-api-types";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type definitions derived from the product query
 */
export type SellingPlanFragment = NonNullable<
    ProductFragment["sellingPlanGroups"]
>["nodes"][number]["sellingPlans"]["nodes"][number];

export type SellingPlanGroupFragment = NonNullable<ProductFragment["sellingPlanGroups"]>["nodes"][number];

/**
 * Enriched selling plan with selection state and URL
 * Used for rendering plan buttons with correct state and navigation
 */
export type EnrichedSellingPlan = SellingPlanFragment & {
    isSelected: boolean;
    url: string;
    groupName: string;
};

interface SellingPlanSelectorProps {
    sellingPlanGroups: ProductFragment["sellingPlanGroups"];
    selectedSellingPlan: SellingPlanFragment | null;
    selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"];
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SellingPlanSelector displays subscription frequency options
 *
 * @param sellingPlanGroups - Selling plan groups from product query
 * @param selectedSellingPlan - Currently selected plan (from URL state)
 * @param selectedVariant - Current variant (for availability filtering)
 * @param className - Additional CSS classes
 * @returns Pill-style selector or null if no plans available
 *
 * State Management:
 * - URL query parameter: ?selling_plan=gid://shopify/SellingPlan/123
 * - Updates URL when user selects different plan (replace history)
 * - preventScrollReset maintains scroll position on plan change
 *
 * Plan Availability:
 * - Filters plans based on variant.sellingPlanAllocations
 * - Only shows plans available for currently selected variant
 * - Returns null if no plans available for variant
 *
 * Plan Display:
 * - Uses plan.options for display label (e.g., "1 Week", "2 Weeks")
 * - Falls back to plan.name if no options
 * - Selected state: filled bg-primary
 * - Unselected state: outline border-primary
 */
export function SellingPlanSelector({
    sellingPlanGroups,
    selectedSellingPlan,
    selectedVariant,
    className
}: SellingPlanSelectorProps) {
    const navigate = useNavigate();
    const {search, pathname} = useLocation();

    // Get selling plan IDs that are available for the current variant
    const availablePlanIds =
        selectedVariant?.sellingPlanAllocations?.nodes.map(allocation => allocation.sellingPlan.id) ?? [];

    // Filter and enrich selling plans with selection state and URLs
    const params = new URLSearchParams(search);
    const availablePlans = !sellingPlanGroups?.nodes
        ? []
        : sellingPlanGroups.nodes.flatMap(group =>
              group.sellingPlans.nodes
                  .filter(plan => availablePlanIds.includes(plan.id))
                  .map(plan => {
                      params.set("selling_plan", plan.id);
                      return {
                          ...plan,
                          groupName: group.name,
                          isSelected: selectedSellingPlan?.id === plan.id,
                          url: `${pathname}?${params.toString()}`
                      } as EnrichedSellingPlan;
                  })
          );

    const handlePlanSelect = (plan: EnrichedSellingPlan) => {
        void navigate(plan.url, {
            replace: true,
            preventScrollReset: true
        });
    };

    if (availablePlans.length === 0) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <p className="text-sm font-medium text-muted-foreground">Delivery Frequency</p>
            <div className="flex flex-wrap gap-2">
                {availablePlans.map(plan => {
                    // Display the option value (e.g., "1 Week", "2 Weeks", "1 Month")
                    const optionLabel = plan.options.map(opt => opt.value).join(" ");

                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => handlePlanSelect(plan)}
                            className={cn(
                                "inline-flex min-h-10 select-none items-center justify-center rounded-full border-2 px-3 sm:px-4 py-1.5 text-base sm:text-lg font-medium sleek",
                                "active:scale-95",
                                plan.isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-primary text-primary hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
                            )}
                        >
                            {optionLabel || plan.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate the adjusted price for a selling plan
 *
 * @param originalPrice - Variant price without subscription
 * @param sellingPlan - Selling plan with price adjustments
 * @returns Adjusted price with subscription discount
 *
 * Price Adjustment Types:
 * 1. SellingPlanPercentagePriceAdjustment: X% off (e.g., 10% off)
 * 2. SellingPlanFixedAmountPriceAdjustment: $X off (e.g., $5 off)
 * 3. SellingPlanFixedPriceAdjustment: Set price (e.g., $19.99)
 *
 * Example:
 * - Original: $100.00
 * - Plan: 10% off
 * - Result: $90.00
 */
export function calculateSellingPlanPrice(originalPrice: MoneyV2, sellingPlan: SellingPlanFragment): MoneyV2 {
    const amount = parseFloat(originalPrice.amount);
    const adjustment = sellingPlan.priceAdjustments?.[0]?.adjustmentValue;

    if (!adjustment) return originalPrice;

    let adjustedAmount = amount;

    switch (adjustment.__typename) {
        case "SellingPlanPercentagePriceAdjustment":
            adjustedAmount = amount * (1 - adjustment.adjustmentPercentage / 100);
            break;
        case "SellingPlanFixedAmountPriceAdjustment":
            adjustedAmount = amount - parseFloat(adjustment.adjustmentAmount.amount);
            break;
        case "SellingPlanFixedPriceAdjustment":
            adjustedAmount = parseFloat(adjustment.price.amount);
            break;
    }

    return {
        amount: adjustedAmount.toFixed(2),
        currencyCode: originalPrice.currencyCode
    };
}

/**
 * Get the discount percentage for a selling plan (if applicable)
 *
 * @param sellingPlan - Selling plan to check
 * @returns Discount percentage or null if not percentage-based
 *
 * Only returns value for SellingPlanPercentagePriceAdjustment.
 * Returns null for fixed amount or fixed price adjustments.
 *
 * Use case: Displaying "Save 10%" badges on subscription options
 */
export function getSellingPlanDiscount(sellingPlan: SellingPlanFragment): number | null {
    const adjustment = sellingPlan.priceAdjustments?.[0]?.adjustmentValue;

    if (adjustment?.__typename === "SellingPlanPercentagePriceAdjustment") {
        return adjustment.adjustmentPercentage;
    }

    return null;
}
