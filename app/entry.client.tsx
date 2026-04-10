/**
 * @fileoverview Client Entry Point for React Hydration
 *
 * @description
 * Handles client-side hydration of the server-rendered React application.
 * This file runs in the browser after the initial HTML is loaded, making
 * the static HTML interactive by attaching React event handlers.
 *
 * @architecture
 * Hydration Flow:
 * 1. Browser receives server-rendered HTML
 * 2. JavaScript bundle loads and executes
 * 3. This entry point hydrates the existing DOM
 * 4. React takes over and the app becomes interactive
 *
 * @performance
 * - Uses startTransition for non-blocking hydration (React 18+)
 * - Wrapped in StrictMode for development checks
 * - Preserves CSP nonce from server render
 *
 * @edge-case
 * Google Cache handling:
 * - Skips hydration for Google's webcache.googleusercontent.com
 * - This prevents issues with cached pages trying to hydrate
 *
 * @dependencies
 * - react-router/dom - Client-side router
 * - react-dom/client - React 18 hydration
 * - @shopify/hydrogen - CSP nonce provider
 *
 * @related
 * - entry.server.tsx - Server-side rendering counterpart
 * - root.tsx - Root component being hydrated
 */

import {HydratedRouter} from "react-router/dom";
import {startTransition, StrictMode} from "react";
import {hydrateRoot} from "react-dom/client";
import {NonceProvider} from "@shopify/hydrogen";

// =============================================================================
// CLIENT HYDRATION
// =============================================================================

/**
 * Skip hydration for Google's cached pages.
 * Google Cache serves a snapshot of the page, and attempting to hydrate
 * that snapshot can cause issues since the JS context is different.
 */
if (!window.location.origin.includes("webcache.googleusercontent.com")) {
    /**
     * Use startTransition to make hydration non-blocking.
     * This allows the browser to remain responsive during hydration,
     * especially on slower devices with complex component trees.
     */
    startTransition(() => {
        // Extract the CSP nonce from server-rendered script tags
        // This nonce is needed for any dynamically injected scripts
        const existingNonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;

        // Hydrate the entire document (not just a div)
        // React 18's hydrateRoot is used for concurrent features
        hydrateRoot(
            document,
            <StrictMode>
                <NonceProvider value={existingNonce}>
                    <HydratedRouter />
                </NonceProvider>
            </StrictMode>,
            {
                onRecoverableError(error) {
                    if (process.env.NODE_ENV === "development") {
                        console.warn("[Hydration] Recoverable error:", error);
                    }
                }
            }
        );
    });
}
