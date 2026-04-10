/**
 * @fileoverview Social Media Sharing Utilities and Platform Integrations
 *
 * @description
 * Comprehensive social sharing toolkit for products and articles with platform-specific URL
 * generation, Web Share API integration, clipboard operations, and share analytics tracking.
 * Supports Facebook, X (Twitter), WhatsApp, Pinterest, and native OS sharing.
 *
 * @architecture
 * Sharing Strategy:
 * - Native OS sharing via Web Share API (mobile/modern browsers)
 * - Platform-specific URLs (Facebook, X, WhatsApp, Pinterest)
 * - Clipboard fallback for "Copy Link" functionality
 * - Share analytics tracking via /api/share/track endpoint
 *
 * Platform Support:
 * - Web Share API: iOS Safari 12.1+, Android Chrome 89+, Desktop Safari (macOS Sonoma+)
 * - Facebook: sharer.php with quote parameter
 * - X (Twitter): intent/tweet with text + url
 * - WhatsApp: whatsapp://send (mobile) or wa.me (desktop)
 * - Pinterest: pin/create/button with image media
 * - Copy Link: Clipboard API + document.execCommand fallback
 *
 * Share Data Format:
 * - Product: title, description, url, imageUrl, price, shopName
 * - Article: title, excerpt, url, imageUrl (no price)
 * - Analytics: platform, productId, productHandle, timestamp, userAgent, referrer
 *
 * @dependencies
 * - storefrontapi.generated - ProductFragment type
 * - Browser Web Share API
 * - Browser Clipboard API
 * - Browser Navigator API
 *
 * @related
 * - app/components/ProductShareButton.tsx - Product sharing UI component
 * - app/components/blog/ShareButtons.tsx - Article sharing UI component
 * - app/routes/api.share.track.tsx - Share analytics tracking endpoint
 * - app/lib/blog-utils.ts - Article share data creation
 */

import type {ProductFragment} from "storefrontapi.generated";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {parseProductTitle} from "~/lib/product";

// Types
export interface ShareData {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    price: string;
    shopName?: string;
}

export interface ShareAnalytics {
    platform: string;
    productId: string;
    productHandle: string;
    timestamp: number;
    userAgent?: string;
    referrer?: string;
}

export interface SocialSharePlatform {
    id: string;
    name: string;
    icon: React.ComponentType<{className?: string}>;
    url: (shareData: ShareData) => string;
    isNative?: boolean;
    customHandler?: (shareData: ShareData, onSuccess?: () => void, onError?: () => void) => Promise<void>;
}

// Format price using the shared CurrencyFormatter for consistent symbol display
function formatPrice(price: {amount: string; currencyCode: string}): string {
    return formatShopifyMoney(price);
}

// Create share data from product
export function createShareData(
    product: Pick<ProductFragment, "title" | "description" | "images">,
    variant: ProductFragment["selectedOrFirstAvailableVariant"],
    currentUrl: string,
    shopName?: string
): ShareData {
    const firstImage = product.images?.nodes?.[0];
    const {primary, secondary} = parseProductTitle(product.title);

    return {
        title: primary,
        description:
            product.description ||
            `Check out ${primary}${secondary ? ` - ${secondary}` : ""} - Premium quality product available now.`,
        url: currentUrl,
        imageUrl: firstImage?.url,
        price: variant?.price ? formatPrice(variant.price) : "",
        shopName
    };
}

// Generate URL with query parameters
export function generateShareUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        }
    });
    return url.toString();
}

// Generate share message
export function generateShareMessage(shareData: ShareData): string {
    return `Checkout the ${shareData.title}${shareData.shopName ? ` by ${shareData.shopName}` : ""} only at ${shareData.price}\n\nProduct Link:\n${shareData.url}`;
}

// Copy to clipboard with fallback
export async function copyToClipboard(text: string, onSuccess?: () => void, onError?: () => void): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(text);
            onSuccess?.();
            return true;
        } catch {
            // Fall through to fallback
        }
    }

    // Fallback for older browsers
    if (typeof document !== "undefined") {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);
            if (successful) {
                onSuccess?.();
                return true;
            }
        } catch {
            // Fall through to error
        }
    }

    onError?.();
    return false;
}

// Check if device is mobile
export function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;

    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent) ||
        window.innerWidth <= 768
    );
}

// Open share window (centered popup)
export function openShareWindow(url: string, title: string = "Share"): void {
    const width = 600;
    const height = 400;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(url, title, `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
}

// Track share event via API
export async function trackShareEvent(analytics: ShareAnalytics): Promise<void> {
    try {
        await fetch("/api/share/track", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(analytics)
        });
    } catch {
        // Silently ignore analytics tracking errors to not disrupt user experience
    }
}

// Create analytics data
export function createShareAnalytics(platform: string, productId: string, productHandle: string): ShareAnalytics {
    return {
        platform,
        productId,
        productHandle,
        timestamp: Date.now(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        referrer: typeof document !== "undefined" ? document.referrer : undefined
    };
}

// =============================================================================
// WEB SHARE API
// =============================================================================

/**
 * Check if the Web Share API is supported in the current browser.
 * Web Share API provides native OS-level sharing on mobile devices.
 *
 * Support:
 * - iOS Safari 12.1+
 * - Android Chrome 89+
 * - Samsung Internet
 * - Desktop Safari (macOS Sonoma+)
 * - Desktop Chrome (Windows/ChromeOS only)
 * - Firefox: No support
 */
export function isWebShareSupported(): boolean {
    return typeof navigator !== "undefined" && "share" in navigator;
}

/**
 * Trigger native OS share dialog using Web Share API.
 * Falls back gracefully if not supported or user cancels.
 *
 * @param shareData - Data to share (title, description, url)
 * @returns true if share was triggered (even if cancelled), false if not supported
 */
export async function triggerNativeShare(shareData: ShareData): Promise<boolean> {
    // Check if Web Share API is available
    if (!isWebShareSupported()) {
        return false;
    }

    // Prepare data for Web Share API
    const webShareData: ShareDataInit = {
        title: shareData.title,
        text: shareData.description,
        url: shareData.url
    };

    // Check if we can share this data (some browsers have restrictions)
    if (navigator.canShare && !navigator.canShare(webShareData)) {
        return false;
    }

    try {
        await navigator.share(webShareData);
        return true;
    } catch (error) {
        // AbortError means user cancelled - not an error, share dialog was shown
        if ((error as Error).name === "AbortError") {
            return true;
        }
        // Other errors (NotAllowedError, etc.) mean share failed
        return false;
    }
}

// Web Share API type (not included in older TypeScript libs)
interface ShareDataInit {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
}

// =============================================================================
// SOCIAL PLATFORM ICONS
// =============================================================================

// Social platform icons as inline SVG components
export const FacebookIcon = ({className}: {className?: string}) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

export const XIcon = ({className}: {className?: string}) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

export const WhatsAppIcon = ({className}: {className?: string}) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

export const PinterestIcon = ({className}: {className?: string}) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
);

export const LinkIcon = ({className}: {className?: string}) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

// Platform brand colors
export const PLATFORM_COLORS = {
    facebook: "rgb(24, 119, 242)",
    x: "rgb(0, 0, 0)",
    whatsapp: "rgb(37, 211, 102)",
    pinterest: "rgb(189, 8, 28)",
    copy: "rgb(107, 114, 128)"
} as const;

// Get all social share platforms
export function getSocialSharePlatforms(): SocialSharePlatform[] {
    return [
        {
            id: "facebook",
            name: "Facebook",
            icon: FacebookIcon,
            url: (shareData: ShareData) =>
                generateShareUrl("https://www.facebook.com/sharer/sharer.php", {
                    u: shareData.url,
                    quote: `Checkout the ${shareData.title}${shareData.shopName ? ` by ${shareData.shopName}` : ""} only at ${shareData.price}`
                })
        },
        {
            id: "x",
            name: "X",
            icon: XIcon,
            url: (shareData: ShareData) => {
                const text = `Checkout the ${shareData.title}${shareData.shopName ? ` by ${shareData.shopName}` : ""} only at ${shareData.price}`;
                return generateShareUrl("https://twitter.com/intent/tweet", {
                    text,
                    url: shareData.url
                });
            }
        },
        {
            id: "whatsapp",
            name: "WhatsApp",
            icon: WhatsAppIcon,
            url: (shareData: ShareData) => {
                const message = generateShareMessage(shareData);
                const baseUrl = isMobileDevice() ? "whatsapp://send" : "https://wa.me/";
                return generateShareUrl(baseUrl, {text: message});
            }
        },
        {
            id: "pinterest",
            name: "Pinterest",
            icon: PinterestIcon,
            url: (shareData: ShareData) =>
                generateShareUrl("https://pinterest.com/pin/create/button/", {
                    url: shareData.url,
                    description: `Checkout the ${shareData.title}${shareData.shopName ? ` by ${shareData.shopName}` : ""} only at ${shareData.price}`,
                    media: shareData.imageUrl || ""
                })
        },
        {
            id: "copy",
            name: "Copy Link",
            icon: LinkIcon,
            url: () => "",
            isNative: true,
            customHandler: async (shareData: ShareData, onSuccess?: () => void, onError?: () => void) => {
                await copyToClipboard(shareData.url, onSuccess, onError);
            }
        }
    ];
}
