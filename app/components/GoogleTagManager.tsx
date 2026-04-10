/**
 * @fileoverview Google Tag Manager Analytics Component
 *
 * @description
 * Subscribes to Shopify Hydrogen's built-in analytics events and forwards them to
 * Google Tag Manager's dataLayer for tracking. Implements Google Analytics 4 (GA4)
 * e-commerce event structure for page views, product views, cart actions, and search.
 *
 * @related
 * - ~/components/GtmScript - Loads GTM script tags and initializes dataLayer
 * - ~/root - Renders GoogleTagManager inside Analytics.Provider
 */

import {useAnalytics} from "@shopify/hydrogen";
import {useEffect} from "react";

// ================================================================================
// Type Definitions
// ================================================================================

// ================================================================================
// GTM Analytics Component
// ================================================================================

/**
 * GoogleTagManager - Forwards Hydrogen analytics events to GTM dataLayer
 *
 * This component doesn't render any UI - it only sets up event subscriptions.
 * Should be rendered inside Hydrogen's Analytics.Provider.
 *
 * Events tracked:
 * - page_view: All page navigations
 * - view_item: Product detail page views
 * - view_item_list: Collection/category page views
 * - view_cart: Cart opened/viewed
 * - add_to_cart / remove_from_cart: Cart item changes
 * - search: Search queries
 * - custom_*: Any custom events
 *
 * @returns null - This component has no visual output
 */
export function GoogleTagManager() {
    const {subscribe, register} = useAnalytics();
    const {ready} = register("Google Tag Manager");

    useEffect(() => {
        // Page view tracking - fires on every navigation
        subscribe("page_viewed", data => {
            window.dataLayer?.push({
                event: "page_view",
                page_location: data.url,
                page_title: document.title
            });
        });

        // Product view tracking (PDP) - fires when a product page is viewed
        subscribe("product_viewed", data => {
            window.dataLayer?.push({
                event: "view_item",
                ecommerce: {
                    items: data.products?.map((product: Record<string, unknown>) => ({
                        item_id: product.id,
                        item_name: product.title,
                        item_variant: product.variantTitle,
                        price: parseFloat(String(product.price || "0")),
                        quantity: product.quantity
                    }))
                }
            });
        });

        // Collection/category view tracking
        subscribe("collection_viewed", data => {
            window.dataLayer?.push({
                event: "view_item_list",
                ecommerce: {
                    item_list_id: data.collection?.id,
                    item_list_name: data.collection?.handle
                }
            });
        });

        // Cart viewed tracking - fires when cart is opened
        subscribe("cart_viewed", data => {
            const cart = data.cart as Record<string, unknown> | undefined;
            const cost = cart?.cost as Record<string, unknown> | undefined;
            const totalAmount = cost?.totalAmount as Record<string, unknown> | undefined;
            const lines = cart?.lines as Record<string, unknown> | undefined;
            const nodes = lines?.nodes as Record<string, unknown>[] | undefined;

            window.dataLayer?.push({
                event: "view_cart",
                ecommerce: {
                    currency: totalAmount?.currencyCode,
                    value: parseFloat(String(totalAmount?.amount || "0")),
                    items: nodes?.map(line => {
                        const merchandise = line.merchandise as Record<string, unknown> | undefined;
                        const product = merchandise?.product as Record<string, unknown> | undefined;
                        const lineCost = line.cost as Record<string, unknown> | undefined;
                        const lineTotal = lineCost?.totalAmount as Record<string, unknown> | undefined;

                        return {
                            item_id: product?.id,
                            item_name: product?.title,
                            item_variant: merchandise?.title,
                            price: parseFloat(String(lineTotal?.amount || "0")),
                            quantity: line.quantity
                        };
                    })
                }
            });
        });

        // Cart updated (add/remove/quantity change)
        // Uses per-item delta comparison to fire accurate add_to_cart / remove_from_cart
        // events even when items are both added and removed in the same cart update.
        subscribe("cart_updated", data => {
            const prevCart = data.prevCart as Record<string, unknown> | undefined;
            const cart = data.cart as Record<string, unknown> | undefined;

            const prevLines = prevCart?.lines as Record<string, unknown> | undefined;
            const prevNodes = (prevLines?.nodes as Record<string, unknown>[]) || [];

            const currLines = cart?.lines as Record<string, unknown> | undefined;
            const currNodes = (currLines?.nodes as Record<string, unknown>[]) || [];

            const cost = cart?.cost as Record<string, unknown> | undefined;
            const totalAmount = cost?.totalAmount as Record<string, unknown> | undefined;
            const currency = totalAmount?.currencyCode;

            // Build quantity maps keyed by line ID for per-item comparison
            const prevMap = new Map(prevNodes.map(l => [l.id as string, Number(l.quantity) || 0]));
            const currMap = new Map(currNodes.map(l => [l.id as string, Number(l.quantity) || 0]));

            const formatLineItem = (line: Record<string, unknown>, quantity: number) => {
                const merchandise = line.merchandise as Record<string, unknown> | undefined;
                const product = merchandise?.product as Record<string, unknown> | undefined;
                const lineCost = line.cost as Record<string, unknown> | undefined;
                const lineTotal = lineCost?.totalAmount as Record<string, unknown> | undefined;
                return {
                    item_id: product?.id,
                    item_name: product?.title,
                    item_variant: merchandise?.title,
                    price: parseFloat(String(lineTotal?.amount || "0")),
                    quantity
                };
            };

            // Detect added items: new lines or increased quantity (report delta)
            const addedItems = currNodes
                .map(line => {
                    const prevQty = prevMap.get(line.id as string) || 0;
                    const currQty = Number(line.quantity) || 0;
                    const delta = currQty - prevQty;
                    return delta > 0 ? formatLineItem(line, delta) : null;
                })
                .filter(Boolean);

            // Detect removed items: deleted lines or decreased quantity (report delta)
            const removedItems = prevNodes
                .map(line => {
                    const currQty = currMap.get(line.id as string) || 0;
                    const prevQty = Number(line.quantity) || 0;
                    const delta = prevQty - currQty;
                    return delta > 0 ? formatLineItem(line, delta) : null;
                })
                .filter(Boolean);

            if (addedItems.length > 0) {
                window.dataLayer?.push({
                    event: "add_to_cart",
                    ecommerce: {currency, items: addedItems}
                });
            }

            if (removedItems.length > 0) {
                window.dataLayer?.push({
                    event: "remove_from_cart",
                    ecommerce: {currency, items: removedItems}
                });
            }
        });

        // Search tracking - fires when search results are viewed
        subscribe("search_viewed", data => {
            const searchResults = data.searchResults as Record<string, unknown> | undefined;

            window.dataLayer?.push({
                event: "search",
                search_term: data.searchTerm,
                search_results: searchResults?.totalResults || 0
            });
        });

        // Custom event tracking - catch-all for any custom events
        subscribe("custom_*" as Parameters<typeof subscribe>[0], data => {
            window.dataLayer?.push({
                event: "custom_event",
                ...data
            });
        });

        // Signal that GTM is ready to receive events
        ready();
    }, [ready, subscribe]);

    // This component doesn't render anything visible
    return null;
}
