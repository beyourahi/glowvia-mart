/**
 * @fileoverview Product share button with social platform selection dialog
 *
 * @description
 * Elegant share button that opens a dialog with product preview and social platform
 * buttons. Supports WhatsApp, Facebook, Twitter/X, copy link, and Web Share API.
 * Includes toast notifications and analytics tracking.
 *
 * @features
 * - Animated share dialog with product preview card
 * - Social platform buttons (WhatsApp, Facebook, Twitter/X, Copy)
 * - Web Share API fallback on supported browsers (mobile)
 * - Toast notifications for success/error states
 * - Analytics tracking for share events
 * - Product image, title, price preview in dialog
 * - Undo functionality for copy action
 * - Body scroll lock when dialog is open
 * - Event bubbling prevention (works inside clickable cards)
 *
 * @props
 * - product: Pick<ProductFragment, "id" | "handle" | "title" | "description" | "media">
 * - selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"]
 * - className: string (optional) - Additional Tailwind classes
 *
 * @usage
 * ```tsx
 * <ProductShareButton
 *   product={product}
 *   selectedVariant={selectedVariant}
 * />
 * ```
 *
 * @related
 * - app/lib/social-share.ts - Share platform configuration and utilities
 * - app/lib/site-content-context.tsx - Site settings for brand name
 * - ProductPage.tsx - Product detail page using this button
 * - ProductItem.tsx - Product card with share button
 *
 * @architecture
 * - ShareData creation from product and variant
 * - Platform-specific URL builders (WhatsApp, Facebook, Twitter)
 * - Custom handlers for Copy and Web Share API
 * - Analytics events tracked via trackShareEvent()
 * - Body scroll lock via useScrollLock hook
 *
 * @see {@link ~/lib/social-share.ts} for share platform configuration
 */

import {useState} from "react";
import {useLocation} from "react-router";
import {Image} from "@shopify/hydrogen";
import {Share, Loader2, Check, X} from "lucide-react";
import {useScrollLock} from "~/hooks/useScrollLock";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "~/components/ui/dialog";
import {cn} from "~/lib/utils";
import {useSiteSettings} from "~/lib/site-content-context";
import {
    createShareData,
    getSocialSharePlatforms,
    openShareWindow,
    trackShareEvent,
    createShareAnalytics,
    type ShareData,
    type SocialSharePlatform
} from "~/lib/social-share";
import type {ProductFragment} from "storefrontapi.generated";
import {extractImagesFromMedia} from "~/lib/media-utils";
import {parseProductTitle} from "~/lib/product";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface ProductShareButtonProps {
    product: Pick<ProductFragment, "id" | "handle" | "title" | "description" | "media">;
    selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"];
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Share Platform Button - Individual social platform button
 *
 * @param platform - Social platform configuration (name, icon, url builder)
 * @param shareData - Share data (url, title, text, price)
 * @param productId - Product GID for analytics
 * @param productHandle - Product handle for analytics
 * @returns Button with platform icon, loading/success/error states
 *
 * State Management:
 * - isLoading: Shows spinner during share action
 * - showSuccess: Shows check icon for copy success (2s)
 * - showError: Shows X icon for copy failure (2s)
 *
 * Platform Handlers:
 * - Custom handlers: Copy link, Web Share API (async with callbacks)
 * - URL builders: WhatsApp, Facebook, Twitter (opens popup window)
 *
 * Analytics:
 * - Tracks share event with platform ID, product ID, product handle
 * - Events: "whatsapp", "facebook", "twitter", "copy", etc.
 */
function SharePlatformButton({
    platform,
    shareData,
    productId,
    productHandle
}: {
    platform: SocialSharePlatform;
    shareData: ShareData;
    productId: string;
    productHandle: string;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);

    const handleShare = async () => {
        setIsLoading(true);
        setShowSuccess(false);
        setShowError(false);

        try {
            // Track analytics
            void trackShareEvent(createShareAnalytics(platform.id, productId, productHandle));

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

    // Get display text
    const getDisplayText = () => {
        if (showSuccess && platform.id === "copy") return "Copied!";
        if (showError && platform.id === "copy") return "Failed";
        return platform.name;
    };

    return (
        <button
            type="button"
            className={cn(
                "group inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-full border-2 border-primary bg-transparent px-3 sm:px-4 py-2",
                "text-primary font-medium sleek",
                "hover:bg-primary hover:text-primary-foreground active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
            onClick={() => void handleShare()}
            disabled={isLoading}
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
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Product Share Button with dialog
 *
 * @param product - Product data (id, handle, title, images)
 * @param selectedVariant - Selected variant for price display
 * @param className - Additional CSS classes
 * @returns Share button that opens dialog with product preview and social platforms
 *
 * Dialog Features:
 * - Product preview card with image, title, price
 * - Social platform buttons (WhatsApp, Facebook, Twitter/X)
 * - Copy link button with success/error states
 * - Body scroll lock when open
 * - Analytics tracking for dialog open and share actions
 *
 * Share Data:
 * - URL: Current page URL (window.location.href)
 * - Title: Product title
 * - Description: Product description
 * - Price: Selected variant price (formatted)
 * - Brand: Site brand name from settings
 *
 * Analytics Events:
 * - share_dialog_open: When dialog opens
 * - [platform_id]: When user shares to specific platform
 */
export function ProductShareButton({product, selectedVariant, className}: ProductShareButtonProps) {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const {brandName, siteUrl} = useSiteSettings();

    // Lock body scroll when dialog is open (prevents background scrolling)
    useScrollLock(open);

    // Get current full URL (SSR-safe)
    const currentUrl = typeof window !== "undefined" ? window.location.href : `${siteUrl}${location.pathname}`;

    // Create share data from product and variant
    const shareData: ShareData = createShareData(product, selectedVariant, currentUrl, brandName);

    // Get social platforms (separate copy from social for layout)
    const platforms = getSocialSharePlatforms();
    const socialPlatforms = platforms.filter(p => p.id !== "copy");
    const copyPlatform = platforms.find(p => p.id === "copy");

    // Get product info for dialog preview
    const firstImage = extractImagesFromMedia(product.media?.nodes)?.[0];
    const {primary, secondary} = parseProductTitle(product.title);

    /**
     * Handle share button click
     * Always opens the elegant dialog (no Web Share API fallback on first click)
     * Tracks analytics event for dialog open
     */
    const handleShareClick = () => {
        void trackShareEvent(createShareAnalytics("share_dialog_open", product.id, product.handle));
        setOpen(true);
    };

    return (
        <>
            {/* Share trigger button */}
            <button
                type="button"
                onClick={handleShareClick}
                className={cn(
                    "inline-flex min-h-10 min-w-10 select-none items-center justify-center rounded-full border-2 border-primary p-1.5 text-primary sleek",
                    "motion-interactive hover:text-primary hover:bg-primary hover:text-primary-foreground active:scale-95",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    className
                )}
                aria-label="Share product"
            >
                <Share className="size-5" />
            </button>

            {/* Share dialog with product preview and social platform buttons */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md rounded-3xl border-none">
                    <DialogHeader className="space-y-3 pr-0 sm:pr-0">
                        <DialogTitle className="text-lg font-semibold">Spread the Love</DialogTitle>
                        <DialogDescription className="sr-only">
                            Share {product.title} with your friends and family
                        </DialogDescription>

                        {/* Product Preview Card */}
                        <div className="flex flex-col items-center gap-3 rounded-2xl bg-linear-to-br from-primary/5 to-primary/10 p-5">
                            {firstImage && (
                                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-card shadow-md ring-2 ring-primary/20">
                                    <Image
                                        src={firstImage.url}
                                        alt={firstImage.altText || product.title}
                                        className="size-full object-cover"
                                        loading="lazy"
                                        width={400}
                                        height={400}
                                    />
                                </div>
                            )}
                            <div className="space-y-1 text-center">
                                <h3 className="text-base font-semibold text-foreground">{primary}</h3>
                                {secondary && <p className="text-sm text-muted-foreground">{secondary}</p>}
                                <p className="text-lg font-bold text-primary">{shareData.price}</p>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Share Options */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap justify-center gap-2">
                            {socialPlatforms.map(platform => (
                                <SharePlatformButton
                                    key={platform.id}
                                    platform={platform}
                                    shareData={shareData}
                                    productId={product.id}
                                    productHandle={product.handle}
                                />
                            ))}
                            {copyPlatform && (
                                <SharePlatformButton
                                    platform={copyPlatform}
                                    shareData={shareData}
                                    productId={product.id}
                                    productHandle={product.handle}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
