/**
 * @fileoverview Grid Column Layout Utilities for Responsive Product Grids (Edge-to-Edge Design)
 *
 * @description
 * Provides utilities for managing responsive product grid columns with screen size constraints
 * and validation. Ensures valid column counts based on device type with edge-to-edge design
 * supporting up to 6 columns on ultrawide displays.
 *
 * @architecture
 * Edge-to-Edge Responsive Grid Strategy (Hybrid Approach):
 * - Mobile (320px): 2-col fixed
 * - Small (640px): 3-col
 * - Medium (768px): 4-col
 * - Large (1024px): 5-col
 * - XL (1280px): 6-col
 * - 3XL (1921px+): 6-col (columns stretch to fill ultrawide)
 * - User can select 2-4 columns on desktop, grid adds columns automatically on larger screens
 *
 * Column Validation:
 * - getValidColumnsForScreenSize(): Returns allowed columns for screen
 * - constrainColumnsToScreenSize(): Adjusts invalid columns to nearest valid
 * - isColumnOptionVisible(): Checks if column button should show in UI
 *
 * Layout Modes:
 * - Grid: 1-4 column grid layouts
 * - List: Single column list layout (stacked items)
 *
 * @dependencies
 * - ~/hooks/useScreenSize - Screen size detection hook
 *
 * @related
 * - app/routes/collections.$handle.tsx - Collection grid with column controls
 * - app/routes/search.tsx - Search results grid
 * - app/hooks/useScreenSize.ts - Detects mobile/tablet/desktop
 */

import type {ScreenSize} from "~/hooks/useScreenSize";

export type GridColumns = 1 | 2 | 3 | 4;

/**
 * Returns valid grid column options for each screen size.
 *
 * - mobile: 2-col only
 * - tablet: 2-col only (3-col requires ≥1024px)
 * - desktop: 2-col, 3-col, 4-col
 */
export function getValidColumnsForScreenSize(screenSize: ScreenSize): GridColumns[] {
    switch (screenSize) {
        case "mobile":
            return [2];
        case "tablet":
            return [2];
        case "desktop":
        default:
            return [2, 3, 4];
    }
}

/**
 * Returns the default columns for a screen size.
 */
export function getDefaultColumnsForScreenSize(screenSize: ScreenSize): GridColumns {
    switch (screenSize) {
        case "mobile":
            return 2;
        case "tablet":
            return 2;
        case "desktop":
        default:
            return 3;
    }
}

/**
 * Adjusts columns to be valid for the current screen size.
 * Returns the closest valid option if current is invalid.
 */
export function constrainColumnsToScreenSize(columns: GridColumns, screenSize: ScreenSize): GridColumns {
    const validOptions = getValidColumnsForScreenSize(screenSize);

    // If current columns is valid, keep it
    if (validOptions.includes(columns)) {
        return columns;
    }

    // Find closest valid option
    const sorted = [...validOptions].sort((a, b) => Math.abs(a - columns) - Math.abs(b - columns));
    return sorted[0];
}

/**
 * Check if a column option should be shown for the current screen size.
 */
export function isColumnOptionVisible(option: GridColumns, screenSize: ScreenSize): boolean {
    return getValidColumnsForScreenSize(screenSize).includes(option);
}

/**
 * Get grid CSS class name based on columns and layout mode (Edge-to-Edge Design).
 *
 * Uses tighter responsive gaps for edge-to-edge design:
 * - gap-2 (8px) base
 * - gap-responsive sm+ (8px → 20px via clamp)
 *
 * Fixed Column Strategy:
 * - User-selected columns remain fixed across all breakpoints
 * - No automatic column addition on larger screens
 * - Columns stretch to fill available width at each breakpoint
 *
 * @param gridColumns - Number of columns (1-4) - user preference
 * @param layoutMode - "grid" for card layout, "list" for horizontal list
 *
 * @returns Tailwind class string for grid/flex layout
 */
export function getGridClassName(gridColumns: GridColumns, layoutMode: "grid" | "list"): string {
    if (layoutMode === "list") {
        return "flex flex-col gap-0 mb-8";
    }

    // Asymmetric responsive gaps: horizontal 8-20px, vertical 12-24px for clearer row separation
    const responsiveGap = "gap-x-responsive gap-y-responsive-lg";

    switch (gridColumns) {
        case 1:
            return `grid ${responsiveGap} grid-cols-1 mb-8`;
        case 2:
            return `grid ${responsiveGap} grid-cols-2 mb-8`;
        case 3:
            return `grid ${responsiveGap} grid-cols-3 mb-8`;
        case 4:
        default:
            return `grid ${responsiveGap} grid-cols-4 mb-8`;
    }
}
