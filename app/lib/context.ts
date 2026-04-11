/**
 * @fileoverview Hydrogen Context Factory for React Router 7
 *
 * @description
 * Creates the core Hydrogen context that powers the entire storefront.
 * This context provides access to:
 * - Storefront API client for GraphQL queries
 * - Customer Account API client for authenticated operations
 * - Cart state management (optimistic updates, mutations)
 * - Session handling (cookie-based)
 * - i18n configuration
 *
 * @architecture
 * This file is called once per request in server.ts. The returned context
 * is passed to React Router's `getLoadContext` and becomes available in
 * all route loaders and actions via `context.storefront`, `context.cart`, etc.
 *
 * @flow
 * 1. Request arrives at server.ts
 * 2. createHydrogenRouterContext() is called with request/env/executionContext
 * 3. Context initializes cache, session, and Hydrogen clients
 * 4. Context is passed to route handlers
 *
 * @dependencies
 * - @shopify/hydrogen - Provides createHydrogenContext
 * - ~/lib/session - Custom session implementation
 * - ~/lib/fragments - GraphQL fragments for cart queries
 *
 * @related
 * - server.ts - Calls this function on every request
 * - root.tsx - Uses context for initial data loading
 * - All route files - Access context in loaders/actions
 *
 * @environment
 * Requires SESSION_SECRET environment variable to be set.
 */

import {createHydrogenContext} from "@shopify/hydrogen";
import {AppSession} from "~/lib/session";
import {CART_QUERY_FRAGMENT} from "~/lib/fragments";
import {createDataAdapter, type DataAdapter} from "~/lib/data-source";
import {STORE_I18N} from "~/lib/store-locale";

// =============================================================================
// ADDITIONAL CONTEXT CONFIGURATION
// =============================================================================

/**
 * Additional context properties beyond Hydrogen's defaults.
 *
 * Use this object to add custom integrations that should be available
 * throughout the application. Examples:
 * - CMS client for content management
 * - Reviews API client
 * - Third-party SDK instances
 *
 * Properties added here will be available as:
 * - context.propertyName (direct access)
 * - context.get(propertyContext) (typed retrieval)
 */
const additionalContext = {
    // Additional context for custom properties, CMS clients, 3P SDKs, etc.
    // These will be available as both context.propertyName and context.get(propertyContext)
    // Example of complex objects that could be added:
    // cms: await createCMSClient(env),
    // reviews: await createReviewsClient(env),
} as const;

// =============================================================================
// TYPE AUGMENTATION
// =============================================================================

/**
 * TypeScript declaration merging to extend Hydrogen's context type.
 * This makes custom properties type-safe throughout the codebase.
 */
type AdditionalContextType = typeof additionalContext;

declare global {
    interface HydrogenAdditionalContext extends AdditionalContextType {
        dataAdapter: DataAdapter;
    }
}

// =============================================================================
// CONTEXT FACTORY
// =============================================================================

/**
 * Creates the Hydrogen context for React Router 7.9.x.
 *
 * This is the main factory function called on every request. It initializes:
 * - Cloudflare Workers cache for API response caching
 * - Cookie-based session for user state
 * - Storefront API client with proper authentication
 * - Customer Account API client
 * - Cart management with custom query fragment
 *
 * @param request - Incoming HTTP request
 * @param env - Cloudflare Workers environment bindings (secrets, KV, etc.)
 * @param executionContext - Workers execution context (for waitUntil)
 *
 * @returns HydrogenContext with storefront, cart, session, and custom properties
 *
 * @throws Error if SESSION_SECRET environment variable is not set
 *
 * @example
 * ```typescript
 * // In server.ts
 * const hydrogenContext = await createHydrogenRouterContext(request, env, ctx);
 * const response = await handleRequest(request, hydrogenContext);
 * ```
 */
export async function createHydrogenRouterContext(request: Request, env: Env, executionContext: ExecutionContext) {
    // -------------------------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------------------------
    // SESSION_SECRET is required for secure cookie signing
    if (!env?.SESSION_SECRET) {
        throw new Error("SESSION_SECRET environment variable is not set");
    }

    // -------------------------------------------------------------------------
    // INITIALIZATION
    // -------------------------------------------------------------------------
    // Bind waitUntil for background tasks (cache writes, analytics, etc.)
    const waitUntil = executionContext.waitUntil.bind(executionContext);

    // Initialize cache and session in parallel for faster startup
    const [cache, session] = await Promise.all([
        // Cloudflare Workers cache API for Storefront API response caching
        caches.open("hydrogen"),
        // Custom cookie session with the provided secret
        AppSession.init(request, [env.SESSION_SECRET])
    ]);

    // -------------------------------------------------------------------------
    // CONTEXT CREATION
    // -------------------------------------------------------------------------
    const hydrogenContext = createHydrogenContext(
        {
            env,
            request,
            cache,
            waitUntil,
            session,
            // i18n configuration - permanently fixed to English/Bangladesh
            i18n: STORE_I18N,
            // Cart configuration with custom query fragment
            // The fragment defines what cart data is fetched on every query
            cart: {
                queryFragment: CART_QUERY_FRAGMENT
            },
            // 2026.1.4: log a warning instead of throwing when an OAuth tunnel
            // domain (ngrok, local HTTPS proxy) is used during development
            customerAccount: {
                useCustomAuthDomain: process.env.NODE_ENV === "development"
            }
        },
        // Merge in any additional context properties (CMS, reviews, etc.)
        additionalContext
    );

    const dataAdapter = createDataAdapter(hydrogenContext.storefront, env);

    return Object.assign(hydrogenContext, {dataAdapter});
}
