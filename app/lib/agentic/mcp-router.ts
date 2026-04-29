import type {JsonRpcRequest, JsonRpcResponse, McpToolRegistry, AgentContext} from "./types";
import {emitAgentEvent} from "./observability";

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

// Minimal env interface for observability — avoids importing from the global Env augmentation here.
type RouterEnv = Pick<Env, "AGENT_ANALYTICS">;

function errorResponse(id: string | number | null, code: number, message: string): JsonRpcResponse {
    return {jsonrpc: "2.0", id, error: {code, message}};
}

export async function handleMcpRequest(
    payload: unknown,
    registry: McpToolRegistry,
    ctx: AgentContext,
    env?: RouterEnv
): Promise<JsonRpcResponse> {
    // Validate JSON-RPC envelope
    if (!payload || typeof payload !== "object") {
        return errorResponse(null, PARSE_ERROR, "Parse error");
    }

    const req = payload as Partial<JsonRpcRequest>;

    if (req.jsonrpc !== "2.0" || typeof req.method !== "string") {
        return errorResponse(req.id ?? null, INVALID_REQUEST, "Invalid Request");
    }

    const id = req.id ?? null;

    if (req.method === "tools/list") {
        const tools = Array.from(registry.values()).map(entry => entry.tool);
        return {jsonrpc: "2.0", id, result: {tools}};
    }

    if (req.method === "tools/call") {
        const params = req.params ?? {};
        const toolName = params.name;

        if (typeof toolName !== "string") {
            return errorResponse(id, INVALID_PARAMS, "Missing required param: name");
        }

        const entry = registry.get(toolName);
        if (!entry) {
            return errorResponse(id, METHOD_NOT_FOUND, `Unknown tool: ${toolName}`);
        }

        const toolParams = (params.arguments ?? {}) as Record<string, unknown>;
        const toolStart = Date.now();

        try {
            const result = await entry.handler(toolParams, ctx);
            emitAgentEvent(env, {
                evt: "mcp_tool_call",
                toolName,
                requestType: ctx?.isAgent ? "agent" : "human",
                responseCategory: "ok",
                durationMs: Date.now() - toolStart
            });
            return {jsonrpc: "2.0", id, result};
        } catch (err) {
            const message = err instanceof Error ? err.message : "Internal error";
            emitAgentEvent(env, {
                evt: "mcp_error",
                toolName,
                requestType: ctx?.isAgent ? "agent" : "human",
                responseCategory: "server_error",
                durationMs: Date.now() - toolStart,
                reason: message.slice(0, 64)
            });
            return errorResponse(id, INTERNAL_ERROR, message);
        }
    }

    return errorResponse(id, METHOD_NOT_FOUND, `Method not found: ${req.method}`);
}
