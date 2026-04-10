/**
 * @fileoverview Product Tag Detection and Management Utilities
 *
 * @description
 * Centralized system for detecting special product tags used for badges, sorting,
 * and UI modifications. Handles tag normalization to support various spelling
 * variations (hyphenated, spaced, case differences).
 *
 * @features
 * - Case-insensitive tag matching with normalization
 * - Support for spelling variations (pre-order, preorder, pre order)
 * - Configurable tag definitions for each special tag type
 * - Filter function to hide special tags from product pages
 * - Type-safe exports with TypeScript
 *
 * @special-tags
 * - pin: Products pinned to top of collections (shows pin icon, not badge)
 * - premium: Premium/luxury products (shows Premium badge)
 * - preorder: Pre-order products (shows Pre-Order badge, changes button label)
 * - newArrival: New products (shows New badge)
 * - clearance: Clearance/sale products (shows Clearance badge)
 *
 * @usage
 * ```tsx
 * import { hasSpecialTag, getSpecialTags, filterDisplayTags } from '~/lib/product-tags';
 *
 * // Check single tag type
 * if (hasSpecialTag(product.tags, 'preorder')) {
 *   buttonLabel = 'Pre Order';
 * }
 *
 * // Get all special tags for a product
 * const specialTags = getSpecialTags(product.tags);
 * if (specialTags.isPinned) { ... }
 *
 * // Filter out special tags for display
 * const displayTags = filterDisplayTags(product.tags);
 * ```
 *
 * @related
 * - ProductItem.tsx - Uses for badge display
 * - QuickAddButton.tsx - Uses for preorder button label
 * - CollectionPageLayout.tsx - Uses for pin sorting
 */

// =============================================================================
// TAG CONFIGURATION
// =============================================================================

/**
 * Tag variations for each special tag type.
 * All variations are normalized (lowercase, no hyphens/spaces/special chars)
 * during matching, so these should be the normalized forms.
 *
 * @example
 * "Pre-Order" → normalized to "preorder" → matches TAG_CONFIG.preorder
 * "NEW ARRIVAL" → normalized to "newarrival" → matches TAG_CONFIG.newArrival
 */
export const TAG_CONFIG = {
    /**
     * Pin tag - Products pinned to top of collections
     * UI: Shows pin icon at top-left corner (not a badge)
     * Sorting: Always appears first in collection, before other sort rules
     */
    pin: ["pin", "pinned", "pinproduct", "featuredpin"],

    /**
     * Premium tag - High-end/luxury products
     * UI: Shows "Premium" badge with muted styling
     */
    premium: ["premium", "premiums", "premiumproduct"],

    /**
     * Preorder tag - Products available for pre-order
     * UI: Shows "Pre-Order" badge
     * Button: Changes "Get it now" to "Pre Order"
     */
    preorder: ["preorder", "preorders"],

    /**
     * New Arrival tag - Recently added products
     * UI: Shows "New" badge with accent styling
     */
    newArrival: ["newarrival", "new", "newproduct", "newarrivals"],

    /**
     * Clearance tag - Products on clearance sale
     * UI: Shows "Clearance" badge with subtle destructive styling
     */
    clearance: ["clearance", "clearances", "clearancesale", "sale", "onsale"]
} as const;

/**
 * Type for special tag keys
 */
export type SpecialTagType = keyof typeof TAG_CONFIG;

/**
 * Display configuration for each badge type
 * Used by ProductBadge component for rendering
 */
export const BADGE_CONFIG: Record<
    Exclude<SpecialTagType, "pin">,
    {label: string; className: string; ariaLabel: string}
> = {
    premium: {
        label: "Premium",
        // Muted dark background with good contrast
        // secondary on secondary-foreground = 15.42:1 (WCAG AAA) ✓
        className: "bg-secondary text-secondary-foreground",
        ariaLabel: "Premium product"
    },
    preorder: {
        label: "Pre-Order",
        // Muted background for subtle appearance
        // muted-foreground on muted = 5.32:1 (WCAG AA) ✓
        className: "bg-muted text-muted-foreground",
        ariaLabel: "Available for pre-order"
    },
    newArrival: {
        label: "New",
        // Accent background with white text
        // accent-foreground on accent = 5.74:1 (WCAG AA) ✓
        className: "bg-accent text-accent-foreground",
        ariaLabel: "New arrival"
    },
    clearance: {
        label: "Clearance",
        // Subtle red tint without being alarming
        // Uses destructive color at reduced opacity for softer appearance
        // Maintains readability with foreground text
        className: "bg-destructive/20 text-foreground",
        ariaLabel: "Clearance item"
    }
};

// =============================================================================
// TAG NORMALIZATION
// =============================================================================

/**
 * Normalize a tag string for comparison.
 * Removes all non-alphanumeric characters and converts to lowercase.
 *
 * @param tag - Raw tag string from Shopify
 * @returns Normalized tag string
 *
 * @example
 * normalizeTag("Pre-Order") → "preorder"
 * normalizeTag("NEW ARRIVAL") → "newarrival"
 * normalizeTag("clearance-sale") → "clearancesale"
 */
export function normalizeTag(tag: string): string {
    return tag.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// =============================================================================
// TAG DETECTION FUNCTIONS
// =============================================================================

/**
 * Check if a product has a specific special tag.
 *
 * @param tags - Array of product tags from Shopify
 * @param tagType - Type of special tag to check for
 * @returns true if product has the specified tag type
 *
 * @example
 * const tags = ['Pre-Order', 'Fragrance', 'Women'];
 * hasSpecialTag(tags, 'preorder'); // true
 * hasSpecialTag(tags, 'premium');  // false
 */
export function hasSpecialTag(tags: string[] | undefined | null, tagType: SpecialTagType): boolean {
    if (!tags || tags.length === 0) return false;

    const variations = TAG_CONFIG[tagType];
    const normalizedProductTags = tags.map(normalizeTag);

    return variations.some(variation => normalizedProductTags.includes(variation));
}

/**
 * Result of getSpecialTags() function.
 * Contains boolean flags for each special tag type.
 */
export interface SpecialTagInfo {
    /** Product is pinned to top of collection */
    isPinned: boolean;
    /** Product is marked as premium */
    isPremium: boolean;
    /** Product is available for pre-order */
    isPreorder: boolean;
    /** Product is a new arrival */
    isNewArrival: boolean;
    /** Product is on clearance */
    isClearance: boolean;
    /** Array of badge types to display (excludes 'pin') */
    badgeTypes: Exclude<SpecialTagType, "pin">[];
}

/**
 * Get all special tag information for a product.
 * Returns structured object with boolean flags and badge list.
 *
 * @param tags - Array of product tags from Shopify
 * @returns SpecialTagInfo object with all tag states
 *
 * @example
 * const tags = ['Premium', 'New Arrival', 'Luxury'];
 * const info = getSpecialTags(tags);
 * // {
 * //   isPinned: false,
 * //   isPremium: true,
 * //   isPreorder: false,
 * //   isNewArrival: true,
 * //   isClearance: false,
 * //   badgeTypes: ['premium', 'newArrival']
 * // }
 */
export function getSpecialTags(tags: string[] | undefined | null): SpecialTagInfo {
    const isPinned = hasSpecialTag(tags, "pin");
    const isPremium = hasSpecialTag(tags, "premium");
    const isPreorder = hasSpecialTag(tags, "preorder");
    const isNewArrival = hasSpecialTag(tags, "newArrival");
    const isClearance = hasSpecialTag(tags, "clearance");

    // Collect badge types (pin doesn't get a badge, it gets an icon)
    const badgeTypes: Exclude<SpecialTagType, "pin">[] = [];
    if (isPremium) badgeTypes.push("premium");
    if (isPreorder) badgeTypes.push("preorder");
    if (isNewArrival) badgeTypes.push("newArrival");
    if (isClearance) badgeTypes.push("clearance");

    return {
        isPinned,
        isPremium,
        isPreorder,
        isNewArrival,
        isClearance,
        badgeTypes
    };
}

// =============================================================================
// TAG FILTERING
// =============================================================================

/**
 * All tag variations that should be hidden from product page display.
 * Pre-computed for efficiency.
 */
const ALL_SPECIAL_TAG_VARIATIONS = new Set(Object.values(TAG_CONFIG).flat().map(normalizeTag));

/**
 * Filter out special tags from display on product pages.
 * Returns only regular tags that should be visible to customers.
 *
 * @param tags - Array of product tags from Shopify
 * @returns Filtered array without special system tags
 *
 * @example
 * const tags = ['Pre-Order', 'Fragrance', 'Women', 'Premium'];
 * filterDisplayTags(tags);
 * // ['Fragrance', 'Women'] - special tags removed
 */
export function filterDisplayTags(tags: string[] | undefined | null): string[] {
    if (!tags || tags.length === 0) return [];

    return tags.filter(tag => {
        const normalized = normalizeTag(tag);
        return !ALL_SPECIAL_TAG_VARIATIONS.has(normalized);
    });
}

// =============================================================================
// BUTTON LABEL HELPER
// =============================================================================

/**
 * Get the appropriate add-to-cart button label based on product tags.
 * Returns "Pre Order" for preorder products, otherwise returns the default.
 *
 * @param tags - Array of product tags from Shopify
 * @param defaultLabel - Label to use for non-preorder products
 * @returns Appropriate button label
 *
 * @example
 * getButtonLabel(['Pre-Order'], 'Get it now'); // "Pre Order"
 * getButtonLabel(['Premium'], 'Get it now');   // "Get it now"
 */
export function getButtonLabel(tags: string[] | undefined | null, defaultLabel: string = "Get it now"): string {
    return hasSpecialTag(tags, "preorder") ? "Pre Order" : defaultLabel;
}

// =============================================================================
// SORTING UTILITIES
// =============================================================================

/**
 * Generic product type for sorting - requires tags array
 */
interface ProductWithTags {
    tags?: string[] | null;
    [key: string]: unknown;
}

/**
 * Sort products with pinned products first, then apply secondary sort.
 *
 * **CRITICAL**: Pinned products get HIGHEST PRECEDENCE over all sorting options.
 * They appear first, AND they are also sorted by the secondary criteria among themselves.
 *
 * This ensures that:
 * 1. Pinned products ALWAYS appear at the top (highest precedence)
 * 2. Among pinned products, the user's sort choice is respected
 * 3. Among non-pinned products, the user's sort choice is respected
 *
 * @param products - Array of products to sort
 * @param secondarySort - Optional comparator applied to BOTH pinned and non-pinned groups
 * @returns New sorted array (does not mutate original)
 *
 * @example
 * // User selects "Price: Low to High"
 * // Before: [{$50, pin}, {$30, pin}, {$20}]
 * // After:  [{$30, pin}, {$50, pin}, {$20}]
 * const sorted = sortWithPinnedFirst(products, (a, b) =>
 *   parseFloat(a.priceRange.minVariantPrice.amount) -
 *   parseFloat(b.priceRange.minVariantPrice.amount)
 * );
 *
 * @example
 * // No secondary sort: maintains Shopify's default order within each group
 * const sorted = sortWithPinnedFirst(products);
 * // Result: [pinned (in Shopify order), unpinned (in Shopify order)]
 */
export function sortWithPinnedFirst<T extends ProductWithTags>(
    products: T[],
    secondarySort?: (a: T, b: T) => number
): T[] {
    // Sort products using a comparator that prioritizes pins FIRST,
    // then applies secondary sort within each group
    return [...products].sort((a, b) => {
        // Check if products have pin tags (case-insensitive, direct check)
        const aHasPin = a.tags?.some(tag => normalizeTag(tag) === "pin" || normalizeTag(tag) === "pinned");
        const bHasPin = b.tags?.some(tag => normalizeTag(tag) === "pin" || normalizeTag(tag) === "pinned");

        // Pin precedence: pinned products always come first
        if (aHasPin && !bHasPin) return -1;
        if (!aHasPin && bHasPin) return 1;

        // If both pinned or both not pinned, apply secondary sort
        if (secondarySort) {
            return secondarySort(a, b);
        }

        // No secondary sort: maintain original order
        return 0;
    });
}
