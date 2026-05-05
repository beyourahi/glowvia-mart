/**
 * @fileoverview Agent Surface Detection
 *
 * Determines whether the current request originates from an AI agent and
 * which signal triggered the detection. Used by the root loader to decide
 * whether to render the agent UI layer vs. the standard shopper UI.
 *
 * Priority (highest to lowest):
 * 1. `hasAgentSession` — authenticated MCP/UCP session via JWT (source: "permalink")
 * 2. `aiAttribution.isAiReferrer` — referer header or UTM params from known AI surfaces (source: "referer")
 * 3. Neither — standard shopper (source: "none")
 */

import type {AiAttribution} from "~/lib/ai-attribution";
import type {AgentProfile} from "~/lib/agentic/types";

/**
 * Describes the detected agent surface for the current request.
 *
 * @property isAgent - True when any agent signal was detected
 * @property source - The signal that triggered agent detection
 * @property profileShape - Field/capability summary from the agent's JWT profile (MCP session only)
 */
export type AgentSurface = {
    isAgent: boolean;
    source: "mcp" | "referer" | "permalink" | "none";
    profileShape?: {fields: string[]; capabilities?: string[]};
};

/**
 * Derive the `AgentSurface` from attribution signals and session state.
 *
 * @param opts.aiAttribution - Server-detected AI referer or UTM attribution
 * @param opts.hasAgentSession - Whether a validated agent JWT session is present
 * @param opts.agentProfile - Decoded agent profile from the JWT (if available)
 */
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
