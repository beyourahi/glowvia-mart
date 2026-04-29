/**
 * @fileoverview Policy & FAQs MCP Endpoint
 *
 * @description
 * Public Model Context Protocol (MCP) endpoint providing AI agents with access
 * to storefront policy and FAQ tools. No authentication required — this endpoint
 * exposes only publicly available information (shipping policies, return policies,
 * FAQ answers) that would be visible to any site visitor.
 *
 * @route POST /api/mcp
 *
 * @protocol JSON-RPC 2.0 over HTTP POST
 *
 * @authentication None — public endpoint, consumer-grade access
 *
 * @tools
 * Phase 3: search_shop_policies_and_faqs (policy + FAQ search)
 *
 * @related
 * - api.ucp.mcp.tsx - Authenticated Storefront MCP (products, cart, checkout)
 * - [.]well-known.ucp.tsx - UCP discovery profile (declares this endpoint)
 * - app/lib/agentic/mcp-router.ts - JSON-RPC 2.0 dispatch logic
 * - app/lib/agentic/mcp-tools/policies/index.ts - Tool registry for this endpoint
 *
 * @see https://spec.modelcontextprotocol.io/specification/
 */

import type {Route} from "./+types/api.mcp";
import {handleMcpRequest} from "~/lib/agentic/mcp-router";
import {policiesToolRegistry} from "~/lib/agentic/mcp-tools";
import {emitAgentEvent, routeFromRequest} from "~/lib/agentic/observability";

const MCP_HEADERS = {
    "Content-Type": "application/json",
    // No caching — MCP responses are dynamic
    "Cache-Control": "no-store"
} as const;

export async function action({request, context}: Route.ActionArgs) {
    // Only accept POST
    if (request.method !== "POST") {
        return new Response(JSON.stringify({error: "Method Not Allowed"}), {
            status: 405,
            headers: {...MCP_HEADERS, Allow: "POST"}
        });
    }

    // Parse JSON-RPC payload
    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return new Response(
            JSON.stringify({
                jsonrpc: "2.0",
                id: null,
                error: {code: -32700, message: "Parse error"}
            }),
            {status: 400, headers: MCP_HEADERS}
        );
    }

    // Build a minimal AgentContext from the Hydrogen context so tool handlers
    // can issue Storefront API queries (policies are public — no auth required).
    const agentCtx = {
        isAgent: true as const,
        profile: {},
        storefront: context.storefront,
        dataAdapter: context.dataAdapter
    };

    emitAgentEvent(context.env as Env, {
        evt: "mcp_request",
        route: routeFromRequest(request),
        requestType: "human",
        responseCategory: "ok",
        statusCode: 200
    });

    const result = await handleMcpRequest(payload, policiesToolRegistry, agentCtx, context.env as Env);
    return new Response(JSON.stringify(result), {status: 200, headers: MCP_HEADERS});
}
