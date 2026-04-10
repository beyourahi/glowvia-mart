/**
 * @fileoverview Account Wishlist Route - Full Featured
 *
 * @description
 * Displays wishlist products within the authenticated account area with all
 * features from the public wishlist page: sharing, bulk cart actions, view
 * options (grid/list, sorting, columns), and confirmation dialogs.
 *
 * @route GET /account/wishlist
 *
 * @authentication
 * Requires customer authentication (enforced by parent account layout).
 * Wishlist data stored in localStorage (browser-specific, not server-side).
 *
 * @features
 * - Share wishlist via social media (Twitter, Facebook, WhatsApp, email, copy)
 * - Add all items to cart in bulk
 * - Grid/list layout toggle with column options (2-4)
 * - Client-side sorting (date added, price ascending/descending)
 * - Clear all with confirmation dialog
 * - View options persistence in localStorage
 *
 * @data-loading
 * - Loader: No server data (wishlist is localStorage-based)
 * - Client hydration: Reads wishlist IDs from localStorage
 * - Product fetching: Client-side via /api/wishlist-products
 * - Prevents duplicate fetches with submittedIds tracking
 *
 * @related
 * - wishlist.tsx - Public shareable wishlist page (feature parity)
 * - api.wishlist-products.tsx - Product data endpoint
 * - lib/wishlist-context.tsx - Wishlist state management
 * - WishlistButton.tsx - Add/remove from wishlist
 */

import {useEffect, useState} from "react";
import {Link, useFetcher} from "react-router";
import type {Route} from "./+types/account.wishlist";
import {Heart, ShoppingBag, Trash2, HeartIcon, Share2, ShoppingCart, Loader2, Check, X} from "lucide-react";
import {CartForm, getSeoMeta, type OptimisticCartLineInput} from "@shopify/hydrogen";
import type {ProductItemFragment} from "storefrontapi.generated";
import {useWishlist} from "~/lib/wishlist-context";
import {reconstructGids, encodeWishlistIds} from "~/lib/wishlist-utils";
import {useSiteSettings} from "~/lib/site-content-context";
import {
    getSocialSharePlatforms,
    openShareWindow,
    trackShareEvent,
    createShareAnalytics,
    type ShareData,
    type SocialSharePlatform
} from "~/lib/social-share";
import {ProductItem} from "~/components/ProductItem";
import {ProductCardSkeleton, ProductListSkeleton} from "~/components/skeletons";
import {Button} from "~/components/ui/button";
import {Card, CardContent} from "~/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "~/components/ui/dialog";
import {AnimatedSection} from "~/components/AnimatedSection";
import {useScrollLock} from "~/hooks/useScrollLock";
import {toast} from "sonner";
import {cn} from "~/lib/utils";
import {buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {useScreenSize} from "~/hooks/useScreenSize";
import {
    type GridColumns,
    getGridClassName,
    isColumnOptionVisible,
    getDefaultColumnsForScreenSize,
    constrainColumnsToScreenSize
} from "~/lib/gridColumns";

// =============================================================================
// TYPES
// =============================================================================

type LayoutMode = "grid" | "list";
type WishlistSortOption = "date-newest" | "date-oldest" | "price-asc" | "price-desc";

// =============================================================================
// META & LOADER
// =============================================================================

// Intentionally indexable: /account/wishlist is a publicly accessible route (no auth required)
// with full SEO investment. robots.txt has an explicit Allow:/account/wishlist above
// Disallow:/account so crawlers can reach shareable wishlist URLs. Do NOT add noindex here.
export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    return (
        getSeoMeta({
            title: "Wishlist",
            description:
                "Your curated collection of favorites. Save the pieces you love and find them all in one place.",
            url: buildCanonicalUrl("/account/wishlist", siteUrl)
        }) ?? []
    );
};

export async function loader({context}: Route.LoaderArgs) {
    // Wishlist is localStorage-based, no server data needed
    // Publicly accessible - no authentication required
    return {};
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to manage grid columns with localStorage persistence
 * Uses separate key from collections to maintain independent preferences
 */
function useWishlistGridColumns(): [GridColumns, (columns: GridColumns) => void] {
    const {screenSize, isHydrated} = useScreenSize();
    const [columns, setColumns] = useState<GridColumns>(3);
    const [rawPreference, setRawPreference] = useState<GridColumns | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("wishlist-grid-columns");
        if (stored && ["1", "2", "3", "4"].includes(stored)) {
            setRawPreference(parseInt(stored) as GridColumns);
        }
    }, []);

    // Compute effective columns based on screen size constraints
    useEffect(() => {
        if (!isHydrated) return;
        const preference = rawPreference ?? getDefaultColumnsForScreenSize(screenSize);
        const constrained = constrainColumnsToScreenSize(preference, screenSize);
        setColumns(constrained);
    }, [screenSize, rawPreference, isHydrated]);

    const updateColumns = (newColumns: GridColumns) => {
        setRawPreference(newColumns);
        localStorage.setItem("wishlist-grid-columns", newColumns.toString());
        const constrained = constrainColumnsToScreenSize(newColumns, screenSize);
        setColumns(constrained);
    };

    return [columns, updateColumns];
}

/**
 * Hook to manage layout mode with localStorage persistence
 */
function useWishlistLayoutMode(): [LayoutMode, (mode: LayoutMode) => void] {
    const [mode, setMode] = useState<LayoutMode>("grid");

    useEffect(() => {
        const stored = localStorage.getItem("wishlist-layout-mode");
        if (stored === "grid" || stored === "list") {
            setMode(stored);
        }
    }, []);

    const updateMode = (newMode: LayoutMode) => {
        setMode(newMode);
        localStorage.setItem("wishlist-layout-mode", newMode);
    };

    return [mode, updateMode];
}

/**
 * Hook to manage wishlist sort option with localStorage persistence
 */
function useWishlistSort(): [WishlistSortOption, (sort: WishlistSortOption) => void] {
    const [sort, setSort] = useState<WishlistSortOption>("date-newest");

    useEffect(() => {
        const stored = localStorage.getItem("wishlist-sort");
        if (["date-newest", "date-oldest", "price-asc", "price-desc"].includes(stored ?? "")) {
            setSort(stored as WishlistSortOption);
        }
    }, []);

    const updateSort = (newSort: WishlistSortOption) => {
        setSort(newSort);
        localStorage.setItem("wishlist-sort", newSort);
    };

    return [sort, updateSort];
}

/**
 * Sort products based on the selected option
 */
function sortProducts(products: ProductItemFragment[], sortOption: WishlistSortOption): ProductItemFragment[] {
    const sorted = [...products];

    switch (sortOption) {
        case "date-newest":
            return sorted;
        case "date-oldest":
            return sorted.reverse();
        case "price-asc":
            return sorted.sort((a, b) => {
                const priceA = parseFloat(a.priceRange.minVariantPrice.amount);
                const priceB = parseFloat(b.priceRange.minVariantPrice.amount);
                return priceA - priceB;
            });
        case "price-desc":
            return sorted.sort((a, b) => {
                const priceA = parseFloat(a.priceRange.minVariantPrice.amount);
                const priceB = parseFloat(b.priceRange.minVariantPrice.amount);
                return priceB - priceA;
            });
        default:
            return sorted;
    }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AccountWishlist() {
    const {ids, count, isHydrated, clear} = useWishlist();
    const fetcher = useFetcher<{products: ProductItemFragment[]; error: string | null}>();
    const [submittedIds, setSubmittedIds] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // View options state
    const [gridColumns, setGridColumns] = useWishlistGridColumns();
    const [layoutMode, setLayoutMode] = useWishlistLayoutMode();
    const [sortOption, setSortOption] = useWishlistSort();

    // Lock body scroll when dialog is open
    useScrollLock(dialogOpen);

    // Fetch products when wishlist IDs are available
    useEffect(() => {
        if (!isHydrated) return;
        if (ids.length === 0) return;

        const idsKey = ids.join(",");
        if (submittedIds === idsKey) return;
        if (fetcher.state !== "idle") return;

        const gids = reconstructGids(ids);
        const formData = new FormData();
        formData.set("ids", JSON.stringify(gids));

        void fetcher.submit(formData, {
            method: "POST",
            action: "/api/wishlist-products"
        });

        setSubmittedIds(idsKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHydrated, ids, fetcher.state, submittedIds]);

    const handleClearAll = () => {
        clear();
        setDialogOpen(false);
        toast.success("Wishlist cleared", {
            description: "All items have been removed from your wishlist"
        });
    };

    const hasData = fetcher.data !== undefined;
    const isLoading = fetcher.state !== "idle" || (!hasData && ids.length > 0);

    const rawProducts = fetcher.data?.products ?? [];
    const products = sortProducts(rawProducts, sortOption);

    const gridClassName = getGridClassName(gridColumns, layoutMode);

    if (!isHydrated || isLoading) {
        return (
            <div className="space-y-10 md:space-y-14 lg:space-y-16">
                <WishlistHeader count={null} ids={ids} products={[]} onClearClick={() => setDialogOpen(true)} />
                <WishlistViewOptionsSelector
                    gridColumns={gridColumns}
                    onGridColumnsChange={setGridColumns}
                    layoutMode={layoutMode}
                    onLayoutModeChange={setLayoutMode}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                />
                <WishlistSkeleton count={ids.length || 8} layoutMode={layoutMode} />
            </div>
        );
    }

    if (count === 0) {
        return (
            <div className="space-y-10 md:space-y-14 lg:space-y-16">
                <AnimatedSection animation="hero" threshold={0.1}>
                    <WishlistHeader count={0} ids={[]} products={[]} onClearClick={() => setDialogOpen(true)} />
                </AnimatedSection>
                <AnimatedSection animation="section" threshold={0.1} delay={100}>
                    <WishlistEmpty />
                </AnimatedSection>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-10 md:space-y-14 lg:space-y-16">
                <AnimatedSection animation="hero" threshold={0.1}>
                    <WishlistHeader
                        count={count}
                        ids={ids}
                        products={products}
                        onClearClick={() => setDialogOpen(true)}
                    />
                </AnimatedSection>

                <WishlistViewOptionsSelector
                    gridColumns={gridColumns}
                    onGridColumnsChange={setGridColumns}
                    layoutMode={layoutMode}
                    onLayoutModeChange={setLayoutMode}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                />

                <AnimatedSection animation="section" threshold={0.1} delay={100}>
                    {products.length > 0 ? (
                        <div className={gridClassName}>
                            {products.map((product, index) => (
                                <ProductItem
                                    key={product.id}
                                    product={product}
                                    loading={index < 4 ? "eager" : "lazy"}
                                    variant={layoutMode === "list" ? "list" : "card"}
                                    index={index}
                                    gridColumns={gridColumns}
                                />
                            ))}
                        </div>
                    ) : (
                        <WishlistUnavailable onClearClick={() => setDialogOpen(true)} />
                    )}
                </AnimatedSection>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-2xl p-8 sm:max-w-md border-none" showCloseButton={false}>
                    <DialogHeader className="space-y-3 pr-0 sm:pr-0">
                        <DialogTitle className="font-serif text-2xl font-medium text-primary md:text-3xl">
                            Clear Wishlist
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                            Remove all {count} saved {count === 1 ? "item" : "items"} from your wishlist?
                        </DialogDescription>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground/80 text-center sm:text-left">
                        This action cannot be undone.
                    </p>

                    <DialogFooter className="mt-2 flex-col gap-3 sm:flex-row sm:gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Keep Items
                        </Button>
                        <Button type="button" onClick={handleClearAll} className="w-full sm:w-auto">
                            Clear All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// =============================================================================
// VIEW OPTIONS SELECTOR
// =============================================================================

interface WishlistViewOptionsSelectorProps {
    gridColumns: GridColumns;
    onGridColumnsChange: (columns: GridColumns) => void;
    layoutMode: LayoutMode;
    onLayoutModeChange: (mode: LayoutMode) => void;
    sortOption: WishlistSortOption;
    onSortChange: (sort: WishlistSortOption) => void;
}

type PillOption =
    | {id: string; label: string; type: "sort"; value: WishlistSortOption}
    | {id: string; label: string; type: "grid"; value: GridColumns}
    | {id: string; label: string; type: "layout"; value: "list"};

const WISHLIST_PILL_OPTIONS: PillOption[] = [
    {id: "newest", label: "Newest", type: "sort", value: "date-newest"},
    {id: "oldest", label: "Oldest", type: "sort", value: "date-oldest"},
    {id: "price-low", label: "Price ↑", type: "sort", value: "price-asc"},
    {id: "price-high", label: "Price ↓", type: "sort", value: "price-desc"},
    {id: "2col", label: "2-Col", type: "grid", value: 2},
    {id: "3col", label: "3-Col", type: "grid", value: 3},
    {id: "4col", label: "4-Col", type: "grid", value: 4},
    {id: "list", label: "List", type: "layout", value: "list"}
];

function WishlistViewOptionsSelector({
    gridColumns,
    onGridColumnsChange,
    layoutMode,
    onLayoutModeChange,
    sortOption,
    onSortChange
}: WishlistViewOptionsSelectorProps) {
    const {screenSize, isHydrated} = useScreenSize();

    const handlePillClick = (option: PillOption) => {
        if (option.type === "sort") {
            onSortChange(option.value);
        } else if (option.type === "grid") {
            if (layoutMode === "list") {
                onLayoutModeChange("grid");
            }
            onGridColumnsChange(option.value);
        } else if (option.type === "layout") {
            onLayoutModeChange("list");
        }
    };

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

    const sortOptions = WISHLIST_PILL_OPTIONS.filter(option => option.type === "sort");
    const gridOptions = WISHLIST_PILL_OPTIONS.filter(option => {
        if (option.type !== "grid") return false;
        if (!isHydrated) return [2, 3, 4].includes(option.value);
        return isColumnOptionVisible(option.value, screenSize);
    });
    const layoutOptions = WISHLIST_PILL_OPTIONS.filter(option => option.type === "layout");

    const renderPill = (option: PillOption) => {
        const isActive = isPillActive(option);
        return (
            <Button
                key={option.id}
                type="button"
                variant={isActive ? "default" : "outline"}
                onClick={() => handlePillClick(option)}
                className={cn("min-h-11 md:min-h-0 text-sm md:text-base", "active:scale-95")}
            >
                {option.label}
            </Button>
        );
    };

    return (
        <div className="mb-6">
            <div className="md:hidden overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 snap-x snap-mandatory pb-2">
                    {sortOptions.map(option => (
                        <div key={option.id} className="snap-start shrink-0">
                            {renderPill(option)}
                        </div>
                    ))}
                    <div className="w-px h-6 bg-primary/20 shrink-0" aria-hidden="true" />
                    {gridOptions.map(option => (
                        <div key={option.id} className="snap-start shrink-0">
                            {renderPill(option)}
                        </div>
                    ))}
                    {layoutOptions.map(option => (
                        <div key={option.id} className="snap-start shrink-0">
                            {renderPill(option)}
                        </div>
                    ))}
                </div>
            </div>

            <div className="hidden md:flex flex-wrap items-center justify-end gap-3">
                <div className="flex items-center gap-2">{sortOptions.map(renderPill)}</div>
                <div className="w-px h-6 bg-primary/20" aria-hidden="true" />
                <div className="flex items-center gap-2">
                    {gridOptions.map(renderPill)}
                    {layoutOptions.map(renderPill)}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// SHARE DIALOG
// =============================================================================

function SharePlatformButton({
    platform,
    shareData,
    wishlistId
}: {
    platform: SocialSharePlatform;
    shareData: ShareData;
    wishlistId: string;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);

    const handleShare = async () => {
        setIsLoading(true);
        setShowSuccess(false);
        setShowError(false);

        try {
            void trackShareEvent(createShareAnalytics(platform.id, wishlistId, "wishlist"));

            if (platform.customHandler) {
                await platform.customHandler(
                    shareData,
                    () => {
                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 2000);
                    },
                    () => {
                        setShowError(true);
                        setTimeout(() => setShowError(false), 2000);
                    }
                );
            } else {
                const shareUrl = platform.url(shareData);
                openShareWindow(shareUrl, `Share on ${platform.name}`);
            }
        } catch {
            if (platform.id === "copy") {
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const Icon = platform.icon;

    const getDisplayText = () => {
        if (showSuccess && platform.id === "copy") return "Copied!";
        if (showError && platform.id === "copy") return "Failed";
        return platform.name;
    };

    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => void handleShare()}
            disabled={isLoading}
            className="group min-h-11 active:scale-95"
        >
            {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
            ) : showSuccess ? (
                <Check className="size-4 text-success" />
            ) : showError ? (
                <X className="size-4 text-destructive" />
            ) : (
                <Icon className="size-4 sleek group-hover:text-primary-foreground" />
            )}
            <span className="text-sm">{getDisplayText()}</span>
        </Button>
    );
}

interface WishlistShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ids: number[];
    products: ProductItemFragment[];
}

function WishlistShareDialog({open, onOpenChange, ids, products}: WishlistShareDialogProps) {
    const {siteUrl, brandName} = useSiteSettings();

    useScrollLock(open);

    const encoded = encodeWishlistIds(ids);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : siteUrl;
    const shareUrl = `${baseUrl}/wishlist/share?ids=${encoded}`;

    const shareData: ShareData = {
        title: "My Wishlist",
        description: `Check out my curated wishlist with ${ids.length} item${ids.length !== 1 ? "s" : ""}${brandName ? ` from ${brandName}` : ""}!`,
        url: shareUrl,
        price: `${ids.length} item${ids.length !== 1 ? "s" : ""}`,
        shopName: brandName
    };

    const platforms = getSocialSharePlatforms();
    const socialPlatforms = platforms.filter(p => p.id !== "copy");
    const copyPlatform = platforms.find(p => p.id === "copy");

    const previewImages = products
        .slice(0, 4)
        .map(p => p.featuredImage)
        .filter(Boolean);

    const wishlistId = `wishlist-${ids.length}-${Date.now()}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl border-none">
                <DialogHeader className="space-y-3 pr-0 sm:pr-0">
                    <DialogTitle className="text-lg font-semibold">Share Your Wishlist</DialogTitle>
                    <DialogDescription className="sr-only">
                        Share your wishlist with {ids.length} items with friends and family
                    </DialogDescription>

                    <div className="flex flex-col items-center gap-3 rounded-2xl bg-linear-to-br from-primary/5 to-primary/10 p-5">
                        {previewImages.length > 0 && (
                            <div className="flex -space-x-3">
                                {previewImages.map((image, index) => (
                                    <div
                                        key={image?.id || index}
                                        className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-card shadow-md ring-2 ring-primary/20"
                                        style={{zIndex: previewImages.length - index}}
                                    >
                                        <img
                                            src={image?.url}
                                            alt={image?.altText || `Product ${index + 1}`}
                                            className="size-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                                {ids.length > 4 && (
                                    <div
                                        className="relative flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary font-semibold text-sm ring-2 ring-primary/20"
                                        style={{zIndex: 0}}
                                    >
                                        +{ids.length - 4}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="space-y-1 text-center">
                            <h3 className="text-base font-semibold text-foreground">My Wishlist</h3>
                            <p className="text-sm text-muted-foreground">
                                {ids.length} curated {ids.length === 1 ? "item" : "items"}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex flex-wrap justify-center gap-2">
                        {socialPlatforms.map(platform => (
                            <SharePlatformButton
                                key={platform.id}
                                platform={platform}
                                shareData={shareData}
                                wishlistId={wishlistId}
                            />
                        ))}
                        {copyPlatform && (
                            <SharePlatformButton
                                platform={copyPlatform}
                                shareData={shareData}
                                wishlistId={wishlistId}
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// =============================================================================
// HEADER
// =============================================================================

interface WishlistHeaderProps {
    count: number | null;
    ids: number[];
    products: ProductItemFragment[];
    onClearClick: () => void;
}

function WishlistHeader({count, ids, products, onClearClick}: WishlistHeaderProps) {
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    const cartLines: OptimisticCartLineInput[] = products
        .filter(product => product.variants?.nodes?.length > 0)
        .map(product => {
            const variant = product.variants.nodes.find(v => v.availableForSale) || product.variants.nodes[0];
            return {
                merchandiseId: variant.id,
                quantity: 1
            };
        });

    const hasCartableProducts = cartLines.length > 0;

    return (
        <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 md:size-12 rounded-2xl bg-muted/50 shrink-0">
                            <HeartIcon className="size-5 md:size-6 text-muted-foreground" />
                        </div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-foreground tracking-tight my-0">
                            Wishlist
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base pl-0 md:pl-15">
                        {count === null
                            ? "Loading your saved items..."
                            : count === 0
                              ? "Save your favorite products here"
                              : `${count} ${count === 1 ? "item" : "items"} saved for later`}
                    </p>
                </div>

                {count !== null && count > 0 && (
                    <>
                        <div className="hidden sm:flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShareDialogOpen(true)}
                                className="gap-2 min-h-10"
                            >
                                <Share2 className="size-4" />
                                Share
                            </Button>
                            {hasCartableProducts && <AddAllToCartButton lines={cartLines} />}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onClearClick}
                                className="gap-2 min-h-10"
                            >
                                <Trash2 className="size-4" />
                                Clear all
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-3 sm:hidden">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShareDialogOpen(true)}
                                className="gap-2"
                            >
                                <Share2 className="size-4" />
                                Share
                            </Button>
                            {hasCartableProducts && <AddAllToCartButton lines={cartLines} isMobile />}
                            <Button type="button" variant="outline" size="sm" onClick={onClearClick} className="gap-2">
                                <Trash2 className="size-4" />
                                Clear all
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <WishlistShareDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                ids={ids}
                products={products}
            />
        </>
    );
}

function AddAllToCartButton({lines, isMobile = false}: {lines: OptimisticCartLineInput[]; isMobile?: boolean}) {
    const [hasShownToast, setHasShownToast] = useState(false);

    return (
        <CartForm fetcherKey="cart-mutation" route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
            {fetcher => (
                <AddAllToCartButtonContent
                    fetcher={fetcher}
                    lines={lines}
                    isMobile={isMobile}
                    hasShownToast={hasShownToast}
                    setHasShownToast={setHasShownToast}
                />
            )}
        </CartForm>
    );
}

function AddAllToCartButtonContent({
    fetcher,
    lines,
    isMobile,
    hasShownToast,
    setHasShownToast
}: {
    fetcher: {state: string; data: unknown};
    lines: OptimisticCartLineInput[];
    isMobile: boolean;
    hasShownToast: boolean;
    setHasShownToast: (value: boolean) => void;
}) {
    const isAdding = fetcher.state !== "idle";

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data && !hasShownToast) {
            toast.success(`Added ${lines.length} item${lines.length !== 1 ? "s" : ""} to cart`, {
                description: "Items remain in your wishlist"
            });
            setHasShownToast(true);
        }
        if (fetcher.state !== "idle" && hasShownToast) {
            setHasShownToast(false);
        }
    }, [fetcher.state, fetcher.data, lines.length, hasShownToast, setHasShownToast]);

    return (
        <Button type="submit" disabled={isAdding} size="sm" className="gap-2 min-h-10">
            {isAdding ? <Loader2 className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
            {isAdding ? "Adding..." : "Add All"}
        </Button>
    );
}

// =============================================================================
// EMPTY & UNAVAILABLE STATES
// =============================================================================

function WishlistEmpty() {
    return (
        <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-20 text-center px-6">
                <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 mb-6 shadow-inner">
                    <Heart className="size-10 md:size-12 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-2">
                    Your wishlist is empty
                </h3>
                <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm leading-relaxed">
                    Save products you love by clicking the heart icon. They&apos;ll appear here for easy access.
                </p>
                <Button asChild size="lg" className="gap-2 motion-interactive">
                    <Link to="/collections/all-products">
                        <ShoppingBag className="size-4" />
                        Start Shopping
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function WishlistUnavailable({onClearClick}: {onClearClick: () => void}) {
    return (
        <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-20 text-center px-6">
                <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 mb-6 shadow-inner">
                    <Heart className="size-10 md:size-12 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-2">
                    Some products are unavailable
                </h3>
                <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm leading-relaxed">
                    Some products in your wishlist are no longer available. They may have been removed or sold out.
                </p>
                <Button onClick={onClearClick} variant="outline" size="lg" className="gap-2 motion-interactive">
                    <Trash2 className="size-4" />
                    Clear unavailable items
                </Button>
            </CardContent>
        </Card>
    );
}

// =============================================================================
// SKELETON
// =============================================================================

function WishlistSkeleton({count = 8, layoutMode = "grid"}: {count?: number; layoutMode?: LayoutMode}) {
    const skeletonCount = Math.min(count, 12);

    if (layoutMode === "list") {
        return (
            <div className="flex flex-col gap-0 mb-8">
                {Array.from({length: skeletonCount}).map((_, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <ProductListSkeleton key={`wishlist-list-skeleton-${index}`} animate />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({length: skeletonCount}).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <ProductCardSkeleton key={`wishlist-skeleton-${index}`} index={index} animate />
            ))}
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
