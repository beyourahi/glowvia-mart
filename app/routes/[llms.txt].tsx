/**
 * @fileoverview AI Transparency Manifest (llms.txt)
 *
 * @description
 * Serves a plain-text manifest following the llms.txt convention, providing AI
 * language models and agents with structured information about this storefront:
 * what it sells, how it works, and which machine-readable interfaces are available.
 *
 * This file serves two audiences:
 * 1. AI crawlers indexing the storefront for search/retrieval
 * 2. Autonomous AI agents discovering capabilities before making API calls
 *
 * @route GET /llms.txt
 *
 * @caching
 * Cached for 1 hour (max-age=3600). Content changes only when store details
 * or API endpoints change, which is infrequent.
 *
 * @content
 * - Store identity (name, description, URL)
 * - What the store sells
 * - MCP endpoints and their capabilities
 * - UCP capability declarations
 * - Usage guidelines for AI agents
 *
 * @robots
 * robots.txt explicitly allows AI crawlers to access /llms.txt
 *
 * @related
 * - [robots.txt].tsx - Declares Allow: /llms.txt for AI crawler bots
 * - [.]well-known.ucp.tsx - Machine-readable UCP profile (JSON)
 * - api.mcp.tsx - Public MCP endpoint (policies & FAQs)
 * - api.ucp.mcp.tsx - Authenticated MCP endpoint (catalog & cart)
 *
 * @see https://llmstxt.org/
 * @see https://shopify.dev/docs/agents
 */

import type {Route} from "./+types/[llms.txt]";

const LLMS_TXT_QUERY = `#graphql
  query LlmsTxtShopInfo($country: CountryCode, $language: LanguageCode)
   @inContext(country: $country, language: $language) {
    shop {
      name
      description
      primaryDomain {
        url
      }
    }
  }
` as const;

export async function loader({request, context}: Route.LoaderArgs) {
    const url = new URL(request.url);
    const origin = url.origin;

    const {shop} = await context.dataAdapter.query(LLMS_TXT_QUERY, {
        cache: context.dataAdapter.CacheShort()
    });

    const storeName = shop?.name ?? "This Store";
    const storeDescription = shop?.description ?? "An online storefront built on Shopify.";
    const storeUrl = shop?.primaryDomain?.url ?? origin;

    const body = buildLlmsTxt({
        storeName,
        storeDescription,
        storeUrl,
        origin
    });

    return new Response(body, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=18000"
        }
    });
}

function buildLlmsTxt({
    storeName,
    storeDescription,
    storeUrl,
    origin
}: {
    storeName: string;
    storeDescription: string;
    storeUrl: string;
    origin: string;
}): string {
    return `# ${storeName}

> ${storeDescription}

This is a Shopify-powered e-commerce storefront. It sells physical products online and supports agentic shopping workflows via Shopify's Universal Commerce Protocol (UCP) and Model Context Protocol (MCP).

## Store

- **URL**: ${storeUrl}
- **Platform**: Shopify Hydrogen (React)
- **API Version**: 2026-04 (Shopify Storefront API)

## For AI Agents

This storefront exposes machine-readable interfaces for autonomous shopping agents:

### UCP Discovery

The full capability profile is available at:

    GET ${origin}/.well-known/ucp

This JSON document declares all supported MCP endpoints, capabilities, and auth requirements.

### MCP Endpoints

**Storefront MCP** (authenticated) — product search, catalog browsing, cart, checkout:

    POST ${origin}/api/ucp/mcp
    Authorization: Bearer <jwt>

Capabilities: dev.ucp.shopping.discovery, dev.shopify.catalog.storefront, dev.ucp.shopping.checkout

**Policies MCP** (public) — shipping & return policies, FAQ answers, contact info:

    POST ${origin}/api/mcp

Capabilities: dev.ucp.shopping.policies

Both endpoints implement JSON-RPC 2.0. Send \`{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\` to discover available tools.

## Sitemap

    ${origin}/sitemap.xml

## Crawling Guidelines

- Products, collections, blogs, and pages are publicly indexable
- Cart, checkout, and account pages are private — do not crawl
- Respect crawl-delay directives in robots.txt
- Prefer MCP tool calls over page scraping for structured data
`.trim();
}
