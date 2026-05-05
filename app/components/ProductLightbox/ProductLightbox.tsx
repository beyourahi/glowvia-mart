/**
 * @fileoverview Full-screen product media lightbox — Radix Dialog with looping nav, keyboard support, and thumbnail strip.
 *
 * Videos unmount when navigating away (only `currentMedia` is rendered), so no explicit
 * pause is needed — the next video `autoPlay`s on mount.
 *
 * @related
 * - ProductImageGallery.tsx - Triggers lightbox on image click
 * - LightboxMedia.tsx / LightboxControls.tsx / LightboxThumbnails.tsx - Child components
 * - useLightboxKeyboard.ts - Arrow + ESC keyboard handler
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

export function ProductLightbox({media, initialIndex, isOpen, onClose}: ProductLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Reset to the clicked image's index each time the lightbox opens.
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    // Lenis-aware scroll lock — same mechanism as the cart drawer.
    useScrollLock(isOpen);

    const goToNext = () => setCurrentIndex(prev => (prev + 1) % media.length);
    const goToPrevious = () => setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
    const goToIndex = (index: number) => setCurrentIndex(index);

    useLightboxKeyboard({
        isOpen,
        onNext: goToNext,
        onPrevious: goToPrevious,
        onClose
    });

    // Preload adjacent images for smoother navigation.
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

    const currentMedia = media[currentIndex];

    if (!currentMedia) {
        return null;
    }

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogPrimitive.Portal>
                {/* Backdrop — wrapped in Close so clicking it dismisses the lightbox */}
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
                    onPointerDownOutside={e => e.preventDefault()} // backdrop handled by DialogPrimitive.Close above
                    aria-label="Product media lightbox"
                >
                    <LightboxControls
                        onClose={onClose}
                        onNext={goToNext}
                        onPrevious={goToPrevious}
                        showNavigation={media.length > 1}
                        currentIndex={currentIndex}
                        totalCount={media.length}
                    />

                    {/* Click the empty area around the media to close; stop propagation on the media itself. */}
                    <div
                        className="flex-1 flex items-center justify-center px-4 md:px-8 cursor-pointer"
                        onClick={e => {
                            if (e.target === e.currentTarget) {
                                onClose();
                            }
                        }}
                        onKeyDown={e => {
                            if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                                e.preventDefault();
                                onClose();
                            }
                        }}
                        role="button"
                        tabIndex={-1}
                        aria-label="Click to close lightbox"
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                            role="presentation"
                        >
                            <LightboxMedia media={currentMedia} />
                        </div>
                    </div>

                    <LightboxThumbnails media={media} currentIndex={currentIndex} onSelect={goToIndex} />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
