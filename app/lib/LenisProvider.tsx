/**
 * @fileoverview Lenis Smooth Scroll React Provider and Hooks
 *
 * @description
 * React Context provider for Lenis smooth scrolling with SSR-safe initialization, route change
 * handling, scroll locking for modals, and scroll event subscriptions. Provides hooks for
 * accessing Lenis instance and controlling scroll behavior throughout the application.
 *
 * @architecture
 * Provider Pattern:
 * - LenisProvider wraps app in root.tsx
 * - Initializes Lenis on client-side only (SSR-safe)
 * - Automatically scrolls to top on route changes
 * - Provides scroll value and control functions via context
 *
 * Scroll Event Handling:
 * - Listens to Lenis scroll events
 * - Updates scroll value in React state
 * - Provides callbacks for scroll animations
 * - Manages scroll lock for modals/dialogs
 *
 * Route Change Behavior:
 * - Detects pathname changes
 * - Immediately scrolls to top (immediate: true)
 * - Ignores hash and search param changes
 *
 * Context API:
 * - lenis: Lenis instance
 * - scroll: Current scroll position
 * - stopScroll(): Disable scrolling (for modals)
 * - startScroll(): Re-enable scrolling
 * - scrollToTop(immediate?): Scroll to top
 *
 * @dependencies
 * - React (createContext, useContext, useEffect, useState, useRef)
 * - react-router (useLocation)
 * - lenis (Lenis type)
 * - ./smoothScroll (initSmoothScroll)
 *
 * @related
 * - app/root.tsx - Wraps app with LenisProvider
 * - app/lib/smoothScroll.ts - Lenis initialization and configuration
 * - app/lib/useScrolled.ts - Detects scroll position using Lenis
 * - app/lib/useScrollProgress.ts - Tracks scroll progress using Lenis
 * - app/components/Header.tsx - Uses useScrolled for header styling
 */

import {createContext, useContext, useEffect, useState, useRef, type ReactNode} from "react";
import {useLocation} from "react-router";
import type Lenis from "lenis";
import {initSmoothScroll} from "./smoothScroll";

/**
 * Lenis context value type
 */
interface LenisContextValue {
    lenis: Lenis | null;
    scroll: number;
    stopScroll: () => void;
    startScroll: () => void;
    scrollToTop: (immediate?: boolean) => void;
}

const LenisContext = createContext<LenisContextValue | null>(null);

/**
 * Provider component for Lenis smooth scrolling
 * Initializes Lenis on client-side only (SSR safe)
 * Automatically scrolls to top on route changes
 */
export function LenisProvider({children}: {children: ReactNode}) {
    const [lenis, setLenis] = useState<Lenis | null>(null);
    const [scroll, setScroll] = useState(0);
    const location = useLocation();
    const prevPathname = useRef(location.pathname);

    useEffect(() => {
        // Only initialize on client
        if (typeof window === "undefined") return;

        const lenisInstance = initSmoothScroll();
        setLenis(lenisInstance);

        // Listen to scroll events and update scroll value
        const handleScroll = (e: Lenis) => {
            setScroll(e.scroll);
        };

        lenisInstance.on("scroll", handleScroll);

        // Cleanup on unmount
        return () => {
            lenisInstance.off("scroll", handleScroll);
            lenisInstance.destroy();
        };
    }, []);

    // Scroll to top on route change (pathname only, not hash or search params)
    useEffect(() => {
        if (location.pathname !== prevPathname.current && lenis) {
            // Immediately scroll to top on route change
            lenis.scrollTo(0, {immediate: true});
            prevPathname.current = location.pathname;
        }
    }, [location.pathname, lenis]);

    // Stop scrolling (for modals/dialogs)
    const stopScroll = () => {
        if (lenis) {
            lenis.stop();
        }
    };

    // Resume scrolling
    const startScroll = () => {
        if (lenis) {
            lenis.start();
        }
    };

    // Scroll to top (optionally immediate)
    const scrollToTop = (immediate = false) => {
        if (lenis) {
            lenis.scrollTo(0, {immediate});
        }
    };

    return (
        <LenisContext.Provider value={{lenis, scroll, stopScroll, startScroll, scrollToTop}}>
            {children}
        </LenisContext.Provider>
    );
}

/**
 * Hook to access Lenis instance and scroll value
 * @throws if used outside LenisProvider
 */
export function useLenis(): LenisContextValue {
    const context = useContext(LenisContext);
    if (!context) {
        throw new Error("useLenis must be used within a LenisProvider");
    }
    return context;
}

/**
 * Hook to subscribe to Lenis scroll events with a callback
 * More efficient than using useLenis().scroll for animations
 */
export function useLenisScroll(callback: (scroll: number, lenis: Lenis) => void) {
    const {lenis} = useLenis();

    useEffect(() => {
        if (!lenis) return;

        const handleScroll = (e: Lenis) => {
            callback(e.scroll, e);
        };

        lenis.on("scroll", handleScroll);
        return () => {
            lenis.off("scroll", handleScroll);
        };
    }, [lenis, callback]);
}

/**
 * @deprecated Use `useScrollLock` from `~/hooks/useScrollLock` instead.
 * This hook is NOT ref-counted — if two overlays are open and one closes,
 * it will prematurely re-enable Lenis scrolling. The replacement hook
 * tracks active locks so Lenis only resumes when ALL overlays close.
 */
export function useLockBodyScroll(isLocked: boolean) {
    const {stopScroll, startScroll} = useLenis();

    useEffect(() => {
        if (isLocked) {
            stopScroll();
        } else {
            startScroll();
        }

        // Cleanup: ensure scroll is restored when component unmounts
        return () => {
            if (isLocked) {
                startScroll();
            }
        };
    }, [isLocked, stopScroll, startScroll]);
}
