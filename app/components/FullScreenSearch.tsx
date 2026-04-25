/**
 * @fileoverview Full-screen search overlay component with categorized results
 *
 * @description
 * Modal search experience with tabbed categorized results (Products, Collections, Articles),
 * recent search history, popular searches, and featured collections. Includes view options
 * (grid/list, column count) that persist per-tab in localStorage.
 *
 * @features
 * - Full-screen modal overlay using Radix Dialog
 * - Keyboard shortcut (Cmd+K) to open search
 * - ESC key to close
 * - Auto-focus input on open
 * - Real-time search with debounced fetcher
 * - Categorized results with count badges
 * - Recent searches with local storage persistence
 * - Popular search suggestions
 * - Featured collections display
 * - Per-tab view preferences (grid/list mode, column count)
 * - Responsive grid layouts
 * - Staggered fade-in animations for results
 * - Tracking parameters for analytics
 * - Loading and empty states
 *
 * @props
 * - collections: Menu collections for featured display
 * - popularSearchTerms: Array of popular search terms (falls back to hardcoded list)
 *
 * @state
 * - inputValue: Current search query
 * - activeTab: Current result category tab (products/collections/articles)
 * - Per-tab grid columns and layout mode (stored in localStorage)
 *
 * @dependencies
 * - useAside: Controls search overlay open/close
 * - useRecentSearches: Manages search history in localStorage
 * - useSearchKeyboard: Global Cmd+K shortcut handler
 * - ViewOptionsSelector: Grid/list view controls
 * - ProductPrice: Price range display for products
 * - urlWithTrackingParams: Adds search tracking to URLs
 *
 * @search-behavior
 * - Shows initial state (recent, popular, featured) when no query
 * - Fetches categorized results on input change
 * - Saves searches to recent history on result click or "View all"
 * - Limits preview to 12 products per category
 * - Full results accessible via "View all" button
 *
 * @accessibility
 * - Proper Dialog.Title and Dialog.Description
 * - Keyboard navigation (ESC, arrow keys)
 * - Focus management
 * - ARIA labels on interactive elements
 *
 * @related
 * - SearchFormPredictive.tsx - Inline search form
 * - ~/routes/search.tsx - Full search results page
 * - CollectionPageLayout.tsx - View options selector
 * - ProductItem.tsx - Font size utilities
 */

import {useEffect, useRef, useState} from "react";
import {Link, useFetcher, useNavigate, useSearchParams} from "react-router";
import {Image} from "@shopify/hydrogen";
import {Search, Clock, TrendingUp, Calendar, Newspaper, Package, FolderOpen} from "lucide-react";
import {useScrollLock} from "~/hooks/useScrollLock";
import * as Dialog from "@radix-ui/react-dialog";
import {useAside} from "~/components/Aside";
import {useRecentSearches, type RecentSearchEntry} from "~/hooks/useRecentSearches";
import {useSearchKeyboard} from "~/hooks/useSearchKeyboard";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
import {
    ViewOptionsSelector,
    getResponsiveDefaultColumns,
    getGridClassName,
    type LayoutMode,
    type GridColumns
} from "~/components/CollectionPageLayout";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "~/components/ui/tabs";
import {Skeleton} from "~/components/ui/skeleton";
import {ProductPrice} from "~/components/ProductPrice";
import {getProductFontSizes, ProductItem} from "~/components/ProductItem";
import {SEARCH_ENDPOINT} from "~/components/SearchFormPredictive";
import {urlWithTrackingParams} from "~/lib/search";
import type {MenuCollection, SearchProduct} from "types";

const FALLBACK_POPULAR_SEARCHES = ["new arrivals", "best sellers", "gift ideas", "on sale", "trending now"];

const FALLBACK_SEARCH_CONTENT = {
    searchPlaceholder: "Search products...",
    recentSearchesHeading: "Recent Searches",
    popularSearchesHeading: "Popular Searches",
    featuredCollectionsHeading: "Featured Collections",
    clearAllButton: "Clear All",
    emptyResultsHeading: "No results found",
    emptyResultsMessageTemplate: 'We couldn\'t find anything for "{term}"',
    viewAllResults: "View All Results",
    categoryProducts: "Products",
    categoryCollections: "Collections",
    categoryArticles: "Articles",
    sortFeatured: "Featured",
    sortPriceLowHigh: "Price: Low to High",
    sortPriceHighLow: "Price: High to Low",
    sortNewest: "Newest",
    sortBestSelling: "Best Selling",
    sortAToZ: "A to Z",
    sortZToA: "Z to A",
    filterByPrice: "Price",
    filterByColor: "Color",
    filterBySize: "Size",
    filterAvailability: "Availability",
    filterInStock: "In Stock",
    resultsCountTemplate: "Showing {count} of {total} products",
    loadMoreButton: "Load More",
    loadingText: "Loading...",
    gridViewLabel: "Grid view",
    listViewLabel: "List view",
    col2Label: "2 columns",
    col3Label: "3 columns",
    col4Label: "4 columns",
    applyFilters: "Apply Filters",
    clearFilters: "Clear Filters"
} as const;
import type {CategorizedSearchResult, SearchCollection, SearchArticle} from "~/routes/search";

interface FullScreenSearchProps {
    collections: MenuCollection[];
    popularSearchTerms?: string[];
}

// =============================================================================
// MAIN FULL-SCREEN SEARCH COMPONENT
// =============================================================================

export function FullScreenSearch({collections, popularSearchTerms = []}: FullScreenSearchProps) {
    const {type, open, close} = useAside();
    const isOpen = type === "search";
    const {recentSearches, addSearch, clearSearches} = useRecentSearches();
    const searchContent = FALLBACK_SEARCH_CONTENT;
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isInStockOnly = searchParams.get("availability") === "in-stock";

    // Fetcher for categorized search
    const fetcher = useFetcher<CategorizedSearchResult>({key: "fullscreen-search"});

    // Track input value with state to trigger re-renders when cleared
    const [inputValue, setInputValue] = useState("");

    // Get results from categorized search
    const searchData = fetcher?.data;
    const products = searchData?.products?.nodes ?? [];
    const searchCollections = searchData?.collections?.nodes ?? [];
    const articles = searchData?.articles?.nodes ?? [];
    const total =
        (searchData?.products?.totalCount ?? 0) +
        (searchData?.collections?.totalCount ?? 0) +
        (searchData?.articles?.totalCount ?? 0);

    // Show search results only when there's an active search term
    const isSearching = inputValue.trim().length > 0;

    // Lock Lenis smooth scroll when search is open.
    // Radix Dialog handles native body scroll lock; this stops Lenis's virtual scroll.
    // Ref-counted via useScrollLock so concurrent overlays don't conflict.
    useScrollLock(isOpen);

    // Global keyboard shortcut (Cmd+K)
    useSearchKeyboard(() => open("search"));

    // Auto-focus input on open, reset state when closed
    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure dialog is mounted
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            // Reset input value when dialog closes
            setInputValue("");
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    }, [isOpen]);

    // Register ESC key listener
    useEffect(() => {
        // Handle ESC key to close
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                close();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, close]);

    // Fetch search results using categorized search
    const fetchResults = (term: string) => {
        if (term.trim()) {
            const params: Record<string, string> = {q: term};
            if (isInStockOnly) params.availability = "in-stock";
            void fetcher.submit(params, {method: "GET", action: SEARCH_ENDPOINT});
        }
    };

    const handleAvailabilityToggle = () => {
        const next = new URLSearchParams(searchParams);
        if (isInStockOnly) {
            next.delete("availability");
        } else {
            next.set("availability", "in-stock");
        }
        setSearchParams(next, {replace: true, preventScrollReset: true});
        // Re-fetch with updated availability if there's an active search term
        const term = inputRef.current?.value;
        if (term?.trim()) {
            const params: Record<string, string> = {q: term};
            if (!isInStockOnly) params.availability = "in-stock";
            void fetcher.submit(params, {method: "GET", action: SEARCH_ENDPOINT});
        }
    };

    // =============================================================================
    // INPUT HANDLERS
    // =============================================================================

    // Handle input change - updates state to trigger re-render when cleared
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (value.trim()) {
            fetchResults(value);
        }
    };

    // Navigate to full search results page
    const goToSearch = () => {
        const term = inputRef.current?.value;
        if (term?.trim()) {
            addSearch(term.trim());
        }
        const params = new URLSearchParams();
        if (term) params.set("q", term);
        if (isInStockOnly) params.set("availability", "in-stock");
        void navigate(`${SEARCH_ENDPOINT}?${params.toString()}`);
        close();
    };

    // Handle search form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        goToSearch();
    };

    // Handle clicking a search suggestion
    const handleSuggestionClick = (term: string) => {
        if (inputRef.current) {
            inputRef.current.value = term;
            setInputValue(term);
            fetchResults(term);
            inputRef.current.focus();
        }
    };

    // Handle clicking a result (save to recent)
    // When a product is clicked we also capture its thumbnail so the next time
    // Recent Searches renders, the chip shows a visual anchor for that term.
    const handleResultClick = (meta?: {
        image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
        productHandle?: string | null;
    }) => {
        if (inputValue.trim()) {
            addSearch(inputValue.trim(), meta);
        }
        close();
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    // Featured collections (first 4 with handles not in featured list)
    const featuredCollections = collections
        .filter(c => !["all", "all-collections"].includes(c.handle.toLowerCase()))
        .slice(0, 4);

    return (
        <Dialog.Root open={isOpen} onOpenChange={open => !open && close()}>
            <Dialog.Portal>
                {/* Overlay with blur effect */}
                <Dialog.Overlay
                    className={cn(
                        "motion-overlay fixed inset-0 z-200 bg-overlay-dark backdrop-blur-md",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:duration-[var(--motion-duration-overlay)] data-[state=open]:duration-[var(--motion-duration-overlay)]"
                    )}
                />

                {/* Content */}
                <Dialog.Content
                    className={cn(
                        "motion-overlay fixed inset-0 z-200 flex h-dvh flex-col bg-background",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4",
                        "data-[state=closed]:duration-[var(--motion-duration-overlay)] data-[state=open]:duration-[var(--motion-duration-overlay)]"
                    )}
                >
                    {/* Close button - safe area aware positioning */}
                    <Dialog.Close asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "motion-link absolute z-10 text-primary hover:text-primary",
                                // Safe area aware positioning - closer to edge on mobile for thumb reach
                                "top-3 right-3 sm:top-4 sm:right-4",
                                // Ensure 44px minimum touch target height
                                "min-h-11 px-3 sm:px-4 text-base sm:text-lg font-medium"
                            )}
                        >
                            Close
                        </Button>
                    </Dialog.Close>

                    {/* Fixed search input header - won't shrink */}
                    <div className="shrink-0 bg-background px-4 sm:px-6 md:px-8 lg:px-16 pt-10 sm:pt-12 md:pt-16 pb-4 sm:pb-6">
                        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                            {/* Consistent underline style across all screen sizes */}
                            <div className="relative flex items-center gap-3">
                                <input
                                    ref={inputRef}
                                    name="q"
                                    type="search"
                                    onChange={handleInputChange}
                                    className={cn(
                                        "w-full bg-transparent border-0 border-b-2 border-[var(--border-strong)]",
                                        // Responsive text sizing
                                        "text-xl md:text-3xl font-serif",
                                        "text-primary placeholder:text-primary/40",
                                        // Responsive padding
                                        "py-3 sm:py-4 outline-none",
                                        "motion-field focus:border-primary"
                                    )}
                                    placeholder={searchContent.searchPlaceholder}
                                    autoComplete="off"
                                    enterKeyHint="search"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Scrollable content area - min-h-0 is critical for flex overflow */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" data-lenis-prevent>
                        <div className="px-4 sm:px-6 md:px-8 lg:px-16 pt-4 sm:pt-6 pb-[max(4rem,calc(env(safe-area-inset-bottom)+2rem))] md:pb-[max(5rem,calc(env(safe-area-inset-bottom)+3rem))]">
                            {/* Content based on state */}
                            {isSearching ? (
                                <SearchResultsSection
                                    products={products}
                                    collections={searchCollections}
                                    articles={articles}
                                    total={total}
                                    productCount={searchData?.products?.totalCount ?? 0}
                                    collectionCount={searchData?.collections?.totalCount ?? 0}
                                    articleCount={searchData?.articles?.totalCount ?? 0}
                                    term={inputValue}
                                    state={fetcher.state}
                                    onResultClick={handleResultClick}
                                    onViewAll={goToSearch}
                                    searchContent={searchContent}
                                    isInStockOnly={isInStockOnly}
                                    onAvailabilityToggle={handleAvailabilityToggle}
                                />
                            ) : (
                                <SearchInitialState
                                    recentSearches={recentSearches}
                                    collections={featuredCollections}
                                    popularSearches={
                                        popularSearchTerms.length > 0 ? popularSearchTerms : FALLBACK_POPULAR_SEARCHES
                                    }
                                    onClearRecent={clearSearches}
                                    onSuggestionClick={handleSuggestionClick}
                                    onClose={close}
                                    searchContent={searchContent}
                                />
                            )}
                        </div>
                    </div>

                    {/* Accessibility */}
                    <Dialog.Title className="sr-only">Search</Dialog.Title>
                    <Dialog.Description className="sr-only">
                        Search for products, collections, and more
                    </Dialog.Description>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// =============================================================================
// INITIAL STATE (before typing)
// =============================================================================

/**
 * Displays initial search state before user starts typing.
 * Shows recent searches, popular searches, and featured collections.
 */
interface SearchInitialStateProps {
    recentSearches: RecentSearchEntry[];
    collections: MenuCollection[];
    popularSearches: string[];
    onClearRecent: () => void;
    onSuggestionClick: (term: string) => void;
    onClose: () => void;
    searchContent: import("types").SearchContent;
}

function SearchInitialState({
    recentSearches,
    collections,
    popularSearches,
    onClearRecent,
    onSuggestionClick,
    onClose,
    searchContent
}: SearchInitialStateProps) {
    const {canHover} = usePointerCapabilities();

    return (
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
                <section>
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h3 className="flex items-center gap-2 text-sm sm:text-sm uppercase tracking-wider text-muted-foreground font-medium">
                            <Clock className="size-3.5 sm:size-4" />
                            {searchContent.recentSearchesHeading}
                        </h3>
                        <button
                            onClick={onClearRecent}
                            className={cn(
                                "motion-link text-sm text-primary/70 cursor-pointer",
                                canHover ? "hover:text-primary" : "active:text-primary",
                                // Ensure touch target
                                "min-h-11 px-2 flex items-center"
                            )}
                        >
                            {searchContent.clearAllButton}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recentSearches.map(entry => (
                            <button
                                key={entry.term}
                                onClick={() => onSuggestionClick(entry.term)}
                                className={cn(
                                    "motion-interactive motion-press",
                                    // Thumbnail chips get tighter left padding so the image sits flush
                                    entry.image
                                        ? "pl-1.5 pr-3 sm:pr-4 py-1.5 sm:py-1.5"
                                        : "px-3 sm:px-4 py-2.5 sm:py-2",
                                    "min-h-11 cursor-pointer",
                                    "rounded-[var(--radius-pill-raw)] border border-[var(--border-strong)]",
                                    "text-sm font-medium text-primary",
                                    "inline-flex items-center gap-2",
                                    canHover
                                        ? "hover:bg-primary hover:text-primary-foreground"
                                        : "active:bg-primary active:text-primary-foreground",
                                    "active:scale-[var(--motion-press-scale)]"
                                )}
                            >
                                {entry.image ? (
                                    <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted/50 ring-1 ring-[var(--border-strong)]/60">
                                        <Image
                                            alt={entry.image.altText || entry.term}
                                            data={{
                                                url: entry.image.url,
                                                altText: entry.image.altText ?? undefined,
                                                width: entry.image.width ?? undefined,
                                                height: entry.image.height ?? undefined
                                            }}
                                            loading="lazy"
                                            sizes="32px"
                                            className="h-full w-full object-cover"
                                        />
                                    </span>
                                ) : null}
                                <span className="truncate max-w-[10rem] sm:max-w-[14rem]">{entry.term}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Popular searches */}
            {popularSearches.length > 0 && (
                <section>
                    <h3 className="flex items-center gap-2 text-sm sm:text-sm uppercase tracking-wider text-muted-foreground font-medium mb-3 sm:mb-4">
                        <TrendingUp className="size-3.5 sm:size-4" />
                        {searchContent.popularSearchesHeading}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {popularSearches.map((term: string) => (
                            <button
                                key={term}
                                onClick={() => onSuggestionClick(term)}
                                className={cn(
                                    "motion-interactive motion-press",
                                    // Responsive padding with proper touch target
                                    "px-3 sm:px-4 py-2.5 sm:py-2 min-h-11 cursor-pointer",
                                    "rounded-[var(--radius-pill-raw)] border border-[var(--border-strong)]",
                                    "text-sm font-medium text-primary",
                                    canHover
                                        ? "hover:bg-primary hover:text-primary-foreground"
                                        : "active:bg-primary active:text-primary-foreground",
                                    "active:scale-[var(--motion-press-scale)]"
                                )}
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured collections */}
            {collections.length > 0 && (
                <section>
                    <h3 className="text-sm sm:text-sm uppercase tracking-wider text-muted-foreground font-medium mb-4 sm:mb-6">
                        {searchContent.featuredCollectionsHeading}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-responsive gap-y-responsive-lg">
                        {collections.map(collection => (
                            <Link
                                key={collection.id}
                                to={`/collections/${collection.handle}`}
                                onClick={onClose}
                                prefetch="viewport"
                                viewTransition
                                className={cn(
                                    "motion-link cursor-pointer",
                                    canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
                                )}
                            >
                                <div className="aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-muted/50 mb-2 sm:mb-3">
                                    {collection.image ? (
                                        <Image
                                            alt={collection.image.altText ?? collection.title}
                                            data={collection.image}
                                            loading="lazy"
                                            sizes="(min-width: 768px) 25vw, 50vw"
                                            className={cn(
                                                "motion-image h-full w-full object-cover",
                                                canHover && "group-hover:scale-[1.03]"
                                            )}
                                        />
                                    ) : (
                                        <div
                                            className={cn(
                                                "motion-image flex h-full w-full items-center justify-center bg-linear-to-br from-primary/5 to-primary/20",
                                                canHover && "group-hover:scale-[1.03]"
                                            )}
                                        >
                                            <span className="text-xl sm:text-2xl md:text-3xl font-serif text-primary/30">
                                                {collection.title.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <p
                                    className={cn(
                                        "motion-link line-clamp-1 text-sm font-medium text-primary sm:text-sm md:text-base",
                                        canHover && "group-hover:text-primary/70"
                                    )}
                                >
                                    {collection.title}
                                </p>
                                <p className="text-sm sm:text-sm text-muted-foreground">
                                    {collection.productsCount} products
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// =============================================================================
// SEARCH RESULTS SECTION
// =============================================================================

/**
 * Displays categorized search results in tabs with view options.
 * Each tab maintains its own view preferences in localStorage.
 */
interface ResultClickMeta {
    image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
    productHandle?: string | null;
}

interface SearchResultsSectionProps {
    products: SearchProduct[];
    collections: SearchCollection[];
    articles: SearchArticle[];
    total: number;
    productCount: number;
    collectionCount: number;
    articleCount: number;
    term: string;
    state: "idle" | "loading" | "submitting";
    onResultClick: (meta?: ResultClickMeta) => void;
    onViewAll: () => void;
    searchContent: import("types").SearchContent;
    isInStockOnly: boolean;
    onAvailabilityToggle: () => void;
}

function SearchResultsSection({
    products,
    collections,
    articles,
    total,
    productCount,
    collectionCount,
    articleCount,
    term,
    state,
    onResultClick,
    onViewAll,
    searchContent,
    isInStockOnly,
    onAvailabilityToggle
}: SearchResultsSectionProps) {
    const [activeTab, setActiveTab] = useState("products");

    // Per-tab view state - each tab remembers its own view preferences
    // Initialize with SSR-safe defaults (3), will update on mount with responsive defaults
    const [productsGridColumns, setProductsGridColumns] = useState<GridColumns>(3);
    const [productsLayoutMode, setProductsLayoutMode] = useState<LayoutMode>("grid");

    const [collectionsGridColumns, setCollectionsGridColumns] = useState<GridColumns>(3);
    const [collectionsLayoutMode, setCollectionsLayoutMode] = useState<LayoutMode>("grid");

    const [articlesGridColumns, setArticlesGridColumns] = useState<GridColumns>(3);
    const [articlesLayoutMode, setArticlesLayoutMode] = useState<LayoutMode>("grid");

    // Load saved preferences from localStorage on mount, or use responsive defaults
    useEffect(() => {
        const responsiveDefault = getResponsiveDefaultColumns();

        const savedProductsGrid = localStorage.getItem("fullscreen-search-products-grid-columns");
        const savedProductsLayout = localStorage.getItem("fullscreen-search-products-layout-mode");
        const savedCollectionsGrid = localStorage.getItem("fullscreen-search-collections-grid-columns");
        const savedCollectionsLayout = localStorage.getItem("fullscreen-search-collections-layout-mode");
        const savedArticlesGrid = localStorage.getItem("fullscreen-search-articles-grid-columns");
        const savedArticlesLayout = localStorage.getItem("fullscreen-search-articles-layout-mode");

        // Products: use saved or responsive default
        if (savedProductsGrid && ["1", "2", "3", "4"].includes(savedProductsGrid)) {
            setProductsGridColumns(parseInt(savedProductsGrid) as GridColumns);
        } else {
            setProductsGridColumns(responsiveDefault);
        }
        if (savedProductsLayout === "grid" || savedProductsLayout === "list") {
            setProductsLayoutMode(savedProductsLayout);
        }

        // Collections: use saved or responsive default
        if (savedCollectionsGrid && ["1", "2", "3", "4"].includes(savedCollectionsGrid)) {
            setCollectionsGridColumns(parseInt(savedCollectionsGrid) as GridColumns);
        } else {
            setCollectionsGridColumns(responsiveDefault);
        }
        if (savedCollectionsLayout === "grid" || savedCollectionsLayout === "list") {
            setCollectionsLayoutMode(savedCollectionsLayout);
        }

        // Articles: use saved or responsive default
        if (savedArticlesGrid && ["1", "2", "3", "4"].includes(savedArticlesGrid)) {
            setArticlesGridColumns(parseInt(savedArticlesGrid) as GridColumns);
        } else {
            setArticlesGridColumns(responsiveDefault);
        }
        if (savedArticlesLayout === "grid" || savedArticlesLayout === "list") {
            setArticlesLayoutMode(savedArticlesLayout);
        }
    }, []);

    // Get current tab's view state
    const currentGridColumns =
        activeTab === "products"
            ? productsGridColumns
            : activeTab === "collections"
              ? collectionsGridColumns
              : articlesGridColumns;

    const currentLayoutMode =
        activeTab === "products"
            ? productsLayoutMode
            : activeTab === "collections"
              ? collectionsLayoutMode
              : articlesLayoutMode;

    const handleGridColumnsChange = (columns: GridColumns) => {
        if (activeTab === "products") {
            setProductsGridColumns(columns);
            localStorage.setItem("fullscreen-search-products-grid-columns", columns.toString());
        } else if (activeTab === "collections") {
            setCollectionsGridColumns(columns);
            localStorage.setItem("fullscreen-search-collections-grid-columns", columns.toString());
        } else {
            setArticlesGridColumns(columns);
            localStorage.setItem("fullscreen-search-articles-grid-columns", columns.toString());
        }
    };

    const handleLayoutModeChange = (mode: LayoutMode) => {
        if (activeTab === "products") {
            setProductsLayoutMode(mode);
            localStorage.setItem("fullscreen-search-products-layout-mode", mode);
        } else if (activeTab === "collections") {
            setCollectionsLayoutMode(mode);
            localStorage.setItem("fullscreen-search-collections-layout-mode", mode);
        } else {
            setArticlesLayoutMode(mode);
            localStorage.setItem("fullscreen-search-articles-layout-mode", mode);
        }
    };

    // =============================================================================
    // LOADING AND EMPTY STATES
    // =============================================================================

    if (state === "loading" && term) {
        return <SearchLoadingSkeleton />;
    }

    if (!total && term) {
        return <SearchEmptyState term={term} searchContent={searchContent} />;
    }

    // Compute grid class based on layoutMode and gridColumns for each tab
    // Note: getGridClassName includes "mb-8" but we don't need that margin here
    const productsGridClassName = getGridClassName(productsGridColumns, productsLayoutMode).replace(" mb-8", "");
    const collectionsGridClassName = getGridClassName(collectionsGridColumns, collectionsLayoutMode).replace(
        " mb-8",
        ""
    );
    const articlesGridClassName = getGridClassName(articlesGridColumns, articlesLayoutMode).replace(" mb-8", "");

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {/* Tabs row - horizontally scrollable on mobile */}
                    <div className="flex justify-between items-center gap-3">
                        <TabsList className="bg-transparent p-0 h-auto gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto scrollbar-none">
                            <TabsTrigger
                                value="products"
                                className={cn(
                                    "rounded-[var(--radius-pill-raw)] border-2 border-primary shrink-0",
                                    // Responsive padding - smaller on mobile for 320px screens
                                    "px-3 py-1.5 sm:px-4 sm:py-2",
                                    // Minimum touch target height (44px = 11 * 4px)
                                    "min-h-11",
                                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                    "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary",
                                    // Text size responsive
                                    "text-sm sm:text-base"
                                )}
                            >
                                {/* Hide icons on mobile to save space */}
                                <Package className="size-4 mr-1.5 hidden sm:block" />
                                <span className="sm:hidden">{searchContent.categoryProducts}</span>
                                <span className="hidden sm:inline">{searchContent.categoryProducts}</span>
                                <span className="ml-1 text-sm sm:text-sm opacity-70">({productCount})</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="collections"
                                className={cn(
                                    "rounded-[var(--radius-pill-raw)] border-2 border-primary shrink-0",
                                    "px-3 py-1.5 sm:px-4 sm:py-2",
                                    // Minimum touch target height (44px = 11 * 4px)
                                    "min-h-11",
                                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                    "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary",
                                    "text-sm sm:text-base"
                                )}
                            >
                                <FolderOpen className="size-4 mr-1.5 hidden sm:block" />
                                <span className="sm:hidden">{searchContent.categoryCollections}</span>
                                <span className="hidden sm:inline">{searchContent.categoryCollections}</span>
                                <span className="ml-1 text-sm sm:text-sm opacity-70">({collectionCount})</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="articles"
                                className={cn(
                                    "rounded-[var(--radius-pill-raw)] border-2 border-primary shrink-0",
                                    "px-3 py-1.5 sm:px-4 sm:py-2",
                                    // Minimum touch target height (44px = 11 * 4px)
                                    "min-h-11",
                                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                    "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary",
                                    "text-sm sm:text-base"
                                )}
                            >
                                <Newspaper className="size-4 mr-1.5 hidden sm:block" />
                                <span className="sm:hidden">{searchContent.categoryArticles}</span>
                                <span className="hidden sm:inline">{searchContent.categoryArticles}</span>
                                <span className="ml-1 text-sm sm:text-sm opacity-70">({articleCount})</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* View options on desktop - inline with tabs */}
                        {/* Note: showSortOptions=false because this is a preview search - sorting requires full /search page */}
                        {((activeTab === "products" && products.length > 0) ||
                            (activeTab === "collections" && collections.length > 0) ||
                            (activeTab === "articles" && articles.length > 0)) && (
                            <div className="hidden md:flex md:items-center md:gap-3 shrink-0">
                                {activeTab === "products" && (
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-primary min-h-11">
                                        <input
                                            type="checkbox"
                                            checked={isInStockOnly}
                                            onChange={onAvailabilityToggle}
                                            className="size-4 accent-[var(--color-primary)] cursor-pointer"
                                        />
                                        {searchContent.filterInStock}
                                    </label>
                                )}
                                <ViewOptionsSelector
                                    gridColumns={currentGridColumns}
                                    onGridColumnsChange={handleGridColumnsChange}
                                    layoutMode={currentLayoutMode}
                                    onLayoutModeChange={handleLayoutModeChange}
                                    showSortOptions={false}
                                />
                            </div>
                        )}
                    </div>

                    {/* View options on mobile - separate row below tabs */}
                    {((activeTab === "products" && products.length > 0) ||
                        (activeTab === "collections" && collections.length > 0) ||
                        (activeTab === "articles" && articles.length > 0)) && (
                        <div className="md:hidden flex items-center justify-between gap-3">
                            {activeTab === "products" ? (
                                <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-primary min-h-11">
                                    <input
                                        type="checkbox"
                                        checked={isInStockOnly}
                                        onChange={onAvailabilityToggle}
                                        className="size-4 accent-[var(--color-primary)] cursor-pointer"
                                    />
                                    {searchContent.filterInStock}
                                </label>
                            ) : (
                                <div />
                            )}
                            <ViewOptionsSelector
                                gridColumns={currentGridColumns}
                                onGridColumnsChange={handleGridColumnsChange}
                                layoutMode={currentLayoutMode}
                                onLayoutModeChange={handleLayoutModeChange}
                                showSortOptions={false}
                            />
                        </div>
                    )}
                </div>

                {/* Products Tab */}
                <TabsContent value="products" className="mt-0">
                    {products.length > 0 ? (
                        <div className={productsGridClassName}>
                            {products.slice(0, 12).map((product, index) => {
                                // Generate product URL with search tracking parameters
                                const productUrl = urlWithTrackingParams({
                                    baseUrl: `/products/${product.handle}`,
                                    trackingParams: product.trackingParameters,
                                    term
                                });

                                // Convert grid/list layout mode to card/list variant
                                const variant = productsLayoutMode === "grid" ? "card" : "list";

                                return (
                                    <button
                                        type="button"
                                        key={product.id}
                                        onClick={() =>
                                            onResultClick({
                                                image: product.featuredImage
                                                    ? {
                                                          url: product.featuredImage.url,
                                                          altText: product.featuredImage.altText ?? null,
                                                          width: product.featuredImage.width ?? null,
                                                          height: product.featuredImage.height ?? null
                                                      }
                                                    : null,
                                                productHandle: product.handle ?? null
                                            })
                                        }
                                        className="w-full text-left"
                                    >
                                        <ProductItem
                                            product={
                                                product as unknown as import("storefrontapi.generated").ProductItemFragment
                                            }
                                            variant={variant}
                                            index={index}
                                            gridColumns={productsGridColumns}
                                            // Search-optimized configuration
                                            compactMode={true}
                                            showVendor={false}
                                            showBadges={true}
                                            showQuickAdd={false}
                                            showWishlist={false}
                                            showSwatches={false}
                                            customLink={productUrl}
                                            loading="lazy"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <SearchTabEmptyState type="products" term={term} searchContent={searchContent} />
                    )}
                </TabsContent>

                {/* Collections Tab */}
                <TabsContent value="collections" className="mt-0">
                    {collections.length > 0 ? (
                        <div className={collectionsGridClassName}>
                            {collections.map((collection, index) => (
                                <SearchCollectionCard
                                    key={collection.id}
                                    collection={collection}
                                    onClick={onResultClick}
                                    index={index}
                                    variant={collectionsLayoutMode === "list" ? "list" : "card"}
                                />
                            ))}
                        </div>
                    ) : (
                        <SearchTabEmptyState type="collections" term={term} searchContent={searchContent} />
                    )}
                </TabsContent>

                {/* Articles Tab */}
                <TabsContent value="articles" className="mt-0">
                    {articles.length > 0 ? (
                        <div className={articlesGridClassName}>
                            {articles.map((article, index) => (
                                <SearchArticleItem
                                    key={article.id}
                                    article={article}
                                    term={term}
                                    onClick={onResultClick}
                                    index={index}
                                    variant={articlesLayoutMode === "list" ? "list" : "card"}
                                />
                            ))}
                        </div>
                    ) : (
                        <SearchTabEmptyState type="articles" term={term} searchContent={searchContent} />
                    )}
                </TabsContent>
            </Tabs>

            {/* View all results */}
            {total > 0 && (
                <div className="text-center pt-4 sm:pt-6">
                    <button
                        type="button"
                        onClick={onViewAll}
                        className={cn(
                            "motion-interactive motion-press",
                            "rounded-[var(--radius-pill-raw)] border-2 border-primary cursor-pointer",
                            // Responsive padding and sizing with proper touch target
                            "px-4 sm:px-6 py-2.5 sm:py-2 min-h-11",
                            "font-sans text-base sm:text-xl md:text-2xl font-medium",
                            "text-primary",
                            "hover:bg-primary hover:text-primary-foreground",
                            "active:scale-[var(--motion-press-scale)]"
                        )}
                    >
                        <span className="sm:hidden">{searchContent.viewAllResults}</span>
                        <span className="hidden sm:inline">
                            {searchContent.viewAllResults} for &ldquo;{term}&rdquo;
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// PRODUCT CARDS
// =============================================================================
// Note: Product cards now use ProductItem component with search-optimized configuration.
// See TabsContent "products" section above for ProductItem usage.

// =============================================================================
// OTHER RESULT ITEMS
// =============================================================================

/**
 * Collection card/list item with image, title, and description.
 * Supports both grid (card) and list layouts.
 */
interface SearchCollectionCardProps {
    collection: SearchCollection;
    onClick: () => void;
    index: number;
    variant?: "card" | "list";
}

function SearchCollectionCard({collection, onClick, index, variant = "card"}: SearchCollectionCardProps) {
    const {canHover} = usePointerCapabilities();
    const staggerDelay = Math.min(index, 11) * 40;

    if (variant === "list") {
        return (
            <Link
                to={`/collections/${collection.handle}`}
                onClick={onClick}
                prefetch="viewport"
                viewTransition
                className={cn(
                    "motion-interactive flex items-center gap-4 border-b border-border/50 py-4 pl-4 no-underline cursor-pointer md:gap-6 md:pl-6",
                    canHover ? "group hover:bg-muted/30" : "motion-press active:bg-muted/30",
                    "animate-product-fade-in"
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {/* Fixed dimensions for consistent list view layout */}
                {/* 80x80px mobile (1:1 ratio), 96x96px desktop */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 overflow-hidden rounded-xl md:rounded-2xl bg-muted/50">
                    {collection.image ? (
                        <Image
                            alt={collection.image.altText ?? collection.title}
                            data={collection.image}
                            loading="lazy"
                            sizes="96px"
                            className={cn(
                                "motion-image h-full w-full object-cover",
                                canHover && "group-hover:scale-[1.03]"
                            )}
                        />
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                            <span className="text-2xl font-serif text-primary/30">{collection.title.charAt(0)}</span>
                        </div>
                    )}
                    {/* Hover overlay */}
                    <div
                        className={cn(
                            "motion-interactive absolute inset-0 bg-primary/0",
                            canHover && "group-hover:bg-primary/5"
                        )}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base md:text-lg font-medium text-primary truncate">
                        {collection.title}
                    </h3>
                    {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{collection.description}</p>
                    )}
                </div>
            </Link>
        );
    }

    return (
        <Link
            to={`/collections/${collection.handle}`}
            onClick={onClick}
            prefetch="viewport"
            viewTransition
            className={cn(
                "motion-link block animate-product-fade-in cursor-pointer",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
            )}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="aspect-square rounded-xl overflow-hidden bg-muted/50 mb-3">
                {collection.image ? (
                    <Image
                        alt={collection.image.altText ?? collection.title}
                        data={collection.image}
                        loading="lazy"
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className={cn(
                            "motion-image h-full w-full object-cover",
                            canHover && "group-hover:scale-[1.03]"
                        )}
                    />
                ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                        <span className="text-3xl md:text-4xl font-serif text-primary/30">
                            {collection.title.charAt(0)}
                        </span>
                    </div>
                )}
            </div>
            <h3
                className={cn(
                    "font-serif text-sm md:text-base font-medium text-primary motion-interactive",
                    canHover && "group-hover:text-primary/70"
                )}
            >
                {collection.title}
            </h3>
            {collection.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{collection.description}</p>
            )}
        </Link>
    );
}

/**
 * Article item with image, title, excerpt, and publish date.
 * Supports both card (vertical) and list (horizontal) layouts.
 */
interface SearchArticleItemProps {
    article: SearchArticle;
    term: string;
    onClick: () => void;
    index?: number;
    variant?: "card" | "list";
}

function SearchArticleItem({article, term, onClick, index = 0, variant = "card"}: SearchArticleItemProps) {
    const {canHover} = usePointerCapabilities();
    const articleUrl = urlWithTrackingParams({
        baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
        trackingParams: article.trackingParameters,
        term
    });

    const staggerDelay = Math.min(index, 11) * 40;
    const publishDate = new Date(article.publishedAt).toLocaleDateString(STORE_FORMAT_LOCALE, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

    if (variant === "list") {
        return (
            <Link
                to={articleUrl}
                onClick={onClick}
                prefetch="viewport"
                viewTransition
                className={cn(
                    "motion-interactive flex items-center gap-4 border-b border-border/50 py-4 pl-4 no-underline cursor-pointer md:gap-6 md:pl-6",
                    canHover ? "group hover:bg-muted/30" : "motion-press active:bg-muted/30",
                    "animate-product-fade-in"
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {/* Fixed dimensions for consistent list view layout */}
                {/* 80x80px mobile (1:1 ratio), 96x96px desktop */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 overflow-hidden rounded-xl md:rounded-2xl bg-muted/50">
                    {article.image ? (
                        <Image
                            alt={article.image.altText ?? article.title}
                            data={article.image}
                            loading="lazy"
                            sizes="96px"
                            className={cn(
                                "motion-image h-full w-full object-cover",
                                canHover && "group-hover:scale-[1.03]"
                            )}
                        />
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                            <Newspaper className="size-6 text-primary/30" />
                        </div>
                    )}
                    {/* Hover overlay */}
                    <div
                        className={cn(
                            "motion-interactive absolute inset-0 bg-primary/0",
                            canHover && "group-hover:bg-primary/5"
                        )}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-base md:text-lg font-medium text-primary truncate">
                        {article.title}
                    </h4>
                    {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>{publishDate}</span>
                        <span className="text-border">•</span>
                        <span>{article.blog.title}</span>
                    </div>
                </div>
            </Link>
        );
    }

    // Card variant - vertical layout with image on top
    return (
        <Link
            to={articleUrl}
            onClick={onClick}
            prefetch="viewport"
            viewTransition
            className={cn(
                "motion-link block no-underline animate-product-fade-in cursor-pointer",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
            )}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-muted/50 mb-4">
                {article.image ? (
                    <Image
                        alt={article.image.altText ?? article.title}
                        data={article.image}
                        loading="lazy"
                        sizes="(min-width: 45em) 400px, 100vw"
                        className={cn(
                            "motion-image h-full w-full object-cover",
                            canHover && "group-hover:scale-[1.03]"
                        )}
                    />
                ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                        <Newspaper className="size-12 text-primary/30" />
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <h4 className="font-serif text-base font-medium leading-snug text-primary line-clamp-2">
                    {article.title}
                </h4>
                {article.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>{publishDate}</span>
                    <span className="text-border">•</span>
                    <span>{article.blog.title}</span>
                </div>
            </div>
        </Link>
    );
}

// =============================================================================
// LOADING & EMPTY STATES
// =============================================================================

/**
 * Loading skeleton for search results.
 * Shows placeholder cards while fetching data.
 */
const SKELETON_IDS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"] as const;

function SearchLoadingSkeleton() {
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Tabs skeleton */}
            <div className="flex gap-2">
                <Skeleton className="h-11 w-28 rounded-[var(--radius-pill-raw)]" />
                <Skeleton className="h-11 w-32 rounded-[var(--radius-pill-raw)]" />
                <Skeleton className="h-11 w-24 rounded-[var(--radius-pill-raw)]" />
            </div>

            {/* Product grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-responsive gap-y-responsive-lg">
                {SKELETON_IDS.map((id, index) => (
                    <div key={id} className="animate-product-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                        <Skeleton className="aspect-4/5 w-full rounded-lg sm:rounded-xl mb-2 sm:mb-3" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Empty state when no results found for search query.
 */
function SearchEmptyState({term, searchContent}: {term: string; searchContent: import("types").SearchContent}) {
    return (
        <div className="max-w-6xl mx-auto text-center py-10 sm:py-16 px-4">
            <div className="size-12 sm:size-16 mx-auto mb-4 sm:mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="size-6 sm:size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-serif text-primary mb-2">{searchContent.emptyResultsHeading}</h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
                {searchContent.emptyResultsMessageTemplate.replace("{term}", term)}
            </p>
        </div>
    );
}

/**
 * Empty state for individual result category tabs.
 * Shows when a specific category has no results for the search term.
 */
function SearchTabEmptyState({
    type,
    term,
    searchContent
}: {
    type: "products" | "collections" | "articles";
    term: string;
    searchContent: import("types").SearchContent;
}) {
    const config = {
        products: {icon: Package, label: searchContent.categoryProducts.toLowerCase()},
        collections: {icon: FolderOpen, label: searchContent.categoryCollections.toLowerCase()},
        articles: {icon: Newspaper, label: searchContent.categoryArticles.toLowerCase()}
    };

    const {icon: Icon, label} = config[type];

    return (
        <div className="py-8 sm:py-12 text-center text-muted-foreground px-4">
            <Icon className="size-8 sm:size-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base max-w-sm mx-auto">
                No {label} found for &ldquo;<span className="break-all">{term}</span>&rdquo;
            </p>
        </div>
    );
}
