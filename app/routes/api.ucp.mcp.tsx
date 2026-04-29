/**
 * @fileoverview Authenticated Storefront MCP Endpoint
 *
 * @description
 * Authenticated Model Context Protocol (MCP) endpoint providing AI agents with
 * access to full storefront capabilities — product search, catalog browsing,
 * cart management, and checkout initiation. Requires Bearer token authentication
 * to prevent unauthorized automated access.
 *
 * @route POST /api/ucp/mcp
 *
 * @protocol JSON-RPC 2.0 over HTTP POST
 *
 * @authentication Bearer JWT in Authorization header
 *   - Phase 1: validates presence, scheme, structure, and expiry
 *   - Phase 5: full JWKS signature verification
 *
 * @tools
 * Phase 1: empty tool registry (tools/list returns [])
 * Phase 2+: product_search, get_product, get_collection, search_products
 * Phase 3+: cart_create, cart_add_lines, cart_update_lines, cart_remove_lines
 * Phase 4+: checkout_create, checkout_complete
 *
 * @related
 * - api.mcp.tsx - Public Policy & FAQs MCP (no auth)
 * - [.]well-known.ucp.tsx - UCP discovery profile (declares this endpoint)
 * - app/lib/agentic/agent-auth.ts - Bearer token verification
 * - app/lib/agentic/mcp-router.ts - JSON-RPC 2.0 dispatch logic
 * - app/lib/agentic/mcp-tools/storefront/index.ts - Tool registry for this endpoint
 *
 * @see https://shopify.dev/docs/agents/catalog/storefront-mcp
 * @see https://ucp.dev/specification/overview/
 */

import type {Route} from "./+types/api.ucp.mcp";
import {verifyAgentBearer} from "~/lib/agentic/agent-auth";
import {extractAgentContext} from "~/lib/agentic/agent-context";
import {handleMcpRequest} from "~/lib/agentic/mcp-router";
import {storefrontToolRegistry} from "~/lib/agentic/mcp-tools";
import {emitAgentEvent, routeFromRequest} from "~/lib/agentic/observability";
import {agentIdHash} from "~/lib/agentic/agent-id-hash";

const MCP_HEADERS = {
    "Content-Type": "application/json",
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

    // Extract and validate the Bearer token before processing any payload
    const authorization = request.headers.get("Authorization");
    const [scheme, token] = authorization ? authorization.split(" ") : [];
    if (scheme?.toLowerCase() !== "bearer" || !token) {
        return new Response(
            JSON.stringify({
                jsonrpc: "2.0",
                id: null,
                error: {code: -32001, message: "Unauthorized", data: {reason: "Missing or invalid Authorization header"}}
            }),
            {status: 401, headers: {...MCP_HEADERS, "WWW-Authenticate": 'Bearer realm="storefront-mcp"'}}
        );
    }

    const env = context.env as unknown as Record<string, string | undefined>;
    // Typed env for observability — safe since AGENT_ANALYTICS is declared in env.d.ts
    const observabilityEnv = context.env as Env;
    const authResult = await verifyAgentBearer(token, {
        jwksUrl: env["JWKS_URL"],
        expectedAudience: env["PUBLIC_STORE_DOMAIN"] ?? "",
        permissive: env["IS_PORTFOLIO_DEMO"] === "true"
    });
    if (!authResult.ok) {
        emitAgentEvent(observabilityEnv, {
            evt: "jwt_reject",
            route: routeFromRequest(request),
            requestType: "agent",
            reason: authResult.reason,
            responseCategory: "server_error",
            statusCode: 401
        });
        return new Response(
            JSON.stringify({
                jsonrpc: "2.0",
                id: null,
                error: {code: -32001, message: "Unauthorized", data: {reason: authResult.reason}}
            }),
            {
                status: 401,
                headers: {...MCP_HEADERS, "WWW-Authenticate": 'Bearer realm="storefront-mcp"'}
            }
        );
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

    // Extract optional agent identity context from payload metadata
    const agentCtx = extractAgentContext(payload, context);
    const sessionSecret = env["SESSION_SECRET"] ?? "";
    const idHash = await agentIdHash(agentCtx?.profile?.id, sessionSecret);
    const profileShape = agentCtx?.profile
        ? Object.keys(agentCtx.profile).filter(k => agentCtx.profile[k as keyof typeof agentCtx.profile] !== undefined)
        : [];

    emitAgentEvent(observabilityEnv, {
        evt: "mcp_request",
        route: routeFromRequest(request),
        requestType: "agent",
        agentIdHash: idHash,
        profileShape,
        capabilities: agentCtx?.profile?.capabilities?.slice().sort(),
        responseCategory: "ok",
        statusCode: 200
    });

    const result = await handleMcpRequest(payload, storefrontToolRegistry, agentCtx, observabilityEnv);
    return new Response(JSON.stringify(result), {status: 200, headers: MCP_HEADERS});
}
