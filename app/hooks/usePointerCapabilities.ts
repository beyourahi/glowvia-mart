/**
 * @fileoverview Pointer Capabilities Detection Hook
 *
 * Detects whether the user's primary input device supports hover and whether it
 * uses a coarse pointer (touch) or fine pointer (mouse/trackpad). Used to
 * conditionally enable hover-dependent UI (e.g. image zoom, tooltip previews)
 * only on devices that actually support hover — avoiding phantom interactions
 * on touch screens.
 *
 * SSR-safe: defaults to `canHover: false, isCoarsePointer: true` (mobile-first)
 * until the client hydrates and reads the actual media query state.
 */

import {useEffect, useState} from "react";

/** CSS media query that matches devices with a fine pointer that supports hover (mouse, trackpad). */
const CAN_HOVER_QUERY = "(hover: hover) and (pointer: fine)";
/** CSS media query that matches coarse pointer devices (touchscreens). */
const COARSE_POINTER_QUERY = "(pointer: coarse)";

/**
 * Pointer input capabilities of the user's primary device.
 *
 * @property canHover - True when the device supports hover (mouse/trackpad)
 * @property isCoarsePointer - True when the primary pointer is touch/coarse
 * @property isHydrated - False during SSR and until the first client-side effect runs
 */
type PointerCapabilities = {
    canHover: boolean;
    isCoarsePointer: boolean;
    isHydrated: boolean;
};

/**
 * Hook that tracks the user's pointer capabilities via CSS media queries.
 *
 * Listens to `MediaQueryList` change events so state updates automatically
 * when an external keyboard/mouse is connected to a touch device.
 * SSR default: `{canHover: false, isCoarsePointer: true, isHydrated: false}`.
 */
export const usePointerCapabilities = (): PointerCapabilities => {
    const [state, setState] = useState<PointerCapabilities>({
        canHover: false,
        isCoarsePointer: true,
        isHydrated: false
    });

    useEffect(() => {
        const canHoverQuery = window.matchMedia(CAN_HOVER_QUERY);
        const coarsePointerQuery = window.matchMedia(COARSE_POINTER_QUERY);

        // Called once on mount and again whenever the OS input device changes.
        const updateCapabilities = () => {
            setState({
                canHover: canHoverQuery.matches,
                isCoarsePointer: coarsePointerQuery.matches,
                isHydrated: true
            });
        };

        updateCapabilities();

        canHoverQuery.addEventListener("change", updateCapabilities);
        coarsePointerQuery.addEventListener("change", updateCapabilities);

        return () => {
            canHoverQuery.removeEventListener("change", updateCapabilities);
            coarsePointerQuery.removeEventListener("change", updateCapabilities);
        };
    }, []);

    return state;
};
