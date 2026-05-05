/**
 * @fileoverview Collection Sidebar — desktop-only sticky navigation for collection pages.
 *
 * Shows "All Products", an optional SALE link (when `discountCount > 0`), and all
 * collections with product counts. Active link is bold with a persistent underline;
 * inactive links animate the underline in from the left on hover (origin-left, 300ms).
 * Counts cap at "250+". Sticky positioning is handled by the parent CollectionPageLayout.
 *
 * @related
 * - CollectionPageLayout.tsx - Positions the sidebar and provides its props
 */
import {Link} from "react-router";
import {cn} from "~/lib/utils";

export interface CollectionWithCount {
    handle: string;
    title: string;
    productsCount: number;
}

interface CollectionSidebarProps {
    collections: CollectionWithCount[];
    activeHandle: string | "all-products" | "sale";
    totalProductCount: number;
    discountCount?: number;
}

export function CollectionSidebar({
    collections,
    activeHandle,
    totalProductCount,
    discountCount
}: CollectionSidebarProps) {
    return (
        <nav className="hidden md:block">
            <ul className="space-y-1">
                {/* All Products Link */}
                <CollectionLink
                    href="/collections/all-products"
                    title="All Products"
                    count={totalProductCount}
                    isActive={activeHandle === "all-products"}
                />

                {/* SALE Link - only show if discountCount > 0, highlighted differently */}
                {discountCount !== undefined && discountCount > 0 && (
                    <CollectionLink
                        href="/sale"
                        title="SALE"
                        count={discountCount}
                        isActive={activeHandle === "sale"}
                        isSale
                    />
                )}

                {/* Individual Collections */}
                {collections.map(collection => (
                    <CollectionLink
                        key={collection.handle}
                        href={`/collections/${collection.handle}`}
                        title={collection.title}
                        count={collection.productsCount}
                        isActive={activeHandle === collection.handle}
                    />
                ))}
            </ul>
        </nav>
    );
}

// Desktop Link Item
function CollectionLink({
    href,
    title,
    count,
    isActive,
    isSale = false
}: {
    href: string;
    title: string;
    count: number;
    isActive: boolean;
    isSale?: boolean;
}) {
    const displayCount = count >= 250 ? "250+" : count.toString();

    return (
        <li>
            <Link
                to={href}
                prefetch="viewport"
                viewTransition
                className={cn(
                    "group flex items-center gap-1 py-1 text-fluid-h4 motion-link hover:text-primary",
                    // SALE link gets emerald green styling to match discount badges
                    isSale
                        ? isActive
                            ? "text-sale-text font-semibold"
                            : "text-sale-text/80 hover:text-sale-text-hover"
                        : isActive
                          ? "text-primary font-semibold"
                          : "text-primary/80 hover:text-primary"
                )}
            >
                <span className="relative">
                    {title}
                    {/* Animated underline - scales from left on hover */}
                    <span
                        className={cn(
                            "absolute bottom-0 left-0 w-full h-px bg-current motion-link origin-left",
                            isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        )}
                    />
                </span>
                <sup className="text-xs ml-0.5">{displayCount}</sup>
            </Link>
        </li>
    );
}
