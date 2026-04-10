/**
 * @fileoverview Aside state management for sheet/drawer overlays
 *
 * @description
 * Provides context-based state management for sheet overlays (cart, search, mobile menu).
 * Uses React Context to allow any component to open/close aside panels without prop drilling.
 * Ensures only one aside is open at a time by using a single state value for the active type.
 *
 * @features
 * - Single active aside at a time (cart, search, mobile, or closed)
 * - Type-safe aside modes via AsideType union
 * - Memoized context value to prevent unnecessary re-renders
 * - Error boundary for missing provider
 *
 * @architecture
 * - AsideProvider: Wraps the app to provide aside state
 * - useAside: Hook to access aside state from any component
 * - AsideType: "cart" | "search" | "mobile" | "closed"
 *
 * @related
 * - PageLayout.tsx - Wraps app in AsideProvider
 * - CartMain.tsx - Uses aside state for cart drawer
 * - FullScreenSearch.tsx - Uses aside state for search overlay
 * - FullScreenMenu.tsx - Uses aside state for mobile menu
 * - Header.tsx - Uses aside.open() to trigger cart/search/menu
 *
 * @example
 * ```tsx
 * // In a component
 * const { type, open, close } = useAside();
 *
 * // Open cart
 * <button onClick={() => open('cart')}>Cart</button>
 *
 * // Check if cart is open
 * const isCartOpen = type === 'cart';
 *
 * // Close any open aside
 * <button onClick={close}>Close</button>
 * ```
 */

import {createContext, type ReactNode, useCallback, useContext, useMemo, useState} from "react";
import type {AsideType, AsideContextValue} from "types";

// ================================================================================
// Context Setup
// ================================================================================

const AsideContext = createContext<AsideContextValue | null>(null);

// ================================================================================
// Provider Component
// ================================================================================

/**
 * AsideProvider - Global state provider for sheet overlays
 *
 * Manages which aside (cart, search, mobile menu) is currently open.
 * Only one aside can be open at a time - opening a new aside automatically closes the previous one.
 *
 * @param children - React children to wrap with aside state
 *
 * @example
 * ```tsx
 * <AsideProvider>
 *   <App />
 * </AsideProvider>
 * ```
 */
export function AsideProvider({children}: {children: ReactNode}) {
    const [type, setType] = useState<AsideType>("closed");

    // close is stable: setType is guaranteed stable by React, and the dep array is empty
    const close = useCallback(() => setType("closed"), []);

    // Memoize the context value so consumers only re-render when type or close changes.
    // open is setType directly — React guarantees setState identity is stable across renders.
    const value = useMemo(() => ({type, open: setType, close}), [type, close]);

    return <AsideContext.Provider value={value}>{children}</AsideContext.Provider>;
}

// ================================================================================
// Hook
// ================================================================================

/**
 * useAside - Access aside state and controls
 *
 * Returns the current aside state and functions to open/close asides.
 * Must be used within an AsideProvider or will throw an error.
 *
 * @returns {AsideContextValue} Object containing:
 *   - type: Current aside type ("cart" | "search" | "mobile" | "closed")
 *   - open: Function to open an aside by type
 *   - close: Function to close the current aside
 *
 * @throws {Error} If used outside of AsideProvider
 *
 * @example
 * ```tsx
 * const { type, open, close } = useAside();
 *
 * // Check which aside is open
 * const isCartOpen = type === "cart";
 *
 * // Open cart drawer
 * open("cart");
 *
 * // Close any open aside
 * close();
 * ```
 */
export function useAside() {
    const aside = useContext(AsideContext);
    if (!aside) {
        throw new Error("useAside must be used within an AsideProvider");
    }
    return aside;
}
