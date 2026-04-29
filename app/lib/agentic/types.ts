import type {DataAdapter, StorefrontLike} from "~/lib/data-source";

// UCP Capability tuple
export type UcpCapability = {
    version: string;
    spec: string;
    mcp_server?: string;
    status?: "ga" | "preview";
    /** Shopify cart permalink URL pattern for agent-to-checkout handoff. */
    cart_permalink_pattern?: string;
};

// UCP Service declaration
export type UcpService = {
    url: string;
    protocol: "mcp";
    auth?: "bearer";
};

// Full UCP profile manifest
export type UcpProfile = {
    ucp: {
        version: string;
        services: Record<string, UcpService>;
        capabilities: Record<string, UcpCapability[]>;
    };
};

// JSON-RPC 2.0 envelope
export type JsonRpcRequest = {
    jsonrpc: "2.0";
    id: string | number | null;
    method: string;
    params?: Record<string, unknown>;
};

export type JsonRpcSuccess<T = unknown> = {
    jsonrpc: "2.0";
    id: string | number | null;
    result: T;
};

export type JsonRpcError = {
    jsonrpc: "2.0";
    id: string | number | null;
    error: {
        code: number;
        message: string;
        data?: unknown;
    };
};

export type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcError;

// MCP Tool definition (tools/list response item)
export type McpTool = {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties?: Record<string, unknown>;
        required?: string[];
    };
};

// MCP tool handler signature
export type McpToolHandler = (
    params: Record<string, unknown>,
    ctx: AgentContext
) => Promise<unknown>;

// Registry of MCP tool handlers
export type McpToolRegistry = Map<string, {
    tool: McpTool;
    handler: McpToolHandler;
}>;

// Verified JWT claims from a signed agent bearer token
export type AgentJwtClaims = {
    sub?: string;
    aud?: string;
    exp?: number;
    iat?: number;
    iss?: string;
    [key: string]: unknown;
};

// Agent profile extracted from MCP request meta
export type AgentProfile = {
    id?: string;
    name?: string;
    version?: string;
    capabilities?: string[];
    class?: "shopping" | "order_management" | "knowledge" | "unknown";
    tenantId?: string;
    agentVersion?: string;
};

// Per-request agent context (null when request is not agent-mediated)
export type AgentContext = {
    profile: AgentProfile;
    isAgent: true;
    storefront: StorefrontLike;
    dataAdapter: DataAdapter;
} | null;

// Environment bindings available in Hydrogen loaders/actions
export type StorefrontEnv = Record<string, string | undefined>;
