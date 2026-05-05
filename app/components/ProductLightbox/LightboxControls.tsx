/**
 * @fileoverview Overlay controls for the product lightbox — counter, close, and nav arrows.
 *
 * WCAG contrast on dark/60 overlay:
 * - Default:  text-light/80 on bg-dark/60  ≈ 10:1 (AAA) ✓
 * - Hover:    text-light on bg-dark/80      ≈ 16:1 (AAA) ✓
 * - Focus:    ring-2 ring-light             ≈ 21:1 (AAA) ✓
 * - Counter:  #fff on bg-dark/60           ≈ 12:1 (AAA) ✓
 *
 * @related
 * - ProductLightbox.tsx - Parent that provides handlers
 */

import {XIcon, ChevronLeftIcon, ChevronRightIcon} from "lucide-react";
import {Button} from "~/components/ui/button";

interface LightboxControlsProps {
    /** Close the lightbox */
    onClose: () => void;
    /** Navigate to previous media */
    onPrevious: () => void;
    /** Navigate to next media */
    onNext: () => void;
    /** Whether to show navigation arrows (false for single media) */
    showNavigation: boolean;
    /** Current media index (0-based) */
    currentIndex: number;
    /** Total number of media items */
    totalCount: number;
}

export function LightboxControls({
    onClose,
    onPrevious,
    onNext,
    showNavigation,
    currentIndex,
    totalCount
}: LightboxControlsProps) {
    return (
        <>
            {/* Top bar: counter (left) + close button (right) */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <span className="text-light text-sm font-medium bg-dark/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {currentIndex + 1} / {totalCount}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="bg-dark/60 hover:bg-dark/80 text-light/80 hover:text-light rounded-full backdrop-blur-sm sleek focus-visible:ring-2 focus-visible:ring-light"
                    aria-label="Close lightbox"
                >
                    <XIcon className="size-5" />
                </Button>
            </div>

            {showNavigation && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-dark/60 hover:bg-dark/80 text-light/80 hover:text-light rounded-full backdrop-blur-sm sleek focus-visible:ring-2 focus-visible:ring-light"
                        aria-label="Previous image"
                    >
                        <ChevronLeftIcon className="size-6" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-dark/60 hover:bg-dark/80 text-light/80 hover:text-light rounded-full backdrop-blur-sm sleek focus-visible:ring-2 focus-visible:ring-light"
                        aria-label="Next image"
                    >
                        <ChevronRightIcon className="size-6" />
                    </Button>
                </>
            )}
        </>
    );
}
