/**
 * @fileoverview Offline-aware error page with contextual UI variants.
 *
 * Renders one of three sub-components based on connectivity and status code:
 * offline (checked first — most common PWA error), 404, or generic (500+).
 * Offline state is SSR-safe: defaults to online, hydrates via browser events.
 *
 * @related
 * - NetworkStatusIndicator.tsx - Persistent network status banner
 * - app/hooks/useNetworkStatus.ts - Reusable network status hook
 * - public/sw.js - Service worker providing offline caching
 */

import {useEffect, useState} from "react";
import {Link} from "react-router";
import {Button} from "~/components/ui/button";
import {WifiOff} from "lucide-react";

interface OfflineAwareErrorPageProps {
    /** HTTP status code (404, 500, etc.) */
    statusCode: number;
    /** Custom title override (defaults based on status code) */
    title?: string;
    /** Custom message override (defaults based on status code) */
    message?: string;
}

export function OfflineAwareErrorPage({statusCode, title, message}: OfflineAwareErrorPageProps) {
    // SSR-safe: default to online to avoid hydration mismatch; real state set after mount.
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (typeof navigator !== "undefined") {
            setIsOffline(!navigator.onLine);
        }

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Offline is checked first — it's the most common error cause in a PWA.
    if (isOffline) {
        return <OfflineErrorUI />;
    }

    if (statusCode === 404) {
        return <NotFoundErrorUI title={title} message={message} />;
    }

    return <GenericErrorUI statusCode={statusCode} title={title} message={message} />;
}

/** Offline connectivity error UI — reload or go home. */
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

interface NotFoundErrorUIProps {
    title?: string;
    message?: string;
}

/** 404 Not Found UI — large code + home/collections navigation. */
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

interface GenericErrorUIProps {
    statusCode: number;
    title?: string;
    message?: string;
}

/** Generic error UI (500+) — error code + reload/home navigation. */
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

        </div>
    );
}
