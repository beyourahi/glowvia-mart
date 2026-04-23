/**
 * @fileoverview Search Results Route (/search)
 *
 * @description
 * Full-featured search page with multiple result types, infinite scroll,
 * and predictive search support. Features include:
 * - Tabbed results (Products, Collections, Articles)
 * - Infinite scroll pagination per result type
 * - Predictive search for autocomplete
 * - Recent searches history
 * - Popular searches suggestions
 * - Configurable grid layout
 *
 * @url-pattern /search?q=:term
 * Query parameter 'q' contains the search term.
 *
 * @architecture
 * Request Types:
 * - Full page: Regular search with all result types
 * - Predictive: Quick autocomplete for FullScreenSearch (?predictive=true)
 * - Fetcher: Infinite scroll pagination (?index&fetchType=products|articles)
 *
 * Search Flow:
 * 1. User submits search form or types in FullScreenSearch
 * 2. Loader fetches results from Shopify search API
 * 3. Results displayed in tabs with counts
 * 4. Infinite scroll loads more results per type
 *
 * @seo
 * - noIndex (search results pages shouldn't be indexed)
 * - Dynamic title based on search term
 *
 * @personalization
 * - Recent searches stored in localStorage
 * - Popular searches from menu data or fallback
 *
 * @related
 * - FullScreenSearch.tsx - Predictive search modal
 * - SearchForm.tsx - Search input component
 * - InfiniteScrollGrid.tsx - Pagination handling
 */

import * as React from "react";
import {Link, useLoaderData, useNavigate, useRouteLoaderData, useRouteError, isRouteErrorResponse} from "react-router";
import type {Route} from "./+types/search";
import {Analytics, Image, getSeoMeta} from "@shopify/hydrogen";
import {SearchForm} from "~/components/SearchForm";
import {type PredictiveSearchReturn, getEmptyPredictiveSearchResult, urlWithTrackingParams} from "~/lib/search";
import type {PredictiveSearchQuery} from "storefrontapi.generated";
import type {SearchProduct, MenuCollection} from "types";
import type {RootLoader} from "~/root";
import {
    ViewOptionsSelector,
    getResponsiveDefaultColumns,
    getGridClassName,
    type LayoutMode,
    type GridColumns
} from "~/components/CollectionPageLayout";
import {InfiniteScrollGrid} from "~/components/InfiniteScrollGrid";
import {ProductPrice} from "~/components/ProductPrice";
import {DiscountBadge} from "~/components/DiscountBadge";
import {getProductFontSizes} from "~/components/ProductItem";
import {analyzeProductDiscount, type ProductWithVariants} from "~/lib/discounts";
import {useRecentSearches, type RecentSearchEntry} from "~/hooks/useRecentSearches";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {Alert, AlertDescription} from "~/components/ui/alert";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "~/components/ui/tabs";
import {Button} from "~/components/ui/button";
import {Search, AlertCircle, Package, FolderOpen, Newspaper, SearchX, Calendar, Clock, TrendingUp} from "lucide-react";
import {cn} from "~/lib/utils";
import {buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {parseProductTitle} from "~/lib/product";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";
import {trackErrorBoundary} from "~/hooks/usePwaAnalytics";
import {sortWithPinnedFirst} from "~/lib/product-tags";
import {AnimatedSection} from "~/components/AnimatedSection";
import {PageHeading} from "~/components/PageHeading";
import {getSearchSortOption} from "~/lib/sort-filter-helpers";

const FALLBACK_POPULAR_SEARCHES = ["new arrivals", "best sellers", "gift ideas", "on sale", "trending now"];

// =============================================================================
// META FUNCTION
// =============================================================================

export const meta: Route.MetaFunction = ({data, matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const term = data && "term" in data ? data.term : "";
    const title = term ? `Search results for "${term}"` : "Search";

    return (
        getSeoMeta({
            title,
            description: "Search our collection of handcrafted products, collections, and articles.",
            url: buildCanonicalUrl("/search", siteUrl),
            robots: {noIndex: true, noFollow: false}
        }) ?? []
    );
};

export async function loader({request, context}: Route.LoaderArgs) {
    const url = new URL(request.url);
    const isPredictive = url.searchParams.has("predictive");
    const isFetcherRequest = url.searchParams.has("index");
    const fetchType = url.searchParams.get("fetchType");

    // Handle fetcher requests for infinite scroll
    if (isFetcherRequest && !isPredictive) {
        if (fetchType === "articles") {
            return await fetchMoreArticles({request, context});
        }
        return await fetchMoreProducts({request, context});
    }

    // Handle predictive search (for FullScreenSearch)
    if (isPredictive) {
        return await predictiveSearch({request, context}).catch((error: Error) => {
            console.error(error);
            return {type: "predictive" as const, term: "", result: getEmptyPredictiveSearchResult()};
        });
    }

    // Handle regular categorized search
    return await regularSearch({request, context}).catch((error: Error) => {
        console.error(error);
        return {
            type: "categorized" as const,
            term: "",
            error: error.message,
            products: {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}, totalCount: 0},
            collections: {nodes: [], totalCount: 0},
            articles: {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}, totalCount: 0}
        } satisfies CategorizedSearchResult;
    });
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
    const data = useLoaderData<typeof loader>();
    const rootData = useRouteLoaderData<RootLoader>("root");
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState("products");
    const searchInputRef = React.useRef<HTMLInputElement | null>(null);
    const formRef = React.useRef<HTMLFormElement>(null!);
    const {recentSearches, addSearch, clearSearches} = useRecentSearches();

    // Per-tab view state - each tab remembers its own view preferences
    // Initialize with SSR-safe defaults (3), will update on mount with responsive defaults
    const [productsGridColumns, setProductsGridColumns] = React.useState<GridColumns>(3);
    const [productsLayoutMode, setProductsLayoutMode] = React.useState<LayoutMode>("grid");

    const [collectionsGridColumns, setCollectionsGridColumns] = React.useState<GridColumns>(3);
    const [collectionsLayoutMode, setCollectionsLayoutMode] = React.useState<LayoutMode>("grid");

    const [articlesGridColumns, setArticlesGridColumns] = React.useState<GridColumns>(3);
    const [articlesLayoutMode, setArticlesLayoutMode] = React.useState<LayoutMode>("grid");

    // Handle clicking a search suggestion - fill input and submit
    const handleSuggestionClick = (term: string) => {
        if (searchInputRef.current) {
            searchInputRef.current.value = term;
            searchInputRef.current.focus();
            // Add to recent searches and submit
            addSearch(term);
            formRef.current?.requestSubmit();
        }
    };

    // Get collections and popular searches from root loader (for empty state)
    const menuCollections = rootData?.menuCollections ?? [];
    const popularSearchTerms = rootData?.popularSearchTerms ?? [];

    // Load saved preferences from localStorage on mount, or use responsive defaults
    React.useEffect(() => {
        const responsiveDefault = getResponsiveDefaultColumns();

        const savedProductsGrid = localStorage.getItem("search-products-grid-columns");
        const savedProductsLayout = localStorage.getItem("search-products-layout-mode");
        const savedCollectionsGrid = localStorage.getItem("search-collections-grid-columns");
        const savedCollectionsLayout = localStorage.getItem("search-collections-layout-mode");
        const savedArticlesGrid = localStorage.getItem("search-articles-grid-columns");
        const savedArticlesLayout = localStorage.getItem("search-articles-layout-mode");

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
            localStorage.setItem("search-products-grid-columns", columns.toString());
        } else if (activeTab === "collections") {
            setCollectionsGridColumns(columns);
            localStorage.setItem("search-collections-grid-columns", columns.toString());
        } else {
            setArticlesGridColumns(columns);
            localStorage.setItem("search-articles-grid-columns", columns.toString());
        }
    };

    const handleLayoutModeChange = (mode: LayoutMode) => {
        if (activeTab === "products") {
            setProductsLayoutMode(mode);
            localStorage.setItem("search-products-layout-mode", mode);
        } else if (activeTab === "collections") {
            setCollectionsLayoutMode(mode);
            localStorage.setItem("search-collections-layout-mode", mode);
        } else {
            setArticlesLayoutMode(mode);
            localStorage.setItem("search-articles-layout-mode", mode);
        }
    };

    // Handle fetcher requests (infinite scroll) - they return products/pageInfo directly
    if (!data || !("type" in data)) return null;

    // Handle predictive search requests
    if (data.type === "predictive") return null;

    // Handle fetcher responses for infinite scroll
    if (data.type === "products" || data.type === "articles") return null;

    // Now we know it's a CategorizedSearchResult
    const {term, error, products, collections, articles} = data;
    const totalResults = products.totalCount + collections.totalCount + articles.totalCount;

    // Handle input change - navigate to /search when input is cleared
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!value.trim() && term) {
            // Clear results when input is emptied
            void navigate("/search", {replace: true});
        }
    };

    return (
        /* Search page container with responsive padding and max-width constraint for ultrawide
           - Mobile (320px): px-3, py-6
           - Tablet: px-4 → px-8
           - Desktop: px-12 → px-16
           - Ultrawide (3xl): centered with max-w-400 (1600px) */
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:mx-auto 3xl:max-w-400 3xl:px-12 mb-4 min-h-dvh  ">
            {/* Page Header with fluid title sizing
                 pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px) */}
            <AnimatedSection animation="fade" threshold={0.08}>
                <header className="pt-(--page-breathing-room) pb-6 sm:pb-8 md:pb-12 lg:pb-16 xl:pb-20">
                    <PageHeading title="/ Search" />
                </header>
            </AnimatedSection>

            {/* Search Form - styled like FullScreenSearch with underline input
                 Max-width scales up on larger screens for visual balance */}
            <AnimatedSection animation="slide-up" threshold={0.1}>
                <SearchForm
                    className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-4xl xl:max-w-5xl 2xl:max-w-6xl"
                    formRef={formRef}
                >
                    {({inputRef}) => (
                        <input
                            defaultValue={term}
                            name="q"
                            type="search"
                            placeholder="Search..."
                            ref={el => {
                                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                                searchInputRef.current = el;
                            }}
                            onChange={handleInputChange}
                            autoComplete="off"
                            enterKeyHint="search"
                            className={cn(
                                "w-full bg-transparent border-0 border-b-2 border-[var(--border-strong)]",
                                "text-xl md:text-3xl font-serif",
                                "text-primary placeholder:text-primary/40",
                                "py-3 sm:py-4 outline-none",
                                "focus:border-primary"
                            )}
                        />
                    )}
                </SearchForm>
            </AnimatedSection>

            {/* Error State */}
            {error && (
                <Alert variant="destructive" className="mb-8 max-w-2xl">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Results or Empty States */}
            {!term ? (
                <AnimatedSection animation="fade" threshold={0.1}>
                    <SearchPageInitialState
                        recentSearches={recentSearches}
                        collections={menuCollections}
                        popularSearches={popularSearchTerms.length > 0 ? popularSearchTerms : FALLBACK_POPULAR_SEARCHES}
                        onClearRecent={clearSearches}
                        onSuggestionClick={handleSuggestionClick}
                    />
                </AnimatedSection>
            ) : totalResults === 0 ? (
                <AnimatedSection animation="fade" threshold={0.1}>
                    <SearchEmptyState term={term} />
                </AnimatedSection>
            ) : (
                <AnimatedSection animation="slide-up" threshold={0.12}>
                    <div className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex flex-col gap-4 mb-6">
                                {/* Tabs row - horizontally scrollable on mobile for small screens */}
                                <div className="flex items-center justify-between gap-4">
                                    <TabsList className="bg-transparent p-0 h-auto gap-1 sm:gap-1.5 md:gap-2 shrink-0 overflow-x-auto scrollbar-hide">
                                        <TabsTrigger
                                            value="products"
                                            className={cn(
                                                "rounded-[var(--radius-pill-raw)] border-2 border-primary",
                                                // Responsive padding and touch target - tighter on smallest screens
                                                "min-h-9 px-2 py-1 sm:min-h-10 sm:px-3 sm:py-1.5 md:min-h-11 md:px-4 md:py-2",
                                                "text-sm sm:text-sm md:text-base font-medium whitespace-nowrap",
                                                "sleek",
                                                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary"
                                            )}
                                        >
                                            {/* Icon hidden on smallest screens, visible on sm+ */}
                                            <Package className="hidden sm:inline-block size-4 mr-1.5" />
                                            <span>Products</span>
                                            <span className="ml-1 text-sm opacity-80">({products.totalCount})</span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="collections"
                                            className={cn(
                                                "rounded-[var(--radius-pill-raw)] border-2 border-primary",
                                                "min-h-9 px-2 py-1 sm:min-h-10 sm:px-3 sm:py-1.5 md:min-h-11 md:px-4 md:py-2",
                                                "text-sm sm:text-sm md:text-base font-medium whitespace-nowrap",
                                                "sleek",
                                                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary"
                                            )}
                                        >
                                            <FolderOpen className="hidden sm:inline-block size-4 mr-1.5" />
                                            <span>Collections</span>
                                            <span className="ml-1 text-sm opacity-80">({collections.totalCount})</span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="articles"
                                            className={cn(
                                                "rounded-[var(--radius-pill-raw)] border-2 border-primary",
                                                "min-h-9 px-2 py-1 sm:min-h-10 sm:px-3 sm:py-1.5 md:min-h-11 md:px-4 md:py-2",
                                                "text-sm sm:text-sm md:text-base font-medium whitespace-nowrap",
                                                "sleek",
                                                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary"
                                            )}
                                        >
                                            <Newspaper className="hidden sm:inline-block size-4 mr-1.5" />
                                            <span>Articles</span>
                                            <span className="ml-1 text-sm opacity-80">({articles.totalCount})</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* View options on desktop - search sorting is currently URL-driven */}
                                    {((activeTab === "products" && products.nodes.length > 0) ||
                                        (activeTab === "collections" && collections.nodes.length > 0) ||
                                        (activeTab === "articles" && articles.nodes.length > 0)) && (
                                        <div className="hidden md:block shrink-0">
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
                                {((activeTab === "products" && products.nodes.length > 0) ||
                                    (activeTab === "collections" && collections.nodes.length > 0) ||
                                    (activeTab === "articles" && articles.nodes.length > 0)) && (
                                    <div className="md:hidden">
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

                            <TabsContent value="products" className="mt-0">
                                <SearchProductsTab
                                    products={products}
                                    term={term}
                                    gridColumns={productsGridColumns}
                                    layoutMode={productsLayoutMode}
                                />
                            </TabsContent>

                            <TabsContent value="collections" className="mt-0">
                                <SearchCollectionsTab
                                    collections={collections}
                                    term={term}
                                    gridColumns={collectionsGridColumns}
                                    layoutMode={collectionsLayoutMode}
                                />
                            </TabsContent>

                            <TabsContent value="articles" className="mt-0">
                                <SearchArticlesTab
                                    articles={articles}
                                    term={term}
                                    gridColumns={articlesGridColumns}
                                    layoutMode={articlesLayoutMode}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </AnimatedSection>
            )}

            <Analytics.SearchView
                data={{
                    searchTerm: term,
                    searchResults: {total: totalResults, items: {products, collections, articles}}
                }}
            />
        </div>
    );
}

/**
 * Rich initial search state - displayed when no search term
 * Shows recent searches, popular searches, and featured collections
 */
interface SearchPageInitialStateProps {
    recentSearches: RecentSearchEntry[];
    collections: MenuCollection[];
    popularSearches: string[];
    onClearRecent: () => void;
    onSuggestionClick: (term: string) => void;
}

function SearchPageInitialState({
    recentSearches,
    collections,
    popularSearches,
    onClearRecent,
    onSuggestionClick
}: SearchPageInitialStateProps) {
    // Featured collections (first 6, excluding "all" type collections)
    const featuredCollections = collections
        .filter(c => !["all", "all-collections"].includes(c.handle.toLowerCase()))
        .slice(0, 6);

    // Show a minimal state if we have no data to display
    const hasContent = recentSearches.length > 0 || popularSearches.length > 0 || featuredCollections.length > 0;

    if (!hasContent) {
        return (
            <div className="py-10 sm:py-16 text-center px-4">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted/50 mb-4 sm:mb-6">
                    <Search className="size-6 sm:size-8 text-muted-foreground" />
                </div>
                <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-primary mb-2 sm:mb-3">
                    Start searching
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-sm sm:max-w-md mx-auto leading-relaxed">
                    Enter a search term to discover products, collections, and articles.
                </p>
            </div>
        );
    }

    return (
        <div className=" space-y-8 sm:space-y-12">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
                <section>
                    <div className="flex justify-between items-center mb-4 sm:mb-5">
                        <h3 className="flex items-center gap-2 text-sm sm:text-sm uppercase tracking-wider text-muted-foreground font-medium">
                            <Clock className="size-4 sm:size-4" />
                            Recent Searches
                        </h3>
                        <Button variant="ghost" size="sm" onClick={onClearRecent} className="text-sm">
                            Clear all
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {recentSearches.map(entry => (
                            <button
                                key={entry.term}
                                type="button"
                                onClick={() => onSuggestionClick(entry.term)}
                                className={cn(
                                    "motion-interactive motion-press cursor-pointer",
                                    // Thumbnail chips use compact left padding so the image sits flush
                                    entry.image
                                        ? "pl-1.5 pr-3 sm:pr-4 py-1.5"
                                        : "px-3 sm:px-4 py-2",
                                    "min-h-11 inline-flex items-center gap-2",
                                    "rounded-[var(--radius-pill-raw)] border border-[var(--border-strong)]",
                                    "text-sm font-medium text-primary",
                                    "hover:bg-primary hover:text-primary-foreground",
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
                    <h3 className="flex items-center gap-2 text-sm sm:text-sm uppercase tracking-wider text-muted-foreground font-medium mb-4 sm:mb-5">
                        <TrendingUp className="size-4 sm:size-4" />
                        Popular Searches
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {popularSearches.map((term: string) => (
                            <Button
                                key={term}
                                variant="outline"
                                size="sm"
                                onClick={() => onSuggestionClick(term)}
                                className="text-sm sm:text-sm border-[var(--border-strong)]"
                            >
                                {term}
                            </Button>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured collections */}
            {featuredCollections.length > 0 && (
                <section>
                    <h3 className="text-sm sm:text-sm uppercase tracking-wider text-muted-foreground font-medium mb-5 sm:mb-6">
                        Explore Collections
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-responsive">
                        {featuredCollections.map(collection => (
                            <Link
                                key={collection.id}
                                to={`/collections/${collection.handle}`}
                                prefetch="viewport"
                                className="group"
                            >
                                <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-muted/50 mb-2 sm:mb-3">
                                    {collection.image ? (
                                        <Image
                                            alt={collection.image.altText ?? collection.title}
                                            data={collection.image}
                                            loading="lazy"
                                            sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, 50vw"
                                            className="w-full h-full object-cover group-hover:scale-105 motion-image"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-primary/5 to-primary/20 flex items-center justify-center group-hover:scale-105 motion-image">
                                            <span className="text-2xl sm:text-3xl md:text-4xl font-serif text-primary/30">
                                                {collection.title.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm sm:text-base font-medium text-primary group-hover:text-primary/70 motion-surface line-clamp-1">
                                    {collection.title}
                                </p>
                                <p className="text-sm sm:text-sm text-muted-foreground">
                                    {collection.productsCount} {collection.productsCount === 1 ? "product" : "products"}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Helpful hint */}
            <div className="text-center py-6 sm:py-8 border-t border-border/50">
                <p className="text-sm sm:text-base text-muted-foreground">
                    Type above to search for products, collections, or articles
                </p>
            </div>
        </div>
    );
}

/**
 * Empty state when no results found
 */
function SearchEmptyState({term}: {term: string}) {
    return (
        <div className="py-10 sm:py-16 text-center px-4">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted/50 mb-4 sm:mb-6">
                <SearchX className="size-6 sm:size-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-primary mb-2 sm:mb-3">No results found</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-sm sm:max-w-md mx-auto leading-relaxed">
                We couldn&rsquo;t find anything for &ldquo;{term}&rdquo;.
            </p>
            <p className="text-sm text-muted-foreground/80 mt-2">
                Try a different search term or browse our collections.
            </p>
        </div>
    );
}

/**
 * Products tab content with infinite scroll
 */
function SearchProductsTab({
    products,
    term,
    gridColumns,
    layoutMode
}: {
    products: CategorizedSearchResult["products"];
    term: string;
    gridColumns: GridColumns;
    layoutMode: LayoutMode;
}) {
    if (products.nodes.length === 0) {
        return (
            <div className="py-8 sm:py-12 text-center text-muted-foreground px-4">
                <Package className="size-10 sm:size-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No products found for &ldquo;{term}&rdquo;</p>
            </div>
        );
    }

    // Grid classes - exact columns as selected
    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    return (
        <InfiniteScrollGrid<SearchProduct>
            key={`search-products-${layoutMode}-${gridColumns}`}
            initialProducts={products.nodes as SearchProduct[]}
            pageInfo={{
                hasNextPage: products.pageInfo.hasNextPage,
                endCursor: products.pageInfo.endCursor
            }}
            resourcesClassName={resourcesClassName}
            fetcherKey={`search-products-${term}`}
            showSkeletons={true}
            skeletonCount={gridColumns === 1 ? 1 : gridColumns === 2 ? 2 : gridColumns === 3 ? 3 : 4}
            endMessage="You've seen all results"
        >
            {({node: product, index, isNew}) => (
                <SearchProductItem
                    key={product.id}
                    product={product}
                    term={term}
                    loading={index < 12 ? "eager" : undefined}
                    variant={layoutMode === "list" ? "list" : "card"}
                    index={index}
                    gridColumns={gridColumns}
                />
            )}
        </InfiniteScrollGrid>
    );
}

/**
 * Product item component
 */
function SearchProductItem({
    product,
    term,
    loading,
    variant = "card",
    index = 0,
    gridColumns
}: {
    product: SearchProduct;
    term: string;
    loading?: "eager" | "lazy";
    variant?: "card" | "list";
    index?: number;
    gridColumns?: GridColumns;
}) {
    const {canHover} = usePointerCapabilities();
    const productUrl = urlWithTrackingParams({
        baseUrl: `/products/${product.handle}`,
        trackingParams: product.trackingParameters,
        term
    });

    const image = product.featuredImage;
    const {primary, secondary} = parseProductTitle(product.title);
    const staggerDelay = Math.min(index, 11) * 40;

    // Get dynamic font sizes based on grid columns and variant
    const fontSizes = getProductFontSizes(gridColumns, variant);

    // Analyze discount from product variant data
    const discountInfo = analyzeProductDiscount(product as ProductWithVariants);

    if (variant === "list") {
        return (
            <Link
                to={productUrl}
                prefetch="viewport"
                className={cn(
                    "flex items-center gap-4 md:gap-6 py-4 pl-4 border-b border-border/50 no-underline",
                    canHover ? "group hover:bg-muted/30" : "motion-press active:bg-muted/30",
                    "animate-product-fade-in"
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {/* Fixed dimensions for consistent list view layout */}
                {/* 80x100px mobile (4:5 ratio), 96x120px desktop */}
                <div className="relative w-20 h-[100px] md:w-24 md:h-[120px] shrink-0 overflow-hidden rounded-2xl bg-muted/50">
                    {discountInfo.type !== "none" && (
                        <DiscountBadge discountInfo={discountInfo} className="top-1 left-1 text-sm px-1.5 py-0" />
                    )}
                    {image ? (
                        <Image
                            alt={image.altText || product.title}
                            data={image}
                            loading={loading}
                            sizes="96px"
                            className={cn(
                                "w-full h-full object-cover motion-image",
                                canHover && "group-hover:scale-105"
                            )}
                        />
                    ) : (
                        <div className="w-full h-full bg-muted/50" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={cn("font-sans font-medium leading-snug text-primary truncate", fontSizes.title)}>
                        <span>{primary}</span>
                        {secondary && <span>, {secondary}</span>}
                    </h3>
                    <div className={cn("font-mono tabular-nums text-primary mt-1", fontSizes.price)}>
                        <ProductPrice
                            price={product.priceRange.minVariantPrice}
                            maxPrice={product.priceRange.maxVariantPrice}
                        />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            to={productUrl}
            prefetch="viewport"
            className={cn(
                "block no-underline animate-product-fade-in",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
            )}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="relative overflow-hidden rounded-2xl bg-muted/50 mb-4">
                {discountInfo.type !== "none" && <DiscountBadge discountInfo={discountInfo} />}
                {image ? (
                    <Image
                        alt={image.altText || product.title}
                        aspectRatio="4/5"
                        data={image}
                        loading={loading}
                        sizes="(min-width: 45em) 400px, 100vw"
                        className={cn(
                            "h-auto w-full object-cover motion-image",
                            canHover && "group-hover:scale-105"
                        )}
                    />
                ) : (
                    <div className="aspect-4/5 bg-muted/50" />
                )}
            </div>
            <div className="space-y-1">
                <h3 className={cn("font-sans font-medium leading-snug text-primary line-clamp-2", fontSizes.title)}>
                    <span>{primary}</span>
                    {secondary && <span>, {secondary}</span>}
                </h3>
                <div className={cn("font-mono tabular-nums text-primary", fontSizes.price)}>
                    <ProductPrice
                        price={product.priceRange.minVariantPrice}
                        maxPrice={product.priceRange.maxVariantPrice}
                    />
                </div>
            </div>
        </Link>
    );
}

/**
 * Collections tab content
 */
function SearchCollectionsTab({
    collections,
    term,
    gridColumns,
    layoutMode
}: {
    collections: CategorizedSearchResult["collections"];
    term: string;
    gridColumns: GridColumns;
    layoutMode: LayoutMode;
}) {
    if (collections.nodes.length === 0) {
        return (
            <div className="py-8 sm:py-12 text-center text-muted-foreground px-4">
                <FolderOpen className="size-10 sm:size-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No collections found for &ldquo;{term}&rdquo;</p>
            </div>
        );
    }

    // Grid classes - exact columns as selected
    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    return (
        <div className={resourcesClassName}>
            {collections.nodes.map((collection, index) => (
                <SearchCollectionCard
                    key={collection.id}
                    collection={collection}
                    index={index}
                    variant={layoutMode === "list" ? "list" : "card"}
                />
            ))}
        </div>
    );
}

/**
 * Collection card component
 */
function SearchCollectionCard({
    collection,
    index,
    variant = "card"
}: {
    collection: SearchCollection;
    index: number;
    variant?: "card" | "list";
}) {
    const {canHover} = usePointerCapabilities();
    const staggerDelay = Math.min(index, 11) * 40;

    if (variant === "list") {
        return (
            <Link
                to={`/collections/${collection.handle}`}
                prefetch="viewport"
                className={cn(
                    "flex items-center gap-4 md:gap-6 py-4 border-b border-border/50 no-underline",
                    canHover ? "group hover:bg-muted/30" : "motion-press active:bg-muted/30",
                    "animate-product-fade-in"
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {/* Fixed dimensions for consistent list view layout */}
                {/* 80x80px mobile (1:1 ratio), 96x96px desktop */}
                <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 overflow-hidden rounded-2xl bg-muted/50">
                    {collection.image ? (
                        <Image
                            alt={collection.image.altText || collection.title}
                            data={collection.image}
                            sizes="96px"
                            className={cn(
                                "w-full h-full object-cover motion-image",
                                canHover && "group-hover:scale-105"
                            )}
                        />
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                            <span className="text-2xl font-serif text-primary/30">{collection.title.charAt(0)}</span>
                        </div>
                    )}
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
            prefetch="viewport"
            className={cn(
                "block animate-product-fade-in",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
            )}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="aspect-square rounded-xl overflow-hidden bg-muted/50 mb-3">
                {collection.image ? (
                    <Image
                        alt={collection.image.altText || collection.title}
                        data={collection.image}
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className={cn(
                            "w-full h-full object-cover motion-image",
                            canHover && "group-hover:scale-105"
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
                    "font-serif text-sm md:text-base font-medium text-primary motion-surface",
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
 * Articles tab content
 */
function SearchArticlesTab({
    articles,
    term,
    gridColumns,
    layoutMode
}: {
    articles: CategorizedSearchResult["articles"];
    term: string;
    gridColumns: GridColumns;
    layoutMode: LayoutMode;
}) {
    if (articles.nodes.length === 0) {
        return (
            <div className="py-8 sm:py-12 text-center text-muted-foreground px-4">
                <Newspaper className="size-10 sm:size-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No articles found for &ldquo;{term}&rdquo;</p>
            </div>
        );
    }

    // Grid classes - exact columns as selected
    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    return (
        <div className={resourcesClassName}>
            {articles.nodes.map((article, index) => (
                <SearchArticleCard
                    key={article.id}
                    article={article}
                    term={term}
                    index={index}
                    variant={layoutMode === "list" ? "list" : "card"}
                />
            ))}
        </div>
    );
}

/**
 * Article card component with image, excerpt, and date
 */
function SearchArticleCard({
    article,
    term,
    index,
    variant = "card"
}: {
    article: SearchArticle;
    term: string;
    index: number;
    variant?: "card" | "list";
}) {
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
                prefetch="viewport"
                className={cn(
                    "flex items-center gap-4 md:gap-6 py-4 border-b border-border/50 no-underline",
                    canHover ? "group hover:bg-muted/30" : "motion-press active:bg-muted/30",
                    "animate-product-fade-in"
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {/* Fixed dimensions for consistent list view layout */}
                {/* 80x80px mobile (1:1 ratio), 96x96px desktop */}
                <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 overflow-hidden rounded-2xl bg-muted/50">
                    {article.image ? (
                        <Image
                            alt={article.image.altText || article.title}
                            data={article.image}
                            sizes="96px"
                            className={cn(
                                "w-full h-full object-cover motion-image",
                                canHover && "group-hover:scale-105"
                            )}
                        />
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                            <Newspaper className="size-6 text-primary/30" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base md:text-lg font-medium text-primary truncate">
                        {article.title}
                    </h3>
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
            prefetch="viewport"
            className={cn(
                "block no-underline animate-product-fade-in",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
            )}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-muted/50 mb-4">
                {article.image ? (
                    <Image
                        alt={article.image.altText || article.title}
                        data={article.image}
                        sizes="(min-width: 45em) 400px, 100vw"
                        className={cn(
                            "w-full h-full object-cover motion-image",
                            canHover && "group-hover:scale-105"
                        )}
                    />
                ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                        <Newspaper className="size-12 text-primary/30" />
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <h3 className="font-serif text-base font-medium leading-snug text-primary line-clamp-2">
                    {article.title}
                </h3>
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
// ERROR BOUNDARY
// =============================================================================

/**
 * Search-specific error boundary.
 * Shows contextual "Search Unavailable" with offline detection.
 */
export function ErrorBoundary() {
    const error = useRouteError();
    let statusCode = 500;
    let errorMessage: string | undefined;

    if (isRouteErrorResponse(error)) {
        statusCode = error.status;
        errorMessage = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    // Track error via analytics (SSR-safe, runs on client only)
    const errorType = isRouteErrorResponse(error) ? "route_error" : "js_error";
    if (typeof window !== "undefined") {
        setTimeout(() => trackErrorBoundary(statusCode, errorType, "search"), 0);
    }

    // Contextual title for search errors
    const title = "Search Unavailable";

    return <OfflineAwareErrorPage statusCode={statusCode} title={title} message={errorMessage} />;
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    title
    trackingParameters
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
    }
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    media(first: 5) {
      nodes {
        __typename
        ... on MediaImage {
          id
          alt
          image {
            id
            url
            altText
            width
            height
          }
        }
        ... on Video {
          id
          alt
          sources {
            url
            mimeType
            width
            height
          }
          previewImage {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
` as const;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
` as const;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
    excerpt(truncateAt: 150)
    publishedAt
    image {
      id
      url
      altText
      width
      height
    }
    blog {
      handle
      title
    }
  }
` as const;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
` as const;

const SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment SearchCollection on Collection {
    __typename
    id
    handle
    title
    description
    image {
      id
      url
      altText
      width
      height
    }
    products(first: 1) {
      nodes {
        id
        availableForSale
      }
    }
  }
` as const;

// Query for searching collections by title
const SEARCH_COLLECTIONS_QUERY = `#graphql
  query SearchCollections(
    $country: CountryCode
    $language: LanguageCode
    $query: String!
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    collections(query: $query, first: $first, sortKey: RELEVANCE) {
      nodes {
        ...SearchCollection
      }
      totalCount
    }
  }
  ${SEARCH_COLLECTION_FRAGMENT}
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $productFirst: Int!
    $productAfter: String
    $articleFirst: Int!
    $articleAfter: String
    $sortKey: SearchSortKeys!
    $reverse: Boolean!
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $term,
      types: [PRODUCT],
      first: $productFirst,
      after: $productAfter,
      sortKey: $sortKey,
      reverse: $reverse,
      unavailableProducts: SHOW,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
      totalCount
    }
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $articleFirst,
      after: $articleAfter,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
      totalCount
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

// Query for fetching more products (infinite scroll)
const SEARCH_PRODUCTS_QUERY = `#graphql
  query SearchProducts(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $first: Int!
    $after: String
    $sortKey: SearchSortKeys!
    $reverse: Boolean!
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $term,
      types: [PRODUCT],
      first: $first,
      after: $after,
      sortKey: $sortKey,
      reverse: $reverse,
      unavailableProducts: SHOW,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
` as const;

// Query for fetching more articles (infinite scroll)
const SEARCH_ARTICLES_QUERY = `#graphql
  query SearchArticles(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $first: Int!
    $after: String
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $first,
      after: $after,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${SEARCH_ARTICLE_FRAGMENT}
` as const;

/**
 * Search result type for the new categorized search
 */
export interface CategorizedSearchResult {
    type: "categorized";
    term: string;
    error?: string;
    products: {
        nodes: SearchProduct[];
        pageInfo: {hasNextPage: boolean; endCursor: string | null};
        totalCount: number;
    };
    collections: {
        nodes: SearchCollection[];
        totalCount: number;
    };
    articles: {
        nodes: SearchArticle[];
        pageInfo: {hasNextPage: boolean; endCursor: string | null};
        totalCount: number;
    };
}

/**
 * Collection type from search
 */
export type SearchCollection = {
    __typename: "Collection";
    id: string;
    handle: string;
    title: string;
    description: string;
    image: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
};

/**
 * Article type from search with enhanced fields
 */
export type SearchArticle = {
    __typename: "Article";
    id: string;
    handle: string;
    title: string;
    trackingParameters: string | null;
    excerpt: string | null;
    publishedAt: string;
    image: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
    blog: {
        handle: string;
        title: string;
    };
};

/**
 * Escapes special characters in search terms for Shopify's search query syntax.
 * Special characters: : \ ( ) " ' * -
 * @see https://shopify.dev/docs/api/usage/search-syntax
 */
function escapeSearchTerm(term: string): string {
    // Escape special characters that have meaning in Shopify search syntax
    return term.replace(/[:\\()\"\'*\-]/g, "\\$&");
}

/**
 * Builds a safe collections query string.
 * Uses only trailing wildcard (prefix query) as leading wildcards are not supported.
 * @see https://shopify.dev/docs/api/usage/search-syntax#search-query-syntax
 */
function buildCollectionsQuery(term: string): string {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return "";

    const escapedTerm = escapeSearchTerm(trimmedTerm);
    // Use trailing wildcard only (prefix query) - leading wildcards are not supported
    return `title:${escapedTerm}*`;
}

/**
 * Fetches collections matching the search term with error handling.
 * Returns empty result on failure to prevent breaking the entire search.
 */
async function fetchCollections(
    dataAdapter: Route.LoaderArgs["context"]["dataAdapter"],
    term: string
): Promise<{nodes: SearchCollection[]; totalCount: number}> {
    const emptyResult = {nodes: [], totalCount: 0};

    const query = buildCollectionsQuery(term);
    if (!query) return emptyResult;

    try {
        const result = await dataAdapter.query(SEARCH_COLLECTIONS_QUERY, {
            variables: {
                query,
                first: 20
            }
        });

        const {collections} = result as {
            collections: {
                nodes: Array<SearchCollection & {products: {nodes: Array<{id: string; availableForSale: boolean}>}}>;
                totalCount: string | number;
            };
        };

        // Filter out collections with no available products
        const filteredNodes = collections.nodes.filter(collection =>
            collection.products.nodes.some(p => p.availableForSale)
        );

        return {
            nodes: filteredNodes,
            totalCount: filteredNodes.length
        };
    } catch (error) {
        // Log the error but don't fail the entire search
        console.error("Collections search failed:", error);
        return emptyResult;
    }
}

/**
 * Regular search fetcher - fetches products, articles, and collections
 */
async function regularSearch({
    request,
    context
}: Pick<Route.LoaderArgs, "request" | "context">): Promise<CategorizedSearchResult> {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const term = String(url.searchParams.get("q") || "");
    const searchSortOption = getSearchSortOption(url.searchParams.get("sort"));

    // Execute search and collections queries in parallel
    // Collections query is wrapped with error handling to prevent cascading failures
    const [searchResult, collectionsResult] = await Promise.all([
        dataAdapter.query(SEARCH_QUERY, {
            variables: {
                term,
                productFirst: 24,
                articleFirst: 12,
                sortKey: searchSortOption.sortKey,
                reverse: searchSortOption.reverse
            }
        }),
        fetchCollections(dataAdapter, term)
    ]);

    const {products, articles, errors} = searchResult as {
        products: CategorizedSearchResult["products"];
        articles: CategorizedSearchResult["articles"];
        errors?: Array<{message: string}>;
    };

    const error = errors ? errors.map(({message}: {message: string}) => message).join(", ") : undefined;

    // Keep promoted products pinned first even when the backend sort changes.
    const sortedProducts = sortWithPinnedFirst(products.nodes as SearchProduct[]);

    return {
        type: "categorized",
        term,
        error,
        products: {
            nodes: sortedProducts,
            pageInfo: {
                hasNextPage: products.pageInfo.hasNextPage,
                endCursor: products.pageInfo.endCursor ?? null
            },
            totalCount: products.totalCount
        },
        collections: collectionsResult,
        articles: {
            nodes: articles.nodes as SearchArticle[],
            pageInfo: {
                hasNextPage: articles.pageInfo.hasNextPage,
                endCursor: articles.pageInfo.endCursor ?? null
            },
            totalCount: articles.totalCount
        }
    };
}

/**
 * Fetches more products for infinite scroll
 */
async function fetchMoreProducts({request, context}: Pick<Route.LoaderArgs, "request" | "context">) {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const term = String(url.searchParams.get("q") || "");
    const cursor = url.searchParams.get("cursor");
    const searchSortOption = getSearchSortOption(url.searchParams.get("sort"));

    const {products} = (await dataAdapter.query(SEARCH_PRODUCTS_QUERY, {
        variables: {
            term,
            first: 24,
            after: cursor,
            sortKey: searchSortOption.sortKey,
            reverse: searchSortOption.reverse
        }
    })) as {products: {nodes: SearchProduct[]; pageInfo: {hasNextPage: boolean; endCursor: string | null}}};

    // Keep promoted products pinned first even when the backend sort changes.
    const sortedProducts = sortWithPinnedFirst(products.nodes);

    return {
        type: "products" as const,
        products: sortedProducts,
        pageInfo: {
            hasNextPage: products.pageInfo.hasNextPage,
            endCursor: products.pageInfo.endCursor
        }
    };
}

/**
 * Fetches more articles for infinite scroll
 */
async function fetchMoreArticles({request, context}: Pick<Route.LoaderArgs, "request" | "context">) {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const term = String(url.searchParams.get("q") || "");
    const cursor = url.searchParams.get("cursor");

    const {articles} = (await dataAdapter.query(SEARCH_ARTICLES_QUERY, {
        variables: {
            term,
            first: 12,
            after: cursor
        }
    })) as {articles: {nodes: SearchArticle[]; pageInfo: {hasNextPage: boolean; endCursor: string | null}}};

    return {
        type: "articles" as const,
        articles: articles.nodes,
        pageInfo: {
            hasNextPage: articles.pageInfo.hasNextPage,
            endCursor: articles.pageInfo.endCursor
        }
    };
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
    products(first: 1) {
      nodes {
        id
        availableForSale
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    availableForSale
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
` as const;

/**
 * Predictive search fetcher
 */
async function predictiveSearch({
    request,
    context
}: Pick<Route.ActionArgs, "request" | "context">): Promise<PredictiveSearchReturn> {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const term = String(url.searchParams.get("q") || "").trim();
    const limit = Number(url.searchParams.get("limit") || 10);
    const type = "predictive";

    if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

    // Predictively search articles, collections, pages, products, and queries (suggestions)
    const {predictiveSearch: items, errors}: PredictiveSearchQuery & {errors?: Array<{message: string}>} =
        await dataAdapter.query(PREDICTIVE_SEARCH_QUERY, {
            variables: {
                // customize search options as needed
                limit,
                limitScope: "EACH",
                term
            }
        });

    if (errors) {
        throw new Error(`Shopify API errors: ${errors.map(({message}: {message: string}) => message).join(", ")}`);
    }

    if (!items) {
        throw new Error("No predictive search data returned from Shopify API");
    }

    // All products (including OOS) are surfaced in predictive search results
    const total = Object.values(items).reduce((acc: number, item: Array<unknown>) => acc + item.length, 0);

    return {type, term, result: {items, total}};
}
