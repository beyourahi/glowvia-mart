import {isRouteErrorResponse, useRouteError, Link} from "react-router";

/**
 * Reusable error boundary for route-level errors.
 * Renders content only — the root Layout provides the <html> document shell.
 *
 * Usage: export { RouteErrorBoundary as ErrorBoundary } from "~/components/RouteErrorBoundary";
 */
export function RouteErrorBoundary() {
    const error = useRouteError();
    let errorMessage = "An unexpected error occurred";
    let errorStatus = 500;

    if (isRouteErrorResponse(error)) {
        errorStatus = error.status;
        errorMessage = errorStatus === 404
            ? "The page you're looking for doesn't exist or has been moved."
            : error?.data?.message ?? error.data;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    const title =
        errorStatus === 404
            ? "Page Not Found"
            : errorStatus >= 500
              ? "Something Went Wrong"
              : "An Error Occurred";

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <h1 className="text-4xl font-bold text-primary-foreground">{errorStatus}</h1>
            <h2 className="mt-2 text-xl text-primary-foreground/80">{title}</h2>
            {errorMessage && (
                <p className="mt-4 max-w-md text-sm text-primary-foreground/60">{errorMessage}</p>
            )}
            <Link
                to="/"
                className="mt-8 rounded-md bg-primary-foreground/10 px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/20"
            >
                Return Home
            </Link>
        </div>
    );
}
