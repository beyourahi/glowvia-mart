/**
 * @fileoverview Reusable Route Error Boundary
 *
 * @description
 * Lightweight, reusable error boundary re-exported by route modules that don't
 * need a custom error UI. Renders content only — the root Layout export wraps
 * the output with the HTML document shell, and the default App export provides
 * header/footer around route-scoped errors.
 *
 * Handles both route error responses (4xx, 5xx) and thrown JS errors, deriving
 * a human-readable title and default message from the HTTP status code via the
 * getErrorTitle() / getDefaultMessage() helpers.
 *
 * @usage
 * ```ts
 * export { RouteErrorBoundary as ErrorBoundary } from "~/components/RouteErrorBoundary";
 * ```
 *
 * @related
 * - app/root.tsx — Root ErrorBoundary delegates to OfflineAwareErrorPage (full-page).
 * - app/components/OfflineAwareErrorPage.tsx — Full-page error UI with offline detection.
 * - app/routes/$.tsx — Custom 404 boundary that reads root data for recovery UX.
 */

import {isRouteErrorResponse, useRouteError, Link} from "react-router";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";

/**
 * Human-readable title for a given HTTP status code.
 */
function getErrorTitle(status: number): string {
    switch (status) {
        case 400:
            return "Bad Request";
        case 401:
            return "Unauthorized";
        case 403:
            return "Forbidden";
        case 404:
            return "Page Not Found";
        case 408:
            return "Request Timeout";
        case 429:
            return "Too Many Requests";
        case 500:
            return "Something Went Wrong";
        case 502:
            return "Bad Gateway";
        case 503:
            return "Service Unavailable";
        default:
            return status >= 500 ? "Something Went Wrong" : "An Error Occurred";
    }
}

/**
 * Fallback message for a given HTTP status code when the error response
 * doesn't supply its own.
 */
function getDefaultMessage(status: number): string {
    if (status === 404) {
        return "The page you're looking for doesn't exist or has been moved.";
    }
    if (status >= 500) {
        return "We're experiencing technical difficulties. Please try again in a moment.";
    }
    return "Something went wrong. Please try again.";
}

export function RouteErrorBoundary() {
    const error = useRouteError();

    let status = 500;
    let message: string | undefined;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.data?.message ?? (typeof error.data === "string" ? error.data : undefined);
    } else if (error instanceof Error) {
        message = error.message;
    }

    const title = getErrorTitle(status);
    const displayMessage = message || getDefaultMessage(status);

    return (
        <section className="relative flex min-h-[60dvh] flex-col items-center justify-center overflow-hidden px-4 py-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />
            <div className="relative mx-auto w-full max-w-2xl text-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                            Error {status}
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
                        <p className="mx-auto max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                            {displayMessage}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                        <Button variant="outline" asChild>
                            <Link to="/">Return Home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
