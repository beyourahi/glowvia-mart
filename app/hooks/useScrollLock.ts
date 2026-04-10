/**
 * @fileoverview Ref-counted scroll lock for overlay components
 *
 * @description
 * Manages Lenis smooth scroll pause/resume when overlays are open.
 * Ref-counted so nested/concurrent overlays (e.g. Dialog inside Sheet)
 * don't prematurely re-enable scrolling when one closes.
 *
 * Native body scroll is handled by Radix UI's built-in scroll lock
 * (`@radix-ui/react-remove-scroll`), so this hook only manages Lenis.
 *
 * @architecture
 * - Module-level `activeLockCount` tracks how many consumers hold a lock
 * - Lenis stops when count goes from 0 → 1
 * - Lenis resumes when count goes from 1 → 0
 * - Cleanup on unmount releases any leaked lock
 *
 * @usage
 * Use for overlay components that block background interaction:
 * - Dialog, AlertDialog, Sheet → YES (modal overlays)
 * - FullScreenMenu, FullScreenSearch → YES (full-screen overlays)
 *
 * Do NOT use for inline/non-blocking components:
 * - Accordion, Collapsible, Tabs → NO (inline content disclosure)
 * - Toast/Sonner → NO (transient, non-blocking notifications)
 * - Popover, HoverCard, Tooltip → NO (lightweight, non-blocking)
 * - DropdownMenu, ContextMenu, Menubar → NO (lightweight menus)
 *
 * @dependencies
 * - ~/lib/LenisProvider (useLenis hook for Lenis instance access)
 *
 * @related
 * - app/lib/LenisProvider.tsx — Lenis context and instance management
 * - app/lib/smoothScroll.ts — Lenis initialization config
 * - app/components/ui/dialog.tsx — Dialog uses Radix scroll lock natively
 * - app/components/ui/sheet.tsx — Sheet uses Radix scroll lock natively
 */

import {useEffect, useRef} from "react";
import {useLenis} from "~/lib/LenisProvider";

/**
 * Module-level lock counter shared across all hook instances.
 * NOT React state — mutations don't trigger re-renders, which is intentional.
 * The counter only drives Lenis stop/start side effects.
 */
let activeLockCount = 0;

/**
 * Pause Lenis smooth scrolling while an overlay is open.
 *
 * Ref-counted: multiple simultaneous locks are tracked independently.
 * Lenis only resumes when ALL active locks have been released.
 * SSR-safe: no DOM or Lenis access during server render.
 *
 * @param isLocked - Whether this consumer currently wants scroll locked
 */
export function useScrollLock(isLocked: boolean): void {
    const {lenis} = useLenis();

    /**
     * Tracks whether THIS hook instance currently holds an active lock.
     * Prevents double-counting if the effect re-runs with the same value.
     */
    const hasLockRef = useRef(false);

    /**
     * Ref to the Lenis instance so the unmount cleanup always has access
     * to the latest instance without needing it in the dependency array.
     */
    const lenisRef = useRef(lenis);
    lenisRef.current = lenis;

    // Acquire or release lock when isLocked changes
    useEffect(() => {
        if (isLocked && !hasLockRef.current) {
            hasLockRef.current = true;
            activeLockCount++;
            if (activeLockCount === 1) {
                lenisRef.current?.stop();
            }
        } else if (!isLocked && hasLockRef.current) {
            hasLockRef.current = false;
            activeLockCount = Math.max(0, activeLockCount - 1);
            if (activeLockCount === 0) {
                lenisRef.current?.start();
            }
        }
    }, [isLocked]);

    // Safety net: release leaked lock on unmount
    useEffect(() => {
        return () => {
            if (hasLockRef.current) {
                hasLockRef.current = false;
                activeLockCount = Math.max(0, activeLockCount - 1);
                if (activeLockCount === 0) {
                    lenisRef.current?.start();
                }
            }
        };
    }, []);
}
