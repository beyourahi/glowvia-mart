/**
 * @fileoverview PWA Offline Fallback Page
 *
 * @description
 * Shown by the service worker when navigating to uncached content while offline.
 * Provides a user-friendly offline experience with retry options and cached
 * theme support for brand consistency.
 *
 * @route GET /offline
 *
 * @pwa-integration
 * - Precached by service worker during install event
 * - Served when navigation fails and user is offline
 * - Reads cached theme from localStorage for brand styling
 * - Tracks offline page views for analytics
 *
 * @access-control
 * This page should only be visible when offline:
 * - If user navigates here while online → Redirect to homepage
 * - Service worker can still precache (redirect is client-side only)
 *
 * @theme-handling
 * When served from SW cache, applies cached theme:
 * 1. Reads theme from localStorage (persisted by root.tsx)
 * 2. Injects CSS variables into document head
 * 3. Loads Google Fonts if URL is cached
 *
 * @design
 * Matches ErrorPage component for visual consistency:
 * - Large centered icon (WifiOff)
 * - Heading and descriptive message
 * - Retry and home action buttons
 * - Helpful tip about cached pages
 *
 * @related
 * - public/sw.js - Service worker that serves this page
 * - lib/theme-storage.ts - Theme caching utilities
 * - hooks/usePwaAnalytics.ts - Offline analytics tracking
 * - ErrorPage.tsx - Design pattern reference
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
 */

import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import {Button} from "~/components/ui/button";
import {WifiOff} from "lucide-react";
import {trackOfflinePageView} from "~/hooks/usePwaAnalytics";
import {getThemeFromStorage} from "~/lib/theme-storage";
import type {GeneratedTheme} from "types";

const FALLBACK_ERROR_CONTENT = {
    offlineHeading: "You're Offline",
    offlineMessage: "Please check your internet connection and try again.",
    offlineRetry: "Retry",
    offlineHome: "Return Home",
    offlineTip: "Tip: Some pages you've visited before may still be available"
} as const;

/**
 * Hook to redirect to home if user is online
 * This ensures the offline page is only accessible when truly offline
 *
 * Why client-side only:
 * - Server can't reliably detect online/offline status
 * - Service worker needs to precache this page (server must render it)
 * - When SW serves from cache while offline, this redirect won't trigger
 *   because the user IS offline
 */
function useOnlineRedirect() {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Check if user is online
        if (typeof navigator !== "undefined" && navigator.onLine) {
            // User is online - they shouldn't be on this page
            // Redirect to homepage
            void navigate("/", {replace: true});
        } else {
            // User is offline - show the page
            setIsChecking(false);
        }
    }, [navigate]);

    return isChecking;
}

/**
 * Hook to apply cached theme when offline
 * Reads from localStorage and injects CSS + fonts into document head
 */
function useOfflineTheme() {
    const [theme, setTheme] = useState<GeneratedTheme | null>(null);

    useEffect(() => {
        // Debug logging for troubleshooting
        if (process.env.NODE_ENV === "development") {
            try {
                const rawStored = localStorage.getItem("hydrogen-theme-cache");
                // eslint-disable-next-line no-console -- intentional debug logging for offline theme
                console.log("[OfflineTheme] localStorage check:", rawStored ? "exists" : "empty");

                if (rawStored) {
                    const parsed = JSON.parse(rawStored) as Record<string, unknown>;
                    const themeObj = parsed?.theme as Record<string, unknown> | undefined;
                    // eslint-disable-next-line no-console -- intentional debug logging for offline theme
                    console.log("[OfflineTheme] Theme structure:", {
                        hasTheme: !!themeObj,
                        hasCssVariables: !!themeObj?.cssVariables,
                        hasFonts: !!themeObj?.fonts
                    });
                }
            } catch (e) {
                console.error("[OfflineTheme] Debug error:", e);
            }
        }

        // Read cached theme from localStorage
        const cachedTheme = getThemeFromStorage();

        if (cachedTheme) {
            setTheme(cachedTheme);
        }
    }, []);

    useEffect(() => {
        if (!theme) return;

        // Inject CSS variables into document head
        // This overrides any cached theme CSS with the latest from localStorage
        const styleId = "offline-theme-override";
        let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        // Set the CSS - this comes after any cached styles, so it takes precedence
        styleElement.textContent = theme.cssVariables;

        // Inject Google Fonts link if available
        if (theme.googleFontsUrl) {
            const fontLinkId = "offline-google-fonts";
            let fontLink = document.getElementById(fontLinkId) as HTMLLinkElement | null;

            if (!fontLink) {
                fontLink = document.createElement("link");
                fontLink.id = fontLinkId;
                fontLink.rel = "stylesheet";
                fontLink.href = theme.googleFontsUrl;
                document.head.appendChild(fontLink);
            }
        }

        // No cleanup - styles should persist for the page lifetime
    }, [theme]);

    return theme;
}

export default function OfflinePage() {
    // Redirect to home if user is online
    const isChecking = useOnlineRedirect();

    // Apply cached theme for brand-consistent offline experience
    useOfflineTheme();

    // Use fallback content directly (no context needed for offline page - 80/20 rule)
    const errorContent = FALLBACK_ERROR_CONTENT;

    // Track offline page view for analytics
    useEffect(() => {
        void trackOfflinePageView();
    }, []);

    // Show nothing while checking online status (prevents flash)
    if (isChecking) {
        return null;
    }

    return (
        // pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px)
        <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 pt-(--page-breathing-room) pb-16 text-center  ">
            {/* Large offline icon (matching ErrorPage statusCode size) */}
            <WifiOff className="size-24 sm:size-32 md:size-40 text-secondary/60" strokeWidth={1.5} aria-hidden="true" />

            {/* Heading (matching ErrorPage h1 style) */}
            <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {errorContent.offlineHeading}
            </h1>

            {/* Message (matching ErrorPage p style) */}
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">{errorContent.offlineMessage}</p>

            {/* Action buttons - use <a href> for full page navigation through SW */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button onClick={() => window.location.reload()}>{errorContent.offlineRetry}</Button>
                <Button variant="outline" asChild>
                    <a href="/">{errorContent.offlineHome}</a>
                </Button>
            </div>

            {/* Helpful tip */}
            <p className="mt-8 text-sm text-muted-foreground">{errorContent.offlineTip}</p>
        </div>
    );
}
