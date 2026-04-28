/**
 * @fileoverview ComplementaryProducts — "Pairs well with" horizontal scroll section
 *
 * @description
 * Displays products with COMPLEMENTARY intent from Shopify's recommendation engine.
 * Uses a simple flex overflow-x-auto scroll pattern rather than an Embla carousel —
 * intentionally minimal to match storefront_002's clean monochromatic aesthetic.
 *
 * @design
 * - Subtle top border divider introduces the section without visual weight
 * - "Pairs well with" heading uses font-serif at text-lg (mobile) → text-xl (sm+) for clear hierarchy
 * - Horizontal scrollable row with fixed-width columns for each card
 * - Cards are 220px wide on mobile, 200px on tablet+, with a scrollbar-hide utility
 *
 * @features
 * - Deferred-safe: accepts raw resolved products array (already awaited by caller)
 * - Returns null when products is empty and not loading
 * - Loading state renders four skeleton cards
 *
 * @related
 * - routes/products.$handle.tsx — loads COMPLEMENTARY_PRODUCTS_QUERY (deferred)
 * - ProductItem.tsx — individual product card
 * - skeletons.tsx — ProductCardSkeleton primitive
 */

import {ProductItem} from "~/components/ProductItem";
import {ProductCardSkeleton} from "~/components/skeletons";

// ============================================================================
// Types
// ============================================================================

type ComplementaryProductsProps = {
    isLoading?: boolean;
    products: any[];
};

// ============================================================================
// Skeleton strip for loading state
// ============================================================================

const COMPLEMENTARY_SKELETON_IDS = ["cp-sk-1", "cp-sk-2", "cp-sk-3", "cp-sk-4"] as const;

function ComplementaryProductsSkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden">
            {COMPLEMENTARY_SKELETON_IDS.map((id, index) => (
                <div key={id} className="shrink-0 w-[220px] sm:w-[200px]">
                    <ProductCardSkeleton index={index} />
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Main component
// ============================================================================

/**
 * ComplementaryProducts — renders a "Pairs well with" horizontal scroll row.
 *
 * The section only mounts when there are products to show (or while loading).
 * Empty + not loading returns null so no visual gap appears on the PDP.
 */
export function ComplementaryProducts({isLoading = false, products}: ComplementaryProductsProps) {
    // Render nothing when empty and data has settled
    if (!isLoading && (!products || products.length === 0)) {
        return null;
    }

    return (
        <section
            aria-label="Complementary products"
            className="border-t border-border/60 pt-8 pb-12 md:pb-16 mx-4 lg:mx-6 xl:mx-8 2xl:mx-12 3xl:mx-auto 3xl:max-w-400 3xl:px-12"
        >
            {/* Section heading — serif to match site heading language, scaled for mobile readability */}
            <h2 className="font-serif text-lg sm:text-xl font-normal tracking-tight text-foreground/80 mb-6">
                Pairs well with
            </h2>

            {isLoading ? (
                <ComplementaryProductsSkeleton />
            ) : (
                <div
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                    role="list"
                    aria-label="Complementary products list"
                >
                    {products.slice(0, 8).map((product, index) => (
                        <div
                            key={product.id}
                            className="shrink-0 w-[220px] sm:w-[200px]"
                            role="listitem"
                        >
                            <ProductItem
                                product={product}
                                index={index}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
