/* eslint-disable no-console -- Service worker debug logging is intentional and essential for debugging */
/* global workbox, importScripts */
/**
 * Service Worker for Hydrogen PWA
 *
 * Uses Workbox 7.0.0 for intelligent caching strategies optimized for e-commerce.
 * Five distinct strategies balance performance with data freshness.
 *
 * Update flow: New SW installs → skipWaiting → activates immediately → clients claimed
 *
 * @see https://developer.chrome.com/docs/workbox/
 */

// Import Workbox from CDN
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

// Ensure Workbox loaded successfully
if (!workbox) {
    console.error("[SW] Workbox failed to load");
} else {
    console.log("[SW] Workbox loaded successfully");

    // Use workbox modules
    const {registerRoute, setDefaultHandler, setCatchHandler} = workbox.routing;
    const {CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly} = workbox.strategies;
    const {ExpirationPlugin} = workbox.expiration;
    const {CacheableResponsePlugin} = workbox.cacheableResponse;

    // ==========================================================================
    // MANIFEST — always network, never cache (prevents parse errors)
    // Must be registered BEFORE any catch-all strategies that could intercept it.
    // The .webmanifest extension could otherwise match the static assets handler.
    // ==========================================================================
    registerRoute(
        ({url}) => url.pathname === "/manifest.webmanifest",
        new NetworkOnly()
    );

    // ==========================================================================
    // OFFLINE FALLBACK PAGE
    // ==========================================================================
    const OFFLINE_PAGE = "/offline";
    const OFFLINE_CACHE_NAME = "hydrogen-pwa-offline-v1";

    // ==========================================================================
    // CACHE NAMES
    // ==========================================================================
    const CACHE_PREFIX = "hydrogen-pwa";
    const CACHE_VERSION = "v1";

    // ==========================================================================
    // HELPER: Get offline page from cache with robust matching
    // ==========================================================================
    async function getOfflinePage() {
        try {
            // First, try the dedicated offline cache
            const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
            const response = await offlineCache.match(OFFLINE_PAGE, {
                ignoreSearch: true,
                ignoreVary: true
            });
            if (response) {
                console.log("[SW] Serving offline page from dedicated cache");
                return response.clone();
            }

            // Fallback: search all caches with options
            const allCachesResponse = await caches.match(OFFLINE_PAGE, {
                ignoreSearch: true,
                ignoreVary: true
            });
            if (allCachesResponse) {
                console.log("[SW] Serving offline page from general cache search");
                return allCachesResponse.clone();
            }

            console.warn("[SW] Offline page not found in any cache");
            return null;
        } catch (error) {
            console.error("[SW] Error getting offline page:", error);
            return null;
        }
    }

    // ==========================================================================
    // STRATEGY 1: SHOPIFY CDN (Images, Fonts)
    // CacheFirst - Aggressive caching for static assets on Shopify CDN
    // ==========================================================================
    registerRoute(
        ({url}) => url.hostname === "cdn.shopify.com",
        new CacheFirst({
            cacheName: `${CACHE_PREFIX}-shopify-cdn-${CACHE_VERSION}`,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 200,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    purgeOnQuotaError: true
                })
            ]
        })
    );

    // ==========================================================================
    // STRATEGY 2: GOOGLE FONTS
    // StaleWhileRevalidate - Serve cached, update in background
    // Fonts are immutable, so aggressive caching is safe
    // ==========================================================================

    // Google Fonts stylesheets
    registerRoute(
        ({url}) => url.hostname === "fonts.googleapis.com",
        new StaleWhileRevalidate({
            cacheName: `${CACHE_PREFIX}-google-fonts-stylesheets-${CACHE_VERSION}`,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 30,
                    maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                })
            ]
        })
    );

    // Google Fonts webfonts (actual font files)
    registerRoute(
        ({url}) => url.hostname === "fonts.gstatic.com",
        new CacheFirst({
            cacheName: `${CACHE_PREFIX}-google-fonts-webfonts-${CACHE_VERSION}`,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 30,
                    maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                })
            ]
        })
    );

    // ==========================================================================
    // STRATEGY 3: STATIC ASSETS (JS, CSS)
    // StaleWhileRevalidate - Fast serving with background updates
    // Hashed filenames handle cache busting automatically
    // ==========================================================================
    registerRoute(
        ({request, url}) =>
            request.destination === "script" ||
            request.destination === "style" ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css"),
        new StaleWhileRevalidate({
            cacheName: `${CACHE_PREFIX}-static-assets-${CACHE_VERSION}`,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    purgeOnQuotaError: true
                })
            ]
        })
    );

    // ==========================================================================
    // STRATEGY 4: HTML PAGES (Navigation)
    // NetworkFirst - Prefer fresh content, fallback to cache
    // 3 second timeout before falling back to cache
    // ==========================================================================

    // Exclude sensitive routes from caching
    const SENSITIVE_ROUTES = [
        /^\/cart/,
        /^\/checkout/,
        /^\/account/,
        /^\/api\//,
        /^\/search\?/ // Search with query params
    ];

    const isSensitiveRoute = url => {
        return SENSITIVE_ROUTES.some(pattern => pattern.test(url.pathname + url.search));
    };

    // Navigation requests (HTML pages)
    registerRoute(
        ({request, url}) => request.mode === "navigate" && !isSensitiveRoute(url),
        new NetworkFirst({
            cacheName: `${CACHE_PREFIX}-pages-${CACHE_VERSION}`,
            networkTimeoutSeconds: 3,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                    purgeOnQuotaError: true
                })
            ]
        })
    );

    // ==========================================================================
    // STRATEGY 5: SENSITIVE ROUTES (Cart, Checkout, Account, API)
    // NetworkOnly - NEVER cache sensitive e-commerce operations
    // On failure, serve offline page for navigation requests
    // ==========================================================================
    registerRoute(
        ({request, url}) => request.mode === "navigate" && isSensitiveRoute(url),
        new NetworkOnly({
            plugins: [
                {
                    // When network fails for sensitive routes, serve offline page
                    handlerDidError: async () => {
                        return getOfflinePage();
                    }
                }
            ]
        })
    );

    // Non-navigation sensitive routes (API calls, etc.) - fail silently
    registerRoute(({request, url}) => request.mode !== "navigate" && isSensitiveRoute(url), new NetworkOnly());

    // ==========================================================================
    // DEFAULT HANDLER
    // NetworkFirst for any uncached resources
    // ==========================================================================
    setDefaultHandler(
        new NetworkFirst({
            cacheName: `${CACHE_PREFIX}-default-${CACHE_VERSION}`,
            networkTimeoutSeconds: 3,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60
                })
            ]
        })
    );

    // ==========================================================================
    // GLOBAL CATCH HANDLER
    // Fallback for any request that fails after all strategies are exhausted
    // ==========================================================================
    setCatchHandler(async ({request}) => {
        // Track cache miss for analytics (post message to all clients)
        if (request.mode === "navigate") {
            try {
                const clients = await self.clients.matchAll({type: "window"});
                clients.forEach(client => {
                    client.postMessage({
                        type: "CACHE_MISS",
                        url: request.url
                    });
                });
            } catch {
                // Silent fail - analytics tracking should not block fallback
            }

            // Return the offline page using robust helper
            const offlineResponse = await getOfflinePage();
            if (offlineResponse) {
                return offlineResponse;
            }
        }

        // For other requests (images, etc.), return a generic error
        return Response.error();
    });

    // ==========================================================================
    // SERVICE WORKER LIFECYCLE
    // ==========================================================================

    // Install: Precache offline page and immediately activate (no waiting)
    self.addEventListener("install", event => {
        console.log("[SW] Installing service worker...");
        self.skipWaiting();

        event.waitUntil(
            // Precache the offline fallback page
            caches.open(OFFLINE_CACHE_NAME).then(cache => {
                console.log("[SW] Precaching offline page");
                return cache.add(OFFLINE_PAGE);
            })
        );
    });

    // Activate: Clean up old caches and claim clients
    self.addEventListener("activate", event => {
        console.log("[SW] Activating service worker...");

        event.waitUntil(
            Promise.all([
                // Claim all clients immediately
                self.clients.claim(),

                // Clean up old cache versions
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames
                            .filter(name => name.startsWith(CACHE_PREFIX) && !name.includes(CACHE_VERSION))
                            .map(name => {
                                console.log("[SW] Deleting old cache:", name);
                                return caches.delete(name);
                            })
                    );
                })
            ])
        );
    });

    // Message handler for skip waiting and cache update commands
    self.addEventListener("message", event => {
        if (event.data && event.data.type === "SKIP_WAITING") {
            self.skipWaiting();
        }

        // Handle request to update offline page cache with themed version
        if (event.data && event.data.type === "UPDATE_OFFLINE_CACHE") {
            console.log("[SW] Received UPDATE_OFFLINE_CACHE message");
            event.waitUntil(
                (async () => {
                    try {
                        // Fetch fresh offline page (with theme CSS from SSR)
                        const response = await fetch(OFFLINE_PAGE, {
                            credentials: "same-origin",
                            cache: "reload"
                        });

                        if (response.ok) {
                            // Clear old versions from all caches
                            const cacheNames = await caches.keys();
                            await Promise.all(
                                cacheNames.map(async name => {
                                    const cache = await caches.open(name);
                                    await cache.delete(OFFLINE_PAGE);
                                })
                            );

                            // Store fresh version in dedicated offline cache
                            const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
                            await offlineCache.put(OFFLINE_PAGE, response);
                            console.log("[SW] Offline page cache updated with themed version");

                            // Notify the client that update is complete
                            if (event.source) {
                                event.source.postMessage({type: "OFFLINE_CACHE_UPDATED"});
                            }
                        }
                    } catch (error) {
                        console.error("[SW] Failed to update offline cache:", error);
                    }
                })()
            );
        }
    });
}
/* eslint-enable no-console */
