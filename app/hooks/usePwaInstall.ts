/**
 * @fileoverview PWA Installation Management Hook with Platform Detection
 *
 * @description
 * Comprehensive hook for managing progressive web app installation across platforms.
 * Handles beforeinstallprompt event capture, platform-specific install flows, and
 * installation state tracking. Provides a unified interface for iOS manual installation
 * and Chrome/Edge native install prompts. Integrates with manifest.webmanifest for
 * app metadata and tracks installation analytics via GTM.
 *
 * @architecture
 * - Platform detection: iOS (manual instructions), Android/Desktop (native prompt)
 * - Early event capture: Pre-hydration script captures beforeinstallprompt on mobile
 * - Standalone detection: Identifies when app is running as installed PWA
 * - Install state persistence: Uses localStorage and getInstalledRelatedApps API
 * - User-initiated only: No auto-prompts or intrusive banners
 * - Manifest integration: Fetches app name and icons from /manifest.webmanifest
 *
 * @dependencies
 * - React hooks (useState, useEffect, useRef)
 * - Browser beforeinstallprompt event API
 * - Browser getInstalledRelatedApps API (optional, degrades gracefully)
 * - pwa-storage.ts - LocalStorage utilities for install state
 * - /public/pwa-install-capture.js - Pre-hydration event capture script
 * - /manifest.webmanifest - App metadata (name, icons)
 * - GTM dataLayer for analytics
 *
 * @related
 * - OpenInAppButton.tsx - Primary consumer for install button UI
 * - IosInstallInstructions.tsx - iOS-specific manual install steps
 * - pwa-storage.ts - Persistent install state tracking
 * - manifest[.]webmanifest.tsx - Dynamic manifest generation
 * - ServiceWorkerRegistration.tsx - Coordinates with SW registration
 *
 * @platform_support
 * iOS Safari:
 * - Uses "Add to Home Screen" manual instructions
 * - Detects standalone mode via CSS media query and navigator.standalone
 *
 * Chrome/Edge (Android/Desktop):
 * - Uses native beforeinstallprompt API
 * - Pre-hydration capture via window.__pwaInstallPromptEvent
 * - One-time prompt usage (cleared after user choice)
 *
 * @usage
 * ```tsx
 * const {
 *   canInstall,      // Native prompt available (Android/Desktop)
 *   isIOS,           // iOS device detected
 *   isStandalone,    // Running as installed app
 *   appName,         // From manifest
 *   triggerInstall   // Show native prompt
 * } = usePwaInstall();
 *
 * if (isStandalone) {
 *   return <AlreadyInstalledMessage />;
 * }
 *
 * if (isIOS) {
 *   return <IosInstallInstructions />;
 * }
 *
 * if (canInstall) {
 *   return <InstallButton onClick={triggerInstall} />;
 * }
 * ```
 */

import {useState, useEffect, useRef} from "react";
import {isAppMarkedAsInstalled, setAppInstalled} from "~/lib/pwa-storage";
import {trackInstallPrompt, trackInstallAccepted, trackInstallDismissed} from "~/hooks/usePwaAnalytics";

// =============================================================================
// TYPES
// =============================================================================

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: "accepted" | "dismissed"}>;
}

interface ManifestData {
    name?: string;
    short_name?: string;
    icons?: Array<{src: string; sizes: string; type?: string}>;
}

declare global {
    interface Window {
        __pwaInstallPromptEvent?: BeforeInstallPromptEvent;
        dataLayer?: Array<Record<string, unknown>>;
    }
    interface Navigator {
        standalone?: boolean;
    }
}

interface UsePwaInstallReturn {
    /** beforeinstallprompt event is available (Android/Desktop Chrome) */
    canInstall: boolean;
    /** iOS Safari detected (needs manual install instructions) */
    isIOS: boolean;
    /** Desktop browser detected */
    isDesktop: boolean;
    /** App is already installed (standalone mode) */
    isStandalone: boolean;
    /** App is installed but user is browsing in regular browser */
    isAppDetectedAsInstalled: boolean;
    /** Installation in progress */
    isInstalling: boolean;
    /** App name from manifest */
    appName: string | null;
    /** App icon URL from manifest (192x192) */
    appIcon: string | null;
    /** Trigger the native install prompt (Android/Desktop) */
    triggerInstall: () => Promise<void>;
}

// =============================================================================
// ANALYTICS HELPERS
// =============================================================================

function trackEvent(event: string, data?: Record<string, unknown>) {
    if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({event, ...data});
    }
}

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

/**
 * Detect any iOS device (iPhone, iPad, iPod)
 * All iOS browsers use WebKit and support "Add to Home Screen" (iOS 16.4+)
 */
function detectIOSDevice(): boolean {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent;
    // iOS device detection (iPhone, iPad, iPod)
    // MSStream check excludes IE11 on Windows Phone
    if (/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)) return true;
    // iPadOS 13+ desktop mode: UA spoofed to "Macintosh" but has multitouch
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
    return false;
}

function detectStandaloneMode(): boolean {
    if (typeof window === "undefined") return false;

    // Check CSS media query (works on most browsers)
    const matchesStandalone = window.matchMedia("(display-mode: standalone)").matches;

    // Check iOS-specific property
    const iosStandalone = navigator.standalone === true;

    return matchesStandalone || iosStandalone;
}

function getPlatform(): "ios" | "android" | "desktop" {
    if (typeof window === "undefined") return "desktop";

    const ua = navigator.userAgent;

    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    // iPadOS 13+ desktop mode: UA spoofed to "Macintosh" but has multitouch
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
    if (/Android/.test(ua)) return "android";
    return "desktop";
}

// =============================================================================
// HOOK
// =============================================================================

export function usePwaInstall(): UsePwaInstallReturn {
    // State
    const [canInstall, setCanInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isAppDetectedAsInstalled, setIsAppDetectedAsInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [appName, setAppName] = useState<string | null>(null);
    const [appIcon, setAppIcon] = useState<string | null>(null);

    // Store beforeinstallprompt event for later use
    const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

    // Initialization effect
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Detect platforms
        const iosDevice = detectIOSDevice();
        const standalone = detectStandaloneMode();
        const desktop = getPlatform() === "desktop";

        setIsIOS(iosDevice);
        setIsDesktop(desktop);
        setIsStandalone(standalone);

        // Track standalone launch
        if (standalone) {
            trackEvent("pwa_launched_standalone");
        }

        // Don't proceed with install prompts if already in standalone mode
        if (standalone) return;

        // Check if app was previously installed (localStorage fallback)
        const wasInstalledBefore = isAppMarkedAsInstalled();
        if (wasInstalledBefore) {
            setIsAppDetectedAsInstalled(true);
        }

        // Also try getInstalledRelatedApps() API as a secondary check
        if (navigator.getInstalledRelatedApps) {
            navigator
                .getInstalledRelatedApps()
                .then(apps => {
                    const isInstalled = apps.some(app => app.platform === "webapp");
                    if (isInstalled) {
                        setIsAppDetectedAsInstalled(true);
                        setAppInstalled();
                    }
                })
                .catch(() => {
                    // API not available or error - silently fail
                });
        }

        // Fetch manifest for app info
        fetch("/manifest.webmanifest")
            .then(res => {
                if (!res.ok) throw new Error("Manifest not found");
                return res.json() as Promise<ManifestData>;
            })
            .then(manifest => {
                setAppName(manifest.name || manifest.short_name || null);

                // Get 192x192 icon for prompt display
                const icon = manifest.icons?.find(i => i.sizes === "192x192");
                if (icon) {
                    setAppIcon(icon.src);
                }
            })
            .catch(() => {
                // Silently fail
            });

        // Handler for beforeinstallprompt event
        const handleBeforeInstall = (e: Event) => {
            // Prevent browser's default mini-infobar
            e.preventDefault();

            // Store the event for later use
            deferredPromptRef.current = e as BeforeInstallPromptEvent;
            setCanInstall(true);
        };

        // Check for pre-captured event from head script (for mobile browsers)
        if (window.__pwaInstallPromptEvent) {
            deferredPromptRef.current = window.__pwaInstallPromptEvent;
            setCanInstall(true);
            delete window.__pwaInstallPromptEvent;
        }

        // Also listen for future events (in case it hasn't fired yet on desktop)
        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        // Handler for appinstalled event - fires when installation completes
        const handleAppInstalled = () => {
            const platform = getPlatform();

            // Set localStorage flag for future "Open in App" detection
            setAppInstalled();

            // Update state
            setCanInstall(false);
            setIsStandalone(true);
            setIsAppDetectedAsInstalled(true);

            // Track analytics
            trackEvent("pwa_app_installed", {
                platform,
                source: "appinstalled_event"
            });
        };

        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    // Trigger native install prompt (Android/Desktop)
    const triggerInstall = async () => {
        if (!deferredPromptRef.current) {
            return;
        }

        setIsInstalling(true);

        try {
            trackInstallPrompt();

            // Show the native install prompt
            await deferredPromptRef.current.prompt();

            // Wait for user's choice
            const {outcome} = await deferredPromptRef.current.userChoice;

            if (outcome === "accepted") {
                trackInstallAccepted();
            } else {
                trackInstallDismissed();
            }
        } catch (err) {
            console.error("[PWA] Install prompt error:", err);
        } finally {
            // Clear the deferred prompt (can only be used once)
            deferredPromptRef.current = null;
            setCanInstall(false);
            setIsInstalling(false);
        }
    };

    return {
        canInstall,
        isIOS,
        isDesktop,
        isStandalone,
        isAppDetectedAsInstalled,
        isInstalling,
        appName,
        appIcon,
        triggerInstall
    };
}
