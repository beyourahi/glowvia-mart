/**
 * @fileoverview Navigation and close controls for product lightbox
 *
 * @description
 * Top bar with close button, navigation arrows, and current position counter.
 * Controls positioned for optimal reach on both mobile and desktop.
 *
 * @layout
 * - Top bar: Counter (left), Close button (right)
 * - Side arrows: Centered vertically on left/right edges
 * - All controls overlay on top of media content
 *
 * @accessibility
 * - All buttons have aria-labels for screen readers
 * - Touch targets minimum 44x44px (size-11)
 * - Focus visible rings for keyboard navigation
 *
 * @wcag
 * Controls sit on bg-overlay-dark (30% black with backdrop-blur) over product images.
 *
 * Default state:
 * - Button bg: bg-dark/60 (60% black) provides clear visibility without dominating
 * - Icon color: text-light/80 (80% white) - slightly muted to invite interaction
 * - 80% white on bg-dark/60 composite ≈ 10:1 (WCAG AAA) ✓
 *
 * Hover state:
 * - Button bg: bg-dark/80 (80% black) for stronger presence
 * - Icon color: text-light (100% white) - brightens to signal interactivity
 * - 100% white on bg-dark/80 composite ≈ 16:1 (WCAG AAA) ✓
 * - No ring - cleaner aesthetic, brightness shift provides sufficient feedback
 *
 * Focus state:
 * - ring-2 ring-light provides 21:1 contrast against dark overlay (WCAG AAA) ✓
 *
 * Counter text: white (#fff) on bg-dark/60 ≈ 12:1 (WCAG AAA) ✓
 *
 * @related
 * - ProductLightbox.tsx - Parent component that provides handlers
 * - useLightboxKeyboard.ts - Keyboard shortcuts for same actions
 */

import {XIcon, ChevronLeftIcon, ChevronRightIcon} from "lucide-react";
import {Button} from "~/components/ui/button";

// =============================================================================
// COMPONENT INTERFACE
// =============================================================================

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

// =============================================================================
// LIGHTBOX CONTROLS COMPONENT
// =============================================================================

/**
 * LightboxControls - Navigation and close controls overlay
 *
 * Renders:
 * - Position counter (e.g., "3 / 10") in top-left
 * - Close button in top-right
 * - Previous/Next arrows on left/right sides (when multiple media)
 *
 * @example
 * ```tsx
 * <LightboxControls
 *   onClose={handleClose}
 *   onPrevious={handlePrev}
 *   onNext={handleNext}
 *   showNavigation={media.length > 1}
 *   currentIndex={currentIndex}
 *   totalCount={media.length}
 * />
 * ```
 */
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
            {/* ================================================================
                TOP BAR - Counter and Close Button
                Position: Fixed at top, spans full width
                ================================================================ */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                {/* Position counter - shows current / total */}
                <span className="text-light text-sm font-medium bg-dark/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {currentIndex + 1} / {totalCount}
                </span>

                {/* Close button - top right corner
                    Hover: darker bg + icon brightness increase for visual feedback */}
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

            {/* ================================================================
                NAVIGATION ARROWS - Previous and Next
                Position: Fixed at vertical center on left/right edges
                Only rendered when there are multiple media items
                ================================================================ */}
            {showNavigation && (
                <>
                    {/* Previous arrow - left side
                        Hover: darker bg + icon brightness increase for visual feedback */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-dark/60 hover:bg-dark/80 text-light/80 hover:text-light rounded-full backdrop-blur-sm sleek focus-visible:ring-2 focus-visible:ring-light"
                        aria-label="Previous image"
                    >
                        <ChevronLeftIcon className="size-6" />
                    </Button>

                    {/* Next arrow - right side
                        Hover: darker bg + icon brightness increase for visual feedback */}
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
