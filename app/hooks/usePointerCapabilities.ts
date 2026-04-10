import {useEffect, useState} from "react";

const CAN_HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";

type PointerCapabilities = {
    canHover: boolean;
    isCoarsePointer: boolean;
    isHydrated: boolean;
};

export const usePointerCapabilities = (): PointerCapabilities => {
    const [state, setState] = useState<PointerCapabilities>({
        canHover: false,
        isCoarsePointer: true,
        isHydrated: false
    });

    useEffect(() => {
        const canHoverQuery = window.matchMedia(CAN_HOVER_QUERY);
        const coarsePointerQuery = window.matchMedia(COARSE_POINTER_QUERY);

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
