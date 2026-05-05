/**
 * @fileoverview Social share buttons for blog articles — `inline` (button row) and `dialog` (modal) variants.
 *
 * Platforms: Twitter, Facebook, LinkedIn, Email, Copy Link. Copy gives a 2-second checkmark
 * feedback + toast. `window.location.origin` is guarded for SSR via the `"use client"` directive.
 *
 * @related
 * - ~/lib/blog-utils - `createArticleShareData` for share data formatting
 * - ~/lib/social-share - Platform definitions and share utilities
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

export function ShareButtons({article, variant = "inline", className, shopName}: ShareButtonsProps) {
    const location = useLocation();
    const [copied, setCopied] = useState(false);

    // SSR-safe: only access window.location.origin on client
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareData = createArticleShareData(article, baseUrl, shopName);
    const platforms = getSocialSharePlatforms();

    const handleShare = async (platform: (typeof platforms)[0], shareData: ShareData) => {
        if (platform.id === "copy") {
            const success = await copyToClipboard(
                shareData.url,
                () => {
                    setCopied(true);
                    toast.success("Link copied to clipboard!");
                    setTimeout(() => setCopied(false), 2000);
                },
                () => {
                    toast.error("Failed to copy link");
                }
            );
            return;
        }

        if (platform.customHandler) {
            await platform.customHandler(shareData);
            return;
        }

        const url = platform.url(shareData);
        openShareWindow(url, `Share on ${platform.name}`);
    };

    if (variant === "inline") {
        return (
            <div className={cn("space-y-3 sm:space-y-4 md:space-y-5", className)}>
                {/* Heading row with decorative rule — visually anchors the share section */}
                <div className="flex items-center gap-3">
                    <h3 className="font-serif text-base sm:text-lg md:text-xl font-medium text-primary shrink-0">
                        Share this article
                    </h3>
                    <span aria-hidden="true" className="flex-1 h-px bg-primary/15" />
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3">
                    {platforms.map(platform => (
                        <Button
                            key={platform.id}
                            variant="outline"
                            size="sm"
                            aria-label={`Share on ${platform.name}`}
                            className={cn(
                                "rounded-full gap-2 sm:gap-2.5",
                                "border-2 border-primary/60 bg-background text-primary",
                                "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                                "hover:-translate-y-0.5 hover:shadow-lg",
                                "active:translate-y-0 active:shadow-sm",
                                "sleek",
                                // <640px: 48px square icon-only; ≥640px: full pill with label
                                "size-12 sm:size-auto sm:min-h-12 sm:min-w-0 p-0 sm:px-5 text-sm sm:text-base font-medium"
                            )}
                            onClick={() => void handleShare(platform, shareData)}
                        >
                            {platform.id === "copy" && copied ? (
                                <Check className="size-[1.125rem] sm:size-5" />
                            ) : (
                                <platform.icon className="size-[1.125rem] sm:size-5" />
                            )}
                            <span className="hidden sm:inline">{platform.name}</span>
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

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
