/**
 * Structured event emitter for agent commerce observability.
 *
 * Dual target:
 * - console.log (JSON) — consumed by Oxygen's log viewer and Workers Logs
 * - Analytics Engine writeDataPoint — when the AGENT_ANALYTICS binding is present (Workers only)
 *
 * Privacy boundary — this allowlist is exhaustive.
 * Never log: agent name, vendor, email, customer PII, cart contents,
 * full profile JSON, auth tokens, free-text inputs, full URLs with query strings.
 */

export type AgentEventName =
    | "mcp_request"
    | "mcp_tool_call"
    | "mcp_error"
    | "agent_arrival"
    | "jwt_reject"
    | "checkout_handoff"
    | "fallback_shown";

export type ResponseCategory = "ok" | "not_found" | "rate_limited" | "server_error";

export type AgentEvent = {
    evt: AgentEventName;
    /** URL pathname only — no query string, hash, or fragment. */
    route?: string;
    requestType?: "agent" | "human";
    /** First 16 hex chars of SHA-256(agentId + sessionSecret). */
    agentIdHash?: string;
    /** Object.keys(profile) — field names only, never values. */
    profileShape?: string[];
    /** Sorted UCP capability token list. */
    capabilities?: string[];
    responseCategory?: ResponseCategory;
    statusCode?: number;
    durationMs?: number;
    /** Rejection / fallback reason enum — never free-text input. */
    reason?: string;
    /** MCP tool name for tool-call events. */
    toolName?: string;
};

type AnalyticsEngineDataset = {
    writeDataPoint(data: {indexes?: string[]; doubles?: number[]; blobs?: string[]}): void;
};

type ObservabilityEnv = {
    AGENT_ANALYTICS?: AnalyticsEngineDataset;
};

export function emitAgentEvent(
    env: ObservabilityEnv | null | undefined,
    event: AgentEvent
): void {
    try {
        const payload = {ns: "agentic", ts: Date.now(), ...event};
        console.log(JSON.stringify(payload)); // eslint-disable-line no-console

        if (env?.AGENT_ANALYTICS) {
            env.AGENT_ANALYTICS.writeDataPoint({
                indexes: [event.evt],
                doubles: [event.durationMs ?? 0, event.statusCode ?? 0],
                blobs: [
                    event.agentIdHash ?? "anon",
                    event.route ?? "",
                    event.requestType ?? "human",
                    event.responseCategory ?? "ok",
                    event.reason ?? "",
                    event.toolName ?? ""
                ]
            });
        }
    } catch {
        // Observability must never interrupt a request
    }
}

/** Extract pathname-only route string from a Request URL (no query, hash). */
export function routeFromRequest(request: Request): string {
    try {
        return new URL(request.url).pathname;
    } catch {
        return "";
    }
}
