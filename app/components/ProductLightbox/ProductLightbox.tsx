/**
 * @fileoverview Full-screen product media lightbox component
 *
 * @description
 * Modal overlay for viewing product images and videos at their natural
 * aspect ratios. Provides navigation via arrows, keyboard, swipe gestures,
 * and thumbnail strip. Built on Radix Dialog for accessibility.
 *
 * @features
 * - Natural aspect ratio display (object-fit: contain, no cropping)
 * - Continuous loop navigation (last → first → last)
 * - Keyboard: Arrow keys navigate, ESC closes
 * - Thumbnails: Click to jump, auto-scroll to active
 * - Video: Native HTML5 playback with custom controls
 * - Backdrop click to close
 *
 * @layout
 * Full-screen overlay with three zones:
 * 1. Top: Close button and position counter
 * 2. Center: Main media display with side navigation arrows
 * 3. Bottom: Thumbnail strip
 *
 * @state
 * - currentIndex: Active media position (loops 0 to length-1)
 * - isVideoPlaying: Video playback state (pauses on navigation)
 *
 * @accessibility
 * - ARIA: role="dialog", aria-modal="true"
 * - Focus trap via Radix Dialog
 * - Focus returns to trigger on close
 * - All controls have aria-labels
 * - Touch targets ≥ 44x44px
 * - Keyboard navigation support
 *
 * @related
 * - ProductImageGallery.tsx - Triggers lightbox on image click
 * - LightboxMedia.tsx - Renders individual media items
 * - LightboxControls.tsx - Navigation arrows and close button
 * - LightboxThumbnails.tsx - Bottom thumbnail strip
 * - useLightboxKeyboard.ts - Keyboard navigation hook
 */

import {useState, useEffect} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {cn} from "~/lib/utils";
import {useScrollLock} from "~/hooks/useScrollLock";
import type {ProductLightboxProps} from "types";

// Child components
import {LightboxMedia} from "./LightboxMedia";
import {LightboxThumbnails} from "./LightboxThumbnails";
import {LightboxControls} from "./LightboxControls";
import {useLightboxKeyboard} from "./useLightboxKeyboard";

// =============================================================================
// PRODUCT LIGHTBOX COMPONENT
// =============================================================================

/**
 * ProductLightbox - Full-screen media viewer for product detail page
 *
 * @description
 * Opens as a modal overlay when user clicks a product image.
 * Displays images and videos at natural aspect ratio with full
 * navigation capabilities.
 *
 * @example
 * ```tsx
 * const [lightboxOpen, setLightboxOpen] = useState(false);
 * const [initialIndex, setInitialIndex] = useState(0);
 *
 * <ProductLightbox
 *   media={product.media.nodes}
 *   initialIndex={initialIndex}
 *   isOpen={lightboxOpen}
 *   onClose={() => setLightboxOpen(false)}
 * />
 * ```
 */
export function ProductLightbox({media, initialIndex, isOpen, onClose}: ProductLightboxProps) {
    // ==========================================================================
    // STATE MANAGEMENT
    // ==========================================================================

    // Current media index - loops continuously
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // ==========================================================================
    // RESET ON OPEN
    // ==========================================================================

    // Reset to initial index when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    // ==========================================================================
    // BODY SCROLL LOCK
    // ==========================================================================

    // Prevent page scroll when lightbox is open
    // Uses Lenis scroll lock - same mechanism as cart drawer
    useScrollLock(isOpen);

    // ==========================================================================
    // NAVIGATION HANDLERS
    // ==========================================================================

    /**
     * Navigate to next media with continuous looping.
     * Videos unmount on navigation (only currentMedia is rendered) so no
     * explicit pause needed — the new video autoPlays on mount.
     */
    const goToNext = () => setCurrentIndex(prev => (prev + 1) % media.length);

    /** Navigate to previous media with continuous looping */
    const goToPrevious = () => setCurrentIndex(prev => (prev - 1 + media.length) % media.length);

    /** Jump to specific index (from thumbnail click) */
    const goToIndex = (index: number) => setCurrentIndex(index);

    // ==========================================================================
    // KEYBOARD NAVIGATION
    // ==========================================================================

    useLightboxKeyboard({
        isOpen,
        onNext: goToNext,
        onPrevious: goToPrevious,
        onClose
    });

    // ==========================================================================
    // IMAGE PRELOADING
    // ==========================================================================

    // Preload adjacent images for smoother navigation
    useEffect(() => {
        if (!isOpen) return;

        const preloadIndexes = [(currentIndex + 1) % media.length, (currentIndex - 1 + media.length) % media.length];

        preloadIndexes.forEach(index => {
            const item = media[index];
            if (item.__typename === "MediaImage" && item.image?.url) {
                const img = new Image();
                img.src = item.image.url;
            }
        });
    }, [isOpen, currentIndex, media]);

    // ==========================================================================
    // CURRENT MEDIA ITEM
    // ==========================================================================

    const currentMedia = media[currentIndex];

    // Guard against empty media array
    if (!currentMedia) {
        return null;
    }

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogPrimitive.Portal>
                {/* ================================================================
                    BACKDROP OVERLAY
                    Clickable to close (wrapped in Close primitive)
                    Theater-dark background for immersive viewing
                    ================================================================ */}
                <DialogPrimitive.Close asChild>
                    <DialogPrimitive.Overlay
                        className={cn(
                            // Full screen fixed positioning
                            "fixed inset-0 z-[9999]",
                            // Theater-dark overlay (90% black) with subtle blur
                            "bg-dark/90 backdrop-blur-sm",
                            // Animations
                            "data-[state=open]:animate-in data-[state=closed]:animate-out",
                            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                        )}
                        aria-label="Close lightbox"
                    />
                </DialogPrimitive.Close>

                {/* ================================================================
                    MAIN CONTENT CONTAINER
                    Full screen flexbox layout
                    Three sections: controls (absolute), media (center), thumbnails (bottom)
                    ================================================================ */}
                <DialogPrimitive.Content
                    className={cn(
                        // Full screen fixed positioning
                        "fixed inset-0 z-[9999]",
                        // Flexbox column layout
                        "flex flex-col",
                        // Animations
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "duration-200"
                    )}
                    // Prevent default Radix close behavior (we handle it manually)
                    onPointerDownOutside={e => e.preventDefault()}
                    aria-label="Product media lightbox"
                >
                    {/* Navigation controls (close, arrows, counter) */}
                    <LightboxControls
                        onClose={onClose}
                        onNext={goToNext}
                        onPrevious={goToPrevious}
                        showNavigation={media.length > 1}
                        currentIndex={currentIndex}
                        totalCount={media.length}
                    />

                    {/* Main media display area - click empty space to close */}
                    <div
                        className="flex-1 flex items-center justify-center px-4 md:px-8 cursor-pointer"
                        onClick={e => {
                            // Only close if clicking the container itself, not the media
                            if (e.target === e.currentTarget) {
                                onClose();
                            }
                        }}
                        onKeyDown={e => {
                            // Allow Enter/Space to close when focused on backdrop
                            if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                                e.preventDefault();
                                onClose();
                            }
                        }}
                        role="button"
                        tabIndex={-1}
                        aria-label="Click to close lightbox"
                    >
                        {/* Stop propagation on media to prevent closing when clicking image/video */}
                        <div
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                            role="presentation"
                        >
                            <LightboxMedia media={currentMedia} />
                        </div>
                    </div>

                    {/* Thumbnail strip - always visible on all devices */}
                    <LightboxThumbnails media={media} currentIndex={currentIndex} onSelect={goToIndex} />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
