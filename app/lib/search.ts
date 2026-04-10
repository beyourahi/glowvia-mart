/**
 * @fileoverview Search Utilities for Storefront Search Features
 *
 * @description
 * Provides utility functions for the storefront search functionality.
 * Handles predictive search state management and URL construction
 * with Shopify's tracking parameters for search analytics.
 *
 * @architecture
 * Search flow in this storefront:
 * 1. User types in SearchFormPredictive → triggers predictive search API
 * 2. Results displayed in real-time dropdown (products, collections, articles)
 * 3. On submit → navigates to search results page with tracking params
 * 4. Full search page uses regular search with filtering/pagination
 *
 * @dependencies
 * - types - Search return types from global type definitions
 *
 * @related
 * - search.tsx - Search results route
 * - SearchFormPredictive.tsx - Predictive search input component
 * - FullScreenSearch.tsx - Full-screen search modal
 * - popularSearches.ts - Popular search terms extraction
 *
 * @tracking
 * Shopify tracking params enable:
 * - Search analytics in Shopify admin
 * - Conversion tracking for search results
 * - A/B testing capabilities
 */

import type {RegularSearchReturn, PredictiveSearchReturn, UrlWithTrackingParams} from "types";

export type {RegularSearchReturn, PredictiveSearchReturn};

// =============================================================================
// SEARCH STATE UTILITIES
// =============================================================================

/**
 * Returns the empty state of a predictive search result.
 *
 * Used to reset the search state when:
 * - User clears search input
 * - Search error occurs
 * - Initial component mount
 *
 * @returns Empty predictive search result structure
 */
export function getEmptyPredictiveSearchResult(): PredictiveSearchReturn["result"] {
    return {
        total: 0,
        items: {
            articles: [],
            collections: [],
            products: [],
            pages: [],
            queries: []
        }
    };
}

// =============================================================================
// URL CONSTRUCTION
// =============================================================================

/**
 * Appends tracking parameters to a search URL.
 *
 * Shopify tracking parameters enable:
 * - Search analytics in Shopify admin dashboard
 * - Conversion tracking from search to purchase
 * - Performance monitoring for search features
 *
 * @param params.baseUrl - The base URL for the search page
 * @param params.trackingParams - Shopify tracking query string
 * @param params.params - Additional query parameters (filters, etc.)
 * @param params.term - The search term (will be URL encoded)
 *
 * @returns Complete URL with all parameters
 *
 * @example
 * ```ts
 * const url = urlWithTrackingParams({
 *   baseUrl: '/search',
 *   trackingParams: 'utm_source=shopify',
 *   params: { type: 'product' },
 *   term: 'red shoes'
 * });
 * // Returns: '/search?type=product&q=red%20shoes&utm_source=shopify'
 * ```
 */
export function urlWithTrackingParams({baseUrl, trackingParams, params: extraParams, term}: UrlWithTrackingParams) {
    let search = new URLSearchParams({
        ...extraParams,
        q: encodeURIComponent(term)
    }).toString();

    if (trackingParams) {
        search = `${search}&${trackingParams}`;
    }

    return `${baseUrl}?${search}`;
}
