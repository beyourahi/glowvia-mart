/**
 * Centralized type definitions for Hydrogen storefront
 *
 * This file contains all custom interfaces and types used throughout the application.
 * Auto-generated types from GraphQL codegen are NOT included here - they remain in:
 * - storefrontapi.generated.d.ts (Storefront API)
 * - customer-accountapi.generated.d.ts (Customer Account API)
 */

import type {RefObject, MutableRefObject, ReactNode, HTMLAttributes, FormEvent, ChangeEvent} from "react";
import type {Fetcher, FormProps} from "react-router";
import type {OptimisticCart} from "@shopify/hydrogen";
import type {
    CartApiQueryFragment,
    HeaderQuery,
    FooterQuery,
    ProductFragment,
    ProductVariantFragment,
    RegularSearchQuery,
    PredictiveSearchQuery,
    CuratedCollectionsQuery
} from "storefrontapi.generated";
import type {AddressFragment, CustomerFragment} from "customer-accountapi.generated";
import type {ShippingConfig} from "~/lib/shipping";

// =============================================================================
// ASIDE & NAVIGATION TYPES
// =============================================================================

/**
 * Types of side panels that can be opened in the application
 */
export type AsideType = "search" | "cart" | "mobile" | "closed";

/**
 * Context value for aside state management
 */
export interface AsideContextValue {
    type: AsideType;
    open: (mode: AsideType) => void;
    close: () => void;
}

/**
 * Viewport type for responsive navigation
 */
export type Viewport = "desktop" | "mobile";

// =============================================================================
// LAYOUT TYPES
// =============================================================================

/**
 * Collection image data
 */
export interface CollectionImage {
    id: string;
    url: string;
    altText?: string | null;
    width?: number;
    height?: number;
}

/**
 * Collection data for the full-screen menu
 */
export interface MenuCollection {
    id: string;
    handle: string;
    title: string;
    productsCount: number;
    image?: CollectionImage | null;
}

/**
 * Props for the main page layout component
 */
export interface PageLayoutProps {
    cart: Promise<CartApiQueryFragment | null>;
    footer: Promise<FooterQuery | null>;
    header: HeaderQuery;
    isLoggedIn: Promise<boolean>;
    hasStoreCredit: Promise<boolean>;
    publicStoreDomain: string;
    menuCollections: MenuCollection[];
    totalCollections: number;
    totalProductCount: number;
    discountCount: number;
    popularSearchTerms: string[];
    shippingConfig?: ShippingConfig;
    hasBlog: boolean;
    children?: ReactNode;
    /** Announcement banner texts displayed fixed at top on all pages */
    announcementTexts?: string[];
}

/**
 * Props for the header component
 */
export interface HeaderProps {
    header: HeaderQuery;
    cart: Promise<CartApiQueryFragment | null>;
    isLoggedIn: Promise<boolean>;
    publicStoreDomain: string;
}

/**
 * Props for the footer component
 */
export interface FooterProps {
    footer: Promise<FooterQuery | null>;
    header: HeaderQuery;
    publicStoreDomain: string;
}

// =============================================================================
// CART TYPES
// =============================================================================

/**
 * Layout mode for cart display
 */
export type CartLayout = "page" | "aside";

/**
 * Props for the main cart component
 */
export interface CartMainProps {
    cart: CartApiQueryFragment | null;
    layout: CartLayout;
    isLoggedIn?: boolean;
    hasStoreCredit?: boolean;
    shippingConfig?: ShippingConfig;
}

/**
 * Props for the cart summary component
 */
export interface CartSummaryProps {
    cart: OptimisticCart<CartApiQueryFragment | null>;
    layout: CartLayout;
    isLoggedIn?: boolean;
    hasStoreCredit?: boolean;
    shippingConfig?: ShippingConfig;
}

// =============================================================================
// MONEY TYPES
// =============================================================================

/**
 * Money data structure for currency display
 */
export interface MoneyData {
    amount: string;
    currencyCode: string;
}

// =============================================================================
// COLLECTION TYPES
// =============================================================================

/**
 * Category keys for collection pattern matching
 */
export type CollectionCategory = "bestSellers" | "newArrivals" | "featured";

/**
 * Basic collection node structure used in pattern matching
 */
export interface CollectionNode {
    handle: string;
    id: string;
    title: string;
    products: {nodes: unknown[]};
}

/**
 * Tab configuration for collection tabs
 */
export interface TabConfig {
    key: string;
    label: string;
}

/**
 * Curated collection node type from the generated query
 */
export type CuratedCollectionNode = NonNullable<CuratedCollectionsQuery["collections"]>["nodes"][number];

/**
 * Configuration for a curated collection tab
 */
export interface CuratedTab extends TabConfig {
    collection: CuratedCollectionNode;
}

/**
 * Data structure for curated collections section
 */
export type CuratedCollectionsData = {
    tabs: CuratedTab[];
} | null;

/**
 * Props for the curated collections component
 */
export interface CuratedCollectionsProps {
    collections: Promise<CuratedCollectionsData | null>;
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

/**
 * Generic result type with items for search operations
 */
export type ResultWithItems<Type extends "predictive" | "regular", Items> = {
    type: Type;
    term: string;
    error?: string;
    result: {total: number; items: Items};
};

/**
 * Return type for regular search operations
 */
export type RegularSearchReturn = ResultWithItems<"regular", RegularSearchQuery>;

/**
 * Return type for predictive search operations
 */
export type PredictiveSearchReturn = ResultWithItems<
    "predictive",
    NonNullable<PredictiveSearchQuery["predictiveSearch"]>
>;

/**
 * URL tracking parameters configuration
 */
export interface UrlWithTrackingParams {
    /** The base URL to which the tracking parameters will be appended */
    baseUrl: string;
    /** The trackingParams returned by the Storefront API */
    trackingParams?: string | null;
    /** Any additional query parameters to be appended to the URL */
    params?: Record<string, string>;
    /** The search term to be appended to the URL */
    term: string;
}

/**
 * Items from regular search results
 */
export type SearchItems = RegularSearchReturn["result"]["items"];

/**
 * Partial search result type for component props
 */
export type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<SearchItems, ItemType> &
    Pick<RegularSearchReturn, "term">;

/**
 * Props for search results component
 */
export interface SearchResultsProps extends RegularSearchReturn {
    children: (args: SearchItems & {term: string}) => ReactNode;
}

/**
 * Product type from regular search query
 */
export type SearchProduct = NonNullable<RegularSearchQuery["products"]>["nodes"][number];

/**
 * Items from predictive search results
 */
export type PredictiveSearchItems = PredictiveSearchReturn["result"]["items"];

/**
 * Return type for the usePredictiveSearch hook
 */
export interface UsePredictiveSearchReturn {
    term: MutableRefObject<string>;
    total: number;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    items: PredictiveSearchItems;
    fetcher: Fetcher<PredictiveSearchReturn>;
}

/**
 * Arguments passed to search results predictive render function
 */
export interface SearchResultsPredictiveArgs extends Pick<
    UsePredictiveSearchReturn,
    "term" | "total" | "inputRef" | "items"
> {
    state: Fetcher["state"];
    closeSearch: () => void;
}

/**
 * Partial predictive search result type for component props
 */
export type PartialPredictiveSearchResult<
    ItemType extends keyof PredictiveSearchItems,
    ExtraProps extends keyof SearchResultsPredictiveArgs = "term" | "closeSearch"
> = Pick<PredictiveSearchItems, ItemType> & Pick<SearchResultsPredictiveArgs, ExtraProps>;

/**
 * Props for predictive search results component
 */
export interface SearchResultsPredictiveProps {
    children: (args: SearchResultsPredictiveArgs) => ReactNode;
}

/**
 * Children render function type for search form predictive
 */
export type SearchFormPredictiveChildren = (args: {
    fetchResults: (event: ChangeEvent<HTMLInputElement>) => void;
    goToSearch: () => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    fetcher: Fetcher<PredictiveSearchReturn>;
}) => ReactNode;

/**
 * Props for the predictive search form component
 */
export interface SearchFormPredictiveProps extends Omit<FormProps, "children"> {
    children: SearchFormPredictiveChildren | null;
}

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * Product image type extracted from product fragment
 */
export type ProductImage = ProductFragment["images"]["nodes"][number];

/**
 * Props for the product image gallery component
 */
export interface ProductImageGalleryProps {
    images: ProductImage[];
    selectedVariantImage?: ProductVariantFragment["image"];
    /**
     * Optional media array for lightbox (includes images and videos)
     * Accepts raw Shopify media which will be filtered to supported types
     */
    media?: unknown[];
}

// =============================================================================
// PRODUCT MEDIA TYPES (for Lightbox)
// =============================================================================

/**
 * Product media item from Shopify Storefront API product.media
 *
 * @description
 * Uses discriminated union pattern with __typename for type-safe rendering.
 * Supports both MediaImage (static images) and Video (product videos).
 *
 * @usage
 * ```typescript
 * if (media.__typename === "MediaImage") {
 *   // Render image using media.image
 * } else if (media.__typename === "Video") {
 *   // Render video using media.sources
 * }
 * ```
 *
 * @see ProductLightbox - Full-screen media viewer
 * @see ProductImageGallery - Product page gallery with lightbox trigger
 */
export type ProductMediaItem =
    | {
          __typename: "MediaImage";
          id: string;
          alt?: string | null;
          image: {
              id: string;
              url: string;
              altText?: string | null;
              width: number;
              height: number;
          } | null;
      }
    | {
          __typename: "Video";
          id: string;
          alt?: string | null;
          sources: Array<{
              url: string;
              mimeType: string;
          }>;
          previewImage?: {
              url: string;
              altText?: string | null;
              width?: number;
              height?: number;
          } | null;
      };

/**
 * Props for the ProductLightbox component
 *
 * @description
 * Full-screen lightbox for viewing product images and videos.
 * Supports keyboard navigation, swipe gestures, and thumbnails.
 *
 * @example
 * ```tsx
 * <ProductLightbox
 *   media={product.media.nodes}
 *   initialIndex={0}
 *   isOpen={lightboxOpen}
 *   onClose={() => setLightboxOpen(false)}
 * />
 * ```
 */
export interface ProductLightboxProps {
    /** Array of product media items (images and videos) */
    media: ProductMediaItem[];
    /** Index of initially displayed media item */
    initialIndex: number;
    /** Whether the lightbox is currently open */
    isOpen: boolean;
    /** Callback when lightbox should close */
    onClose: () => void;
}

// =============================================================================
// ANIMATION TYPES
// =============================================================================

/**
 * Context value for brand animation state
 */
export interface BrandAnimationContextValue {
    progress: number;
    isComplete: boolean;
    heroRef: RefObject<HTMLElement>;
    isHomePage: boolean;
    setIsHomePage: (value: boolean) => void;
}

/**
 * Measured positions for brand animation calculations
 */
export interface MeasuredPositions {
    /** Initial X position */
    startX: number;
    /** Initial Y position (relative to document) */
    startY: number;
    /** Initial width */
    startWidth: number;
    /** Initial height */
    startHeight: number;
    /** Font size in pixels */
    fontSize: number;
    /** Target X position in header */
    endX: number;
    /** Target Y position in header */
    endY: number;
    /** Scale factor to reach header size */
    endScale: number;
}

/**
 * Options for scroll progress tracking
 */
export interface ScrollProgressOptions {
    startOffset?: number;
    endOffset: number;
}

/**
 * Result from scroll progress hook
 */
export interface ScrollProgressResult {
    progress: number;
    scrollY: number;
    isComplete: boolean;
}

// =============================================================================
// UI COMPONENT TYPES
// =============================================================================

/**
 * Props for the GiantText component
 */
export interface GiantTextProps extends HTMLAttributes<HTMLDivElement> {
    text: string;
    textClassName?: string;
}

// =============================================================================
// ORDER FILTER TYPES
// =============================================================================

/**
 * Parameters for filtering customer orders
 * @see https://shopify.dev/docs/api/customer/latest/queries/customer#returns-Customer.fields.orders.arguments.query
 */
export interface OrderFilterParams {
    /** Order name or number (e.g., "#1001" or "1001") */
    name?: string;
    /** Order confirmation number */
    confirmationNumber?: string;
}

// =============================================================================
// ACCOUNT ACTION TYPES
// =============================================================================

/**
 * Response type for address-related actions
 */
export interface AddressActionResponse {
    addressId?: string | null;
    createdAddress?: AddressFragment;
    defaultAddress?: string | null;
    deletedAddress?: string | null;
    error: Record<AddressFragment["id"], string> | null;
    updatedAddress?: AddressFragment;
}

/**
 * Response type for profile update actions
 */
export interface ProfileActionResponse {
    error: string | null;
    customer: CustomerFragment | null;
}

// =============================================================================
// METAOBJECT TYPES (Site Content from Shopify Admin)
// =============================================================================

/**
 * Hero media - can be either an image or a video
 * Uses discriminated union for type-safe rendering
 */
export type HeroMedia =
    | {
          mediaType: "image";
          url: string;
          altText?: string;
          width?: number;
          height?: number;
      }
    | {
          mediaType: "video";
          url: string;
          altText?: string;
          previewImage?: {
              url: string;
              altText?: string;
          };
      };

export interface FeaturedProductSection {
    id: string;
    handle: string;
    title: string;
    vendor: string;
    description: string;
    availableForSale: boolean;
    tags: string[];
    featuredImage: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
    priceRange: {
        minVariantPrice: { amount: string; currencyCode: string };
        maxVariantPrice: { amount: string; currencyCode: string };
    };
    price: {
        amount: string;
        currencyCode: string;
    };
    compareAtPrice: {
        amount: string;
        currencyCode: string;
    } | null;
    variants: {
        nodes: Array<{
            id: string;
            availableForSale: boolean;
            title?: string;
            selectedOptions?: Array<{ name: string; value: string }>;
            price: { amount: string; currencyCode: string };
            compareAtPrice?: { amount: string; currencyCode: string } | null;
        }>;
    };
}

/**
 * Site settings from the site_settings metaobject
 * Contains ALL site-wide configuration in one place for easy management
 */
export interface SiteSettings {
    // ─────────────────────────────────────────────────────────────────────────
    // BRAND IDENTITY
    // ─────────────────────────────────────────────────────────────────────────
    brandName: string;
    brandLogo?: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
    brandWords: string[];
    missionStatement: string;
    featuredProductSection: FeaturedProductSection | null;

    // ─────────────────────────────────────────────────────────────────────────
    // HERO SECTION
    // ─────────────────────────────────────────────────────────────────────────
    heroHeading: string;
    heroDescription: string;
    /** Hero media for mobile viewports (< 768px). Falls back to heroMediaLargeScreen if not set. */
    heroMediaMobile?: HeroMedia;
    /** Hero media for large screens (>= 768px). Falls back to heroMediaMobile if not set. */
    heroMediaLargeScreen?: HeroMedia;

    // ─────────────────────────────────────────────────────────────────────────
    // SEO DEFAULTS
    // ─────────────────────────────────────────────────────────────────────────
    siteUrl: string;

    // ─────────────────────────────────────────────────────────────────────────
    // CONTACT INFORMATION
    // ─────────────────────────────────────────────────────────────────────────
    contactEmail: string;
    contactPhone: string;
    messengerPageId: string;
    whatsappNumber: string;
    businessHours: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION HEADINGS
    // ─────────────────────────────────────────────────────────────────────────
    blogSectionTitle: string;
    collectionsTitle: string;
    relatedProductsTitle: string;
    recommendedTitle: string;
    instagramTitle: string;

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE HEADINGS (Gallery & Blog)
    // ─────────────────────────────────────────────────────────────────────────
    galleryPageHeading: string;
    galleryPageDescription: string;
    blogPageHeading: string;
    blogPageDescription: string;

    // ─────────────────────────────────────────────────────────────────────────
    // PROMOTIONAL BANNERS
    // ─────────────────────────────────────────────────────────────────────────
    /** Array of announcement texts displayed in scrolling banner */
    announcementBanner: string[];
    promotionalBannerOneMedia?: HeroMedia;
    promotionalBannerTwoMedia?: HeroMedia;

    // ─────────────────────────────────────────────────────────────────────────
    // COLLECTIONS
    // ─────────────────────────────────────────────────────────────────────────
    socialLinks: SocialLink[]; // From list of links field
    testimonials: Testimonial[]; // From JSON field
    faqItems: FAQItem[]; // From JSON field
    instagramMedia: InstagramMedia[]; // From list of file references field

    // ─────────────────────────────────────────────────────────────────────────
    // FAVICON (File reference - MediaImage only)
    // Dynamic favicon served from /favicon.ico route
    // ─────────────────────────────────────────────────────────────────────────
    /** Favicon URL from Shopify CDN (32x32 or SVG recommended) */
    faviconUrl: string | null;

    // ─────────────────────────────────────────────────────────────────────────
    // PWA ICONS (File references - MediaImage only)
    // Required for Progressive Web App installability
    // ─────────────────────────────────────────────────────────────────────────
    /** 192x192px PNG icon for Android home screen */
    icon192Url: string | null;
    /** 512x512px PNG maskable icon for Android splash screens */
    icon512Url: string | null;
    /** 180x180px PNG icon for iOS Safari home screen */
    icon180AppleUrl: string | null;
}

/**
 * Contact information (derived from SiteSettings for backward compatibility)
 */
export interface ContactInfo {
    email: string;
    phone: string;
    businessHours: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
}

/**
 * Social media link from the list of links field
 * Label is the platform name (e.g., "Instagram", "TikTok")
 * Handle is extracted from the URL path
 */
export interface SocialLink {
    id: string;
    platform: string; // Derived from label
    handle: string; // Extracted from URL
    url: string;
    displayOrder: number;
}

/**
 * Customer testimonial from the testimonial metaobject
 */
export interface Testimonial {
    id: string;
    customerName: string;
    location: string;
    rating: number;
    text: string;
    avatar?: {
        url: string;
        altText?: string;
    };
}

/**
 * FAQ item from the JSON field in site_settings
 */
export interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

/**
 * Instagram gallery media from the list of file references
 * Can be either an image or a video
 */
export type InstagramMedia =
    | {
          id: string;
          mediaType: "image";
          url: string;
          altText?: string;
          width?: number;
          height?: number;
      }
    | {
          id: string;
          mediaType: "video";
          url: string;
          altText?: string;
          previewImage?: {
              url: string;
              altText?: string;
          };
      };

/**
 * @deprecated Use InstagramMedia instead
 * Kept for backward compatibility
 */
export interface InstagramImage {
    id: string;
    url: string;
    altText?: string;
}

/**
 * Section headings (derived from SiteSettings for backward compatibility)
 */
export interface SectionHeadings {
    blogSectionTitle: string;
    collectionsTitle: string;
    relatedProductsTitle: string;
    recommendedTitle: string;
    instagramTitle: string;
}

// =============================================================================
// THEME CUSTOMIZATION TYPES
// =============================================================================

/**
 * Theme fonts configuration
 * Stores Google Font family names for dynamic loading
 */
export interface ThemeFonts {
    /** Sans-serif font family (e.g., "Inter", "Poppins") */
    sans: string;
    /** Serif font family (e.g., "EB Garamond", "Playfair Display") */
    serif: string;
    /** Monospace font family (e.g., "JetBrains Mono", "Fira Code") */
    mono: string;
}

/**
 * Core theme colors (5 colors stored in metaobject)
 * All colors should be in OKLCH or HEX format
 * HEX colors are automatically converted to OKLCH internally
 */
export interface ThemeCoreColors {
    /** Main brand color - used for primary buttons, links, accents */
    primary: string;
    /** Secondary brand color - used for borders, secondary buttons */
    secondary: string;
    /** Page background color */
    background: string;
    /** Main text color */
    foreground: string;
    /** Accent/highlight color - used for hover states, badges */
    accent: string;
}

/**
 * Combined theme configuration from theme_settings metaobject
 * Parsed from the separate theme_settings metaobject (not site_settings)
 */
export interface ThemeConfig {
    fonts: ThemeFonts;
    colors: ThemeCoreColors;
    borderRadius: number;
}

/**
 * Complete generated theme ready for rendering
 * Created from ThemeFonts + ThemeCoreColors via deriveThemeColors()
 */
export interface GeneratedTheme {
    /** CSS custom properties string for injection into <head> */
    cssVariables: string;
    /** Google Fonts stylesheet URL for <link> tag */
    googleFontsUrl: string;
    /** Parsed font configuration */
    fonts: ThemeFonts;
}

/**
 * Combined site content for context provider
 * - siteSettings: Site content from site_settings metaobject
 * - themeConfig: Theme configuration from theme_settings metaobject
 */
export interface SiteContent {
    siteSettings: SiteSettings;
    themeConfig: ThemeConfig;
}

// =============================================================================
// MERCHANT-EDITABLE CONTENT TYPES (from Content Metaobjects)
// =============================================================================
// These interfaces define content that merchants can edit in Shopify Admin.
// Each corresponds to a singleton metaobject with handle "main".
// Fields use {placeholder} syntax for dynamic values (e.g., {name}, {count}).

/**
 * Product page content from product_page_content metaobject
 * Contains all product page UI text: buttons, badges, stock messages, tabs
 */
export interface ProductContent {
    // ─────────────────────────────────────────────────────────────────────────
    // ADD TO CART BUTTON STATES
    // ─────────────────────────────────────────────────────────────────────────
    /** Default button text (e.g., "Get it now") */
    addToCartStandard: string;
    /** Button text for preorder products */
    addToCartPreorder: string;
    /** Button text when variant is unavailable */
    addToCartSoldOut: string;
    /** Button text for subscription purchase */
    addToCartSubscribe: string;
    /** Button text when user is offline */
    addToCartOffline: string;
    /** Helper text below button when offline */
    offlineHelperText: string;
    /** Button text when subscription frequency not selected */
    selectFrequency: string;

    // ─────────────────────────────────────────────────────────────────────────
    // STOCK STATUS LABELS
    // ─────────────────────────────────────────────────────────────────────────
    /** Label when product is available */
    stockInStock: string;
    /** Label when product is unavailable */
    stockOutOfStock: string;
    /** Template with {quantity} for low stock warning (e.g., "Only {quantity} left") */
    stockLowTemplate: string;

    // ─────────────────────────────────────────────────────────────────────────
    // PURCHASE TYPE OPTIONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Section label for purchase options */
    purchaseTypeLabel: string;
    /** Label for single purchase option */
    oneTimeLabel: string;
    /** Label for subscription option */
    subscribeSaveLabel: string;
    /** Template with {percent} for subscription discount */
    savePercentageTemplate: string;

    // ─────────────────────────────────────────────────────────────────────────
    // PRODUCT PAGE UI
    // ─────────────────────────────────────────────────────────────────────────
    /** Link text for size chart */
    sizeGuideCta: string;
    /** Label for quantity selector */
    quantityLabel: string;

    // ─────────────────────────────────────────────────────────────────────────
    // PRODUCT TABS
    // ─────────────────────────────────────────────────────────────────────────
    /** Product description tab label */
    tabDescription: string;
    /** Shipping info tab label */
    tabShipping: string;
    /** Reviews tab label */
    tabReviews: string;

    // ─────────────────────────────────────────────────────────────────────────
    // PRODUCT BADGES
    // ─────────────────────────────────────────────────────────────────────────
    /** Badge text for new products */
    badgeNew: string;
    /** Badge text for discounted products */
    badgeSale: string;
    /** Badge text for bestselling products */
    badgeBestseller: string;
    /** Badge text for clearance items */
    badgeClearance: string;
    /** Badge text for premium products */
    badgePremium: string;
    /** Badge text for preorder products */
    badgePreorder: string;
    /** Badge text for limited edition items */
    badgeLimited: string;

    // ─────────────────────────────────────────────────────────────────────────
    // WISHLIST & SHARE
    // ─────────────────────────────────────────────────────────────────────────
    /** Share button accessible label */
    shareButtonLabel: string;
    /** Wishlist button label (add) */
    wishlistAddLabel: string;
    /** Wishlist button label (remove) */
    wishlistRemoveLabel: string;

    // ─────────────────────────────────────────────────────────────────────────
    // RELATED PRODUCTS
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading for related products section */
    relatedProductsTitle: string;
}

/**
 * Cart and checkout content from cart_checkout_content metaobject
 * Contains cart drawer/page, empty states, summaries, shipping progress
 */
export interface CartContent {
    // ─────────────────────────────────────────────────────────────────────────
    // CART HEADERS
    // ─────────────────────────────────────────────────────────────────────────
    /** Header text in cart drawer */
    cartDrawerTitle: string;
    /** Page heading for /cart */
    cartPageTitle: string;
    /** Suffix for 1 item (e.g., "item") */
    itemCountSingular: string;
    /** Suffix for multiple items (e.g., "items") */
    itemCountPlural: string;

    // ─────────────────────────────────────────────────────────────────────────
    // EMPTY CART STATE
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading when cart is empty */
    emptyCartHeading: string;
    /** Button text to continue shopping */
    emptyCartCta: string;

    // ─────────────────────────────────────────────────────────────────────────
    // LINE ITEM CONTROLS
    // ─────────────────────────────────────────────────────────────────────────
    /** Label for quantity selector */
    quantityLabel: string;
    /** Remove item button label */
    removeLabel: string;

    // ─────────────────────────────────────────────────────────────────────────
    // CART SUMMARY LABELS
    // ─────────────────────────────────────────────────────────────────────────
    /** Label for cart subtotal */
    subtotalLabel: string;
    /** Label for shipping cost */
    shippingLabel: string;
    /** Label for tax amount */
    taxLabel: string;
    /** Label for order total */
    totalLabel: string;
    /** Notice about calculation timing */
    taxShippingNotice: string;

    // ─────────────────────────────────────────────────────────────────────────
    // DISCOUNT CODE
    // ─────────────────────────────────────────────────────────────────────────
    /** Placeholder for discount input */
    discountPlaceholder: string;
    /** Button text to apply discount */
    discountApplyButton: string;
    /** Success message when discount applied */
    discountApplied: string;
    /** Error when discount code invalid */
    discountError: string;

    // ─────────────────────────────────────────────────────────────────────────
    // FREE SHIPPING PROGRESS
    // ─────────────────────────────────────────────────────────────────────────
    /** Label shown when qualified */
    freeShippingLabel: string;
    /** Message when threshold reached */
    freeShippingUnlocked: string;
    /** Template with {amount} remaining */
    freeShippingAwayTemplate: string;
    /** Encouragement at 70%+ progress */
    freeShippingAlmost: string;
    /** Loading text shown during cart mutations while recalculating shipping progress */
    freeShippingCalculating: string;

    // ─────────────────────────────────────────────────────────────────────────
    // ORDER NOTES & CHECKOUT
    // ─────────────────────────────────────────────────────────────────────────
    /** Placeholder for order notes */
    orderNotesPlaceholder: string;
    /** Main checkout button text */
    checkoutButton: string;
    /** Text while recalculating total */
    checkoutCalculating: string;
    /** Warning when user is offline */
    checkoutOfflineWarning: string;
    /** Notice about available credit */
    storeCreditNotice: string;

    // ─────────────────────────────────────────────────────────────────────────
    // UI CONTROLS
    // ─────────────────────────────────────────────────────────────────────────
    /** Mobile close button in drawer */
    closeButton: string;
    /** Heading for product suggestions */
    suggestionsTitle: string;
}

/**
 * Account and authentication content from account_auth_content metaobject
 * Contains dashboard greetings, navigation, quick actions, empty states
 */
export interface AccountContent {
    // ─────────────────────────────────────────────────────────────────────────
    // TIME-BASED GREETINGS (use {name} placeholder)
    // ─────────────────────────────────────────────────────────────────────────
    /** Greeting for 5am-11am (e.g., "Good morning, {name}") */
    greetingMorning: string;
    /** Greeting for 11am-1pm */
    greetingMidday: string;
    /** Greeting for 1pm-5pm */
    greetingAfternoon: string;
    /** Greeting for 5pm-9pm */
    greetingEvening: string;
    /** Greeting for 9pm-5am */
    greetingNight: string;
    /** Default when name unavailable */
    greetingFallback: string;

    // ─────────────────────────────────────────────────────────────────────────
    // DASHBOARD SECTION HEADINGS
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading for recent orders */
    sectionRecentOrders: string;
    /** Heading for quick actions */
    sectionQuickActions: string;
    /** Heading for account statistics */
    sectionAccountStats: string;
    /** Heading for recently viewed */
    sectionRecentlyViewed: string;

    // ─────────────────────────────────────────────────────────────────────────
    // QUICK ACTION LABELS
    // ─────────────────────────────────────────────────────────────────────────
    /** Quick action label: Track Orders */
    actionTrackOrders: string;
    /** Quick action label: Shop Now */
    actionShopNow: string;
    /** Quick action label: Addresses */
    actionAddresses: string;
    /** Quick action label: Get Help */
    actionGetHelp: string;
    /** Quick action label: Edit Profile */
    actionEditProfile: string;
    /** Quick action label: Order History */
    actionOrderHistory: string;

    // ─────────────────────────────────────────────────────────────────────────
    // ACCOUNT STATISTICS LABELS
    // ─────────────────────────────────────────────────────────────────────────
    /** Label for orders count */
    statOrdersPlaced: string;
    /** Label for address count */
    statSavedAddresses: string;
    /** Label for account age */
    statMemberSince: string;

    // ─────────────────────────────────────────────────────────────────────────
    // EMPTY STATES
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading when no orders exist */
    emptyNoOrdersHeading: string;
    /** Message when no orders exist */
    emptyNoOrdersMessage: string;
    /** Message when no addresses saved */
    emptyNoAddresses: string;

    // ─────────────────────────────────────────────────────────────────────────
    // NAVIGATION MENU
    // ─────────────────────────────────────────────────────────────────────────
    /** Navigation label: Dashboard */
    navDashboard: string;
    /** Navigation label: Orders */
    navOrders: string;
    /** Navigation label: Returns */
    navReturns: string;
    /** Navigation label: Wishlist */
    navWishlist: string;
    /** Navigation label: Account Details */
    navAccountDetails: string;

    // ─────────────────────────────────────────────────────────────────────────
    // FORM BUTTONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Logout button text */
    logoutButton: string;
    /** Form save button text */
    saveButton: string;
    /** Form cancel button text */
    cancelButton: string;
    /** Link to all orders */
    viewAllOrders: string;

    // ─────────────────────────────────────────────────────────────────────────
    // STORE CREDIT
    // ─────────────────────────────────────────────────────────────────────────
    /** Label for store credit balance */
    storeCreditLabel: string;
    /** Message for available credit */
    storeCreditAvailable: string;
}

/**
 * Search and filter content from search_filter_content metaobject
 * Contains search modal, filters, sort options, empty states
 */
export interface SearchContent {
    // ─────────────────────────────────────────────────────────────────────────
    // SEARCH INPUT
    // ─────────────────────────────────────────────────────────────────────────
    /** Placeholder text in search input */
    searchPlaceholder: string;

    // ─────────────────────────────────────────────────────────────────────────
    // SEARCH SECTIONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Section heading for recent searches */
    recentSearchesHeading: string;
    /** Section heading for popular terms */
    popularSearchesHeading: string;
    /** Section heading for featured collections */
    featuredCollectionsHeading: string;
    /** Button to clear recent searches */
    clearAllButton: string;

    // ─────────────────────────────────────────────────────────────────────────
    // SEARCH RESULTS
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading when no results found */
    emptyResultsHeading: string;
    /** Message with {term} placeholder */
    emptyResultsMessageTemplate: string;
    /** Button to view all results */
    viewAllResults: string;

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY TABS
    // ─────────────────────────────────────────────────────────────────────────
    /** Tab label for products */
    categoryProducts: string;
    /** Tab label for collections */
    categoryCollections: string;
    /** Tab label for blog articles */
    categoryArticles: string;

    // ─────────────────────────────────────────────────────────────────────────
    // SORT OPTIONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Sort option: Featured */
    sortFeatured: string;
    /** Sort option: Price Low to High */
    sortPriceLowHigh: string;
    /** Sort option: Price High to Low */
    sortPriceHighLow: string;
    /** Sort option: Newest */
    sortNewest: string;
    /** Sort option: Best Selling */
    sortBestSelling: string;
    /** Sort option: A-Z */
    sortAToZ: string;
    /** Sort option: Z-A */
    sortZToA: string;

    // ─────────────────────────────────────────────────────────────────────────
    // FILTER LABELS
    // ─────────────────────────────────────────────────────────────────────────
    /** Filter section label: Price */
    filterByPrice: string;
    /** Filter section label: Color */
    filterByColor: string;
    /** Filter section label: Size */
    filterBySize: string;

    // ─────────────────────────────────────────────────────────────────────────
    // RESULTS DISPLAY
    // ─────────────────────────────────────────────────────────────────────────
    /** Template: "Showing {count} of {total} products" */
    resultsCountTemplate: string;
    /** Button for infinite scroll */
    loadMoreButton: string;
    /** Text while loading more results */
    loadingText: string;

    // ─────────────────────────────────────────────────────────────────────────
    // VIEW OPTIONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Accessibility label for grid view */
    gridViewLabel: string;
    /** Accessibility label for list view */
    listViewLabel: string;
    /** Column option: 2 columns */
    col2Label: string;
    /** Column option: 3 columns */
    col3Label: string;
    /** Column option: 4 columns */
    col4Label: string;

    // ─────────────────────────────────────────────────────────────────────────
    // FILTER BUTTONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Mobile filter apply button */
    applyFilters: string;
    /** Clear all filters button */
    clearFilters: string;
}

/**
 * UI messages and notifications from ui_messages metaobject
 * Contains toasts, loading states, form validation, status updates
 */
export interface UIMessages {
    // ─────────────────────────────────────────────────────────────────────────
    // SUCCESS MESSAGES
    // ─────────────────────────────────────────────────────────────────────────
    /** Generic success message */
    successGeneric: string;
    /** Toast when item added to cart */
    successCartAdd: string;
    /** Toast when item removed from cart */
    successCartRemove: string;
    /** Toast when added to wishlist */
    successWishlistAdd: string;
    /** Toast when removed from wishlist */
    successWishlistRemove: string;
    /** Toast when wishlist cleared */
    successWishlistCleared: string;
    /** Toast when form saved */
    successSaved: string;
    /** Toast when link copied */
    successLinkCopied: string;
    /** Toast when discount applied */
    successDiscount: string;
    /** Toast when newsletter subscribed */
    successSubscribed: string;

    // ─────────────────────────────────────────────────────────────────────────
    // ERROR MESSAGES
    // ─────────────────────────────────────────────────────────────────────────
    /** Generic error message */
    errorGeneric: string;
    /** Network/offline error */
    errorNetwork: string;
    /** Session timeout message */
    errorSession: string;
    /** Form validation for required fields */
    errorRequired: string;
    /** Email validation error */
    errorInvalidEmail: string;
    /** Clipboard copy failed */
    errorCopyFailed: string;

    // ─────────────────────────────────────────────────────────────────────────
    // LOADING STATES
    // ─────────────────────────────────────────────────────────────────────────
    /** Generic loading state */
    loadingGeneric: string;
    /** Processing state */
    loadingProcessing: string;
    /** Calculation in progress */
    loadingCalculating: string;
    /** Save in progress */
    loadingSaving: string;
    /** Adding to cart state */
    loadingAdding: string;

    // ─────────────────────────────────────────────────────────────────────────
    // FORM VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    /** Password too short error */
    validationPasswordShort: string;
    /** Password confirmation error */
    validationPasswordMismatch: string;
    /** Email required error */
    validationEmailRequired: string;

    // ─────────────────────────────────────────────────────────────────────────
    // NETWORK STATUS
    // ─────────────────────────────────────────────────────────────────────────
    /** Online status message */
    statusOnline: string;
    /** Offline status message */
    statusOffline: string;

    // ─────────────────────────────────────────────────────────────────────────
    // CART NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Toast description for add all */
    cartItemsRemain: string;
    /** Toast when quantity changed */
    cartQuantityUpdated: string;
    /** Template with {count} for bulk add */
    cartAllItemsAddedTemplate: string;
    /** Warning about unavailable items */
    cartSomeUnavailable: string;
}

/**
 * Error pages content from error_pages_content metaobject
 * Contains 404, 500, offline, maintenance page messaging
 */
export interface ErrorContent {
    // ─────────────────────────────────────────────────────────────────────────
    // 404 NOT FOUND
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading for 404 page */
    notFoundHeading: string;
    /** Message for 404 page */
    notFoundMessage: string;
    /** Primary button text */
    notFoundPrimaryCta: string;
    /** Secondary button text */
    notFoundSecondaryCta: string;

    // ─────────────────────────────────────────────────────────────────────────
    // 500 SERVER ERROR
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading for 500 page */
    serverErrorHeading: string;
    /** Message for 500 page */
    serverErrorMessage: string;
    /** Retry button text */
    serverErrorRetry: string;
    /** Home button text */
    serverErrorHome: string;
    /** Text before contact link */
    serverErrorContactPrefix: string;
    /** Contact link text */
    serverErrorContactLink: string;

    // ─────────────────────────────────────────────────────────────────────────
    // OFFLINE PAGE
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading for offline page */
    offlineHeading: string;
    /** Message for offline page */
    offlineMessage: string;
    /** Retry button text */
    offlineRetry: string;
    /** Home button text */
    offlineHome: string;
    /** Helpful tip about cached pages */
    offlineTip: string;

    // ─────────────────────────────────────────────────────────────────────────
    // MAINTENANCE MODE
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading for maintenance mode */
    maintenanceHeading: string;
    /** Message for maintenance mode */
    maintenanceMessage: string;
    /** Optional estimated time message */
    maintenanceEstimated: string;
}

/**
 * Wishlist content from wishlist_content metaobject
 * Contains wishlist page, sharing, empty states, view options
 */
export interface WishlistContent {
    // ─────────────────────────────────────────────────────────────────────────
    // PAGE HEADER
    // ─────────────────────────────────────────────────────────────────────────
    /** Main heading on wishlist page */
    pageHeading: string;
    /** SEO description for wishlist page */
    metaDescription: string;

    // ─────────────────────────────────────────────────────────────────────────
    // ITEM COUNT DISPLAY
    // ─────────────────────────────────────────────────────────────────────────
    /** Text while loading count */
    itemCountLoading: string;
    /** Text when no items */
    itemCountEmpty: string;
    /** Template: "{count} item you've saved" */
    itemCountSingularTemplate: string;
    /** Template: "{count} items you've saved" */
    itemCountPluralTemplate: string;

    // ─────────────────────────────────────────────────────────────────────────
    // EMPTY STATE
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading for empty state */
    emptyHeading: string;
    /** Message for empty state */
    emptyMessage: string;
    /** Button text for empty state */
    emptyCta: string;

    // ─────────────────────────────────────────────────────────────────────────
    // SORT OPTIONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Sort option: Newest */
    sortNewest: string;
    /** Sort option: Oldest */
    sortOldest: string;
    /** Sort option: Price ascending */
    sortPriceUp: string;
    /** Sort option: Price descending */
    sortPriceDown: string;
    /** Layout option: List view */
    listLabel: string;

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION BUTTONS
    // ─────────────────────────────────────────────────────────────────────────
    /** Share button text */
    shareButton: string;
    /** Add all to cart button */
    addAllButton: string;
    /** Clear wishlist button */
    clearButton: string;

    // ─────────────────────────────────────────────────────────────────────────
    // SHARE DIALOG
    // ─────────────────────────────────────────────────────────────────────────
    /** Share dialog title */
    shareDialogHeading: string;
    /** Copy link button text */
    shareCopyLink: string;
    /** Confirmation after copy */
    shareCopied: string;
    /** Share text template with {count} and {brand} */
    shareDescriptionTemplate: string;

    // ─────────────────────────────────────────────────────────────────────────
    // CLEAR CONFIRMATION DIALOG
    // ─────────────────────────────────────────────────────────────────────────
    /** Confirmation dialog title */
    clearDialogTitle: string;
    /** Message with {count} */
    clearDialogMessageTemplate: string;
    /** Cannot undo warning */
    clearDialogWarning: string;
    /** Cancel button */
    clearDialogKeep: string;
    /** Confirm button */
    clearDialogConfirm: string;

    // ─────────────────────────────────────────────────────────────────────────
    // BULK ADD FEEDBACK
    // ─────────────────────────────────────────────────────────────────────────
    /** Success message with {count} */
    addAllSuccessTemplate: string;

    // ─────────────────────────────────────────────────────────────────────────
    // UNAVAILABLE PRODUCTS
    // ─────────────────────────────────────────────────────────────────────────
    /** Heading when products unavailable */
    unavailableHeading: string;
    /** Message about unavailable products */
    unavailableMessage: string;
    /** Button to clear unavailable items */
    clearUnavailableButton: string;
    /** Button to continue shopping */
    browseProductsButton: string;

    // ─────────────────────────────────────────────────────────────────────────
    // SHARED WISHLIST PAGE
    // ─────────────────────────────────────────────────────────────────────────
    /** Badge on shared wishlist page */
    sharedWishlistBadge: string;
    /** Message when shared list is empty */
    sharedWishlistEmpty: string;
    /** Title in share preview */
    myWishlistTitle: string;
    /** Template with {count} for preview */
    curatedItemsTemplate: string;
}

// =============================================================================
// NOTE: EnhancedSiteContent REMOVED (80/20 Simplification)
// =============================================================================
// The EnhancedSiteContent type was removed as part of the 80/20 simplification.
// Components now import FALLBACK_* constants directly from fallback-data.ts.
// Only SiteContent (site_settings + theme_settings) is provided via Context.
//
// The individual content type interfaces (ProductContent, CartContent, etc.)
// are preserved because they define the shape of FALLBACK_* constants.
// =============================================================================

// =============================================================================
// GLOBAL WINDOW EXTENSIONS
// =============================================================================

/**
 * BeforeInstallPromptEvent interface for PWA installation
 * This event is captured synchronously before React hydration
 */
export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: "accepted" | "dismissed"}>;
}

/**
 * Related app info returned by getInstalledRelatedApps()
 * @see https://web.dev/get-installed-related-apps/
 */
export interface InstalledRelatedApp {
    id?: string;
    platform: "webapp" | "play" | "itunes" | "windows";
    url?: string;
    version?: string;
}

declare global {
    interface Window {
        /**
         * Pre-captured beforeinstallprompt event
         * Captured synchronously in <head> before React hydration to ensure
         * mobile browsers don't miss the event (which fires early on mobile)
         */
        __pwaInstallPromptEvent?: BeforeInstallPromptEvent;
    }

    interface Navigator {
        /**
         * Returns a list of installed apps related to this web app
         * Only available in Chromium-based browsers (Chrome 80+, Edge, etc.)
         * @see https://web.dev/get-installed-related-apps/
         */
        getInstalledRelatedApps?: () => Promise<InstalledRelatedApp[]>;
    }
}
