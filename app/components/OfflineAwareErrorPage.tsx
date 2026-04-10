/**
 * @fileoverview Offline-aware error page with contextual UI variants.
 *
 * @description
 * Enhanced error page component that intelligently detects network connectivity
 * and displays contextually appropriate error UI. Critical for PWA e-commerce
 * where network failures are common and must be distinguished from actual errors
 * like 404s or server issues. Provides three UI variants: offline, 404 not found,
 * and generic errors (500, etc).
 *
 * @features
 * - Real-time offline detection via navigator.onLine API
 * - Event-driven online/offline state updates
 * - SSR-safe with client-side hydration
 * - Three distinct UI variants with appropriate actions
 * - Consistent styling with semantic font/color system
 * - Responsive layout (mobile-first, stacks to row)
 * - Safe area padding for header offset
 * - Large visual indicators (icons, error codes)
 * - Clear action buttons with appropriate navigation
 *
 * @variants
 * Offline UI:
 * - WifiOff icon (large, muted)
 * - "You're Offline" heading
 * - Network troubleshooting message
 * - "Try Again" button (reloads page)
 * - "Back to Home" button
 * - Helpful tip about cached pages
 *
 * 404 Not Found UI:
 * - Large "404" error code display
 * - Customizable title and message
 * - "Back to Home" button
 * - "Browse Collections" button
 *
 * Generic Error UI (500, etc):
 * - Large error code display
 * - Customizable title and message
 * - "Try Again" button (reloads page)
 * - "Back to Home" button
 * - "Contact us" link for persistent issues
 *
 * @props
 * - statusCode: HTTP status code (404, 500, etc)
 * - title: Custom heading override (optional, defaults based on code)
 * - message: Custom message override (optional, defaults based on code)
 *
 * @architecture
 * - Client-side state for offline detection (SSR-safe)
 * - Event listeners for online/offline browser events
 * - Conditional rendering based on offline state first, then status code
 * - Three sub-components for UI variants (composition pattern)
 * - Proper cleanup of event listeners
 *
 * @related
 * - NetworkStatusIndicator.tsx - Persistent network status banner
 * - app/hooks/useNetworkStatus.ts - Reusable network status hook
 * - public/sw.js - Service worker providing offline caching
 * - app/routes/*.tsx - Route error boundaries using this component
 *
 * @accessibility
 * - Semantic HTML (h1, p, proper heading hierarchy)
 * - Icon aria-hidden (decorative, heading provides context)
 * - Button/link with clear text labels
 * - Sufficient contrast ratios (WCAG AA)
 * - Responsive text sizing
 *
 * @ux
 * - Offline detection prioritized (most likely cause of errors in PWA)
 * - Clear visual hierarchy (icon → code → heading → message → actions)
 * - Multiple action options (don't force single path)
 * - Helpful context ("previously viewed pages may be available")
 * - Non-technical language ("You're Offline" not "Network Error")
 *
 * @performance
 * - SSR-safe (defaults to online, hydrates with actual state)
 * - Minimal re-renders (state only updates on actual changes)
 * - Event listeners cleaned up on unmount
 * - No external dependencies or heavy libraries
 *
 * @ecommerce
 * Critical for e-commerce PWA because:
 * - Network failures common on mobile devices
 * - Cached product pages may load but API calls fail
 * - Distinguishes offline (temporary, user-fixable) from real errors
 * - Provides appropriate recovery paths for each scenario
 * - Prevents confusion when checkout/cart operations fail offline
 *
 * @example
 * ```tsx
 * // Generic error boundary
 * <OfflineAwareErrorPage statusCode={500} />
 *
 * // 404 with custom message
 * <OfflineAwareErrorPage
 *   statusCode={404}
 *   title="Product Not Found"
 *   message="This product no longer exists."
 * />
 *
 * // In route error boundary
 * export function ErrorBoundary() {
 *   const error = useRouteError();
 *   return (
 *     <OfflineAwareErrorPage
 *       statusCode={error.status || 500}
 *     />
 *   );
 * }
 * ```
 */

import {useEffect, useState} from "react";
import {Link} from "react-router";
import {Button} from "~/components/ui/button";
import {WifiOff} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface OfflineAwareErrorPageProps {
    /** HTTP status code (404, 500, etc.) */
    statusCode: number;
    /** Custom title override (defaults based on status code) */
    title?: string;
    /** Custom message override (defaults based on status code) */
    message?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function OfflineAwareErrorPage({statusCode, title, message}: OfflineAwareErrorPageProps) {
    /**
     * SSR-safe offline state.
     * Defaults to online, hydrates with actual state after mount.
     * Prevents hydration mismatch between server and client.
     */
    const [isOffline, setIsOffline] = useState(false);

    // =============================================================================
    // EFFECTS
    // =============================================================================

    /**
     * Detect online/offline status after mount.
     * Listens for browser online/offline events for real-time updates.
     */
    useEffect(() => {
        // Check initial state
        if (typeof navigator !== "undefined") {
            setIsOffline(!navigator.onLine);
        }

        // Listen for changes
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // =============================================================================
    // RENDER
    // =============================================================================

    /**
     * Render offline UI if user is disconnected.
     * Prioritized over error codes because offline is most common PWA error.
     */
    if (isOffline) {
        return <OfflineErrorUI />;
    }

    /**
     * Render 404 UI for not found errors.
     * Distinct from generic errors with different actions.
     */
    if (statusCode === 404) {
        return <NotFoundErrorUI title={title} message={message} />;
    }

    /**
     * Render generic error UI for server errors and other issues.
     * Fallback for all non-404, non-offline errors.
     */
    return <GenericErrorUI statusCode={statusCode} title={title} message={message} />;
}

// =============================================================================
// OFFLINE ERROR UI
// =============================================================================

/**
 * Offline error variant.
 * Shows when network connectivity is lost.
 * Provides reload and home navigation options.
 * Includes helpful tip about cached pages.
 */
function OfflineErrorUI() {
    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-16 text-center  ">
            {/* Large offline icon */}
            <WifiOff className="size-24 text-secondary/60 sm:size-32 md:size-40" strokeWidth={1.5} aria-hidden="true" />

            {/* Heading */}
            <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
                You&apos;re Offline
            </h1>

            {/* Message */}
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
                Check your internet connection and try again.
            </p>

            {/* Action buttons - use <a href> for full page navigation through SW */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button onClick={() => window.location.reload()}>Try Again</Button>
                <Button variant="outline" asChild>
                    <a href="/">Back to Home</a>
                </Button>
            </div>

            {/* Helpful tip */}
            <p className="mt-8 text-sm text-muted-foreground">
                Previously viewed pages may still be available while offline.
            </p>
        </div>
    );
}

// =============================================================================
// 404 NOT FOUND UI
// =============================================================================

interface NotFoundErrorUIProps {
    title?: string;
    message?: string;
}

/**
 * 404 Not Found error variant.
 * Shows large "404" code with customizable title/message.
 * Provides home and collections navigation options.
 */
function NotFoundErrorUI({title, message}: NotFoundErrorUIProps) {
    const displayTitle = title ?? "Page Not Found";
    const displayMessage = message ?? "The page you're looking for doesn't exist or has been moved.";

    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-16 text-center  ">
            {/* Large error code */}
            <span className="select-none text-[8rem] font-bold leading-none text-secondary/60 sm:text-[10rem] md:text-[12rem]">
                404
            </span>

            {/* Heading */}
            <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {displayTitle}
            </h1>

            {/* Message */}
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">{displayMessage}</p>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button asChild>
                    <Link to="/">Back to Home</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link to="/collections/all-products">Browse All Products</Link>
                </Button>
            </div>
        </div>
    );
}

// =============================================================================
// GENERIC ERROR UI (500, etc.)
// =============================================================================

interface GenericErrorUIProps {
    statusCode: number;
    title?: string;
    message?: string;
}

/**
 * Generic error variant (500, etc).
 * Shows error code with customizable title/message.
 * Provides reload and home navigation, plus contact link.
 */
function GenericErrorUI({statusCode, title, message}: GenericErrorUIProps) {
    const displayTitle = title ?? (statusCode >= 500 ? "Something Went Wrong" : "An Error Occurred");
    const displayMessage = message ?? "We're experiencing technical difficulties. Please try again in a moment.";

    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-16 text-center  ">
            {/* Large error code */}
            <span className="select-none text-[8rem] font-bold leading-none text-secondary/60 sm:text-[10rem] md:text-[12rem]">
                {statusCode}
            </span>

            {/* Heading */}
            <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {displayTitle}
            </h1>

            {/* Message */}
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">{displayMessage}</p>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button onClick={() => window.location.reload()}>Try Again</Button>
                <Button variant="outline" asChild>
                    <Link to="/">Back to Home</Link>
                </Button>
            </div>

            {/* Contact footer for server errors */}
            <p className="mt-8 text-sm text-muted-foreground">
                If the problem persists,{" "}
                <Link to="/contact" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    please contact us
                </Link>
                .
            </p>
        </div>
    );
}
