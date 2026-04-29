/**
 * @fileoverview Oxygen Workers Server Entry Point
 *
 * @description
 * Main entry point for the Shopify Oxygen deployment (Cloudflare Workers).
 * This file receives all incoming requests and routes them through the
 * Hydrogen framework. It's the first code that runs for every request.
 *
 * @architecture
 * Request Flow:
 * 1. Oxygen Workers receives HTTP request
 * 2. This fetch handler is invoked
 * 3. Hydrogen context is created (storefront client, session, cart)
 * 4. Request handler routes to appropriate React Router route
 * 5. Response is returned (with session cookie if changed)
 * 6. 404s check for Shopify redirects before returning
 *
 * @environment
 * Runs in Cloudflare Workers environment:
 * - env: Environment bindings (secrets, KV, etc.)
 * - executionContext: Workers context (waitUntil, etc.)
 *
 * @dependencies
 * - @shopify/hydrogen - Request handler and redirects
 * - ~/lib/context - Hydrogen context factory
 * - virtual:react-router/server-build - Vite virtual module
 *
 * @related
 * - ~/lib/context.ts - Creates Hydrogen context
 * - entry.server.tsx - SSR handler called by request handler
 * - vite.config.ts - Configures the virtual server build
 *
 * @deployment
 * Deployed to Shopify Oxygen (oxygen.myshopify.com)
 * Or self-hosted Cloudflare Workers
 */

import {createRequestHandler, storefrontRedirect} from "@shopify/hydrogen";
import {createHydrogenRouterContext} from "~/lib/context";
import {handleAgentSearchRequest, handleAgentProductRequest} from "~/lib/agentic/agent-server";
import {isAgentRequest} from "~/lib/agentic/agent-request";
// eslint-disable-next-line import/no-unresolved
import * as serverBuild from "virtual:react-router/server-build";

// =============================================================================
// FETCH HANDLER
// =============================================================================

/**
 * Workers fetch handler - main entry point for all requests.
 *
 * This is the standard Cloudflare Workers fetch handler format.
 * Every HTTP request to the storefront goes through this function.
 */
export default {
    /**
     * Handle incoming HTTP request.
     *
     * @param request - Incoming HTTP request
     * @param env - Environment bindings (SESSION_SECRET, etc.)
     * @param executionContext - Workers execution context
     *
     * @returns HTTP Response (streamed HTML, JSON, or redirect)
     */
    async fetch(request: Request, env: Env, executionContext: ExecutionContext): Promise<Response> {
        try {
            // -----------------------------------------------------------------
            // CONTEXT INITIALIZATION
            // -----------------------------------------------------------------
            // Create Hydrogen context with storefront client, session, and cart
            const hydrogenContext = await createHydrogenRouterContext(request, env, executionContext);

            // -----------------------------------------------------------------
            // REQUEST HANDLING
            // -----------------------------------------------------------------
            // Create the React Router request handler with Hydrogen context
            // This routes the request to the appropriate route file
            // Agent bypass: intercept before React Router renders HTML.
            // Routes with a default export trigger SSR rendering even when the loader
            // returns a Response — this bypass sends UCP JSON directly to the client.
            const requestUrl = new URL(request.url);
            if (
                requestUrl.pathname === "/search" &&
                requestUrl.searchParams.get("agent") === "true"
            ) {
                return await handleAgentSearchRequest(request, hydrogenContext);
            }
            if (requestUrl.pathname.startsWith("/products/") && isAgentRequest(request)) {
                return await handleAgentProductRequest(request, hydrogenContext);
            }

            const handleRequest = createRequestHandler({
                build: serverBuild,
                mode: process.env.NODE_ENV,
                getLoadContext: () => hydrogenContext
            });

            const response = await handleRequest(request);

            // -----------------------------------------------------------------
            // SESSION COMMIT
            // -----------------------------------------------------------------
            // If session data changed, commit it to the cookie.
            // Use append (not set) to avoid clobbering other Set-Cookie headers.
            if (hydrogenContext.session.isPending) {
                response.headers.append("Set-Cookie", await hydrogenContext.session.commit());
            }

            // -----------------------------------------------------------------
            // REDIRECT HANDLING
            // -----------------------------------------------------------------
            // For 404 responses, check if Shopify has a redirect configured
            // This handles URL changes, deleted products, etc.
            if (response.status === 404) {
                return storefrontRedirect({
                    request,
                    response,
                    storefront: hydrogenContext.storefront
                });
            }

            // -----------------------------------------------------------------
            // AGENT-READABLE HTTP HEADERS
            // -----------------------------------------------------------------
            // Headless agents that skip robots.txt still need a way to discover
            // the UCP discovery endpoint. Set on HTML responses only.
            const contentType = response.headers.get("Content-Type") ?? "";
            if (contentType.includes("text/html")) {
                response.headers.set("X-Agent-Discovery", "/.well-known/ucp");
            }

            return response;
        } catch (error) {
            // -----------------------------------------------------------------
            // ERROR HANDLING
            // -----------------------------------------------------------------
            // Log error and return generic 500 response
            // More detailed error handling could be added here
            console.error(error);
            return new Response("An unexpected error occurred", {
                status: 500,
                headers: {"Content-Type": "text/plain; charset=utf-8"}
            });
        }
    }
};
