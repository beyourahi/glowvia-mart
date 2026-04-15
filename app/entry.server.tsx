/**
 * @fileoverview Server Entry Point for React Router + Hydrogen
 *
 * @description
 * Handles server-side rendering (SSR) of the React application.
 * This file is called by Oxygen (Cloudflare Workers) for every request
 * that needs to render HTML. It sets up CSP headers, renders the React tree
 * to a stream, and handles bot detection for full content delivery.
 *
 * @architecture
 * Request Flow:
 * 1. server.ts receives request and creates Hydrogen context
 * 2. This handler is called with the request and context
 * 3. CSP policy is created for security
 * 4. React tree is rendered to readable stream
 * 5. Response is returned with CSP headers
 *
 * @security
 * Content Security Policy (CSP) is configured here:
 * - Restricts script sources to self, Shopify CDN, Google Tag Manager
 * - Allows Google Fonts for typography
 * - Restricts connect-src for API calls
 *
 * @performance
 * - Uses streaming rendering for faster TTFB
 * - Bots wait for full render (allReady) for SEO
 * - Non-bots get streamed content immediately
 *
 * @dependencies
 * - react-router - ServerRouter for SSR
 * - react-dom/server - Stream rendering
 * - @shopify/hydrogen - CSP creation and nonce management
 * - isbot - Bot detection for SEO
 *
 * @related
 * - server.ts - Calls this handler
 * - root.tsx - Root component being rendered
 * - entry.client.tsx - Client-side hydration counterpart
 */

import {ServerRouter} from "react-router";
import {isbot} from "isbot";
import {renderToReadableStream} from "react-dom/server";
import {createContentSecurityPolicy, type HydrogenRouterContextProvider} from "@shopify/hydrogen";
import type {EntryContext} from "react-router";

// =============================================================================
// SERVER REQUEST HANDLER
// =============================================================================

/**
 * Handles server-side rendering of the React application.
 *
 * @param request - Incoming HTTP request
 * @param responseStatusCode - Initial status code (may change on error)
 * @param responseHeaders - Headers to include in response
 * @param reactRouterContext - React Router server context
 * @param context - Hydrogen context with storefront client
 *
 * @returns Streamed HTML Response with CSP headers
 */
export default async function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    reactRouterContext: EntryContext,
    context: HydrogenRouterContextProvider
) {
    // -------------------------------------------------------------------------
    // CONTENT SECURITY POLICY
    // -------------------------------------------------------------------------
    // Creates CSP headers and nonce for inline scripts/styles
    // This protects against XSS attacks by whitelisting trusted sources
    const {nonce, header, NonceProvider} = createContentSecurityPolicy({
        shop: {
            checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
            storeDomain: context.env.PUBLIC_STORE_DOMAIN
        },
        // Script sources: Self, Shopify CDN, Google Tag Manager
        scriptSrc: ["'self'", "https://cdn.shopify.com", "https://*.googletagmanager.com"],
        // Google Fonts require style-src
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com", "https://fonts.googleapis.com"],
        // Font files from Google Fonts
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.shopify.com"],
        imgSrc: [
            "'self'",
            "https://cdn.shopify.com",
            "https://*.google-analytics.com",
            "https://*.googletagmanager.com",
            // Unsplash for Instagram section placeholders
            "https://images.unsplash.com"
        ],
        // Allow video/audio from Shopify CDN (required for hero video metaobject)
        mediaSrc: ["'self'", "https://cdn.shopify.com", "https://*.shopify.com", "https://*.myshopify.com"],
        connectSrc: [
            // Shopify domains for Customer Account API
            "https://*.shopify.com",
            "https://*.myshopify.com",
            // Google Tag Manager domains
            "https://*.google-analytics.com",
            "https://*.analytics.google.com",
            "https://*.googletagmanager.com"
            // Note: monorail-edge.shopifysvc.com (Shopify analytics) is already
            // included by Hydrogen's createContentSecurityPolicy defaults.
            // POST requests to /v1/produce may still abort with net::ERR_ABORTED
            // during page navigations (browser cancels in-flight requests on unload)
            // or when ad blockers are active. This is expected and does not affect
            // storefront functionality — Shopify analytics is best-effort telemetry.
        ],
        // Allow Google Maps embeds in <iframe> (ShopLocation section)
        frameSrc: ["https://www.google.com/"],
        // Prevent clickjacking by blocking all iframe embedding
        frameAncestors: ["'none'"]
    });

    // -------------------------------------------------------------------------
    // STREAMING RENDER
    // -------------------------------------------------------------------------
    // Renders React tree to a readable stream for progressive delivery
    // NonceProvider makes the CSP nonce available to all components
    const body = await renderToReadableStream(
        <NonceProvider>
            <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />
        </NonceProvider>,
        {
            nonce,
            signal: request.signal,
            onError(error) {
                console.error(error);
                responseStatusCode = 500;
            }
        }
    );

    // -------------------------------------------------------------------------
    // BOT HANDLING (SEO)
    // -------------------------------------------------------------------------
    // For search engine crawlers, wait for full content before responding
    // This ensures bots index complete page content, not streaming placeholders
    if (isbot(request.headers.get("user-agent"))) {
        await body.allReady;
    }

    // -------------------------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------------------------
    responseHeaders.set("Content-Type", "text/html");
    responseHeaders.set("Content-Security-Policy", header);

    // Return streaming response with all headers
    return new Response(body, {
        headers: responseHeaders,
        status: responseStatusCode
    });
}
