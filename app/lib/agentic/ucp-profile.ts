/**
 * @fileoverview UCP Capability Profile Builder
 *
 * Constructs the machine-readable `UcpProfile` served at `GET /.well-known/ucp`.
 * The profile advertises the storefront's agent capabilities: catalog discovery,
 * policy lookup, and the checkout handoff pattern (via cart permalink or MCP preview).
 *
 * All URLs are derived from `PUBLIC_STORE_DOMAIN` so the profile is correct for
 * both Oxygen deployments (real store domain) and Cloudflare Workers portfolio
 * deployments (where the domain may differ from the demo store).
 */

import type {UcpProfile} from "./types";

/**
 * Build the UCP capability profile for the `/.well-known/ucp` discovery endpoint.
 *
 * @param env - Environment variables (reads `PUBLIC_STORE_DOMAIN`)
 * @param _request - Incoming request (reserved for future per-request customization)
 */
export function buildUcpProfile(env: Record<string, string | undefined>, _request: Request): UcpProfile {
    const storeDomain = env.PUBLIC_STORE_DOMAIN ?? "";
    const storeUrl = storeDomain ? `https://${storeDomain}` : "";

    const ucpMcpUrl = storeUrl ? `${storeUrl}/api/ucp/mcp` : "/api/ucp/mcp";
    const policiesMcpUrl = storeUrl ? `${storeUrl}/api/mcp` : "/api/mcp";

    return {
        ucp: {
            version: "2026-04-08",
            services: {
                storefront_mcp: {
                    url: ucpMcpUrl,
                    protocol: "mcp",
                    auth: "bearer"
                },
                policies_mcp: {
                    url: policiesMcpUrl,
                    protocol: "mcp"
                }
            },
            capabilities: {
                // Catalog discovery via Storefront MCP — GA
                "dev.ucp.shopping.discovery": [{
                    version: "2026-04-08",
                    spec: "https://ucp.dev/specification/discovery/",
                    mcp_server: ucpMcpUrl
                }],
                // Storefront Catalog Extension (gift cards, collections, selling plans) — GA
                "dev.shopify.catalog.storefront": [{
                    version: "2026-04-08",
                    spec: "https://shopify.dev/docs/agents/catalog/storefront-mcp"
                }],
                // Policy & FAQs discovery — no auth required
                "dev.ucp.shopping.policies": [{
                    version: "2026-04-08",
                    spec: "https://ucp.dev/specification/policies/",
                    mcp_server: policiesMcpUrl
                }],
                // Checkout MCP — Shopify-hosted, limited-partner preview as of 2026-04.
                // Agents should call {shop}.myshopify.com/api/mcp for cart mutations
                // (add_to_cart, update_cart, get_cart) — Shopify hosts these natively.
                // For URL-based handoff, use the cart_permalink_pattern documented below.
                "dev.ucp.shopping.checkout": [{
                    version: "2026-04-08",
                    spec: "https://ucp.dev/specification/checkout/",
                    status: "preview",
                    mcp_server: storeUrl ? `${storeUrl}/api/mcp` : undefined,
                    cart_permalink_pattern: storeUrl ? `${storeUrl}/cart/{variant_id}:{quantity}[,{variant_id}:{quantity}...]` : undefined
                }]
            }
        }
    };
}
