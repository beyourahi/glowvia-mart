import type {AiAttribution} from "~/lib/ai-attribution";
import type {AgentProfile} from "~/lib/agentic/types";

export type AgentSurface = {
    isAgent: boolean;
    source: "mcp" | "referer" | "permalink" | "none";
    profileShape?: {fields: string[]; capabilities?: string[]};
};

export function deriveAgentSurface(opts: {
    aiAttribution: AiAttribution;
    hasAgentSession: boolean;
    agentProfile?: AgentProfile | null;
}): AgentSurface {
    const {aiAttribution, hasAgentSession, agentProfile} = opts;

    if (hasAgentSession) {
        const profileShape = agentProfile
            ? {
                  fields: Object.keys(agentProfile).filter(
                      k => agentProfile[k as keyof AgentProfile] !== undefined
                  ),
                  capabilities: agentProfile.capabilities
              }
            : undefined;
        return {isAgent: true, source: "permalink", profileShape};
    }

    if (aiAttribution.isAiReferrer) {
        return {isAgent: true, source: "referer"};
    }

    return {isAgent: false, source: "none"};
}
