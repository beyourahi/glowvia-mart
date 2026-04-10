/**
 * @fileoverview Keyboard Shortcut Hook for Search Activation
 *
 * @description
 * Provides a global keyboard shortcut (Cmd+K / Ctrl+K) to quickly open the search
 * interface. Accepts a generic callback so it stays decoupled from any specific
 * overlay system (Aside, Dialog, etc.).
 *
 * Mount this hook once at the app level to avoid duplicate event listeners.
 *
 * @architecture
 * - Single global keydown listener, cleaned up on unmount
 * - Platform-aware modifier detection (Meta on Mac, Ctrl elsewhere)
 * - SSR-safe: guards against missing `navigator`
 * - Calls `stopPropagation` after `preventDefault` to prevent other handlers
 *   from reacting to the same keystroke
 *
 * @example
 * ```tsx
 * // Mount once at app level with a callback
 * function PageLayout() {
 *     const {open} = useAside();
 *     useSearchKeyboard(() => open("search"));
 *     return <main>...</main>;
 * }
 *
 * // Display shortcut hint to users
 * <button>
 *     Search <kbd>{getKeyboardShortcutLabel()}</kbd>
 * </button>
 * ```
 */

import {useEffect} from "react";

// =============================================================================
// HOOK
// =============================================================================

/**
 * Registers a global keyboard shortcut (Cmd+K / Ctrl+K) that fires the
 * provided callback. The hook is intentionally generic — pass whatever
 * "open search" logic your component tree needs.
 *
 * @param onOpen - Callback invoked when the shortcut is pressed
 * @sideeffect Adds and removes a global keydown event listener
 */
export function useSearchKeyboard(onOpen: () => void) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            // SSR guard — navigator may not exist during server render
            const isMac =
                typeof navigator !== "undefined"
                    ? navigator.platform?.toUpperCase().indexOf("MAC") >= 0
                    : false;

            const modifier = isMac ? event.metaKey : event.ctrlKey;

            if (modifier && event.key.toLowerCase() === "k") {
                event.preventDefault();
                event.stopPropagation();
                onOpen();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onOpen]);
}

// =============================================================================
// HELPER
// =============================================================================

/**
 * Returns the platform-appropriate keyboard shortcut label.
 * SSR-safe — falls back to "Ctrl+K" when `navigator` is unavailable.
 *
 * @returns "⌘K" on Mac, "Ctrl+K" elsewhere
 */
export function getKeyboardShortcutLabel(): string {
    if (typeof navigator === "undefined" || !navigator.platform) return "Ctrl+K";
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    return isMac ? "⌘K" : "Ctrl+K";
}
