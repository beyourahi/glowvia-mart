/**
 * @fileoverview SimilarItems — "You may also like" 2/3/4-column grid section
 *
 * @description
 * Displays products with RELATED intent from Shopify's recommendation engine.
 * Uses a responsive CSS grid layout (2 → 3 → 4 columns) rather than a carousel —
 * giving shoppers a scannable overview of similar options without swiping.
 *
 * @design
 * - Section heading uses font-serif at text-lg (mobile) → text-xl (sm+) for clear hierarchy
 * - font-normal tracking-tight — refined, not heavy; consistent with ComplementaryProducts
 * - Responsive grid: 2 cols mobile → 3 cols tablet → 4 cols desktop
 * - Loading skeleton mirrors the grid layout using ProductCardSkeleton
 *
 * @features
 * - Deferred-safe: accepts raw resolved products array (already awaited by caller)
 * - Returns null when products is empty and not loading
 * - Loading state renders a matching skeleton grid (4 items)
 *
 * @related
 * - routes/products.$handle.tsx — loads SIMILAR_PRODUCTS_QUERY (deferred)
 * - ProductItem.tsx — individual product card
 * - skeletons.tsx — ProductCardSkeleton primitive
 */

import {ProductItem} from "~/components/ProductItem";
import {ProductCardSkeleton} from "~/components/skeletons";

// ============================================================================
// Types
// ============================================================================

type SimilarItemsProps = {
    isLoading?: boolean;
    products: any[];
};

// ============================================================================
// Skeleton grid for loading state
// Mirrors 2-col mobile / 3-col tablet / 4-col desktop grid
// ============================================================================

const SIMILAR_SKELETON_COUNT = 4;

function SimilarItemsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
            {Array.from({length: SIMILAR_SKELETON_COUNT}).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key -- Static skeleton items
                <ProductCardSkeleton key={`sim-sk-${index}`} index={index} />
            ))}
        </div>
    );
}

// ============================================================================
// Main component
// ============================================================================

/**
 * SimilarItems — renders a "You may also like" responsive product grid.
 *
 * The section only mounts when there are products to show (or while loading).
 * Empty + not loading returns null so no visual gap appears on the PDP.
 */
export function SimilarItems({isLoading = false, products}: SimilarItemsProps) {
    // Render nothing when empty and data has settled
    if (!isLoading && (!products || products.length === 0)) {
        return null;
    }

    return (
        <section
            aria-label="Similar items"
            className="border-t border-border/60 pt-8 pb-16 md:pb-24 mx-4 lg:mx-6 xl:mx-8 2xl:mx-12 3xl:mx-auto 3xl:max-w-400 3xl:px-12"
        >
            {/* Section heading — serif to match site heading language, scaled for mobile readability */}
            <h2 className="font-serif text-lg sm:text-xl font-normal tracking-tight text-foreground/80 mb-6">
                You may also like
            </h2>

            {isLoading ? (
                <SimilarItemsSkeleton />
            ) : (
                <div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10"
                    role="list"
                    aria-label="Similar items list"
                >
                    {products.slice(0, 8).map((product, index) => (
                        <div key={product.id} role="listitem">
                            <ProductItem
                                product={product}
                                index={index}
                                loading="lazy"
                                gridColumns={4}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
