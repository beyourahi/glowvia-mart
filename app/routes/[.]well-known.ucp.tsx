import type {Route} from "./+types/[.]well-known.ucp";

// UCP merchant profile — declares this storefront's supported agentic commerce capabilities
// to AI agents during UCP discovery/capability negotiation.
// Spec: https://ucp.dev/specification/overview/
// Shopify profiles: https://shopify.dev/docs/agents/profiles
export const loader = async ({request, context}: Route.LoaderArgs) => {
    const storeDomain = context.env?.PUBLIC_STORE_DOMAIN ?? "";
    const storeUrl = storeDomain ? `https://${storeDomain}` : "";

    const profile = {
        ucp: {
            version: "2026-04-08",
            services: {
                // Storefront MCP — GA, no auth required
                // Docs: https://shopify.dev/docs/agents/catalog/storefront-mcp
                storefront_mcp: {
                    url: storeUrl ? `${storeUrl}/api/mcp` : "/api/mcp",
                    protocol: "mcp"
                }
            },
            capabilities: {
                // Discovery via Storefront MCP — GA
                "dev.ucp.shopping.discovery": [{
                    version: "2026-04-08",
                    spec: "https://ucp.dev/specification/discovery/",
                    mcp_server: storeUrl ? `${storeUrl}/api/mcp` : "/api/mcp"
                }],
                // Checkout MCP — limited-partner preview as of 2026-04
                // TODO: Promote to GA when Checkout MCP exits preview
                // Docs: https://shopify.dev/docs/agents/checkout/mcp
                "dev.ucp.shopping.checkout": [{
                    version: "2026-04-08",
                    spec: "https://ucp.dev/specification/checkout/",
                    status: "preview"
                }]
            }
        }
    };

    return new Response(JSON.stringify(profile), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=18000"
        }
    });
};
