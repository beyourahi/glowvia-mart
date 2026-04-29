import {createContext, useContext, type ReactNode} from "react";
import type {AgentSurface} from "~/lib/agentic/agent-surface";

const FALLBACK_AGENT_SURFACE: AgentSurface = {isAgent: false, source: "none"};

const AgentSurfaceContext = createContext<AgentSurface>(FALLBACK_AGENT_SURFACE);

export function AgentSurfaceProvider({children, value}: {children: ReactNode; value: AgentSurface}) {
    return <AgentSurfaceContext.Provider value={value}>{children}</AgentSurfaceContext.Provider>;
}

export function useAgentSurface(): AgentSurface {
    return useContext(AgentSurfaceContext);
}
