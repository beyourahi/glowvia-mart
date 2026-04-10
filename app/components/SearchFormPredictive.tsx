/**
 * @fileoverview Predictive search form with live results via fetcher
 *
 * @description
 * SearchFormPredictive is an enhanced search form that fetches live search results
 * as the user types. Uses React Router's useFetcher for non-navigating data fetching.
 * Provides callbacks for result fetching and navigation to full search page.
 *
 * @features
 * - Live predictive search results as user types
 * - Non-blocking fetcher for background data loading
 * - Enter key navigates to full search page
 * - Automatic input type="search" enforcement
 * - Render prop pattern for flexible UI
 * - Closes aside overlay on navigation
 * - Form reset on submit to prevent navigation
 *
 * @props
 * - children: Render function receiving {inputRef, fetcher, fetchResults, goToSearch}
 * - className: CSS classes for form element (defaults to sticky positioning)
 * - ...props: Additional form props
 *
 * @architecture
 * Uses React Router fetcher for:
 * - Non-navigating data fetching (stays on current page)
 * - Background loading state management
 * - Automatic request deduplication
 * - Optimistic UI updates
 *
 * Render prop provides:
 * - inputRef: For input element binding
 * - fetcher: Fetcher state (data, state, Form)
 * - fetchResults: Callback to trigger search
 * - goToSearch: Navigate to full search page
 *
 * @related
 * - routes/search.tsx - Handles search requests and returns predictive results
 * - FullScreenSearch.tsx - Uses SearchFormPredictive for search overlay
 * - SearchResults.tsx - Displays predictive search results
 * - PredictiveSearchResult.tsx - Individual result components
 *
 * @example
 * ```tsx
 * <SearchFormPredictive>
 *   {({inputRef, fetcher, fetchResults, goToSearch}) => (
 *     <>
 *       <input
 *         ref={inputRef}
 *         name="q"
 *         onChange={fetchResults}
 *         placeholder="Search..."
 *       />
 *       <SearchResults results={fetcher.data} />
 *     </>
 *   )}
 * </SearchFormPredictive>
 * ```
 */

import {useFetcher, useNavigate, type Fetcher} from "react-router";
import React, {useRef, useEffect} from "react";
import type {PredictiveSearchReturn, SearchFormPredictiveProps} from "types";
import {useAside} from "./Aside";

// ================================================================================
// Constants
// ================================================================================

/**
 * SEARCH_ENDPOINT - Route for search requests
 * Used for both predictive fetcher and full search navigation
 */
export const SEARCH_ENDPOINT = "/search";

// ================================================================================
// Predictive Search Form Component
// ================================================================================

/**
 * SearchFormPredictive - Search form with live predictive results
 *
 * Provides a search form that fetches predictive results as the user types.
 * Enter key navigates to full search page. Form submission is prevented to
 * avoid navigation (use goToSearch callback instead).
 *
 * Fetcher configuration:
 * - key: "search" - Deduplicates concurrent search requests
 * - Method: GET with query params
 * - Limit: 5 results (configurable in fetchResults)
 * - predictive: true flag for server-side filtering
 *
 * @param children - Render function with {inputRef, fetcher, fetchResults, goToSearch}
 * @param className - CSS classes (default: sticky top positioning)
 * @param props - Additional form props
 * @returns null if children is not a function, otherwise Form element
 */
export function SearchFormPredictive({
    children,
    className = "bg-background sticky top-0",
    ...props
}: SearchFormPredictiveProps) {
    const fetcher = useFetcher<PredictiveSearchReturn>({key: "search"});
    const inputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();
    const aside = useAside();

    /**
     * resetInput - Prevents form submission navigation
     *
     * Form submit is prevented because we handle navigation via goToSearch callback.
     * This allows Enter key to be handled by parent component (FullScreenSearch).
     *
     * @param event - Form submit event
     */
    function resetInput(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        event.stopPropagation();
        if (inputRef?.current?.value) {
            inputRef.current.blur();
        }
    }

    /**
     * goToSearch - Navigate to full search page with current query
     *
     * Reads current input value, navigates to /search with query param,
     * and closes any open aside overlay (search, cart, mobile menu).
     */
    function goToSearch() {
        const term = inputRef?.current?.value;
        void navigate(SEARCH_ENDPOINT + (term ? `?q=${term}` : ""));
        aside.close();
    }

    /**
     * fetchResults - Trigger predictive search fetch
     *
     * Fetches search results via fetcher.submit() with:
     * - q: Search query from input value
     * - limit: 5 results (predictive preview)
     * - predictive: true flag for server filtering
     *
     * Uses GET method to /search endpoint.
     * Fetcher automatically handles loading state and deduplication.
     *
     * @param event - Input change event
     */
    function fetchResults(event: React.ChangeEvent<HTMLInputElement>) {
        void fetcher.submit(
            {q: event.target.value || "", limit: 5, predictive: true},
            {method: "GET", action: SEARCH_ENDPOINT}
        );
    }

    /**
     * Enforce input type="search"
     *
     * SearchResults component uses querySelector('input[type="search"]') to find
     * the input element. This effect ensures the input always has type="search"
     * regardless of what the parent component sets.
     */
    useEffect(() => {
        inputRef?.current?.setAttribute("type", "search");
    }, []);

    if (typeof children !== "function") {
        return null;
    }

    return (
        <fetcher.Form {...props} className={className} onSubmit={resetInput}>
            {children({inputRef, fetcher, fetchResults, goToSearch})}
        </fetcher.Form>
    );
}
