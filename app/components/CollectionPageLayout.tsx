/**
 * @fileoverview Collection Page Layout with sidebar, view options, and responsive grid.
 *
 * Shared by collections, all-products, and the sale page. Key design choices:
 * - Sort via URL params (server-side, SEO-friendly); grid columns + layout mode in localStorage
 * - Grid columns auto-constrain on resize (4-col → 3-col on tablet, etc.)
 * - `mapSortToCollectionSortKey` uses `CREATED`; `mapSortToProductSortKey` uses `CREATED_AT`
 *   (different field names across Collection vs root Products GraphQL queries)
 *
 * Exported hooks: `useResponsiveGridColumns`, `useLayoutMode`, `useSortOption`
 * Exported utilities: `mapSortToCollectionSortKey`, `mapSortToProductSortKey`
 *
 * @related
 * - CollectionSidebar.tsx - Sidebar navigation component
 * - routes/collections.$handle.tsx, routes/collections.all.tsx, routes/sale.tsx
 * - lib/gridColumns.ts - Grid column constraints
 */
import * as React from "react";
import {useSearchParams, useNavigate} from "react-router";
import {CollectionSidebar, type CollectionWithCount} from "~/components/CollectionSidebar";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {useScreenSize} from "~/hooks/useScreenSize";
import {useScrolled} from "~/lib/useScrolled";
import {
    type GridColumns,
    getValidColumnsForScreenSize,
    getDefaultColumnsForScreenSize,
    constrainColumnsToScreenSize,
    isColumnOptionVisible,
    getGridClassName
} from "~/lib/gridColumns";

export type {GridColumns};
export {getGridClassName};

interface CollectionPageLayoutProps {
    title: string;
    /** Collection description from Shopify (rendered below title) */
    description?: string;
    collections?: CollectionWithCount[];
    activeHandle: string | "all-products" | "sale";
    totalProductCount?: number;
    /** Number of products in the CURRENT collection (displayed as superscript next to title) */
    collectionProductCount?: number;
    discountCount?: number;
    /** Maximum discount percentage to display as badge next to title (only for sale page) */
    maxDiscount?: number;
    children: React.ReactNode;
    gridColumns: GridColumns;
    onGridColumnsChange: (columns: GridColumns) => void;
    sortOption: SortOption;
    onSortChange: (sort: SortOption) => void;
    layoutMode: LayoutMode;
    onLayoutModeChange: (mode: LayoutMode) => void;
    /** Whether to show sort options in ViewOptionsSelector. Default: true */
    showSortOptions?: boolean;
    /**
     * Optional pre-rendered sidebar content. When provided, renders in the sticky sidebar
     * div instead of <CollectionSidebar>. Use with <Suspense> + <Await> for deferred sidebar data.
     * When absent, falls back to the existing <CollectionSidebar> with collections/activeHandle/
     * totalProductCount/discountCount props.
     */
    sidebarSlot?: React.ReactNode;
}

export type SortOption = "title-asc" | "title-desc" | "price-asc" | "price-desc" | "newest" | "best-selling";
export type LayoutMode = "grid" | "list";

export function CollectionPageLayout({
    title,
    description,
    collections,
    activeHandle,
    totalProductCount,
    collectionProductCount,
    discountCount,
    maxDiscount,
    children,
    gridColumns,
    onGridColumnsChange,
    sortOption,
    onSortChange,
    layoutMode,
    onLayoutModeChange,
    showSortOptions = true,
    sidebarSlot
}: CollectionPageLayoutProps) {
    // Track scroll state to match header behavior
    // Header adds pt-3 (12px) when scrolled, sidebar needs to match this offset
    const isScrolled = useScrolled(0);

    return (
        /* Collection Page Root Container
           Margins provide consistent edge spacing across responsive breakpoints.
           PageLayout provides header clearance (pt-[--total-header-height]).
           This container adds breathing room to its first section (header) for
           visual comfort between header and content. Dense pages use extra
           breathing room for sidebar balance. */
        <div className="mx-2 sm:mx-3 md:mx-4 mb-4">
            {/* Page Header with Title and Description
                 - pt-(--page-breathing-room-dense): Breathing room from fixed header (40px → 96px)
                 - aligned with product grid via margin on desktop */}
            <header className="pt-(--page-breathing-room-dense) pb-6 sm:pb-8 md:pb-12 lg:pb-16 xl:pb-20 2xl:pb-24 md:ml-68 lg:ml-84 xl:ml-96 2xl:ml-104">
                <div className="flex flex-wrap items-baseline gap-x-3 sm:gap-x-4 gap-y-2">
                    {/* Fluid title sizing with product count superscript (matching full-screen menu style)
                         Title uses bold scale: text-4xl → md:text-6xl → lg:text-7xl → xl:text-8xl
                         break-words and hyphens-auto prevent overflow on long collection names
                         Product count positioned at top-right via transform translate */}
                    <div className="relative inline-block">
                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium text-primary tracking-tight m-0 wrap-break-word hyphens-auto">
                            {title}
                        </h1>
                        {/* Product count - positioned at top-right of title with small gap */}
                        {collectionProductCount !== undefined && collectionProductCount > 0 && (
                            <sup className="absolute top-0 left-[calc(100%+0.25rem)] sm:left-[calc(100%+0.5rem)] font-mono tabular-nums text-primary/60 text-xs sm:text-sm">
                                {collectionProductCount >= 250 ? "250+" : collectionProductCount}
                            </sup>
                        )}
                    </div>
                    {/* Discount badge - only shown when maxDiscount is provided and > 0 */}
                    {maxDiscount !== undefined && maxDiscount > 0 && (
                        <span className="font-sans text-xs sm:text-sm md:text-base font-medium text-primary/70 whitespace-nowrap">
                            upto {maxDiscount}% off
                        </span>
                    )}
                </div>
                {/* Collection description - renders Shopify collection description below title */}
                {description && (
                    <p className="mt-3 sm:mt-4 md:mt-6 font-sans text-sm sm:text-base md:text-lg lg:text-xl text-primary/70 max-w-prose leading-relaxed">
                        {description}
                    </p>
                )}
            </header>

            {/* Main Content Area - Sidebar and Grid
                 No additional top padding here - breathing room is on the header section above */}
            <div className="flex gap-4 sm:gap-8 lg:gap-12">
                {/* Desktop Sidebar - sticky, positioned below announcement + header dynamically
                     Sidebar positioning uses the same breathing room variable as page padding
                     for consistent alignment. When scrolled, header adds pt-3 (12px),
                     so sidebar adds matching offset to stay aligned.
                     - Base: --total-header-height + --page-breathing-room-dense
                     - Scrolled: +0.75rem (12px) to match header's pt-3 floating effect
                     - z-10 ensures sidebar stays below header (z-100) and announcement (z-101) */}
                <div className="hidden md:block w-60 lg:w-72 xl:w-80 2xl:w-88 shrink-0">
                    <div
                        className={cn(
                            "sticky z-10 transition-[top] duration-300 ease-out",
                            isScrolled
                                ? "top-[calc(var(--total-header-height)+0.75rem+var(--page-breathing-room-dense))]"
                                : "top-[calc(var(--total-header-height)+var(--page-breathing-room-dense))]"
                        )}
                    >
                        {sidebarSlot ?? (
                            <CollectionSidebar
                                collections={collections ?? []}
                                activeHandle={activeHandle}
                                totalProductCount={totalProductCount ?? 0}
                                discountCount={discountCount}
                            />
                        )}
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="flex-1 min-w-0">
                    {/* View Options Header - reduced margin for 320px */}
                    <div className="flex mb-4 sm:mb-6 md:justify-end">
                        <ViewOptionsSelector
                            gridColumns={gridColumns}
                            onGridColumnsChange={onGridColumnsChange}
                            sortOption={sortOption}
                            onSortChange={onSortChange}
                            layoutMode={layoutMode}
                            onLayoutModeChange={onLayoutModeChange}
                            showSortOptions={showSortOptions}
                        />
                    </div>

                    {/* Products Grid */}
                    {children}
                </div>
            </div>
        </div>
    );
}

// Pill option configuration
type PillOption =
    | {id: string; label: string; type: "sort"; value: SortOption}
    | {id: string; label: string; type: "grid"; value: GridColumns}
    | {id: string; label: string; type: "layout"; value: "list"};

const PILL_OPTIONS: PillOption[] = [
    // Sort options
    {id: "newest", label: "Newest", type: "sort", value: "newest"},
    {id: "best-selling", label: "Best Selling", type: "sort", value: "best-selling"},
    {id: "az", label: "A-Z", type: "sort", value: "title-asc"},
    {id: "za", label: "Z-A", type: "sort", value: "title-desc"},
    {id: "price-low", label: "Price ↑", type: "sort", value: "price-asc"},
    {id: "price-high", label: "Price ↓", type: "sort", value: "price-desc"},
    // Grid column options (4-col on desktop only)
    {id: "2col", label: "2-Col", type: "grid", value: 2},
    {id: "3col", label: "3-Col", type: "grid", value: 3},
    {id: "4col", label: "4-Col", type: "grid", value: 4},
    // Layout mode
    {id: "list", label: "List", type: "layout", value: "list"}
];

// View options props
interface ViewOptionsSelectorProps {
    gridColumns: GridColumns;
    onGridColumnsChange: (columns: GridColumns) => void;
    layoutMode: LayoutMode;
    onLayoutModeChange: (mode: LayoutMode) => void;
    sortOption?: SortOption;
    onSortChange?: (sort: SortOption) => void;
    showSortOptions?: boolean;
}

// View options - always visible pill selector (exported for reuse)
export function ViewOptionsSelector({
    gridColumns,
    onGridColumnsChange,
    sortOption,
    onSortChange,
    layoutMode,
    onLayoutModeChange,
    showSortOptions = true
}: ViewOptionsSelectorProps) {
    const {screenSize, isHydrated} = useScreenSize();

    // Handle pill click
    const handlePillClick = (option: PillOption) => {
        if (option.type === "sort" && onSortChange) {
            onSortChange(option.value);
        } else if (option.type === "grid") {
            // Switch to grid mode and set columns
            if (layoutMode === "list") {
                onLayoutModeChange("grid");
            }
            onGridColumnsChange(option.value);
        } else if (option.type === "layout") {
            // Toggle to list mode
            onLayoutModeChange("list");
        }
    };

    // Check if a pill is active
    const isPillActive = (option: PillOption): boolean => {
        if (option.type === "sort") {
            return sortOption === option.value;
        }
        if (option.type === "grid") {
            return layoutMode === "grid" && gridColumns === option.value;
        }
        if (option.type === "layout") {
            return layoutMode === "list";
        }
        return false;
    };

    // Separate options by type for grouped rendering
    const sortOptions = PILL_OPTIONS.filter(option => option.type === "sort");
    // Filter grid options based on screen size (show desktop options before hydration for SSR consistency)
    const gridOptions = PILL_OPTIONS.filter(option => {
        if (option.type !== "grid") return false;
        // SSR/pre-hydration: show desktop options to match server render
        if (!isHydrated) return [2, 3, 4].includes(option.value);
        // Post-hydration: filter based on actual screen size
        return isColumnOptionVisible(option.value, screenSize);
    });
    const layoutOptions = PILL_OPTIONS.filter(option => option.type === "layout");

    // Render a pill button with proper touch targets
    const renderPill = (option: PillOption) => {
        const isActive = isPillActive(option);
        return (
            <Button
                key={option.id}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handlePillClick(option)}
                className={cn(
                    "whitespace-nowrap font-sans text-sm sm:text-sm md:text-base",
                    "transition-all duration-300 ease-out"
                )}
            >
                {option.label}
            </Button>
        );
    };

    return (
        <>
            {/* Mobile: Horizontal scrollable carousel - reduced gap for 320px */}
            <div className="md:hidden overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1.5 sm:gap-2 snap-x snap-mandatory">
                    {/* Sort options */}
                    {showSortOptions &&
                        sortOptions.map(option => (
                            <div key={option.id} className="snap-start">
                                {renderPill(option)}
                            </div>
                        ))}
                    {/* Visual separator on mobile when sort shown */}
                    {showSortOptions && <div className="w-px h-6 bg-primary/20 shrink-0" aria-hidden="true" />}
                    {/* Grid and layout options */}
                    {gridOptions.map(option => (
                        <div key={option.id} className="snap-start">
                            {renderPill(option)}
                        </div>
                    ))}
                    {layoutOptions.map(option => (
                        <div key={option.id} className="snap-start">
                            {renderPill(option)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop: Original flex-wrap layout */}
            <div className="hidden md:flex flex-wrap items-center justify-end gap-3">
                {/* Sort options group */}
                {showSortOptions && <div className="flex items-center gap-2">{sortOptions.map(renderPill)}</div>}

                {/* Visual separator when both groups shown */}
                {showSortOptions && <div className="w-px h-6 bg-primary/20" aria-hidden="true" />}

                {/* Grid and layout options group */}
                <div className="flex items-center gap-2">
                    {gridOptions.map(renderPill)}
                    {layoutOptions.map(renderPill)}
                </div>
            </div>
        </>
    );
}

/**
 * Hook to manage grid columns with:
 * - localStorage persistence
 * - Responsive constraints (auto-switch when screen resizes)
 * - SSR safety
 */
export function useResponsiveGridColumns(
    storageKey: string = "collection-grid-columns"
): [GridColumns, (columns: GridColumns) => void] {
    const {screenSize, isHydrated} = useScreenSize();

    // SSR-safe default: 3 columns (matches desktop)
    const [columns, setColumns] = React.useState<GridColumns>(3);
    // Store raw user preference separately (may be invalid for current screen)
    const [rawPreference, setRawPreference] = React.useState<GridColumns | null>(null);

    // Load from localStorage on mount
    React.useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored && ["1", "2", "3", "4"].includes(stored)) {
            setRawPreference(parseInt(stored) as GridColumns);
        }
    }, [storageKey]);

    // Compute effective columns based on screen size constraints
    React.useEffect(() => {
        if (!isHydrated) return;

        // Use stored preference or screen-appropriate default
        const preference = rawPreference ?? getDefaultColumnsForScreenSize(screenSize);
        // Constrain to valid options for current screen size
        const constrained = constrainColumnsToScreenSize(preference, screenSize);
        setColumns(constrained);
    }, [screenSize, rawPreference, isHydrated]);

    const updateColumns = (newColumns: GridColumns) => {
        // Store raw preference (user's actual choice)
        setRawPreference(newColumns);
        localStorage.setItem(storageKey, newColumns.toString());

        // Update current columns (constrained for current screen)
        const constrained = constrainColumnsToScreenSize(newColumns, screenSize);
        setColumns(constrained);
    };

    return [columns, updateColumns];
}

/** @deprecated Use useResponsiveGridColumns instead */
export function useGridColumns(
    storageKey: string = "collection-grid-columns"
): [GridColumns, (columns: GridColumns) => void] {
    return useResponsiveGridColumns(storageKey);
}

/** @deprecated Use getDefaultColumnsForScreenSize from ~/lib/gridColumns instead */
export function getResponsiveDefaultColumns(): 2 | 3 {
    if (typeof window === "undefined") return 3;
    return window.innerWidth >= 768 ? 3 : 2;
}

// Hook to manage layout mode with localStorage persistence
export function useLayoutMode(storageKey: string = "collection-layout-mode"): [LayoutMode, (mode: LayoutMode) => void] {
    const [mode, setMode] = React.useState<LayoutMode>("grid");

    React.useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored === "grid" || stored === "list") {
            setMode(stored);
        }
    }, [storageKey]);

    const updateMode = (newMode: LayoutMode) => {
        setMode(newMode);
        localStorage.setItem(storageKey, newMode);
    };

    return [mode, updateMode];
}

// Valid sort options for URL validation
const VALID_SORT_OPTIONS: SortOption[] = ["title-asc", "title-desc", "price-asc", "price-desc", "newest", "best-selling"];

// Hook to manage sort option with URL params for server-side sorting
export function useSortOption(defaultSort: SortOption = "newest"): [SortOption, (sort: SortOption) => void] {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get current sort from URL or use default (URL stores UI sort option directly)
    const sortParam = searchParams.get("sort");
    const currentSort: SortOption =
        sortParam && VALID_SORT_OPTIONS.includes(sortParam as SortOption) ? (sortParam as SortOption) : defaultSort;

    const setSort = (newSort: SortOption) => {
        const params = new URLSearchParams(searchParams);
        if (newSort === "newest") {
            // Remove sort params for default (clean URL)
            params.delete("sort");
            params.delete("reverse");
        } else {
            params.set("sort", newSort);
            params.delete("reverse"); // reverse is encoded in sort option name
        }
        params.delete("cursor"); // Reset pagination on sort change
        void navigate(`?${params.toString()}`, {preventScrollReset: false});
    };

    return [currentSort, setSort];
}

// Map UI sort option to GraphQL sortKey for Collection products
export function mapSortToCollectionSortKey(sort: string): {sortKey: string; reverse: boolean} {
    switch (sort) {
        case "title-asc":
            return {sortKey: "TITLE", reverse: false};
        case "title-desc":
            return {sortKey: "TITLE", reverse: true};
        case "price-asc":
            return {sortKey: "PRICE", reverse: false};
        case "price-desc":
            return {sortKey: "PRICE", reverse: true};
        case "best-selling":
            return {sortKey: "BEST_SELLING", reverse: false};
        case "newest":
        default:
            return {sortKey: "CREATED", reverse: true};
    }
}

// Map UI sort option to GraphQL sortKey for root Products query (All Products page)
export function mapSortToProductSortKey(sort: string): {sortKey: string; reverse: boolean} {
    switch (sort) {
        case "title-asc":
            return {sortKey: "TITLE", reverse: false};
        case "title-desc":
            return {sortKey: "TITLE", reverse: true};
        case "price-asc":
            return {sortKey: "PRICE", reverse: false};
        case "price-desc":
            return {sortKey: "PRICE", reverse: true};
        case "best-selling":
            return {sortKey: "BEST_SELLING", reverse: false};
        case "newest":
        default:
            return {sortKey: "CREATED_AT", reverse: true};
    }
}
