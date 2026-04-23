/**
 * Sort and filter helpers for collection and search routes.
 *
 * Collection pages use ProductCollectionSortKeys; search uses SearchSortKeys
 * (only PRICE and RELEVANCE are valid). Each surface has its own options set.
 */

export type SortOption = {
    /** Value stored in the URL `?sort=` param */
    value: string;
    /** Human-readable label */
    label: string;
    /** Shopify sort key enum value (varies by API surface) */
    sortKey: string;
    /** Whether results are reversed (descending) */
    reverse: boolean;
};

/** Ordered list of sort options displayed in the dropdown. */
export const SORT_OPTIONS: SortOption[] = [
    {value: "price-asc", label: "Price: Low to High", sortKey: "PRICE", reverse: false},
    {value: "price-desc", label: "Price: High to Low", sortKey: "PRICE", reverse: true},
    {value: "newest", label: "Newest", sortKey: "CREATED", reverse: true},
    {value: "best-selling", label: "Best Selling", sortKey: "BEST_SELLING", reverse: false},
    {value: "title-asc", label: "A → Z", sortKey: "TITLE", reverse: false},
    {value: "title-desc", label: "Z → A", sortKey: "TITLE", reverse: true}
];

/** Default sort when no `?sort=` param is present */
export const DEFAULT_SORT = "newest";

/**
 * Look up a SortOption by its URL value, falling back to the default.
 */
export function getSortOption(sortParam: string | null): SortOption {
    const match = SORT_OPTIONS.find(option => option.value === sortParam);
    return match ?? SORT_OPTIONS.find(option => option.value === DEFAULT_SORT)!;
}

/**
 * Parse sort and filter params from a request URL.
 */
export function parseSortFilterParams(url: URL) {
    const sortParam = url.searchParams.get("sort");
    const sortOption = getSortOption(sortParam);

    return {
        sort: sortOption.value,
        sortKey: sortOption.sortKey,
        reverse: sortOption.reverse,
        sortLabel: sortOption.label
    };
}

/**
 * Sort options for search pages.
 * Shopify's SearchSortKeys enum only supports PRICE and RELEVANCE —
 * no CREATED_AT, BEST_SELLING, or TITLE.
 */
export const SEARCH_SORT_OPTIONS: SortOption[] = [
    {value: "relevance", label: "Relevance", sortKey: "RELEVANCE", reverse: false},
    {value: "price-asc", label: "Price: Low to High", sortKey: "PRICE", reverse: false},
    {value: "price-desc", label: "Price: High to Low", sortKey: "PRICE", reverse: true}
];

/** Default sort for search pages (no `?sort=` param = relevance). */
export const SEARCH_DEFAULT_SORT = "relevance";

/**
 * Look up a search SortOption by its URL value, falling back to relevance.
 */
export function getSearchSortOption(sortParam: string | null): SortOption {
    const match = SEARCH_SORT_OPTIONS.find(option => option.value === sortParam);
    return match ?? SEARCH_SORT_OPTIONS.find(option => option.value === SEARCH_DEFAULT_SORT)!;
}
