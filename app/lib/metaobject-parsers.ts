/**
 * @fileoverview Shopify Metaobject Data Parsers and Transformers
 *
 * @description
 * Transforms raw GraphQL metaobject responses into type-safe TypeScript objects with
 * validation, fallbacks, and format conversion. Handles two metaobject types (site_settings
 * and theme_settings) with complex field types including JSON arrays, file references, and
 * color format conversion.
 *
 * @architecture
 * Parser Strategy (Simplified - 80/20 Rule):
 * - Defensive parsing with type guards and validation
 * - Graceful fallbacks to centralized defaults from fallback-data.ts
 * - Format conversion (OKLCH to HEX, JSON strings to typed objects)
 * - Collection handling (social links, testimonials, FAQs, Instagram media)
 *
 * Metaobject Structure (Only 2 metaobjects needed):
 * 1. site_settings - Site content (brand, hero, SEO, collections)
 * 2. theme_settings - Brand theming (fonts & colors)
 *
 * Note: UI content parsers (product, cart, account, search, etc.) are preserved
 * for type definitions but not used at runtime. Components import FALLBACK_*
 * constants directly from fallback-data.ts for standard UI labels.
 *
 * Field Types:
 * - Social links: JSON array of {label, url} → SocialLink[]
 * - Testimonials & FAQs: JSON arrays → typed objects
 * - Instagram media: File references → InstagramMedia[] (images/videos)
 * - Fonts: Google Font names → ThemeFonts
 * - Colors: OKLCH or HEX → validated color strings
 *
 * @dependencies
 * - TypeScript types from types/index.ts
 * - Centralized fallback data from ./fallback-data.ts
 *
 * @related
 * - app/lib/metaobject-queries.ts - GraphQL queries that provide the raw data
 * - app/lib/metaobject-fragments.ts - GraphQL fragments for metaobject fields
 * - app/lib/fallback-data.ts - Default values and FALLBACK_* constants
 * - app/lib/site-content-context.tsx - Provides parsed data via React Context
 * - app/root.tsx - Uses parseSiteContent to transform query results
 */

import {DEFAULT_BORDER_RADIUS_SEED, sanitizeBorderRadiusSeed} from "~/lib/theme-utils";
import type {
    SiteSettings,
    SocialLink,
    Testimonial,
    FAQItem,
    InstagramMedia,
    SiteContent,
    HeroMedia,
    ThemeFonts,
    ThemeCoreColors,
    ThemeConfig,
    ProductContent,
    CartContent,
    AccountContent,
    SearchContent,
    UIMessages,
    ErrorContent,
    WishlistContent
} from "types";

// =============================================================================
// METAOBJECT TYPE HELPERS
// =============================================================================

/** A single Shopify metaobject field — value, reference, or multi-reference */
type MetaobjectField = {
    value?: string | null;
    reference?: Record<string, unknown> | null;
    references?: {nodes: Record<string, unknown>[]} | null;
};

/** A parsed metaobject — keys map to their field values */
type MetaobjectData = Record<string, MetaobjectField | undefined>;

// =============================================================================
// FALLBACK CONSTANTS (previously in fallback-data.ts)
// =============================================================================

const FALLBACK_BRAND_WORDS: string[] = [
    "Quality",
    "Crafted",
    "Curated",
    "Timeless",
    "Refined",
    "Purposeful",
    "Distinct",
    "Essential",
    "Thoughtful",
    "Premium"
];

const FALLBACK_SOCIAL_LINKS: SocialLink[] = [
    {
        id: "social-facebook",
        platform: "Facebook",
        handle: "/yourbrand",
        url: "https://facebook.com/yourbrand",
        displayOrder: 1
    },
    {
        id: "social-instagram",
        platform: "Instagram",
        handle: "@yourbrand",
        url: "https://instagram.com/yourbrand",
        displayOrder: 2
    },
    {
        id: "social-tiktok",
        platform: "TikTok",
        handle: "@yourbrand",
        url: "https://tiktok.com/@yourbrand",
        displayOrder: 3
    },
    {
        id: "social-x",
        platform: "X",
        handle: "@yourbrand",
        url: "https://x.com/yourbrand",
        displayOrder: 4
    },
    {
        id: "social-youtube",
        platform: "YouTube",
        handle: "@yourbrand",
        url: "https://youtube.com/@yourbrand",
        displayOrder: 5
    },
    {
        id: "social-linkedin",
        platform: "LinkedIn",
        handle: "company/yourbrand",
        url: "https://linkedin.com/company/yourbrand",
        displayOrder: 6
    },
    {
        id: "social-pinterest",
        platform: "Pinterest",
        handle: "@yourbrand",
        url: "https://pinterest.com/yourbrand",
        displayOrder: 7
    }
];

const FALLBACK_THEME_FONTS = {
    sans: "Inter",
    serif: "Inter",
    mono: "Inter"
};

const FALLBACK_THEME_COLORS = {
    primary: "oklch(0.2 0 0)",
    secondary: "oklch(0.9 0 0)",
    background: "oklch(1 0 0)",
    foreground: "oklch(0.15 0 0)",
    accent: "oklch(0.45 0 0)"
};

const FALLBACK_SECTION_HEADINGS = {
    blogSectionTitle: "From the Blog",
    collectionsTitle: "Featured Collections",
    relatedProductsTitle: "You Might Also Like",
    recommendedTitle: "Recommended For You",
    instagramTitle: "Follow Us"
};

const FALLBACK_SITE_SETTINGS = {
    brandName: "",
    brandLogo: null,
    ogImage: null,
    brandWords: FALLBACK_BRAND_WORDS,
    missionStatement: "",
    featuredProductSection: null,
    heroHeading: "Shop with Intention",
    heroDescription:
        "Discover products built to last. Quality craftsmanship, thoughtful design, everyday value. Your next favorite find is here.",
    heroMediaMobile: undefined,
    heroMediaLargeScreen: undefined,
    siteUrl: "",
    messengerPageId: "",
    whatsappNumber: "",
    ...FALLBACK_SECTION_HEADINGS,
    galleryPageHeading: "The Gallery",
    galleryPageDescription:
        "A visual showcase of our products and the stories behind them—craftsmanship, process, and everyday use.",
    blogPageHeading: "The Blog",
    blogPageDescription:
        "Ideas, guides, and stories from our world—exploring craft, design, and the things worth owning.",
    announcementBanner: [],
    promotionalBannerOneMedia: undefined,
    promotionalBannerTwoMedia: undefined,
    socialLinks: FALLBACK_SOCIAL_LINKS,
    testimonials: [],
    faqItems: [
        {
            id: "faq-default-1",
            question: "What shipping options do you offer?",
            answer: "We offer standard and express shipping. Standard delivery takes 5-7 business days, while express delivery arrives in 2-3 business days."
        },
        {
            id: "faq-default-2",
            question: "What is your return policy?",
            answer: "We accept returns within 30 days of purchase. Items must be unused and in original packaging. Contact us to initiate a return."
        },
        {
            id: "faq-default-3",
            question: "How can I track my order?",
            answer: "Once your order ships, you'll receive a confirmation email with a tracking number. You can also check your order status in your account."
        },
        {
            id: "faq-default-4",
            question: "Do you ship internationally?",
            answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by destination."
        }
    ],
    instagramMedia: [],
    googleMapsEmbedUrls: [],
    googleMapsLinks: [],
    faviconUrl: null,
    icon192Url: null,
    icon512Url: null,
    icon180AppleUrl: null
};

const FALLBACK_PRODUCT_CONTENT: ProductContent = {
    addToCartStandard: "Add to Bag",
    addToCartPreorder: "Pre-Order",
    addToCartSoldOut: "Sold Out",
    addToCartSubscribe: "Subscribe",
    addToCartOffline: "Unavailable Offline",
    offlineHelperText: "Connect to the internet to add items to your bag",
    selectFrequency: "Select delivery frequency",
    stockInStock: "In Stock",
    stockOutOfStock: "Out of Stock",
    stockLowTemplate: "Only {quantity} left",
    purchaseTypeLabel: "Purchase Type",
    oneTimeLabel: "One-time purchase",
    subscribeSaveLabel: "Subscribe & Save",
    savePercentageTemplate: "Save {percent}%",
    sizeGuideCta: "Size Guide",
    quantityLabel: "Quantity",
    tabDescription: "Description",
    tabShipping: "Shipping",
    tabReviews: "Reviews",
    badgeNew: "New",
    badgeSale: "Sale",
    badgeBestseller: "Bestseller",
    badgeClearance: "Clearance",
    badgePremium: "Premium",
    badgePreorder: "Pre-Order",
    badgeLimited: "Limited Edition",
    shareButtonLabel: "Share",
    wishlistAddLabel: "Add to wishlist",
    wishlistRemoveLabel: "Remove from wishlist",
    relatedProductsTitle: "You might also like"
};

const FALLBACK_CART_CONTENT: CartContent = {
    cartDrawerTitle: "Your Bag",
    cartPageTitle: "Shopping Bag",
    itemCountSingular: "item",
    itemCountPlural: "items",
    emptyCartHeading: "Your bag is empty",
    emptyCartCta: "Continue Shopping",
    quantityLabel: "Quantity",
    removeLabel: "Remove",
    subtotalLabel: "Subtotal",
    shippingLabel: "Shipping",
    taxLabel: "Tax",
    totalLabel: "Total",
    taxShippingNotice: "Taxes and shipping calculated at checkout",
    discountPlaceholder: "Enter discount code",
    discountApplyButton: "Apply",
    discountApplied: "Discount applied",
    discountError: "Invalid discount code",
    freeShippingLabel: "Free Shipping",
    freeShippingUnlocked: "You've unlocked free shipping!",
    freeShippingAwayTemplate: "{amount} away from free shipping",
    freeShippingAlmost: "You're almost there!",
    freeShippingCalculating: "Calculating...",
    orderNotesPlaceholder: "Add a note to your order",
    checkoutButton: "Checkout",
    checkoutCalculating: "Calculating...",
    checkoutOfflineWarning: "Connect to the internet to checkout",
    storeCreditNotice: "Store credit will be applied at checkout",
    closeButton: "Close",
    suggestionsTitle: "Complete your look"
};

const FALLBACK_ACCOUNT_CONTENT: AccountContent = {
    greetingMorning: "Good morning, {name}",
    greetingMidday: "Good day, {name}",
    greetingAfternoon: "Good afternoon, {name}",
    greetingEvening: "Good evening, {name}",
    greetingNight: "Good night, {name}",
    greetingFallback: "Welcome back",
    sectionRecentOrders: "Recent Orders",
    sectionQuickActions: "Quick Actions",
    sectionAccountStats: "Account Overview",
    sectionRecentlyViewed: "Recently Viewed",
    actionTrackOrders: "Track Orders",
    actionShopNow: "Shop Now",
    actionAddresses: "Addresses",
    actionGetHelp: "Get Help",
    actionEditProfile: "Edit Profile",
    actionOrderHistory: "Order History",
    statOrdersPlaced: "Orders Placed",
    statSavedAddresses: "Saved Addresses",
    statMemberSince: "Member Since",
    emptyNoOrdersHeading: "No orders yet",
    emptyNoOrdersMessage: "When you place an order, it will appear here",
    emptyNoAddresses: "No saved addresses yet",
    navDashboard: "Dashboard",
    navOrders: "Orders",
    navReturns: "Returns",
    navWishlist: "Wishlist",
    navAccountDetails: "Account Details",
    logoutButton: "Sign Out",
    saveButton: "Save Changes",
    cancelButton: "Cancel",
    viewAllOrders: "View All Orders",
    storeCreditLabel: "Store Credit",
    storeCreditAvailable: "Available Credit"
};

const FALLBACK_SEARCH_CONTENT: SearchContent = {
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
};

const FALLBACK_UI_MESSAGES: UIMessages = {
    successGeneric: "Success!",
    successCartAdd: "Added to bag",
    successCartRemove: "Item removed",
    successWishlistAdd: "Added to wishlist",
    successWishlistRemove: "Removed from wishlist",
    successWishlistCleared: "Wishlist cleared",
    successSaved: "Changes saved",
    successLinkCopied: "Link copied!",
    successDiscount: "Discount applied",
    successSubscribed: "Thanks for subscribing!",
    errorGeneric: "Something went wrong. Please try again.",
    errorNetwork: "Please check your connection and try again",
    errorSession: "Your session has expired. Please sign in again.",
    errorRequired: "This field is required",
    errorInvalidEmail: "Please enter a valid email address",
    errorCopyFailed: "Couldn't copy to clipboard",
    loadingGeneric: "Loading...",
    loadingProcessing: "Processing...",
    loadingCalculating: "Calculating...",
    loadingSaving: "Saving...",
    loadingAdding: "Adding...",
    validationPasswordShort: "Password must be at least 8 characters",
    validationPasswordMismatch: "Passwords don't match",
    validationEmailRequired: "Email is required",
    statusOnline: "You're back online",
    statusOffline: "You're offline",
    cartItemsRemain: "items remain in your bag",
    cartQuantityUpdated: "Quantity updated",
    cartAllItemsAddedTemplate: "{count} items added to bag",
    cartSomeUnavailable: "Some items are no longer available"
};

const FALLBACK_ERROR_CONTENT: ErrorContent = {
    notFoundHeading: "Page Not Found",
    notFoundMessage: "The page you're looking for doesn't exist or has been moved.",
    notFoundPrimaryCta: "Back to Home",
    notFoundSecondaryCta: "Browse Collections",
    serverErrorHeading: "Something Went Wrong",
    serverErrorMessage: "We're experiencing technical difficulties. Please try again.",
    serverErrorRetry: "Try Again",
    serverErrorHome: "Return Home",
    serverErrorContactPrefix: "Need help?",
    serverErrorContactLink: "Contact Support",
    offlineHeading: "You're Offline",
    offlineMessage: "Please check your internet connection and try again.",
    offlineRetry: "Retry",
    offlineHome: "Return Home",
    offlineTip: "Tip: Some pages you've visited before may still be available",
    maintenanceHeading: "We'll Be Right Back",
    maintenanceMessage: "We're making some improvements. Please check back soon.",
    maintenanceEstimated: "Estimated time: a few minutes"
};

const FALLBACK_WISHLIST_CONTENT: WishlistContent = {
    pageHeading: "Wishlist",
    metaDescription: "Your curated collection of favorite items",
    itemCountLoading: "Loading...",
    itemCountEmpty: "No items saved",
    itemCountSingularTemplate: "{count} item you've saved",
    itemCountPluralTemplate: "{count} items you've saved",
    emptyHeading: "Your wishlist is empty",
    emptyMessage: "Save your favorite pieces by tapping the heart icon",
    emptyCta: "Explore Collection",
    sortNewest: "Newest",
    sortOldest: "Oldest",
    sortPriceUp: "Price: Low to High",
    sortPriceDown: "Price: High to Low",
    listLabel: "List",
    shareButton: "Share",
    addAllButton: "Add All to Bag",
    clearButton: "Clear All",
    shareDialogHeading: "Share Your Wishlist",
    shareCopyLink: "Copy Link",
    shareCopied: "Link copied!",
    shareDescriptionTemplate: "Check out my wishlist with {count} items from {brand}",
    clearDialogTitle: "Clear Wishlist",
    clearDialogMessageTemplate: "Are you sure you want to remove all {count} items?",
    clearDialogWarning: "This action cannot be undone",
    clearDialogKeep: "Keep Items",
    clearDialogConfirm: "Clear All",
    addAllSuccessTemplate: "{count} items added to bag",
    unavailableHeading: "Some items are unavailable",
    unavailableMessage: "These items are currently out of stock or discontinued",
    clearUnavailableButton: "Remove Unavailable",
    browseProductsButton: "Browse Products",
    sharedWishlistBadge: "Shared",
    sharedWishlistEmpty: "This shared wishlist is empty",
    myWishlistTitle: "My Wishlist",
    curatedItemsTemplate: "{count} curated items"
};

// =============================================================================
// RE-EXPORTS FOR BACKWARDS COMPATIBILITY
// These export the centralized fallback values under their legacy names
// =============================================================================

/** Brand words for the marquee - sourced from centralized fallback-data.ts */
// eslint-disable-next-line @typescript-eslint/naming-convention -- legacy export name for backwards compatibility
export const DEFAULT_words_to_describe_your_brand = FALLBACK_BRAND_WORDS;

/** Social links - sourced from centralized fallback-data.ts */
export const DEFAULT_SOCIAL_LINKS = FALLBACK_SOCIAL_LINKS;

/**
 * Default site settings - sourced from centralized fallback-data.ts
 * Used when metaobject is not configured in Shopify Admin
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = FALLBACK_SITE_SETTINGS as SiteSettings;

// =============================================================================
// JSON PARSING HELPERS
// =============================================================================

/**
 * Parse hero media from metaobject reference (supports both image and video)
 */
function parseHeroMedia(heroMediaField: MetaobjectField | undefined): HeroMedia | undefined {
    const ref = heroMediaField?.reference;
    if (!ref) return undefined;

    // Check __typename to determine media type
    if (ref.__typename === "MediaImage") {
        const image = ref.image as Record<string, unknown> | undefined;
        if (image?.url) {
            return {
                mediaType: "image",
                url: image.url as string,
                altText: image.altText as string | undefined,
                width: image.width as number | undefined,
                height: image.height as number | undefined
            };
        }
    }

    const sources = ref.sources as Record<string, unknown>[] | undefined;
    if (ref.__typename === "Video" && sources && sources.length > 0) {
        // Prefer mp4 source, fallback to first available
        const mp4Source = sources.find((s: Record<string, unknown>) => s.mimeType === "video/mp4");
        const videoSource = mp4Source || sources[0];

        const previewImage = ref.previewImage as Record<string, unknown> | undefined;
        return {
            mediaType: "video",
            url: videoSource.url as string,
            altText: previewImage?.altText as string | undefined,
            previewImage: previewImage?.url
                ? {
                      url: previewImage.url as string,
                      altText: previewImage.altText as string | undefined
                  }
                : undefined
        };
    }

    return undefined;
}

/**
 * Parse brand words from list of single line text
 * Shopify "List of single line text" field returns JSON array: ["word1", "word2", ...]
 */
function parseBrandWords(brandWordsField: MetaobjectField | undefined): string[] {
    if (!brandWordsField?.value) {
        return DEFAULT_words_to_describe_your_brand;
    }

    try {
        const parsed = JSON.parse(brandWordsField.value) as unknown;
        if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            parsed.every((item): item is string => typeof item === "string")
        ) {
            return parsed;
        }
        return DEFAULT_words_to_describe_your_brand;
    } catch {
        return DEFAULT_words_to_describe_your_brand;
    }
}

/**
 * Parse announcement banner texts from list of single line text
 * Shopify "List of single line text" field returns JSON array: ["text1", "text2", ...]
 * Falls back to wrapping a plain string for stores using single_line_text_field instead.
 * Returns empty array if field is empty — component hides when no texts exist
 */
function parseAnnouncementTexts(announcementField: MetaobjectField | undefined): string[] {
    if (!announcementField?.value) {
        return [];
    }

    try {
        const parsed = JSON.parse(announcementField.value) as unknown;
        if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            parsed.every((item): item is string => typeof item === "string")
        ) {
            return parsed;
        }
        return [];
    } catch {
        // Field is single_line_text_field (plain string) rather than list.single_line_text_field
        // (JSON array). Wrap it so the banner renders regardless of which field type the store uses.
        const text = announcementField.value.trim();
        return text ? [text] : [];
    }
}

/**
 * Parse a list.url field from Shopify metaobjects.
 * Shopify returns list.url as a JSON array string: ["https://...", "https://..."]
 * Returns [] when the field is absent, empty, or malformed.
 */
function parseUrlList(field: MetaobjectField | undefined): string[] {
    if (!field?.value) return [];
    try {
        const parsed = JSON.parse(field.value) as unknown;
        if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === "string")) {
            return parsed.filter(url => url.trim().length > 0);
        }
        return [];
    } catch {
        return [];
    }
}

/**
 * Extract the `src` URL from a Google Maps full iframe embed code.
 * Google Maps "Share > Embed a map" produces HTML like:
 *   <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>
 *
 * Accepts both the full HTML string and a bare URL.
 * Returns null when extraction fails.
 */
function extractIframeSrc(value: string): string | null {
    const trimmed = value.trim();
    // Full iframe HTML — extract src attribute
    if (trimmed.startsWith("<")) {
        const match = trimmed.match(/src="([^"]+)"/);
        return match?.[1] ?? null;
    }
    // Already a bare URL
    return trimmed.length > 0 ? trimmed : null;
}

/**
 * Parse a list.single_line_text field containing Google Maps embed codes.
 * Each entry may be either a full <iframe> HTML string (from the Google Maps
 * "Embed a map" share flow) or a bare embed src URL.
 * The extracted src URL is what the <iframe> element's src attribute receives.
 * Returns [] when the field is absent, empty, or malformed.
 */
function parseEmbedUrlList(field: MetaobjectField | undefined): string[] {
    if (!field?.value) return [];
    try {
        const parsed = JSON.parse(field.value) as unknown;
        if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === "string")) {
            return parsed.flatMap(item => {
                const src = extractIframeSrc(item);
                return src ? [src] : [];
            });
        }
        return [];
    } catch {
        return [];
    }
}

function warnFeaturedProductSection(reason: string) {
    if (process.env.NODE_ENV === "development") {
        console.warn(`[SiteSettings] featured_product_section omitted: ${reason}`);
    }
}

function parseFeaturedProductSection(featuredProductField: MetaobjectField | undefined): SiteSettings["featuredProductSection"] {
    const reference = featuredProductField?.reference;

    if (!reference) return null;

    if (reference.__typename !== "Product") {
        warnFeaturedProductSection(`expected Product reference, received ${reference.__typename ?? "unknown"}`);
        return null;
    }

    const selectedVariant = reference.selectedOrFirstAvailableVariant as Record<string, unknown> | undefined;
    if (!reference.availableForSale || !selectedVariant?.availableForSale) {
        warnFeaturedProductSection(`product "${reference.handle ?? reference.id}" is unavailable`);
        return null;
    }

    const variantPrice = selectedVariant.price as Record<string, unknown> | undefined;
    if (!variantPrice?.amount || !variantPrice.currencyCode) {
        warnFeaturedProductSection(`product "${reference.handle ?? reference.id}" is missing sellable pricing`);
        return null;
    }

    const refFeaturedImage = reference.featuredImage as Record<string, unknown> | undefined;
    const variantImage = selectedVariant.image as Record<string, unknown> | undefined;
    const featuredImage = refFeaturedImage?.url
        ? {
              url: refFeaturedImage.url as string,
              altText: (refFeaturedImage.altText as string | null) ?? null,
              width: (refFeaturedImage.width as number | null) ?? null,
              height: (refFeaturedImage.height as number | null) ?? null
          }
        : variantImage?.url
          ? {
                url: variantImage.url as string,
                altText: (variantImage.altText as string | null) ?? null,
                width: (variantImage.width as number | null) ?? null,
                height: (variantImage.height as number | null) ?? null
            }
          : null;

    const compareAtPrice = selectedVariant.compareAtPrice as Record<string, unknown> | undefined;

    const rawPriceRange = reference.priceRange as Record<string, unknown> | undefined;
    const rawMinPrice = rawPriceRange?.minVariantPrice as Record<string, unknown> | undefined;
    const rawMaxPrice = rawPriceRange?.maxVariantPrice as Record<string, unknown> | undefined;
    const priceRange = {
        minVariantPrice: {
            amount: (rawMinPrice?.amount as string | undefined) ?? (variantPrice.amount as string),
            currencyCode: (rawMinPrice?.currencyCode as string | undefined) ?? (variantPrice.currencyCode as string)
        },
        maxVariantPrice: {
            amount: (rawMaxPrice?.amount as string | undefined) ?? (variantPrice.amount as string),
            currencyCode: (rawMaxPrice?.currencyCode as string | undefined) ?? (variantPrice.currencyCode as string)
        }
    };

    const rawVariants = reference.variants as {nodes: Record<string, unknown>[]} | undefined;
    const variantNodes = (rawVariants?.nodes ?? []).map(v => {
        const vPrice = v.price as Record<string, unknown> | undefined;
        const vCompareAt = v.compareAtPrice as Record<string, unknown> | undefined;
        const vOptions = v.selectedOptions as Array<{name: string; value: string}> | undefined;
        return {
            id: v.id as string,
            availableForSale: v.availableForSale as boolean,
            title: v.title as string | undefined,
            selectedOptions: vOptions,
            price: {
                amount: (vPrice?.amount as string) ?? "0",
                currencyCode: (vPrice?.currencyCode as string) ?? (variantPrice.currencyCode as string)
            },
            compareAtPrice:
                vCompareAt?.amount && vCompareAt.currencyCode
                    ? {amount: vCompareAt.amount as string, currencyCode: vCompareAt.currencyCode as string}
                    : null
        };
    });

    // Forward raw media nodes so downstream (QuickAdd*, FeaturedProductSpotlight)
    // can render a video when product.media[0] is a Video. Shape kept loose —
    // getCardVideoMedia reads only __typename and the relevant sub-fields.
    const rawMedia = reference.media as {nodes?: Array<Record<string, unknown>>} | undefined;
    const mediaNodes = Array.isArray(rawMedia?.nodes) ? rawMedia.nodes : null;

    return {
        id: reference.id as string,
        handle: reference.handle as string,
        title: reference.title as string,
        vendor: (reference.vendor as string | null) ?? "",
        description: (reference.description as string | null) ?? "",
        availableForSale: true,
        tags: (reference.tags as string[] | null) ?? [],
        featuredImage,
        media: mediaNodes ? {nodes: mediaNodes} : null,
        priceRange,
        price: {
            amount: variantPrice.amount as string,
            currencyCode: variantPrice.currencyCode as string
        },
        compareAtPrice:
            compareAtPrice?.amount && compareAtPrice.currencyCode
                ? {
                      amount: compareAtPrice.amount as string,
                      currencyCode: compareAtPrice.currencyCode as string
                  }
                : null,
        variants: {nodes: variantNodes}
    };
}

/**
 * Parse free shipping threshold from Decimal field
 * Shopify Decimal fields return numeric strings (e.g., "50.00")
 */
function parseFreeShippingThreshold(value: MetaobjectField | undefined): number | null {
    if (!value?.value) return null;

    const parsed = parseFloat(value.value);
    return isNaN(parsed) ? null : parsed;
}

function extractHandleFromUrl(url: string, platform: string): string {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes

        if (!pathname) return "";

        // Different platforms have different URL patterns
        const lowerPlatform = platform.toLowerCase();
        if (
            lowerPlatform === "instagram" ||
            lowerPlatform === "tiktok" ||
            lowerPlatform === "twitter" ||
            lowerPlatform === "x"
        ) {
            return `@${pathname}`;
        }
        if (lowerPlatform === "facebook" || lowerPlatform === "linkedin" || lowerPlatform === "youtube") {
            return `/${pathname}`;
        }
        return pathname;
    } catch {
        return "";
    }
}

/**
 * Parse social links from list of links field
 * Shopify "List of links" field returns: [{text, url}, ...] where text is the platform name
 * (Note: Shopify uses "text" not "label" for the link text)
 */
function parseSocialLinks(jsonField: MetaobjectField | undefined): SocialLink[] {
    if (!jsonField?.value) return [];

    try {
        const parsed = JSON.parse(jsonField.value) as unknown;
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return [];
        }

        const links = (parsed as Record<string, unknown>[])
            .map((item, index) => {
                // Shopify "List of links" field uses "text" for label, not "label"
                const platform = (item.text as string) || (item.label as string) || "";
                const url = (item.url as string) || "";
                return {
                    id: `social-${index}`,
                    platform,
                    handle: extractHandleFromUrl(url, platform),
                    url,
                    displayOrder: index + 1
                };
            })
            .filter((link: SocialLink) => link.platform && link.url);

        return links.length > 0 ? links : [];
    } catch {
        return [];
    }
}

/**
 * Parse testimonials from JSON field
 * Expected format: [{customerName, location, rating, text, avatarUrl}, ...]
 */
function parseTestimonialsJson(jsonField: MetaobjectField | undefined): Testimonial[] {
    if (!jsonField?.value) return [];

    try {
        const parsed = JSON.parse(jsonField.value) as unknown;
        if (!Array.isArray(parsed)) return [];

        return (parsed as Record<string, unknown>[])
            .map((item, index) => ({
                id: (item.id as string) || `testimonial-${index}`,
                customerName: (item.customerName as string) || "Anonymous",
                location: (item.location as string) || "",
                rating: parseInt((item.rating as string) || "5", 10),
                text: (item.text as string) || "",
                avatar: item.avatarUrl
                    ? {
                          url: item.avatarUrl as string,
                          altText: (item.avatarAltText as string) || (item.customerName as string)
                      }
                    : undefined
            }))
            .filter((t: Testimonial) => t.text);
    } catch {
        return [];
    }
}

/**
 * Parse FAQ items from JSON field
 * Expected format: [{question, answer}, ...]
 */
function parseFaqItemsJson(jsonField: MetaobjectField | undefined): FAQItem[] {
    if (!jsonField?.value) return [];

    try {
        const parsed = JSON.parse(jsonField.value) as unknown;
        if (!Array.isArray(parsed)) return [];

        const items = (parsed as Record<string, unknown>[])
            .map((item, index) => ({
                id: (item.id as string) || `faq-${index}`,
                question: (item.question as string) || "",
                answer: (item.answer as string) || ""
            }))
            .filter((f: FAQItem) => f.question && f.answer);

        // Detect generic Shopify placeholder FAQs that aren't useful for an
        // e-commerce storefront. When ALL questions are generic placeholders,
        // return [] so the caller falls back to e-commerce defaults.
        if (items.length > 0 && items.every(item => isGenericFaqQuestion(item.question))) {
            return [];
        }

        return items;
    } catch {
        return [];
    }
}

/**
 * Known generic/placeholder FAQ questions that Shopify metaobject templates
 * ship with. These are not e-commerce-relevant and should trigger a fallback
 * to the curated defaults in DEFAULT_SITE_SETTINGS.
 */
const GENERIC_FAQ_QUESTIONS = new Set([
    "what is this?",
    "who is this for?",
    "how does it work?",
    "do i need any special knowledge to use this?",
    "can i get started quickly?",
    "is everything easy to understand?",
    "is this designed to be user-friendly?",
    "can i explore it at my own pace?",
    "what makes this stand out?",
    "where can i find more information?"
]);

function isGenericFaqQuestion(question: string): boolean {
    return GENERIC_FAQ_QUESTIONS.has(question.trim().toLowerCase());
}

/**
 * Extract image URL from a metaobject file reference field
 * Used for PWA icons and other single image references
 */
function extractImageUrl(field: MetaobjectField | undefined): string | null {
    const ref = field?.reference;
    if (!ref || ref.__typename !== "MediaImage") return null;
    const image = ref.image as Record<string, unknown> | undefined;
    return (image?.url as string) ?? null;
}

/**
 * Parse Instagram media from list of file references
 * Each reference can be MediaImage or Video
 */
function parseInstagramMedia(mediaField: MetaobjectField | undefined): InstagramMedia[] {
    const nodes = mediaField?.references?.nodes;
    if (!Array.isArray(nodes) || nodes.length === 0) return [];

    return nodes
        .map((ref: Record<string, unknown>, index: number): InstagramMedia | null => {
            const image = ref.image as Record<string, unknown> | undefined;
            if (ref.__typename === "MediaImage" && image?.url) {
                return {
                    id: (ref.id as string) || `instagram-${index}`,
                    mediaType: "image",
                    url: image.url as string,
                    altText: (image.altText as string) || `Instagram post ${index + 1}`,
                    width: image.width as number | undefined,
                    height: image.height as number | undefined
                };
            }

            const sources = ref.sources as Record<string, unknown>[] | undefined;
            if (ref.__typename === "Video" && sources && sources.length > 0) {
                // Prefer mp4 source, fallback to first available
                const mp4Source = sources.find((s: Record<string, unknown>) => s.mimeType === "video/mp4");
                const videoSource = mp4Source || sources[0];

                const previewImage = ref.previewImage as Record<string, unknown> | undefined;
                return {
                    id: (ref.id as string) || `instagram-${index}`,
                    mediaType: "video",
                    url: videoSource.url as string,
                    altText: (ref.alt as string) || `Instagram video ${index + 1}`,
                    previewImage: previewImage?.url
                        ? {
                              url: previewImage.url as string,
                              altText: previewImage.altText as string | undefined
                          }
                        : undefined
                };
            }

            return null;
        })
        .filter((item): item is InstagramMedia => item !== null);
}

// =============================================================================
// THEME PARSING
// =============================================================================

/**
 * Parse theme fonts from metaobject fields
 * Maps semantic field names to CSS variable names:
 * - body_font → --font-sans (Body text & UI elements)
 * - heading_font → --font-serif (Headings & titles)
 * - price_font → --font-mono (Prices & numerical data)
 */
function parseThemeFonts(data: MetaobjectData): ThemeFonts {
    return {
        // body_font → --font-sans: paragraphs, buttons, labels, UI text
        sans: data.fontBody?.value || FALLBACK_THEME_FONTS.sans,
        // heading_font → --font-serif: h1-h6, hero text, section titles
        serif: data.fontHeading?.value || FALLBACK_THEME_FONTS.serif,
        // price_font → --font-mono: prices, quantities, codes, tabular data
        mono: data.fontPrice?.value || FALLBACK_THEME_FONTS.mono
    };
}

/**
 * Validate color string is a valid OKLCH or HEX format
 * OKLCH: oklch(0.6 0.1 45) or oklch(60% 0.1 45)
 * HEX: #rgb, #rrggbb, #rgba, #rrggbbaa
 */
function isValidColor(color: string): boolean {
    if (!color || typeof color !== "string") return false;
    const trimmed = color.trim();

    // Check OKLCH format
    if (trimmed.startsWith("oklch(") && trimmed.endsWith(")")) {
        return true;
    }

    // Check HEX format
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
        return true;
    }

    return false;
}

/**
 * Parse theme colors from metaobject fields
 * Validates color format and falls back to defaults for invalid values
 */
function parseThemeColors(data: MetaobjectData): ThemeCoreColors {
    const primary = data.colorPrimary?.value ?? "";
    const secondary = data.colorSecondary?.value ?? "";
    const background = data.colorBackground?.value ?? "";
    const foreground = data.colorForeground?.value ?? "";
    const accent = data.colorAccent?.value ?? "";

    return {
        primary: isValidColor(primary) ? primary.trim() : FALLBACK_THEME_COLORS.primary,
        secondary: isValidColor(secondary) ? secondary.trim() : FALLBACK_THEME_COLORS.secondary,
        background: isValidColor(background) ? background.trim() : FALLBACK_THEME_COLORS.background,
        foreground: isValidColor(foreground) ? foreground.trim() : FALLBACK_THEME_COLORS.foreground,
        accent: isValidColor(accent) ? accent.trim() : FALLBACK_THEME_COLORS.accent
    };
}

// =============================================================================
// THEME SETTINGS PARSER (EXPORTED)
// =============================================================================

/**
 * Default theme configuration - used when theme_settings metaobject is not configured
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
    fonts: FALLBACK_THEME_FONTS,
    colors: FALLBACK_THEME_COLORS,
    borderRadius: DEFAULT_BORDER_RADIUS_SEED
};

/**
 * Parse theme settings from the theme_settings metaobject
 * Used for the separate theme_settings metaobject (not site_settings)
 *
 * @param data - Raw GraphQL response for theme_settings metaobject
 * @returns Parsed theme configuration with fonts and colors
 */
export function parseThemeSettings(rawData: unknown): ThemeConfig {
    if (!rawData) return DEFAULT_THEME_CONFIG;

    const data = rawData as MetaobjectData;

    // Debug: Log raw values from Shopify metaobject (dev only)
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console -- intentional debug logging for theme parsing
        console.log("[ThemeSettings] Raw values from Shopify metaobject:", {
            colorPrimary: data.colorPrimary?.value ?? "(not set)",
            colorSecondary: data.colorSecondary?.value ?? "(not set)",
            colorBackground: data.colorBackground?.value ?? "(not set)",
            colorForeground: data.colorForeground?.value ?? "(not set)",
            colorAccent: data.colorAccent?.value ?? "(not set)",
            borderRadius: data.borderRadius?.value ?? "(not set)",
            fontBody: data.fontBody?.value ?? "(not set)",
            fontHeading: data.fontHeading?.value ?? "(not set)",
            fontPrice: data.fontPrice?.value ?? "(not set)"
        });
    }

    return {
        fonts: parseThemeFonts(data),
        colors: parseThemeColors(data),
        borderRadius: sanitizeBorderRadiusSeed(data.borderRadius?.value, DEFAULT_THEME_CONFIG.borderRadius)
    };
}

// =============================================================================
// MAIN PARSER
// =============================================================================

/**
 * Parse site settings from metaobject response
 * Now contains ALL site configuration including collections
 */
export function parseSiteSettings(rawData: unknown): SiteSettings {
    if (!rawData) return DEFAULT_SITE_SETTINGS;

    const data = rawData as MetaobjectData;

    // Parse collections once and fall back to defaults if empty
    const parsedSocialLinks = parseSocialLinks(data.socialLinksData);
    const parsedTestimonials = parseTestimonialsJson(data.testimonialsData);
    const parsedFaqItems = parseFaqItemsJson(data.faqItemsData);
    const parsedInstagramMedia = parseInstagramMedia(data.instagramMediaData);

    return {
        // Brand Identity — brandName/missionStatement/siteUrl come from shop {} via parseShopBrand;
        // defaults here are overridden by shopOverrides in parseSiteContent.
        brandName: DEFAULT_SITE_SETTINGS.brandName,
        missionStatement: DEFAULT_SITE_SETTINGS.missionStatement,
        siteUrl: DEFAULT_SITE_SETTINGS.siteUrl,
        brandWords: parseBrandWords(data.brandWords),
        featuredProductSection: parseFeaturedProductSection(data.featuredProductSection),

        // Hero Section
        heroHeading: data.heroHeading?.value || DEFAULT_SITE_SETTINGS.heroHeading,
        heroDescription: data.heroDescription?.value || DEFAULT_SITE_SETTINGS.heroDescription,
        heroMediaMobile: parseHeroMedia(data.heroMediaMobile) || DEFAULT_SITE_SETTINGS.heroMediaMobile,
        heroMediaLargeScreen: parseHeroMedia(data.heroMediaLargeScreen) || DEFAULT_SITE_SETTINGS.heroMediaLargeScreen,

        // Messaging Widgets (Messenger + WhatsApp — powers FloatingChatWidget)
        messengerPageId: data.messengerId?.value || DEFAULT_SITE_SETTINGS.messengerPageId,
        whatsappNumber: data.whatsappNumber?.value || DEFAULT_SITE_SETTINGS.whatsappNumber,

        // Section Headings
        blogSectionTitle: data.blogSectionTitle?.value || DEFAULT_SITE_SETTINGS.blogSectionTitle,
        collectionsTitle: data.collectionsTitle?.value || DEFAULT_SITE_SETTINGS.collectionsTitle,
        relatedProductsTitle: data.relatedProductsTitle?.value || DEFAULT_SITE_SETTINGS.relatedProductsTitle,
        recommendedTitle: data.recommendedTitle?.value || DEFAULT_SITE_SETTINGS.recommendedTitle,
        instagramTitle: data.instagramTitle?.value || DEFAULT_SITE_SETTINGS.instagramTitle,

        // Page Headings (Gallery & Blog)
        galleryPageHeading: data.galleryPageHeading?.value || DEFAULT_SITE_SETTINGS.galleryPageHeading,
        galleryPageDescription: data.galleryPageDescription?.value || DEFAULT_SITE_SETTINGS.galleryPageDescription,
        blogPageHeading: data.blogPageHeading?.value || DEFAULT_SITE_SETTINGS.blogPageHeading,
        blogPageDescription: data.blogPageDescription?.value || DEFAULT_SITE_SETTINGS.blogPageDescription,

        // Promotional Banners
        announcementBanner: parseAnnouncementTexts(data.announcementBanner),
        promotionalBannerOneMedia: parseHeroMedia(data.promotionalBannerOneMedia),
        promotionalBannerTwoMedia: parseHeroMedia(data.promotionalBannerTwoMedia),

        // Collections - parsers return [] when empty, components handle visibility
        socialLinks: parsedSocialLinks.length > 0 ? parsedSocialLinks : FALLBACK_SOCIAL_LINKS,
        testimonials: parsedTestimonials,
        faqItems: parsedFaqItems.length > 0 ? parsedFaqItems : DEFAULT_SITE_SETTINGS.faqItems,
        instagramMedia: parsedInstagramMedia,

        // Shop Locations (Google Maps)
        // google_maps_embed: list.single_line_text — each entry is the full <iframe> HTML from
        //   Google Maps "Share > Embed a map". Parser extracts the src URL from the HTML.
        // google_maps_link: list.url — each entry is the maps.app.goo.gl/… share URL.
        googleMapsEmbedUrls: parseEmbedUrlList(data.googleMapsEmbed),
        googleMapsLinks: parseUrlList(data.googleMapsLink),

        // Favicon - extracted from file reference
        faviconUrl: extractImageUrl(data.favicon),

        // PWA Icons - extracted from file references
        icon192Url: extractImageUrl(data.icon192),
        icon512Url: extractImageUrl(data.icon512),
        icon180AppleUrl: extractImageUrl(data.icon180Apple)
    };
}

// =============================================================================
// PRODUCT CONTENT PARSER
// =============================================================================

/**
 * Parse product page content metaobject
 * Returns fallback values for any missing fields
 */
export function parseProductContent(data: unknown): ProductContent {
    if (!data || typeof data !== "object") {
        return FALLBACK_PRODUCT_CONTENT;
    }

    const d = data as Record<string, {value?: string}>;

    return {
        // Add to Cart Button Variants
        addToCartStandard: d.addToCartStandard?.value || FALLBACK_PRODUCT_CONTENT.addToCartStandard,
        addToCartPreorder: d.addToCartPreorder?.value || FALLBACK_PRODUCT_CONTENT.addToCartPreorder,
        addToCartSoldOut: d.addToCartSoldOut?.value || FALLBACK_PRODUCT_CONTENT.addToCartSoldOut,
        addToCartSubscribe: d.addToCartSubscribe?.value || FALLBACK_PRODUCT_CONTENT.addToCartSubscribe,
        addToCartOffline: d.addToCartOffline?.value || FALLBACK_PRODUCT_CONTENT.addToCartOffline,
        offlineHelperText: d.offlineHelperText?.value || FALLBACK_PRODUCT_CONTENT.offlineHelperText,
        selectFrequency: d.selectFrequency?.value || FALLBACK_PRODUCT_CONTENT.selectFrequency,

        // Stock Status Labels
        stockInStock: d.stockInStock?.value || FALLBACK_PRODUCT_CONTENT.stockInStock,
        stockOutOfStock: d.stockOutOfStock?.value || FALLBACK_PRODUCT_CONTENT.stockOutOfStock,
        stockLowTemplate: d.stockLowTemplate?.value || FALLBACK_PRODUCT_CONTENT.stockLowTemplate,

        // Purchase Type Options
        purchaseTypeLabel: d.purchaseTypeLabel?.value || FALLBACK_PRODUCT_CONTENT.purchaseTypeLabel,
        oneTimeLabel: d.oneTimeLabel?.value || FALLBACK_PRODUCT_CONTENT.oneTimeLabel,
        subscribeSaveLabel: d.subscribeSaveLabel?.value || FALLBACK_PRODUCT_CONTENT.subscribeSaveLabel,
        savePercentageTemplate: d.savePercentageTemplate?.value || FALLBACK_PRODUCT_CONTENT.savePercentageTemplate,

        // Product Page UI
        sizeGuideCta: d.sizeGuideCta?.value || FALLBACK_PRODUCT_CONTENT.sizeGuideCta,
        quantityLabel: d.quantityLabel?.value || FALLBACK_PRODUCT_CONTENT.quantityLabel,

        // Product Tabs
        tabDescription: d.tabDescription?.value || FALLBACK_PRODUCT_CONTENT.tabDescription,
        tabShipping: d.tabShipping?.value || FALLBACK_PRODUCT_CONTENT.tabShipping,
        tabReviews: d.tabReviews?.value || FALLBACK_PRODUCT_CONTENT.tabReviews,

        // Product Badges
        badgeNew: d.badgeNew?.value || FALLBACK_PRODUCT_CONTENT.badgeNew,
        badgeSale: d.badgeSale?.value || FALLBACK_PRODUCT_CONTENT.badgeSale,
        badgeBestseller: d.badgeBestseller?.value || FALLBACK_PRODUCT_CONTENT.badgeBestseller,
        badgeClearance: d.badgeClearance?.value || FALLBACK_PRODUCT_CONTENT.badgeClearance,
        badgePremium: d.badgePremium?.value || FALLBACK_PRODUCT_CONTENT.badgePremium,
        badgePreorder: d.badgePreorder?.value || FALLBACK_PRODUCT_CONTENT.badgePreorder,
        badgeLimited: d.badgeLimited?.value || FALLBACK_PRODUCT_CONTENT.badgeLimited,

        // Wishlist & Share
        shareButtonLabel: d.shareButtonLabel?.value || FALLBACK_PRODUCT_CONTENT.shareButtonLabel,
        wishlistAddLabel: d.wishlistAddLabel?.value || FALLBACK_PRODUCT_CONTENT.wishlistAddLabel,
        wishlistRemoveLabel: d.wishlistRemoveLabel?.value || FALLBACK_PRODUCT_CONTENT.wishlistRemoveLabel,

        // Related Products
        relatedProductsTitle: d.relatedProductsTitle?.value || FALLBACK_PRODUCT_CONTENT.relatedProductsTitle
    };
}

// =============================================================================
// CART CONTENT PARSER
// =============================================================================

/**
 * Parse cart & checkout content metaobject
 * Returns fallback values for any missing fields
 */
export function parseCartContent(data: unknown): CartContent {
    if (!data || typeof data !== "object") {
        return FALLBACK_CART_CONTENT;
    }

    const d = data as Record<string, {value?: string}>;

    return {
        // Cart Headers
        cartDrawerTitle: d.cartDrawerTitle?.value || FALLBACK_CART_CONTENT.cartDrawerTitle,
        cartPageTitle: d.cartPageTitle?.value || FALLBACK_CART_CONTENT.cartPageTitle,
        itemCountSingular: d.itemCountSingular?.value || FALLBACK_CART_CONTENT.itemCountSingular,
        itemCountPlural: d.itemCountPlural?.value || FALLBACK_CART_CONTENT.itemCountPlural,

        // Empty Cart State
        emptyCartHeading: d.emptyCartHeading?.value || FALLBACK_CART_CONTENT.emptyCartHeading,
        emptyCartCta: d.emptyCartCta?.value || FALLBACK_CART_CONTENT.emptyCartCta,

        // Line Item Controls
        quantityLabel: d.quantityLabel?.value || FALLBACK_CART_CONTENT.quantityLabel,
        removeLabel: d.removeLabel?.value || FALLBACK_CART_CONTENT.removeLabel,

        // Cart Summary Labels
        subtotalLabel: d.subtotalLabel?.value || FALLBACK_CART_CONTENT.subtotalLabel,
        shippingLabel: d.shippingLabel?.value || FALLBACK_CART_CONTENT.shippingLabel,
        taxLabel: d.taxLabel?.value || FALLBACK_CART_CONTENT.taxLabel,
        totalLabel: d.totalLabel?.value || FALLBACK_CART_CONTENT.totalLabel,
        taxShippingNotice: d.taxShippingNotice?.value || FALLBACK_CART_CONTENT.taxShippingNotice,

        // Discount Code
        discountPlaceholder: d.discountPlaceholder?.value || FALLBACK_CART_CONTENT.discountPlaceholder,
        discountApplyButton: d.discountApplyButton?.value || FALLBACK_CART_CONTENT.discountApplyButton,
        discountApplied: d.discountApplied?.value || FALLBACK_CART_CONTENT.discountApplied,
        discountError: d.discountError?.value || FALLBACK_CART_CONTENT.discountError,

        // Free Shipping Progress
        freeShippingLabel: d.freeShippingLabel?.value || FALLBACK_CART_CONTENT.freeShippingLabel,
        freeShippingUnlocked: d.freeShippingUnlocked?.value || FALLBACK_CART_CONTENT.freeShippingUnlocked,
        freeShippingAwayTemplate: d.freeShippingAwayTemplate?.value || FALLBACK_CART_CONTENT.freeShippingAwayTemplate,
        freeShippingAlmost: d.freeShippingAlmost?.value || FALLBACK_CART_CONTENT.freeShippingAlmost,
        freeShippingCalculating: d.freeShippingCalculating?.value || FALLBACK_CART_CONTENT.freeShippingCalculating,

        // Order Notes & Checkout
        orderNotesPlaceholder: d.orderNotesPlaceholder?.value || FALLBACK_CART_CONTENT.orderNotesPlaceholder,
        checkoutButton: d.checkoutButton?.value || FALLBACK_CART_CONTENT.checkoutButton,
        checkoutCalculating: d.checkoutCalculating?.value || FALLBACK_CART_CONTENT.checkoutCalculating,
        checkoutOfflineWarning: d.checkoutOfflineWarning?.value || FALLBACK_CART_CONTENT.checkoutOfflineWarning,
        storeCreditNotice: d.storeCreditNotice?.value || FALLBACK_CART_CONTENT.storeCreditNotice,

        // UI Controls
        closeButton: d.closeButton?.value || FALLBACK_CART_CONTENT.closeButton,
        suggestionsTitle: d.suggestionsTitle?.value || FALLBACK_CART_CONTENT.suggestionsTitle
    };
}

// =============================================================================
// ACCOUNT CONTENT PARSER
// =============================================================================

/**
 * Parse account & auth content metaobject
 * Returns fallback values for any missing fields
 */
export function parseAccountContent(data: unknown): AccountContent {
    if (!data || typeof data !== "object") {
        return FALLBACK_ACCOUNT_CONTENT;
    }

    const d = data as Record<string, {value?: string}>;

    return {
        // Time-based Greetings
        greetingMorning: d.greetingMorning?.value || FALLBACK_ACCOUNT_CONTENT.greetingMorning,
        greetingMidday: d.greetingMidday?.value || FALLBACK_ACCOUNT_CONTENT.greetingMidday,
        greetingAfternoon: d.greetingAfternoon?.value || FALLBACK_ACCOUNT_CONTENT.greetingAfternoon,
        greetingEvening: d.greetingEvening?.value || FALLBACK_ACCOUNT_CONTENT.greetingEvening,
        greetingNight: d.greetingNight?.value || FALLBACK_ACCOUNT_CONTENT.greetingNight,
        greetingFallback: d.greetingFallback?.value || FALLBACK_ACCOUNT_CONTENT.greetingFallback,

        // Dashboard Section Headings
        sectionRecentOrders: d.sectionRecentOrders?.value || FALLBACK_ACCOUNT_CONTENT.sectionRecentOrders,
        sectionQuickActions: d.sectionQuickActions?.value || FALLBACK_ACCOUNT_CONTENT.sectionQuickActions,
        sectionAccountStats: d.sectionAccountStats?.value || FALLBACK_ACCOUNT_CONTENT.sectionAccountStats,
        sectionRecentlyViewed: d.sectionRecentlyViewed?.value || FALLBACK_ACCOUNT_CONTENT.sectionRecentlyViewed,

        // Quick Action Labels
        actionTrackOrders: d.actionTrackOrders?.value || FALLBACK_ACCOUNT_CONTENT.actionTrackOrders,
        actionShopNow: d.actionShopNow?.value || FALLBACK_ACCOUNT_CONTENT.actionShopNow,
        actionAddresses: d.actionAddresses?.value || FALLBACK_ACCOUNT_CONTENT.actionAddresses,
        actionGetHelp: d.actionGetHelp?.value || FALLBACK_ACCOUNT_CONTENT.actionGetHelp,
        actionEditProfile: d.actionEditProfile?.value || FALLBACK_ACCOUNT_CONTENT.actionEditProfile,
        actionOrderHistory: d.actionOrderHistory?.value || FALLBACK_ACCOUNT_CONTENT.actionOrderHistory,

        // Account Statistics Labels
        statOrdersPlaced: d.statOrdersPlaced?.value || FALLBACK_ACCOUNT_CONTENT.statOrdersPlaced,
        statSavedAddresses: d.statSavedAddresses?.value || FALLBACK_ACCOUNT_CONTENT.statSavedAddresses,
        statMemberSince: d.statMemberSince?.value || FALLBACK_ACCOUNT_CONTENT.statMemberSince,

        // Empty States
        emptyNoOrdersHeading: d.emptyNoOrdersHeading?.value || FALLBACK_ACCOUNT_CONTENT.emptyNoOrdersHeading,
        emptyNoOrdersMessage: d.emptyNoOrdersMessage?.value || FALLBACK_ACCOUNT_CONTENT.emptyNoOrdersMessage,
        emptyNoAddresses: d.emptyNoAddresses?.value || FALLBACK_ACCOUNT_CONTENT.emptyNoAddresses,

        // Navigation Menu
        navDashboard: d.navDashboard?.value || FALLBACK_ACCOUNT_CONTENT.navDashboard,
        navOrders: d.navOrders?.value || FALLBACK_ACCOUNT_CONTENT.navOrders,
        navReturns: d.navReturns?.value || FALLBACK_ACCOUNT_CONTENT.navReturns,
        navWishlist: d.navWishlist?.value || FALLBACK_ACCOUNT_CONTENT.navWishlist,
        navAccountDetails: d.navAccountDetails?.value || FALLBACK_ACCOUNT_CONTENT.navAccountDetails,

        // Form Buttons
        logoutButton: d.logoutButton?.value || FALLBACK_ACCOUNT_CONTENT.logoutButton,
        saveButton: d.saveButton?.value || FALLBACK_ACCOUNT_CONTENT.saveButton,
        cancelButton: d.cancelButton?.value || FALLBACK_ACCOUNT_CONTENT.cancelButton,
        viewAllOrders: d.viewAllOrders?.value || FALLBACK_ACCOUNT_CONTENT.viewAllOrders,

        // Store Credit
        storeCreditLabel: d.storeCreditLabel?.value || FALLBACK_ACCOUNT_CONTENT.storeCreditLabel,
        storeCreditAvailable: d.storeCreditAvailable?.value || FALLBACK_ACCOUNT_CONTENT.storeCreditAvailable
    };
}

// =============================================================================
// SEARCH CONTENT PARSER
// =============================================================================

/**
 * Parse search & filter content metaobject
 * Returns fallback values for any missing fields
 */
export function parseSearchContent(data: unknown): SearchContent {
    if (!data || typeof data !== "object") {
        return FALLBACK_SEARCH_CONTENT;
    }

    const d = data as Record<string, {value?: string}>;

    return {
        // Search Input
        searchPlaceholder: d.searchPlaceholder?.value || FALLBACK_SEARCH_CONTENT.searchPlaceholder,

        // Search Sections
        recentSearchesHeading: d.recentSearchesHeading?.value || FALLBACK_SEARCH_CONTENT.recentSearchesHeading,
        popularSearchesHeading: d.popularSearchesHeading?.value || FALLBACK_SEARCH_CONTENT.popularSearchesHeading,
        featuredCollectionsHeading:
            d.featuredCollectionsHeading?.value || FALLBACK_SEARCH_CONTENT.featuredCollectionsHeading,
        clearAllButton: d.clearAllButton?.value || FALLBACK_SEARCH_CONTENT.clearAllButton,

        // Search Results
        emptyResultsHeading: d.emptyResultsHeading?.value || FALLBACK_SEARCH_CONTENT.emptyResultsHeading,
        emptyResultsMessageTemplate:
            d.emptyResultsMessageTemplate?.value || FALLBACK_SEARCH_CONTENT.emptyResultsMessageTemplate,
        viewAllResults: d.viewAllResults?.value || FALLBACK_SEARCH_CONTENT.viewAllResults,

        // Category Tabs
        categoryProducts: d.categoryProducts?.value || FALLBACK_SEARCH_CONTENT.categoryProducts,
        categoryCollections: d.categoryCollections?.value || FALLBACK_SEARCH_CONTENT.categoryCollections,
        categoryArticles: d.categoryArticles?.value || FALLBACK_SEARCH_CONTENT.categoryArticles,

        // Sort Options
        sortFeatured: d.sortFeatured?.value || FALLBACK_SEARCH_CONTENT.sortFeatured,
        sortPriceLowHigh: d.sortPriceLowHigh?.value || FALLBACK_SEARCH_CONTENT.sortPriceLowHigh,
        sortPriceHighLow: d.sortPriceHighLow?.value || FALLBACK_SEARCH_CONTENT.sortPriceHighLow,
        sortNewest: d.sortNewest?.value || FALLBACK_SEARCH_CONTENT.sortNewest,
        sortBestSelling: d.sortBestSelling?.value || FALLBACK_SEARCH_CONTENT.sortBestSelling,
        sortAToZ: d.sortAToZ?.value || FALLBACK_SEARCH_CONTENT.sortAToZ,
        sortZToA: d.sortZToA?.value || FALLBACK_SEARCH_CONTENT.sortZToA,

        // Filter Labels
        filterByPrice: d.filterByPrice?.value || FALLBACK_SEARCH_CONTENT.filterByPrice,
        filterByColor: d.filterByColor?.value || FALLBACK_SEARCH_CONTENT.filterByColor,
        filterBySize: d.filterBySize?.value || FALLBACK_SEARCH_CONTENT.filterBySize,

        // Results Display
        resultsCountTemplate: d.resultsCountTemplate?.value || FALLBACK_SEARCH_CONTENT.resultsCountTemplate,
        loadMoreButton: d.loadMoreButton?.value || FALLBACK_SEARCH_CONTENT.loadMoreButton,
        loadingText: d.loadingText?.value || FALLBACK_SEARCH_CONTENT.loadingText,

        // View Options
        gridViewLabel: d.gridViewLabel?.value || FALLBACK_SEARCH_CONTENT.gridViewLabel,
        listViewLabel: d.listViewLabel?.value || FALLBACK_SEARCH_CONTENT.listViewLabel,
        col2Label: d.col2Label?.value || FALLBACK_SEARCH_CONTENT.col2Label,
        col3Label: d.col3Label?.value || FALLBACK_SEARCH_CONTENT.col3Label,
        col4Label: d.col4Label?.value || FALLBACK_SEARCH_CONTENT.col4Label,

        // Filter Buttons
        applyFilters: d.applyFilters?.value || FALLBACK_SEARCH_CONTENT.applyFilters,
        clearFilters: d.clearFilters?.value || FALLBACK_SEARCH_CONTENT.clearFilters
    };
}

// =============================================================================
// UI MESSAGES PARSER
// =============================================================================

/**
 * Parse UI messages & notifications metaobject
 * Returns fallback values for any missing fields
 */
export function parseUIMessages(data: unknown): UIMessages {
    if (!data || typeof data !== "object") {
        return FALLBACK_UI_MESSAGES;
    }

    const d = data as Record<string, {value?: string}>;

    return {
        // Success Messages
        successGeneric: d.successGeneric?.value || FALLBACK_UI_MESSAGES.successGeneric,
        successCartAdd: d.successCartAdd?.value || FALLBACK_UI_MESSAGES.successCartAdd,
        successCartRemove: d.successCartRemove?.value || FALLBACK_UI_MESSAGES.successCartRemove,
        successWishlistAdd: d.successWishlistAdd?.value || FALLBACK_UI_MESSAGES.successWishlistAdd,
        successWishlistRemove: d.successWishlistRemove?.value || FALLBACK_UI_MESSAGES.successWishlistRemove,
        successWishlistCleared: d.successWishlistCleared?.value || FALLBACK_UI_MESSAGES.successWishlistCleared,
        successSaved: d.successSaved?.value || FALLBACK_UI_MESSAGES.successSaved,
        successLinkCopied: d.successLinkCopied?.value || FALLBACK_UI_MESSAGES.successLinkCopied,
        successDiscount: d.successDiscount?.value || FALLBACK_UI_MESSAGES.successDiscount,
        successSubscribed: d.successSubscribed?.value || FALLBACK_UI_MESSAGES.successSubscribed,

        // Error Messages
        errorGeneric: d.errorGeneric?.value || FALLBACK_UI_MESSAGES.errorGeneric,
        errorNetwork: d.errorNetwork?.value || FALLBACK_UI_MESSAGES.errorNetwork,
        errorSession: d.errorSession?.value || FALLBACK_UI_MESSAGES.errorSession,
        errorRequired: d.errorRequired?.value || FALLBACK_UI_MESSAGES.errorRequired,
        errorInvalidEmail: d.errorInvalidEmail?.value || FALLBACK_UI_MESSAGES.errorInvalidEmail,
        errorCopyFailed: d.errorCopyFailed?.value || FALLBACK_UI_MESSAGES.errorCopyFailed,

        // Loading States
        loadingGeneric: d.loadingGeneric?.value || FALLBACK_UI_MESSAGES.loadingGeneric,
        loadingProcessing: d.loadingProcessing?.value || FALLBACK_UI_MESSAGES.loadingProcessing,
        loadingCalculating: d.loadingCalculating?.value || FALLBACK_UI_MESSAGES.loadingCalculating,
        loadingSaving: d.loadingSaving?.value || FALLBACK_UI_MESSAGES.loadingSaving,
        loadingAdding: d.loadingAdding?.value || FALLBACK_UI_MESSAGES.loadingAdding,

        // Form Validation
        validationPasswordShort: d.validationPasswordShort?.value || FALLBACK_UI_MESSAGES.validationPasswordShort,
        validationPasswordMismatch:
            d.validationPasswordMismatch?.value || FALLBACK_UI_MESSAGES.validationPasswordMismatch,
        validationEmailRequired: d.validationEmailRequired?.value || FALLBACK_UI_MESSAGES.validationEmailRequired,

        // Network Status
        statusOnline: d.statusOnline?.value || FALLBACK_UI_MESSAGES.statusOnline,
        statusOffline: d.statusOffline?.value || FALLBACK_UI_MESSAGES.statusOffline,

        // Cart Notifications
        cartItemsRemain: d.cartItemsRemain?.value || FALLBACK_UI_MESSAGES.cartItemsRemain,
        cartQuantityUpdated: d.cartQuantityUpdated?.value || FALLBACK_UI_MESSAGES.cartQuantityUpdated,
        cartAllItemsAddedTemplate: d.cartAllItemsAddedTemplate?.value || FALLBACK_UI_MESSAGES.cartAllItemsAddedTemplate,
        cartSomeUnavailable: d.cartSomeUnavailable?.value || FALLBACK_UI_MESSAGES.cartSomeUnavailable
    };
}

// =============================================================================
// ERROR CONTENT PARSER
// =============================================================================

/**
 * Parse error pages content metaobject
 * Returns fallback values for any missing fields
 */
export function parseErrorContent(data: unknown): ErrorContent {
    if (!data || typeof data !== "object") {
        return FALLBACK_ERROR_CONTENT;
    }

    const d = data as Record<string, {value?: string}>;

    return {
        // 404 Not Found
        notFoundHeading: d.notFoundHeading?.value || FALLBACK_ERROR_CONTENT.notFoundHeading,
        notFoundMessage: d.notFoundMessage?.value || FALLBACK_ERROR_CONTENT.notFoundMessage,
        notFoundPrimaryCta: d.notFoundPrimaryCta?.value || FALLBACK_ERROR_CONTENT.notFoundPrimaryCta,
        notFoundSecondaryCta: d.notFoundSecondaryCta?.value || FALLBACK_ERROR_CONTENT.notFoundSecondaryCta,

        // 500 Server Error
        serverErrorHeading: d.serverErrorHeading?.value || FALLBACK_ERROR_CONTENT.serverErrorHeading,
        serverErrorMessage: d.serverErrorMessage?.value || FALLBACK_ERROR_CONTENT.serverErrorMessage,
        serverErrorRetry: d.serverErrorRetry?.value || FALLBACK_ERROR_CONTENT.serverErrorRetry,
        serverErrorHome: d.serverErrorHome?.value || FALLBACK_ERROR_CONTENT.serverErrorHome,
        serverErrorContactPrefix: d.serverErrorContactPrefix?.value || FALLBACK_ERROR_CONTENT.serverErrorContactPrefix,
        serverErrorContactLink: d.serverErrorContactLink?.value || FALLBACK_ERROR_CONTENT.serverErrorContactLink,

        // Offline Page
        offlineHeading: d.offlineHeading?.value || FALLBACK_ERROR_CONTENT.offlineHeading,
        offlineMessage: d.offlineMessage?.value || FALLBACK_ERROR_CONTENT.offlineMessage,
        offlineRetry: d.offlineRetry?.value || FALLBACK_ERROR_CONTENT.offlineRetry,
        offlineHome: d.offlineHome?.value || FALLBACK_ERROR_CONTENT.offlineHome,
        offlineTip: d.offlineTip?.value || FALLBACK_ERROR_CONTENT.offlineTip,

        // Maintenance Mode
        maintenanceHeading: d.maintenanceHeading?.value || FALLBACK_ERROR_CONTENT.maintenanceHeading,
        maintenanceMessage: d.maintenanceMessage?.value || FALLBACK_ERROR_CONTENT.maintenanceMessage,
        maintenanceEstimated: d.maintenanceEstimated?.value || FALLBACK_ERROR_CONTENT.maintenanceEstimated
    };
}

// =============================================================================
// WISHLIST CONTENT PARSER
// =============================================================================

/**
 * Parse wishlist content metaobject
 * Returns fallback values for any missing fields
 */
export function parseWishlistContent(data: unknown): WishlistContent {
    if (!data || typeof data !== "object") {
        return FALLBACK_WISHLIST_CONTENT;
    }

    const d = data as Record<string, {value?: string}>;

    return {
        // Page Header
        pageHeading: d.pageHeading?.value || FALLBACK_WISHLIST_CONTENT.pageHeading,
        metaDescription: d.metaDescription?.value || FALLBACK_WISHLIST_CONTENT.metaDescription,

        // Item Count Display
        itemCountLoading: d.itemCountLoading?.value || FALLBACK_WISHLIST_CONTENT.itemCountLoading,
        itemCountEmpty: d.itemCountEmpty?.value || FALLBACK_WISHLIST_CONTENT.itemCountEmpty,
        itemCountSingularTemplate:
            d.itemCountSingularTemplate?.value || FALLBACK_WISHLIST_CONTENT.itemCountSingularTemplate,
        itemCountPluralTemplate: d.itemCountPluralTemplate?.value || FALLBACK_WISHLIST_CONTENT.itemCountPluralTemplate,

        // Empty State
        emptyHeading: d.emptyHeading?.value || FALLBACK_WISHLIST_CONTENT.emptyHeading,
        emptyMessage: d.emptyMessage?.value || FALLBACK_WISHLIST_CONTENT.emptyMessage,
        emptyCta: d.emptyCta?.value || FALLBACK_WISHLIST_CONTENT.emptyCta,

        // Sort Options
        sortNewest: d.sortNewest?.value || FALLBACK_WISHLIST_CONTENT.sortNewest,
        sortOldest: d.sortOldest?.value || FALLBACK_WISHLIST_CONTENT.sortOldest,
        sortPriceUp: d.sortPriceUp?.value || FALLBACK_WISHLIST_CONTENT.sortPriceUp,
        sortPriceDown: d.sortPriceDown?.value || FALLBACK_WISHLIST_CONTENT.sortPriceDown,
        listLabel: d.listLabel?.value || FALLBACK_WISHLIST_CONTENT.listLabel,

        // Action Buttons
        shareButton: d.shareButton?.value || FALLBACK_WISHLIST_CONTENT.shareButton,
        addAllButton: d.addAllButton?.value || FALLBACK_WISHLIST_CONTENT.addAllButton,
        clearButton: d.clearButton?.value || FALLBACK_WISHLIST_CONTENT.clearButton,

        // Share Dialog
        shareDialogHeading: d.shareDialogHeading?.value || FALLBACK_WISHLIST_CONTENT.shareDialogHeading,
        shareCopyLink: d.shareCopyLink?.value || FALLBACK_WISHLIST_CONTENT.shareCopyLink,
        shareCopied: d.shareCopied?.value || FALLBACK_WISHLIST_CONTENT.shareCopied,
        shareDescriptionTemplate:
            d.shareDescriptionTemplate?.value || FALLBACK_WISHLIST_CONTENT.shareDescriptionTemplate,

        // Clear Confirmation Dialog
        clearDialogTitle: d.clearDialogTitle?.value || FALLBACK_WISHLIST_CONTENT.clearDialogTitle,
        clearDialogMessageTemplate:
            d.clearDialogMessageTemplate?.value || FALLBACK_WISHLIST_CONTENT.clearDialogMessageTemplate,
        clearDialogWarning: d.clearDialogWarning?.value || FALLBACK_WISHLIST_CONTENT.clearDialogWarning,
        clearDialogKeep: d.clearDialogKeep?.value || FALLBACK_WISHLIST_CONTENT.clearDialogKeep,
        clearDialogConfirm: d.clearDialogConfirm?.value || FALLBACK_WISHLIST_CONTENT.clearDialogConfirm,

        // Bulk Add Feedback
        addAllSuccessTemplate: d.addAllSuccessTemplate?.value || FALLBACK_WISHLIST_CONTENT.addAllSuccessTemplate,

        // Unavailable Products
        unavailableHeading: d.unavailableHeading?.value || FALLBACK_WISHLIST_CONTENT.unavailableHeading,
        unavailableMessage: d.unavailableMessage?.value || FALLBACK_WISHLIST_CONTENT.unavailableMessage,
        clearUnavailableButton: d.clearUnavailableButton?.value || FALLBACK_WISHLIST_CONTENT.clearUnavailableButton,
        browseProductsButton: d.browseProductsButton?.value || FALLBACK_WISHLIST_CONTENT.browseProductsButton,

        // Shared Wishlist Page
        sharedWishlistBadge: d.sharedWishlistBadge?.value || FALLBACK_WISHLIST_CONTENT.sharedWishlistBadge,
        sharedWishlistEmpty: d.sharedWishlistEmpty?.value || FALLBACK_WISHLIST_CONTENT.sharedWishlistEmpty,
        myWishlistTitle: d.myWishlistTitle?.value || FALLBACK_WISHLIST_CONTENT.myWishlistTitle,
        curatedItemsTemplate: d.curatedItemsTemplate?.value || FALLBACK_WISHLIST_CONTENT.curatedItemsTemplate
    };
}

// =============================================================================
// COMBINED PARSER
// =============================================================================

/**
 * Parse site content from both metaobject query responses
 *
 * @param siteContentData - Response from SITE_CONTENT_QUERY
 * @param themeSettingsData - Response from THEME_SETTINGS_QUERY
 * @returns Combined site content with settings and theme
 */
/** Parse brand identity fields from the Storefront API `shop {}` object. */
export function parseShopBrand(
    shop: unknown
): Partial<Pick<SiteSettings, "brandName" | "brandLogo" | "ogImage" | "missionStatement" | "siteUrl">> {
    if (!shop || typeof shop !== "object") return {};
    const s = shop as Record<string, unknown>;
    const brand = s.brand as Record<string, unknown> | undefined;

    const parseImage = (raw: unknown) => {
        const img = raw as Record<string, unknown> | undefined;
        if (!img?.url) return null;
        return {
            url: img.url as string,
            altText: (img.altText as string | null) ?? null,
            width: (img.width as number | null) ?? null,
            height: (img.height as number | null) ?? null
        };
    };

    const result: Partial<Pick<SiteSettings, "brandName" | "brandLogo" | "ogImage" | "missionStatement" | "siteUrl">> = {};

    if (s.name) result.brandName = s.name as string;

    const primaryDomain = s.primaryDomain as Record<string, unknown> | undefined;
    if (primaryDomain?.url) result.siteUrl = primaryDomain.url as string;

    // Prefer brand.shortDescription, fall back to shop.description
    const desc = (brand?.shortDescription as string | null) || (s.description as string | null);
    if (desc) result.missionStatement = desc;

    if (brand) {
        const logoImg = parseImage((brand.logo as Record<string, unknown> | undefined)?.image);
        if (logoImg) result.brandLogo = logoImg;

        const coverImg = parseImage((brand.coverImage as Record<string, unknown> | undefined)?.image);
        if (coverImg) result.ogImage = coverImg;
    }

    return result;
}

export function parseSiteContent(
    siteContentData: {siteSettings?: unknown; shop?: unknown} | null,
    themeSettingsData: {themeSettings?: unknown} | null
): SiteContent {
    const siteSettings = parseSiteSettings(siteContentData?.siteSettings);
    const shopOverrides = parseShopBrand(siteContentData?.shop);
    return {
        siteSettings: {...siteSettings, ...shopOverrides},
        themeConfig: parseThemeSettings(themeSettingsData?.themeSettings)
    };
}

// =============================================================================
// REMOVED: parseEnhancedSiteContent
// =============================================================================
// The parseEnhancedSiteContent function was removed as part of the 80/20 simplification.
// Components now import FALLBACK_* constants directly from fallback-data.ts.
// Only parseSiteContent (site_settings + theme_settings) is used by root.tsx.
//
// The UI content parser functions below are preserved because:
// 1. They define the shape of FALLBACK_* constants in fallback-data.ts
// 2. They could be useful if UI content metaobjects are ever needed in the future
// =============================================================================
