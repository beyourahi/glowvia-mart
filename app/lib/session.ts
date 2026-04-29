/**
 * @fileoverview Custom Session Implementation for Hydrogen
 *
 * @description
 * Implements a cookie-based session that integrates with Shopify Hydrogen.
 * The session stores user state like cart ID, customer access tokens,
 * flash messages, and other per-user data. Uses React Router's cookie
 * session storage under the hood.
 *
 * @architecture
 * - Cookie-based: Session data is stored in an encrypted cookie
 * - Lazy commit: Changes are batched until commit() is called
 * - Hydrogen-compatible: Implements HydrogenSession interface
 *
 * @security
 * - httpOnly: Cookie not accessible via JavaScript
 * - sameSite: lax (CSRF protection)
 * - Encrypted with SESSION_SECRET
 *
 * @dependencies
 * - @shopify/hydrogen - HydrogenSession interface
 * - react-router - Session storage implementation
 *
 * @related
 * - context.ts - Creates session instance per request
 * - server.ts - Commits session changes in response headers
 *
 * @example
 * ```typescript
 * // In a route loader
 * const cartId = context.session.get('cartId');
 * context.session.set('cartId', newCartId);
 * // Session is committed automatically by Hydrogen
 * ```
 */

import type {HydrogenSession} from "@shopify/hydrogen";
import {createCookieSessionStorage, type SessionStorage, type Session} from "react-router";

// =============================================================================
// SESSION CLASS
// =============================================================================

/**
 * Custom session implementation for the Hydrogen storefront.
 *
 * Wraps React Router's session storage with the HydrogenSession interface.
 * Tracks pending changes via `isPending` flag to optimize commit operations.
 *
 * @implements HydrogenSession
 *
 * @example
 * ```typescript
 * // Initialize in context
 * const session = await AppSession.init(request, [env.SESSION_SECRET]);
 *
 * // Use in routes
 * session.set('key', 'value');
 * const value = session.get('key');
 *
 * // Commit changes
 * const setCookieHeader = await session.commit();
 * ```
 */
export class AppSession implements HydrogenSession {
    /**
     * Flag indicating if session has uncommitted changes.
     * Used by Hydrogen to determine if Set-Cookie header is needed.
     */
    public isPending = false;

    /** Private storage instance for cookie operations */
    #sessionStorage;

    /** Private session instance holding current data */
    #session;

    /**
     * Private constructor - use AppSession.init() instead.
     *
     * @param sessionStorage - React Router session storage instance
     * @param session - Current session data
     */
    constructor(sessionStorage: SessionStorage, session: Session) {
        this.#sessionStorage = sessionStorage;
        this.#session = session;
    }

    /**
     * Factory method to create a new session instance.
     *
     * Reads existing session from Cookie header or creates a new one.
     * Configures cookie settings for security (httpOnly, sameSite).
     *
     * @param request - Incoming HTTP request with Cookie header
     * @param secrets - Array of secrets for cookie signing (first is active)
     *
     * @returns Promise resolving to initialized AppSession
     */
    static async init(request: Request, secrets: string[]) {
        // Create cookie-based session storage with secure defaults
        const storage = createCookieSessionStorage({
            cookie: {
                name: "session", // Cookie name in browser
                httpOnly: true, // Not accessible via JavaScript (XSS protection)
                path: "/", // Available on all routes
                sameSite: "lax", // CSRF protection while allowing navigation
                secrets // Used for signing/encrypting cookie value
            }
        });

        // Try to read existing session from Cookie header
        // Falls back to new empty session if parsing fails
        const session = await storage.getSession(request.headers.get("Cookie")).catch(() => storage.getSession());

        return new this(storage, session);
    }

    // -------------------------------------------------------------------------
    // SESSION ACCESS METHODS
    // -------------------------------------------------------------------------
    // These getters proxy to the underlying React Router session

    /**
     * Check if a key exists in session.
     * @returns Function to check key existence
     */
    get has() {
        return this.#session.has;
    }

    /**
     * Get a value from session.
     * @returns Function to retrieve value by key
     */
    get get() {
        return this.#session.get;
    }

    /**
     * Get a flash value (auto-deleted after read).
     * Useful for one-time messages like "Item added to cart".
     * @returns Function to get/set flash values
     */
    get flash() {
        return this.#session.flash;
    }

    // -------------------------------------------------------------------------
    // SESSION MUTATION METHODS
    // -------------------------------------------------------------------------
    // These mark session as pending to trigger commit

    /**
     * Remove a key from session.
     * Marks session as pending (needs commit).
     * @returns Function to unset key
     */
    get unset() {
        this.isPending = true;
        return this.#session.unset;
    }

    /**
     * Set a value in session.
     * Marks session as pending (needs commit).
     * @returns Function to set key-value pair
     */
    get set() {
        this.isPending = true;
        return this.#session.set;
    }

    // -------------------------------------------------------------------------
    // SESSION LIFECYCLE METHODS
    // -------------------------------------------------------------------------

    /**
     * Destroy the session completely.
     * Returns a Set-Cookie header to clear the cookie.
     *
     * @returns Promise<string> Set-Cookie header value
     */
    destroy() {
        return this.#sessionStorage.destroySession(this.#session);
    }

    /**
     * Commit session changes to cookie.
     * Clears isPending flag and returns Set-Cookie header.
     *
     * @returns Promise<string> Set-Cookie header value
     */
    commit() {
        this.isPending = false;
        return this.#sessionStorage.commitSession(this.#session);
    }
}

// Typed session keys for agent arrival state (Phase 5b)
export const AGENT_SESSION_ID_KEY = "agentSessionId" as const;
export const AGENT_ARRIVAL_AT_KEY = "agentArrivalAt" as const;
