/**
 * @fileoverview UCP Merchant Profile Endpoint
 *
 * @description
 * Serves the Universal Commerce Protocol (UCP) merchant profile at the standard
 * well-known URI. AI agents and shopping assistants fetch this document during
 * capability negotiation to discover what agentic commerce interfaces this
 * storefront supports.
 *
 * @route GET /.well-known/ucp
 *
 * @protocol UCP (Universal Commerce Protocol) — Shopify spec
 *
 * @caching
 * Cached for 1 hour (max-age=3600) with a 5-hour stale-while-revalidate window.
 * This is a relatively stable document — endpoint URLs and capabilities rarely change.
 *
 * @capabilities
 * - dev.ucp.shopping.discovery: Catalog discovery via Storefront MCP (GA)
 * - dev.shopify.catalog.storefront: Extended catalog tools (gift cards, selling plans) (GA)
 * - dev.ucp.shopping.policies: Policy & FAQ access via public MCP (GA)
 * - dev.ucp.shopping.checkout: Checkout MCP (limited-partner preview)
 *
 * @services
 * - storefront_mcp: POST /api/ucp/mcp — authenticated, Bearer JWT
 * - policies_mcp: POST /api/mcp — public, no auth
 *
 * @related
 * - api.ucp.mcp.tsx - Authenticated Storefront MCP endpoint
 * - api.mcp.tsx - Public Policy & FAQs MCP endpoint
 * - app/lib/agentic/ucp-profile.ts - Profile construction logic
 * - [llms.txt].tsx - Human-readable AI transparency manifest
 * - [robots.txt].tsx - Declares Allow: /.well-known/ucp for AI crawlers
 *
 * @see https://ucp.dev/specification/overview/
 * @see https://shopify.dev/docs/agents/profiles
 */

import type {Route} from "./+types/[.]well-known.ucp";
import {buildUcpProfile} from "~/lib/agentic/ucp-profile";

export function loader({request, context}: Route.LoaderArgs) {
    const profile = buildUcpProfile(context.env as unknown as Record<string, string | undefined> ?? {}, request);

    return new Response(JSON.stringify(profile), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=18000"
        }
    });
}
