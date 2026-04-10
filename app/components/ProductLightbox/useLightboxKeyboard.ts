/**
 * @fileoverview Keyboard navigation hook for product lightbox
 *
 * @description
 * Handles keyboard events for lightbox navigation and dismissal.
 * Events are only processed when the lightbox is open.
 *
 * @keyboard-shortcuts
 * - ArrowLeft: Navigate to previous media
 * - ArrowRight: Navigate to next media
 * - Escape: Close lightbox (backup - Radix Dialog also handles this)
 *
 * @note
 * Event listeners are added/removed based on isOpen state to prevent
 * conflicts with page navigation when lightbox is closed.
 *
 * @accessibility
 * - Keyboard-only users can navigate through all media
 * - ESC key provides reliable exit path
 * - Works with screen readers via ARIA on parent elements
 */

import {useEffect} from "react";

// =============================================================================
// HOOK INTERFACE
// =============================================================================

interface UseLightboxKeyboardProps {
    /** Whether the lightbox is currently open */
    isOpen: boolean;
    /** Navigate to next media item */
    onNext: () => void;
    /** Navigate to previous media item */
    onPrevious: () => void;
    /** Close the lightbox */
    onClose: () => void;
}

// =============================================================================
// KEYBOARD NAVIGATION HOOK
// =============================================================================

/**
 * Keyboard navigation hook for lightbox
 *
 * @param props - Hook configuration
 * @param props.isOpen - Controls when listeners are active
 * @param props.onNext - Called on ArrowRight
 * @param props.onPrevious - Called on ArrowLeft
 * @param props.onClose - Called on Escape
 *
 * @example
 * ```tsx
 * useLightboxKeyboard({
 *   isOpen: lightboxOpen,
 *   onNext: () => setIndex(prev => (prev + 1) % total),
 *   onPrevious: () => setIndex(prev => (prev - 1 + total) % total),
 *   onClose: () => setLightboxOpen(false)
 * });
 * ```
 */
export function useLightboxKeyboard({isOpen, onNext, onPrevious, onClose}: UseLightboxKeyboardProps) {
    // Add/remove event listener based on open state
    useEffect(() => {
        if (!isOpen) return;

        // Keydown handler (defined inside useEffect to avoid dependency warning)
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case "ArrowRight":
                    // Prevent page scroll
                    event.preventDefault();
                    onNext();
                    break;

                case "ArrowLeft":
                    // Prevent page scroll
                    event.preventDefault();
                    onPrevious();
                    break;

                case "Escape":
                    // Radix Dialog handles this, but we add as backup
                    // and for cases where we need to pause video first
                    event.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onNext, onPrevious, onClose]);
}
