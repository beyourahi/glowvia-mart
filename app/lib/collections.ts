/**
 * @fileoverview Collection Categorization and Tab Building Utilities
 *
 * @description
 * Provides utilities for categorizing Shopify collections and building
 * tab-based navigation for curated collection displays. Uses pattern matching
 * on collection handles to identify collection categories (bestsellers, new arrivals, etc.)
 * with intelligent fallback support for missing or empty collections.
 *
 * @architecture
 * Collection categorization flow:
 * 1. Collections fetched from Shopify with their handles
 * 2. Pattern matching determines category (bestsellers, new arrivals, featured)
 * 3. Tab builder creates UI tabs with fallback to other collections if primary missing
 * 4. Each tab includes the collection data ready for display
 *
 * @business-logic
 * - Collections are matched by handle patterns (case-insensitive, flexible matching)
 * - Empty collections (no products) are excluded from tabs
 * - If a primary category collection is missing, substitutes with next available
 * - Tab labels update to show actual collection title when using fallback
 *
 * @dependencies
 * - types - CollectionCategory, CollectionNode, TabConfig type definitions
 *
 * @related
 * - CuratedCollections.tsx - Primary consumer of buildCollectionTabs
 * - _index.tsx (homepage) - Displays curated collection tabs
 *
 * @example
 * ```tsx
 * // Build tabs from fetched collections
 * const tabs = buildCollectionTabs(allCollections);
 *
 * // Render tab navigation
 * {tabs.map(tab => (
 *   <Tab key={tab.key} label={tab.label}>
 *     <ProductGrid products={tab.collection.products.nodes} />
 *   </Tab>
 * ))}
 * ```
 */

import type {CollectionCategory, CollectionNode, TabConfig} from "types";
import {sortWithPinnedFirst} from "~/lib/product-tags";

// =============================================================================
// PATTERN MATCHING CONFIGURATION
// =============================================================================

/**
 * Collection handle patterns for category matching.
 *
 * Each category has multiple possible handle patterns to support
 * different naming conventions across Shopify stores.
 * Pattern matching is case-insensitive and uses includes() for flexibility
 * (e.g., "my-best-sellers-2024" matches "best-sellers").
 */
export const COLLECTION_PATTERNS = {
    bestSellers: [
        "best-sellers",
        "bestsellers",
        "best-seller",
        "bestseller",
        "top-sellers",
        "top-selling",
        "most-popular"
    ],
    newArrivals: [
        "new-arrivals",
        "newarrivals",
        "new-arrival",
        "newarrival",
        "new",
        "latest",
        "just-in",
        "fresh-arrivals"
    ],
    featured: [
        "featured",
        "feature",
        "featured-products",
        "featured-items",
        "staff-picks",
        "editors-choice",
        "spotlight"
    ]
} as const;

export type {CollectionCategory, TabConfig};

/**
 * Matches a collection handle to a category based on pattern matching.
 * Uses includes() for flexible matching (e.g., "my-best-sellers-2024" matches "best-sellers")
 */
export function matchCollectionCategory(handle: string): CollectionCategory | null {
    const normalizedHandle = handle.toLowerCase();

    for (const [category, patterns] of Object.entries(COLLECTION_PATTERNS)) {
        if (patterns.some(pattern => normalizedHandle.includes(pattern))) {
            return category as CollectionCategory;
        }
    }
    return null;
}

/**
 * Finds a collection matching the given category with at least one product.
 */
export function findCollectionByCategory<T extends CollectionNode>(
    collections: T[],
    category: CollectionCategory
): T | null {
    return (
        collections.find(col => matchCollectionCategory(col.handle) === category && col.products.nodes.length > 0) ||
        null
    );
}

/**
 * Default tab configuration for the curated collections section
 */
export const DEFAULT_TABS: Array<{
    category: CollectionCategory;
    config: TabConfig;
}> = [
    {category: "featured", config: {key: "featured", label: "Featured"}},
    {category: "newArrivals", config: {key: "new-arrivals", label: "New Arrivals"}},
    {category: "bestSellers", config: {key: "best-sellers", label: "Best Sellers"}}
];

/**
 * Processes collections and returns tab data with intelligent fallbacks.
 * If a primary collection is missing/empty, substitutes with another available collection.
 */
export function buildCollectionTabs<T extends CollectionNode>(allCollections: T[]): Array<TabConfig & {collection: T}> {
    // Filter to only collections with products
    const validCollections = allCollections.filter(col => col.products.nodes.length > 0);

    // Find primary collections for each category
    const primaryCollections = new Map<CollectionCategory, T | null>();
    for (const {category} of DEFAULT_TABS) {
        primaryCollections.set(category, findCollectionByCategory(validCollections, category));
    }

    // Track selected collection IDs to avoid duplicates
    const selectedIds = new Set<string>();
    for (const collection of primaryCollections.values()) {
        if (collection) {
            selectedIds.add(collection.id);
        }
    }

    // Get fallback collections (not already selected)
    const fallbacks = validCollections.filter(c => !selectedIds.has(c.id));

    // Build final tabs with fallbacks
    const tabs: Array<TabConfig & {collection: T}> = [];

    for (const {category, config} of DEFAULT_TABS) {
        let collection = primaryCollections.get(category);

        // Use fallback if primary is missing
        if (!collection && fallbacks.length > 0) {
            collection = fallbacks.shift()!;
            selectedIds.add(collection.id);
        }

        if (collection) {
            // Sort products with pinned first for homepage curated collections
            // Type assertion needed because CollectionNode generic can have varying product types
            const sortedCollection = {
                ...collection,
                products: {
                    ...collection.products,
                    nodes: sortWithPinnedFirst(collection.products.nodes as any)
                }
            };

            tabs.push({
                ...config,
                // Use collection title as label when using fallback
                label: primaryCollections.get(category) === collection ? config.label : collection.title,
                collection: sortedCollection
            });
        }
    }

    return tabs;
}
