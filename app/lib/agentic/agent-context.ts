/**
 * @fileoverview Agent Context Extraction
 *
 * Extracts the `AgentContext` from a raw MCP request body by reading the
 * `meta["ucp-agent"].profile` field. Returns null for non-agent requests
 * (missing meta or profile) so callers can treat null as a standard shopper context.
 */

import type {AgentContext, AgentProfile} from "./types";
import type {DataAdapter, StorefrontLike} from "~/lib/data-source";

/** Hydrogen context fields required to build an `AgentContext`. */
type HydrogenCtx = {
    storefront: StorefrontLike;
    dataAdapter: DataAdapter;
};

/**
 * Extract an `AgentContext` from a raw JSON-RPC request body.
 *
 * Reads `body.meta["ucp-agent"].profile` and attaches storefront/dataAdapter
 * from the Hydrogen context. Returns null if the body is not an agent request.
 *
 * @param body - Parsed MCP request body
 * @param hydrogenCtx - Hydrogen storefront and data adapter bindings
 */
export function extractAgentContext(body: unknown, hydrogenCtx: HydrogenCtx): AgentContext {
    if (!body || typeof body !== "object") return null;

    const req = body as Record<string, unknown>;
    const meta = req.meta as Record<string, unknown> | undefined;
    if (!meta) return null;

    const ucpAgent = meta["ucp-agent"] as Record<string, unknown> | undefined;
    if (!ucpAgent) return null;

    const rawProfile = ucpAgent.profile as AgentProfile | undefined;
    if (!rawProfile) return null;

    const profile: AgentProfile = {
        ...rawProfile,
        class: rawProfile.class ?? "unknown"
    };

    return {
        isAgent: true,
        profile,
        storefront: hydrogenCtx.storefront,
        dataAdapter: hydrogenCtx.dataAdapter,
    };
}
