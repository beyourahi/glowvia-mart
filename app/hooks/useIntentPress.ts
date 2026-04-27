import {useState, useCallback, useRef} from "react";

// Movement beyond this pixel threshold signals scroll intent, not a deliberate tap.
const MOVEMENT_THRESHOLD = 8;

interface UseIntentPressReturn {
    isPressing: boolean;
    handlers: {
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerMove: (e: React.PointerEvent) => void;
        onPointerUp: () => void;
        onPointerCancel: () => void;
    };
}

/**
 * Detects intentional tap vs. passive scroll-through on touch devices.
 *
 * CSS :active fires on any pointerdown — including the first contact point of
 * a scroll gesture — causing product cards to scale down while the user
 * is browsing, not clicking. This hook replaces that with JS-driven intent
 * detection: the press state activates on pointerdown, but is immediately
 * cancelled if the finger moves more than MOVEMENT_THRESHOLD pixels in any
 * direction, which indicates scroll intent rather than a deliberate tap.
 *
 * @param disabled - Pass `canHover` here. On hover-capable (mouse) devices
 *                   the hook returns stable no-op handlers and isPressing=false,
 *                   since CSS :active is the correct mechanism there.
 */
export function useIntentPress(disabled: boolean): UseIntentPressReturn {
    const [isPressing, setIsPressing] = useState(false);
    // Store start position in a ref — updated on every pointerdown without
    // triggering a re-render. Only isPressing (the visual state) lives in state.
    const startPos = useRef<{x: number; y: number} | null>(null);
    const canceled = useRef(false);
    // Keep disabled in a ref so the callbacks below never need to re-create
    // when the canHover value changes between renders.
    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if (disabledRef.current) return;
        startPos.current = {x: e.clientX, y: e.clientY};
        canceled.current = false;
        setIsPressing(true);
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!startPos.current || canceled.current) return;
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        if (dx > MOVEMENT_THRESHOLD || dy > MOVEMENT_THRESHOLD) {
            canceled.current = true;
            setIsPressing(false);
        }
    }, []);

    const cancel = useCallback(() => {
        setIsPressing(false);
        startPos.current = null;
        canceled.current = false;
    }, []);

    return {
        isPressing,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp: cancel,
            onPointerCancel: cancel
        }
    };
}
