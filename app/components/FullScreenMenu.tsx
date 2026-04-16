/**
 * @fileoverview Full-screen mobile navigation menu with slide-from-left animation
 *
 * @description
 * FullScreenMenu is a Radix UI Dialog overlay that displays the main navigation menu
 * on mobile devices. It organizes collections, account links, and policies into a
 * multi-column grid that adapts from mobile to desktop breakpoints.
 *
 * @features
 * - Native iOS-style slide-from-left animation
 * - Auto-organizing collections into Featured/Categories columns
 * - Conditional blog link (only shown if blogs exist)
 * - SALE link with product count (only shown if discounted products exist)
 * - Staggered fade-in animations for menu items
 * - Search button on mobile (opens FullScreenSearch)
 * - PWA "Open in App" button
 * - Safe area insets for iOS notch/Dynamic Island
 * - Body scroll locking via Radix Dialog
 * - ESC key and backdrop click to close
 *
 * @architecture
 * Menu organized into 4 columns (responsive):
 * 1. Featured - All Products, All Collections, SALE (if discounts), featured collections
 * 2. Categories - All other collections
 * 3. Account & Info - Account, Orders, Wishlist, Gallery, FAQ, Contact, Blogs (conditional)
 * 4. Policies - Shipping, Refund, Privacy, Terms
 *
 * @props
 * - collections: Array of collections with handle, title, productsCount
 * - totalProductCount: Total products for "All Products" count
 * - discountCount: Count of discounted products (shows SALE link if > 0)
 * - hasBlog: Whether blogs exist (shows blog link if true)
 *
 * @animations
 * - Overlay: Fade in/out (500ms in, 300ms out)
 * - Content: Slide from left + fade (400ms in, 300ms out)
 * - Menu items: Staggered slide-up-fade (50ms intervals, max 400ms)
 *
 * @accessibility
 * - Radix Dialog handles focus trap, body scroll lock, ESC key
 * - ARIA labels for navigation regions
 * - 44px minimum touch targets for mobile
 * - Keyboard navigation support
 * - Screen reader-friendly hidden labels
 *
 * @related
 * - PageLayout.tsx - Renders FullScreenMenu with data from root loader
 * - Aside.tsx - Controls menu open/close state
 * - Header.tsx - Menu button triggers aside.open("mobile")
 * - FullScreenSearch.tsx - Similar overlay for search
 * - OpenInAppButton.tsx - PWA prompt component
 *
 * @example
 * ```tsx
 * <FullScreenMenu
 *   collections={collections}
 *   totalProductCount={500}
 *   discountCount={50}
 *   hasBlog={true}
 * />
 * ```
 */

import {useEffect, useCallback, useMemo} from "react";
import {Link} from "react-router";
import * as Dialog from "@radix-ui/react-dialog";
import {useAside} from "~/components/Aside";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {useScrollLock} from "~/hooks/useScrollLock";
import {useSiteSettings} from "~/lib/site-content-context";
import {OpenInAppButton} from "~/components/pwa/OpenInAppButton";
import type {MenuCollection} from "types";

// ================================================================================
// Type Definitions & Constants
// ================================================================================

interface FullScreenMenuProps {
    collections: MenuCollection[];
    totalCollections: number;
    totalProductCount: number;
    discountCount: number;
    hasBlog: boolean;
}

// Featured collection handles (Column 1)
const FEATURED_HANDLES = [
    "all-products",
    "all-collections",
    "sale",
    "new-arrivals",
    "bestsellers",
    "best-sellers",
    "featured",
    "staples"
];

// Account/Info links (Column 3) - Blog link is handled separately
const ACCOUNT_LINKS = [
    {title: "Account", url: "/account"},
    {title: "Order History", url: "/account/orders"},
    {title: "Wishlist", url: "/account/wishlist"},
    {title: "Gallery", url: "/gallery"},
    {title: "Changelog", url: "/changelog"},
    {title: "FAQ", url: "/faq"}
];

/**
 * Blog link - conditionally shown based on whether blogs exist
 * Inserted into Account links if hasBlog prop is true
 */
const BLOG_LINK = {title: "Blogs", url: "/blogs"};

/**
 * Policy links (Column 4)
 * Standard legal/policy pages required for e-commerce
 */
const POLICY_LINKS = [
    {title: "Shipping Policy", url: "/policies/shipping-policy"},
    {title: "Refund Policy", url: "/policies/refund-policy"},
    {title: "Privacy Policy", url: "/policies/privacy-policy"},
    {title: "Terms of Service", url: "/policies/terms-of-service"}
];

// ================================================================================
// Main Menu Component
// ================================================================================

/**
 * FullScreenMenu - Full-screen navigation overlay with slide-from-left animation
 *
 * Displays site navigation in a full-screen Dialog overlay. Opens when aside type is "mobile".
 * Automatically organizes collections into Featured and Categories columns based on handles.
 *
 * Layout:
 * - Mobile: Single column, scrollable, search button at top
 * - Tablet: 2 columns
 * - Desktop: 4 columns (Featured, Categories, Account, Policies)
 *
 * Animations:
 * - Native iOS-style slide from left
 * - Staggered item animations (50ms intervals)
 * - Smooth fade transitions
 *
 * @param collections - Collections to display in menu
 * @param totalCollections - Raw Shopify collection count for "All Collections" link
 * @param totalProductCount - Count for "All Products" link
 * @param discountCount - Count for "SALE" link (hidden if 0)
 * @param hasBlog - Whether to show "Blogs" link
 */
export function FullScreenMenu({collections, totalCollections, totalProductCount, discountCount, hasBlog}: FullScreenMenuProps) {
    const {type, close, open} = useAside();
    const {canHover} = usePointerCapabilities();
    const {brandName} = useSiteSettings();
    const isOpen = type === "mobile";

    // Handle opening search from menu — stable reference prevents the useEffect below from re-running
    const handleOpenSearch = useCallback(() => {
        close(); // Close menu first
        // Small delay to allow menu close animation, then open search
        setTimeout(() => open("search"), 150);
    }, [close, open]);

    // Lock Lenis smooth scroll when menu is open.
    // Radix Dialog handles native body scroll lock; this stops Lenis's virtual scroll.
    // Ref-counted via useScrollLock so concurrent overlays don't conflict.
    // Scrolling inside the dialog still works via overflow-y-auto + data-lenis-prevent.
    useScrollLock(isOpen);

    // Handle ESC key to close menu
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                close();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, close]);

    // Organize collections into columns — memoized so the expensive sort/filter only re-runs
    // when collections or counts actually change, not on every menu re-render
    // totalCollections comes from the raw pre-filter Shopify response (accurate real collection count)
    const {featuredCollections, categoryCollections} = useMemo(
        () => organizeCollections(collections, totalProductCount, totalCollections, discountCount),
        [collections, totalProductCount, totalCollections, discountCount]
    );

    return (
        <Dialog.Root open={isOpen} onOpenChange={open => !open && close()}>
            <Dialog.Portal>
                {/* Overlay with fade animation */}
                <Dialog.Overlay
                    className={cn(
                        "motion-overlay fixed inset-0 z-200 bg-background",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:duration-[var(--motion-duration-overlay)] data-[state=open]:duration-[var(--motion-duration-overlay)]"
                    )}
                />

                {/* Content with slide-from-left animation for native mobile feel */}
                <Dialog.Content
                    className={cn(
                        "motion-overlay fixed inset-0 z-200 flex h-dvh flex-col bg-background",
                        // Slide-from-left animation (native iOS navigation pattern)
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full",
                        "data-[state=closed]:duration-[var(--motion-duration-overlay)] data-[state=open]:duration-[var(--motion-duration-overlay)]"
                    )}
                >
                    {/* Mobile header - solid bar with menu button and brand for small screens only */}
                    <div
                        className={cn(
                            "absolute top-0 left-0 right-0 z-5 sm:hidden",
                            "flex items-center justify-between h-14 px-2 bg-background",
                            // Safe area padding for iOS notch
                            "pt-[env(safe-area-inset-top)]"
                        )}
                    >
                        {/* Menu/Close button - left side */}
                        <Dialog.Close asChild>
                            <Button
                                variant="ghost"
                                className="motion-link min-h-11 min-w-11 px-2 text-base font-medium text-primary hover:bg-transparent hover:text-primary cursor-pointer"
                            >
                                Menu
                            </Button>
                        </Dialog.Close>

                        {/* Brand name - center */}
                        <Link
                            to="/"
                            prefetch="viewport"
                            onClick={close}
                            className="motion-link absolute left-1/2 -translate-x-1/2 font-serif text-base sm:text-2xl uppercase tracking-wider text-primary whitespace-nowrap cursor-pointer"
                        >
                            {brandName}
                        </Link>

                        {/* Close button - right side */}
                        <Dialog.Close asChild>
                            <Button
                                variant="ghost"
                                className="motion-link min-h-11 px-2 text-base font-medium text-primary hover:bg-transparent hover:text-primary cursor-pointer"
                            >
                                Close
                            </Button>
                        </Dialog.Close>
                    </div>

                    {/* Close button - desktop only, absolute positioned */}
                    <Dialog.Close asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "motion-link absolute z-10 hidden text-primary hover:text-primary sm:flex",
                                // Safe area positioning for iOS devices
                                "top-4 right-4",
                                // Add safe area insets
                                "mt-[env(safe-area-inset-top)] mr-[env(safe-area-inset-right)]",
                                // Ensure 44px minimum touch target height
                                "min-h-11 px-4 text-lg font-medium"
                            )}
                        >
                            Close
                        </Button>
                    </Dialog.Close>

                    {/* Scrollable content area - min-h-0 is critical for flex overflow */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" data-lenis-prevent>
                        {/* Menu content with safe area padding */}
                        <div
                            className={cn(
                                // Safe area padding for iOS notch/Dynamic Island
                                "pt-[max(3.5rem,calc(env(safe-area-inset-top)+2.5rem))]",
                                "pb-[max(4rem,calc(env(safe-area-inset-bottom)+2rem))]",
                                "px-[max(1.5rem,env(safe-area-inset-left))]",
                                "md:px-6 lg:px-10"
                            )}
                        >
                            {/* Mobile Search Button - styled like FullScreenSearch input, hidden on larger screens */}
                            <button
                                type="button"
                                onClick={handleOpenSearch}
                                className={cn(
                                    "motion-field motion-press w-full mb-8 flex min-h-14 select-none items-center cursor-pointer sm:hidden",
                                    "bg-transparent border-0 border-b-2 border-[var(--border-strong)]",
                                    "text-xl font-serif text-primary/40",
                                    "py-3 text-left",
                                    canHover ? "hover:border-primary/50" : "active:border-primary/50",
                                    "active:scale-[var(--motion-press-scale)]"
                                )}
                                aria-label="Open search"
                            >
                                <span>Search...</span>
                            </button>

                            {/* Open in App Button — shown in menu for the full below-lg range (320–1023px).
                                lg:hidden because the desktop-fixed variant takes over at ≥1024px. */}
                            <div className="lg:hidden mt-4 mb-8">
                                <OpenInAppButton variant="menu-item" />
                            </div>

                            <nav
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
                                role="navigation"
                                aria-label="Main menu"
                            >
                                {/* Column 1: Featured */}
                                <MenuColumn title="Featured" collections={featuredCollections} onNavigate={close} />

                                {/* Column 2: Categories */}
                                <MenuColumn title="Categories" collections={categoryCollections} onNavigate={close} />

                                {/* Column 3: Account & Info - smaller text for visual hierarchy */}
                                <div className="flex flex-col">
                                    {ACCOUNT_LINKS.slice(0, 4).map((link, index) => (
                                        <MenuLink
                                            key={link.url}
                                            title={link.title}
                                            url={link.url}
                                            onNavigate={close}
                                            variant="secondary"
                                            staggerIndex={index}
                                        />
                                    ))}
                                    {hasBlog && (
                                        <MenuLink
                                            title={BLOG_LINK.title}
                                            url={BLOG_LINK.url}
                                            onNavigate={close}
                                            variant="secondary"
                                            staggerIndex={4}
                                        />
                                    )}
                                    {ACCOUNT_LINKS.slice(4).map((link, index) => (
                                        <MenuLink
                                            key={link.url}
                                            title={link.title}
                                            url={link.url}
                                            onNavigate={close}
                                            variant="secondary"
                                            staggerIndex={hasBlog ? index + 5 : index + 4}
                                        />
                                    ))}
                                </div>

                                {/* Column 4: Policies - smaller text for visual hierarchy */}
                                <div className="flex flex-col">
                                    {POLICY_LINKS.map((link, index) => (
                                        <MenuLink
                                            key={link.url}
                                            title={link.title}
                                            url={link.url}
                                            onNavigate={close}
                                            variant="secondary"
                                            staggerIndex={index}
                                        />
                                    ))}
                                </div>
                            </nav>
                        </div>
                    </div>

                    {/* Visually hidden title for accessibility */}
                    <Dialog.Title className="sr-only">Navigation Menu</Dialog.Title>
                    <Dialog.Description className="sr-only">
                        Browse our collections and navigate the site
                    </Dialog.Description>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// ================================================================================
// Menu Column Components
// ================================================================================

/**
 * MenuColumnProps - Props for collection menu column
 *
 * @property title - Column heading (not currently displayed)
 * @property collections - Array of collections with handle, title, productsCount
 * @property onNavigate - Callback to close menu when link is clicked
 */
interface MenuColumnProps {
    title: string;
    collections: Array<{handle: string; title: string; productsCount: number}>;
    onNavigate: () => void;
}

/**
 * MenuColumn - Renders a column of collection links
 *
 * Maps collections to MenuLink components with proper URL formatting.
 * Handles special cases for "all", "all-collections", and "sale" URLs.
 *
 * @param collections - Collections to render as links
 * @param onNavigate - Callback to close menu on link click
 */
function MenuColumn({collections, onNavigate}: MenuColumnProps) {
    const getCollectionUrl = (handle: string) => {
        if (handle === "all-products") return "/collections/all-products";
        if (handle === "all-collections") return "/collections";
        if (handle === "sale") return "/sale";
        return `/collections/${handle}`;
    };

    return (
        <div className="flex flex-col">
            {collections.map((collection, index) => (
                <MenuLink
                    key={collection.handle}
                    title={collection.title}
                    url={getCollectionUrl(collection.handle)}
                    count={collection.productsCount}
                    onNavigate={onNavigate}
                    staggerIndex={index}
                />
            ))}
        </div>
    );
}

/**
 * MenuLinkProps - Props for individual menu link
 *
 * @property title - Link text
 * @property url - Link destination
 * @property count - Optional product count to display as superscript
 * @property onNavigate - Callback to close menu on click
 * @property variant - "collection" (large text) or "secondary" (smaller text)
 * @property staggerIndex - Index for stagger animation delay
 */
interface MenuLinkProps {
    title: string;
    url: string;
    count?: number;
    onNavigate: () => void;
    /** "collection" = large text for collection links, "secondary" = smaller text for other links */
    variant?: "collection" | "secondary";
    /** Index for stagger animation */
    staggerIndex?: number;
}

/**
 * MenuLink - Individual menu link with hover animation
 *
 * Renders a single navigation link with:
 * - Animated underline on hover
 * - Optional product count superscript
 * - Staggered fade-in animation on menu open
 * - 44px minimum touch target for accessibility
 * - Two size variants (collection = large, secondary = smaller)
 *
 * Count display:
 * - Shows count if provided and >= 0
 * - Formats counts >= 250 as "250+"
 * - Hides count if -1 (used for dynamic counts like SALE)
 *
 * @param title - Link text to display
 * @param url - Navigation URL
 * @param count - Optional product count (-1 to hide, 250+ formatted)
 * @param onNavigate - Callback to close menu
 * @param variant - "collection" (fluid-h2 display text) or "secondary" (fluid-h4 text)
 * @param staggerIndex - Index for animation delay (50ms * index, max 400ms)
 */
function MenuLink({title, url, count, onNavigate, variant = "collection", staggerIndex = 0}: MenuLinkProps) {
    const {canHover} = usePointerCapabilities();
    // -1 indicates no count should be shown (e.g., SALE where count is dynamic)
    const displayCount = count !== undefined && count >= 0 ? (count >= 250 ? "250+" : count.toString()) : null;
    // Calculate stagger delay (50ms increment, capped at 400ms)
    const staggerDelay = Math.min(staggerIndex, 8) * 50;

    return (
        <Link
            to={url}
            prefetch="viewport"
            onClick={onNavigate}
            className={cn(
                "motion-link flex items-baseline gap-1 text-primary cursor-pointer",
                canHover
                    ? "group hover:text-primary/70"
                    : "motion-press active:scale-[var(--motion-press-scale)] active:text-primary/80",
                // 44px minimum touch target (Apple HIG guideline)
                "min-h-11 py-2 md:py-3",
                // Stagger animation on menu open
                "animate-slide-up-fade opacity-0"
            )}
            style={{animationDelay: `${staggerDelay}ms`, animationFillMode: "both"}}
        >
            <span
                className={cn(
                    "relative font-medium",
                    // Collection links: display-level fluid type for visual dominance in fullscreen overlay
                    // lg: one scale down (fluid-h3) to reduce visual weight on large screens
                    variant === "collection" && "text-fluid-h2 tracking-tight lg:text-fluid-h3",
                    // Secondary links: readable but subordinate fluid type
                    variant === "secondary" && "text-fluid-h4"
                )}
            >
                {title}
                {/* Animated underline */}
                <span
                    className={cn(
                        "motion-link absolute bottom-0 left-0 h-px w-full origin-left bg-current",
                        canHover ? "scale-x-0 group-hover:scale-x-100" : "scale-x-100 opacity-50"
                    )}
                />
            </span>
            {displayCount && <sup className="text-sm md:text-base">{displayCount}</sup>}
        </Link>
    );
}

// ================================================================================
// Collection Organization
// ================================================================================

/**
 * organizeCollections - Auto-organize collections into Featured and Categories columns
 *
 * Separates collections based on handle matching FEATURED_HANDLES array.
 * Prepends system links ("All Products", "All Collections", "SALE") to Featured column.
 * Sorts Featured collections to match FEATURED_HANDLES order.
 *
 * Featured handles:
 * - all, all-collections, sale, new-arrivals, bestsellers, best-sellers, featured, staples
 *
 * Algorithm:
 * 1. Add "All Products" with totalProductCount
 * 2. Add "All Collections" with totalCollectionCount
 * 3. Add "SALE" if discountCount > 0
 * 4. Separate user collections into Featured/Categories based on handle
 * 5. Sort Featured to match FEATURED_HANDLES order
 *
 * @param collections - All collections from Shopify
 * @param totalProductCount - Count for "All Products" link
 * @param totalCollectionCount - Count for "All Collections" link
 * @param discountCount - Count for "SALE" link (0 to hide)
 * @returns Object with featuredCollections and categoryCollections arrays
 */
function organizeCollections(
    collections: MenuCollection[],
    totalProductCount: number,
    totalCollectionCount: number,
    discountCount: number
) {
    const featuredCollections: Array<{handle: string; title: string; productsCount: number}> = [];
    const categoryCollections: Array<{handle: string; title: string; productsCount: number}> = [];

    // Add "All Products" as first featured item
    featuredCollections.push({
        handle: "all-products",
        title: "All Products",
        productsCount: totalProductCount
    });

    // Add "All Collections" link
    featuredCollections.push({
        handle: "all-collections",
        title: "All Collections",
        productsCount: totalCollectionCount
    });

    // Add "SALE" if there are discounted products
    if (discountCount > 0) {
        featuredCollections.push({
            handle: "sale",
            title: "SALE",
            productsCount: discountCount
        });
    }

    // Sort collections into appropriate columns
    collections.forEach(collection => {
        const handle = collection.handle.toLowerCase();

        if (FEATURED_HANDLES.includes(handle) && handle !== "all-products") {
            featuredCollections.push({
                handle: collection.handle,
                title: collection.title,
                productsCount: collection.productsCount
            });
        } else {
            // Everything else goes to categories
            categoryCollections.push({
                handle: collection.handle,
                title: collection.title,
                productsCount: collection.productsCount
            });
        }
    });

    // Sort featured collections to match expected order
    featuredCollections.sort((a, b) => {
        const aIndex = FEATURED_HANDLES.indexOf(a.handle.toLowerCase());
        const bIndex = FEATURED_HANDLES.indexOf(b.handle.toLowerCase());
        return aIndex - bIndex;
    });

    return {featuredCollections, categoryCollections};
}
