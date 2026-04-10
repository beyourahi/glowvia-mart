/**
 * @fileoverview Product Variant URL Utilities
 *
 * @description
 * Provides utilities for generating product variant URLs with selected options
 * as query parameters. Handles locale prefixes in URLs and constructs proper
 * product page links for variant selection.
 *
 * @architecture
 * Product variants are encoded in URLs as query parameters:
 * - /products/t-shirt?Color=Red&Size=Large
 * - This allows direct linking to specific variants
 * - Supports locale prefixes: /en-BD/products/t-shirt?Color=Red
 *
 * @dependencies
 * - react-router - For current location access
 * - @shopify/hydrogen - SelectedOption type
 *
 * @related
 * - ProductForm.tsx - Uses useVariantUrl for option selection
 * - ProductItem.tsx - Uses getVariantUrl for product links
 * - QuantitySelector.tsx - May use variant URLs
 *
 * @example
 * ```tsx
 * // Hook usage in components
 * const variantUrl = useVariantUrl('t-shirt', [{name: 'Color', value: 'Red'}]);
 *
 * // Function usage for manual URL construction
 * const url = getVariantUrl({
 *   handle: 't-shirt',
 *   pathname: '/en-BD/products/example',
 *   searchParams: new URLSearchParams(),
 *   selectedOptions: [{name: 'Color', value: 'Red'}]
 * });
 * ```
 */

import {useLocation} from "react-router";
import {useMemo} from "react";
import type {SelectedOption} from "@shopify/hydrogen/storefront-api-types";

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to generate a variant URL for the current product.
 *
 * Memoizes the URL calculation to prevent unnecessary re-renders.
 * Automatically detects locale prefix from current pathname.
 *
 * @param handle - Product handle (URL slug)
 * @param selectedOptions - Array of selected variant options
 *
 * @returns URL string with variant options as query params
 *
 * @example
 * ```tsx
 * const url = useVariantUrl('t-shirt', [
 *   {name: 'Color', value: 'Blue'},
 *   {name: 'Size', value: 'Medium'}
 * ]);
 * // Returns: "/products/t-shirt?Color=Blue&Size=Medium"
 * ```
 */
export function useVariantUrl(handle: string, selectedOptions?: SelectedOption[]) {
    const {pathname} = useLocation();

    // Memoize to avoid recomputing on every render when handle/selectedOptions haven't changed.
    // selectedOptions is serialized to a string key so the memo detects content changes.
    return useMemo(
        () =>
            getVariantUrl({
                handle,
                pathname,
                searchParams: new URLSearchParams(),
                selectedOptions
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [handle, pathname, JSON.stringify(selectedOptions)]
    );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Constructs a product variant URL with selected options as query parameters.
 *
 * Handles locale detection by checking for locale prefix pattern in pathname
 * (e.g., /en-BD/). Preserves locale prefix in generated URL.
 *
 * @param params.handle - Product handle (URL slug)
 * @param params.pathname - Current page pathname (for locale detection)
 * @param params.searchParams - Base search params to extend
 * @param params.selectedOptions - Variant options to encode
 *
 * @returns Complete URL path with query string
 *
 * @example
 * ```typescript
 * getVariantUrl({
 *   handle: 't-shirt',
 *   pathname: '/en-BD/products/other-product',
 *   searchParams: new URLSearchParams(),
 *   selectedOptions: [{name: 'Color', value: 'Red'}]
 * });
 * // Returns: "/en-BD/products/t-shirt?Color=Red"
 * ```
 */
export function getVariantUrl({
    handle,
    pathname,
    searchParams,
    selectedOptions
}: {
    handle: string;
    pathname: string;
    searchParams: URLSearchParams;
    selectedOptions?: SelectedOption[];
}) {
    const match = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
    const isLocalePathname = match && match.length > 0;

    const path = isLocalePathname ? `${match![0]}products/${handle}` : `/products/${handle}`;

    selectedOptions?.forEach(option => {
        searchParams.set(option.name, option.value);
    });

    const searchString = searchParams.toString();

    return path + (searchString ? "?" + searchParams.toString() : "");
}
