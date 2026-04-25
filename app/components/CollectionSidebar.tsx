/**
 * @fileoverview Collection Sidebar Component
 *
 * @description
 * Desktop-only sticky navigation sidebar for collection pages, displaying a list of all
 * collections with product counts and highlighting the active collection. Includes special
 * "All Products" and "SALE" links.
 *
 * @components
 * - CollectionSidebar - Main navigation list (nav element)
 * - CollectionLink - Individual collection link with animated underline
 *
 * @features
 * - Sticky positioning (handled by parent CollectionPageLayout)
 * - Active collection highlighting with bold text and visible underline
 * - Hover animations: underline scales from left on hover
 * - Product count display as superscript (max 250+)
 * - Special SALE link with emerald green color (when discountCount > 0)
 * - "All Products" link shows total product count across collections
 * - Desktop only (md:block) - mobile uses different navigation pattern
 *
 * @props
 * CollectionSidebar:
 * - collections: CollectionWithCount[] - Array of collection objects
 * - activeHandle: string | "all-products" | "sale" - Currently active collection identifier
 * - totalProductCount: number - Total products for "All" link
 * - discountCount?: number - Count of discounted products (shows SALE link if > 0)
 *
 * CollectionLink (internal):
 * - href: string - Link destination
 * - title: string - Collection name
 * - count: number - Product count (displays as "250+" if ≥ 250)
 * - isActive: boolean - Whether this is the active collection
 * - isSale?: boolean - Whether this is the SALE link (for accent styling)
 *
 * @types
 * CollectionWithCount:
 * - handle: string - Collection handle (URL slug)
 * - title: string - Display name
 * - productsCount: number - Number of products in collection
 *
 * @styling
 * Link States:
 * - Default: text-primary/80 with opacity
 * - Hover: text-primary (full opacity) with underline animation
 * - Active: text-primary font-semibold with visible underline
 * - SALE variant: text-sale-text (emerald green) with same state pattern
 *
 * Underline Animation:
 * - Absolutely positioned 1px line
 * - Scales from left (origin-left) on hover
 * - Active: scale-x-100 (always visible)
 * - Inactive: scale-x-0, scales to 100 on hover
 * - Duration: 300ms ease-out
 *
 * Count Badge:
 * - Superscript (sup element) with text-sm
 * - Positioned with ml-0.5 after title
 * - Formats large counts as "250+"
 *
 * @layout
 * Sidebar is a simple vertical list (ul with space-y-1):
 * ```
 * All           (123)
 * SALE          (45)   <- Only if discountCount > 0
 * Collection 1  (20)
 * Collection 2  (15)
 * ...
 * ```
 *
 * Active collection has bold font and visible underline.
 * SALE link uses emerald green to match discount badges.
 *
 * @responsive
 * - Hidden on mobile (< md breakpoint)
 * - Visible on desktop (md:block)
 * - Parent (CollectionPageLayout) handles sticky positioning
 *
 * @dependencies
 * - react-router: Link component for navigation
 * - ~/lib/utils: cn utility for className merging
 *
 * @related
 * - CollectionPageLayout.tsx - Parent component that positions sidebar
 * - routes/collections.$handle.tsx - Uses sidebar for collection pages
 * - routes/collections.all-products.tsx - Uses sidebar with activeHandle="all-products"
 * - routes/sale.tsx - Uses sidebar with activeHandle="sale"
 *
 * @accessibility
 * - Semantic nav element for screen readers
 * - Proper link hierarchy with meaningful text
 * - Count information included in link text (not aria-label)
 * - Clear visual distinction for active state
 *
 * @architecture
 * This component is purely presentational and controlled by parent.
 * The parent provides all data and active state. Sidebar uses prefetch="viewport"
 * for optimistic collection loading when links enter viewport.
 *
 * Special links ("All", "SALE") are rendered first, followed by regular collections.
 * SALE link only appears when discountCount > 0 (conditional rendering).
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
