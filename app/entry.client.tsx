/**
 * @fileoverview Client-side hydration entry point.
 *
 * Skips hydration entirely on Google's webcache.googleusercontent.com — the JS context
 * differs from the original page and would cause errors. `startTransition` keeps hydration
 * non-blocking on slow devices.
 *
 * @related entry.server.tsx
 */

import {HydratedRouter} from "react-router/dom";
import {startTransition, StrictMode} from "react";
import {hydrateRoot} from "react-dom/client";
import {NonceProvider} from "@shopify/hydrogen";

if (!window.location.origin.includes("webcache.googleusercontent.com")) {
    startTransition(() => {
        const existingNonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;

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
