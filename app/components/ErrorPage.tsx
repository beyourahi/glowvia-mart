/**
 * @fileoverview Branded error page component for 404 and 500 errors
 *
 * @description
 * ErrorPage provides a consistent, user-friendly error experience for HTTP errors.
 * Designed to be resilient with minimal dependencies so it works even when the app fails.
 * Displays large error code, contextual message, and recovery actions.
 *
 * @features
 * - Large, readable error codes (404, 500, etc.)
 * - Contextual error messages based on error type
 * - Branded styling matching site design
 * - Recovery actions (go home, browse collections, try again)
 * - Contact link for 500 errors
 * - Safe area padding for iOS devices
 * - Minimal dependencies for resilience
 *
 * @props
 * - statusCode: HTTP status code (404, 500, etc.)
 * - title: Optional custom error title (defaults based on status)
 * - message: Optional custom error message (defaults based on status)
 *
 * @architecture
 * Uses semantic HTML and Tailwind styling with no complex logic.
 * Renders different action buttons based on error type:
 * - 404: "Back to Home" + "Browse Collections"
 * - 500: "Try Again" + "Back to Home" + contact message
 *
 * @related
 * - root.tsx - Renders ErrorPage for route errors
 * - routes/$.tsx - 404 catch-all route
 * - ErrorBoundary - Global error boundary component
 *
 * @example
 * ```tsx
 * // 404 error
 * <ErrorPage statusCode={404} />
 *
 * // 500 error with custom message
 * <ErrorPage
 *   statusCode={500}
 *   title="Server Error"
 *   message="Our servers are experiencing issues."
 * />
 * ```
 */

import {Link} from "react-router";
import {Button} from "~/components/ui/button";

const FALLBACK_ERROR_CONTENT = {
    notFoundHeading: "Page Not Found",
    notFoundMessage: "The page you're looking for doesn't exist or has been moved.",
    notFoundPrimaryCta: "Back to Home",
    notFoundSecondaryCta: "Browse Collections",
    serverErrorHeading: "Something Went Wrong",
    serverErrorMessage: "We're experiencing technical difficulties. Please try again.",
    serverErrorRetry: "Try Again",
    serverErrorHome: "Return Home",
    serverErrorContactPrefix: "Need help?",
    serverErrorContactLink: "Contact Support"
} as const;

// ================================================================================
// Type Definitions
// ================================================================================

interface ErrorPageProps {
    statusCode: number;
    title?: string;
    message?: string;
}

// ================================================================================
// Error Page Component
// ================================================================================

/**
 * ErrorPage - User-friendly error display with recovery actions
 *
 * Displays a large error code, contextual message, and action buttons to help
 * users recover from errors. Styled to match the brand and designed to work
 * even if other parts of the app fail.
 *
 * Design principles:
 * - Clear visual hierarchy (large code, medium title, small message)
 * - Contextual actions based on error type
 * - Branded but minimal styling
 * - Works without JavaScript if needed
 *
 * @param statusCode - HTTP status code (404, 500, etc.)
 * @param title - Optional custom title (overrides default)
 * @param message - Optional custom message (overrides default)
 */
export function ErrorPage({statusCode, title, message}: ErrorPageProps) {
    // Use fallback content directly (no metaobject needed for error pages - 80/20 rule)
    const errorContent = FALLBACK_ERROR_CONTENT;
    const is404 = statusCode === 404;

    // Use fallback content for defaults, with prop overrides
    const defaultTitle = is404 ? errorContent.notFoundHeading : errorContent.serverErrorHeading;
    const defaultMessage = is404 ? errorContent.notFoundMessage : errorContent.serverErrorMessage;

    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-16 text-center  ">
            {/* Large error code */}
            <span className="select-none text-[8rem] font-bold leading-none text-secondary/60 sm:text-[10rem] md:text-[12rem]">
                {statusCode}
            </span>

            {/* Heading */}
            <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {title ?? defaultTitle}
            </h1>

            {/* Message */}
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">{message ?? defaultMessage}</p>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                {is404 ? (
                    <>
                        <Button asChild>
                            <Link to="/">{errorContent.notFoundPrimaryCta}</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/collections/all-products">{errorContent.notFoundSecondaryCta}</Link>
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={() => window.location.reload()}>{errorContent.serverErrorRetry}</Button>
                        <Button variant="outline" asChild>
                            <Link to="/">{errorContent.serverErrorHome}</Link>
                        </Button>
                    </>
                )}
            </div>

            {/* Contact footer for 500 errors */}
            {!is404 && (
                <p className="mt-8 text-sm text-muted-foreground">
                    {errorContent.serverErrorContactPrefix}{" "}
                    <Link to="/contact" className="text-primary underline underline-offset-4 hover:text-primary/80">
                        {errorContent.serverErrorContactLink}
                    </Link>
                    .
                </p>
            )}
        </div>
    );
}
