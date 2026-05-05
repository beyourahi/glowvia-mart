/**
 * @fileoverview Server-side rendering entry point — CSP setup, streaming render, bot handling.
 *
 * Bots receive `body.allReady` (fully rendered HTML) so crawlers index complete content;
 * all other requests get the stream immediately for faster TTFB.
 *
 * @related server.ts, entry.client.tsx
 */

import {ServerRouter} from "react-router";
import {isbot} from "isbot";
import {renderToReadableStream} from "react-dom/server";
import {createContentSecurityPolicy, type HydrogenRouterContextProvider} from "@shopify/hydrogen";
import type {EntryContext} from "react-router";

export default async function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    reactRouterContext: EntryContext,
    context: HydrogenRouterContextProvider
) {
    const {nonce, header, NonceProvider} = createContentSecurityPolicy({
        shop: {
            checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
            storeDomain: context.env.PUBLIC_STORE_DOMAIN
        },
        scriptSrc: ["'self'", "https://cdn.shopify.com", "https://*.googletagmanager.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.shopify.com"],
        imgSrc: [
            "'self'",
            "https://cdn.shopify.com",
            "https://*.google-analytics.com",
            "https://*.googletagmanager.com",
            "https://images.unsplash.com" // Instagram section placeholders
        ],
        // Required for hero video metaobject
        mediaSrc: ["'self'", "https://cdn.shopify.com", "https://*.shopify.com", "https://*.myshopify.com"],
        connectSrc: [
            "https://*.shopify.com",
            "https://*.myshopify.com",
            "https://*.google-analytics.com",
            "https://*.analytics.google.com",
            "https://*.googletagmanager.com"
            // monorail-edge.shopifysvc.com is already included by Hydrogen's CSP defaults.
            // POST /v1/produce aborts with net::ERR_ABORTED on navigation/ad-blockers — expected,
            // Shopify analytics is best-effort telemetry and does not affect storefront function.
        ],
        frameSrc: ["https://www.google.com/"], // Google Maps embeds (ShopLocation section)
        frameAncestors: ["'none'"] // Prevent clickjacking
    });

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

    if (isbot(request.headers.get("user-agent"))) {
        await body.allReady;
    }

    responseHeaders.set("Content-Type", "text/html");
    responseHeaders.set("Content-Security-Policy", header);

    return new Response(body, {
        headers: responseHeaders,
        status: responseStatusCode
    });
}
