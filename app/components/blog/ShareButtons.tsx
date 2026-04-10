/**
 * @fileoverview Article Share Buttons Component
 *
 * @description
 * Social sharing component for blog articles with two display variants: inline (horizontal
 * row of buttons) and dialog (modal with article preview). Supports multiple sharing platforms
 * (Twitter, Facebook, LinkedIn, email, copy link) with platform-specific URL generation and
 * native Web Share API fallback on mobile.
 *
 * @features
 * - Two variants: inline (article footer) and dialog (compact trigger button)
 * - Multi-platform sharing: Twitter, Facebook, LinkedIn, Email, Copy Link
 * - Copy link with visual feedback (checkmark for 2s)
 * - Toast notifications for copy success/failure
 * - Platform-specific URL generation with encoded parameters
 * - Responsive button sizing: icon-only mobile, with text desktop
 * - Dialog with article preview (title and excerpt)
 * - Touch-friendly button sizing (min-h-10 mobile, min-h-11 desktop)
 * - Share window popup with appropriate dimensions
 *
 * @props
 * - article: ArticleShareInput - Article data (title, excerpt, handle)
 * - variant: "inline" | "dialog" - Display variant
 * - className: string - Additional Tailwind classes
 * - shopName: string - Shop name for share message customization
 *
 * @client-directive
 * Uses "use client" for React Router SSR compatibility with client-only features:
 * - useState for copy button feedback
 * - useLocation for URL construction
 * - window.location.origin for absolute URLs
 * - Clipboard API for copy functionality
 *
 * @related
 * - ~/lib/blog-utils - createArticleShareData for share data formatting
 * - ~/lib/social-share - Platform definitions and share utilities
 * - ~/routes/blogs.$blogHandle.$articleHandle - Article detail page
 * - ~/components/ui/dialog - shadcn Dialog component
 */

"use client";

import {useState} from "react";
import {useLocation} from "react-router";
import {cn} from "~/lib/utils";
import {createArticleShareData, type ArticleShareInput} from "~/lib/blog-utils";
import {getSocialSharePlatforms, copyToClipboard, openShareWindow, type ShareData} from "~/lib/social-share";
import {Button} from "~/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "~/components/ui/dialog";
import {Check, Share2} from "lucide-react";
import {toast} from "sonner";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the ShareButtons component.
 *
 * Supports two variants:
 * - inline: Horizontal row of platform buttons (for article footers)
 * - dialog: Compact trigger button that opens modal (for headers/toolbars)
 */
interface ShareButtonsProps {
    /** Article data for sharing */
    article: ArticleShareInput;
    /** Visual variant */
    variant?: "inline" | "dialog";
    /** Additional CSS classes */
    className?: string;
    /** Shop name for share message */
    shopName?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ShareButtons component for social sharing of blog articles.
 *
 * @description
 * Provides multiple sharing options with platform-specific implementations:
 *
 * 1. Twitter - Opens tweet composer with article title and URL
 * 2. Facebook - Opens Facebook share dialog
 * 3. LinkedIn - Opens LinkedIn share dialog
 * 4. Email - Opens email client with pre-filled subject and body
 * 5. Copy Link - Copies URL to clipboard with visual feedback
 *
 * Share data includes:
 * - url: Full article URL (baseUrl + article path)
 * - title: Article title
 * - text: Article excerpt or fallback description
 * - hashtags: Extracted from article tags (Twitter only)
 *
 * @example
 * ```tsx
 * // Inline variant for article footer
 * <ShareButtons article={article} variant="inline" shopName={brandName} />
 *
 * // Dialog variant for header/toolbar
 * <ShareButtons article={article} variant="dialog" />
 * ```
 */
export function ShareButtons({article, variant = "inline", className, shopName}: ShareButtonsProps) {
    const location = useLocation();
    const [copied, setCopied] = useState(false);

    // ========================================
    // Data Processing
    // ========================================

    // Construct full article URL for sharing
    // SSR-safe: only access window.location.origin on client
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareData = createArticleShareData(article, baseUrl, shopName);

    // Get all available sharing platforms
    const platforms = getSocialSharePlatforms();

    // ========================================
    // Event Handlers
    // ========================================

    /**
     * Handles share button clicks for each platform.
     *
     * @param platform - Platform configuration object
     * @param shareData - Article share data (url, title, text)
     *
     * Platform-specific behaviors:
     * - copy: Uses Clipboard API with success/error toasts
     * - customHandler: Uses platform's custom handler (e.g., Web Share API)
     * - default: Opens share URL in popup window
     */
    const handleShare = async (platform: (typeof platforms)[0], shareData: ShareData) => {
        // Handle copy link with clipboard feedback
        if (platform.id === "copy") {
            const success = await copyToClipboard(
                shareData.url,
                () => {
                    setCopied(true);
                    toast.success("Link copied to clipboard!");
                    // Reset after 2 seconds
                    setTimeout(() => setCopied(false), 2000);
                },
                () => {
                    toast.error("Failed to copy link");
                }
            );
            return;
        }

        // Handle platforms with custom handlers (e.g., Web Share API)
        if (platform.customHandler) {
            await platform.customHandler(shareData);
            return;
        }

        // Default: open platform-specific share URL in popup
        const url = platform.url(shareData);
        openShareWindow(url, `Share on ${platform.name}`);
    };

    // ========================================
    // Variant: Inline (Horizontal Buttons)
    // ========================================

    /**
     * Inline variant for article footers.
     *
     * Features:
     * - Horizontal flex layout with wrapping
     * - Icon-only buttons on mobile (touch-friendly 44x44px)
     * - Full buttons with text on desktop
     * - Primary color theme (border-primary/50, hover:bg-primary)
     * - "Share this article" heading with uppercase tracking
     * - Copy button shows checkmark for 2s after successful copy
     */
    if (variant === "inline") {
        return (
            <div className={cn("space-y-2.5 sm:space-y-3 md:space-y-4", className)}>
                <h3 className="text-sm sm:text-sm md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Share this article
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-2.5">
                    {platforms.map(platform => (
                        <Button
                            key={platform.id}
                            variant="outline"
                            size="sm"
                            className={cn(
                                "rounded-full gap-1.5 sm:gap-2 border-2 border-primary/50 text-primary",
                                "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                                "sleek hover:scale-110 hover:shadow-md",
                                // Touch-friendly sizing: icon-only on mobile, with text on larger screens
                                "size-10 sm:size-auto sm:min-h-11 sm:min-w-0 p-0 sm:px-4"
                            )}
                            onClick={() => void handleShare(platform, shareData)}
                        >
                            {platform.id === "copy" && copied ? (
                                <Check className="size-4" />
                            ) : (
                                <platform.icon className="size-4" />
                            )}
                            <span className="hidden sm:inline">{platform.name}</span>
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    // ========================================
    // Variant: Dialog (Modal with Preview)
    // ========================================

    /**
     * Dialog variant for compact trigger button.
     *
     * Features:
     * - Compact trigger button with share icon
     * - Modal with article preview (title and excerpt)
     * - 2-column grid layout for touch-friendly targets
     * - Responsive dialog sizing (full-width mobile with margins)
     * - Article preview card with muted background
     * - Same platform buttons as inline variant
     * - Better for headers/toolbars where space is limited
     */
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "rounded-full gap-1.5 sm:gap-2 border-2 border-primary/50 text-primary",
                        "hover:bg-primary hover:text-primary-foreground",
                        "min-h-10 sm:min-h-11 px-3 sm:px-4 text-sm",
                        className
                    )}
                >
                    <Share2 className="size-3.5 sm:size-4" />
                    <span className="hidden xs:inline">Share</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] max-w-md mx-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="font-serif text-base sm:text-lg md:text-xl">Share this article</DialogTitle>
                </DialogHeader>

                {/* Article Preview */}
                <div className="bg-muted/30 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1 sm:space-y-1.5 md:space-y-2">
                    <h4 className="font-medium text-primary line-clamp-2 text-sm sm:text-sm md:text-base">
                        {article.title}
                    </h4>
                    {article.excerpt && (
                        <p className="text-sm sm:text-sm md:text-sm text-muted-foreground line-clamp-2">
                            {article.excerpt}
                        </p>
                    )}
                </div>

                {/* Share Buttons - 2 columns on all screens for better touch targets */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-2.5">
                    {platforms.map(platform => (
                        <Button
                            key={platform.id}
                            variant="outline"
                            className={cn(
                                "rounded-lg sm:rounded-xl gap-1.5 sm:gap-2 min-h-11 sm:min-h-12",
                                "hover:bg-primary hover:text-primary-foreground",
                                "sleek hover:scale-110 hover:shadow-md",
                                "text-sm sm:text-sm md:text-base"
                            )}
                            onClick={() => void handleShare(platform, shareData)}
                        >
                            {platform.id === "copy" && copied ? (
                                <Check className="size-3.5 sm:size-4" />
                            ) : (
                                <platform.icon className="size-3.5 sm:size-4" />
                            )}
                            {platform.name}
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
