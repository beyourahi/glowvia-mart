/**
 * Privacy-safe agent identity hash for observability logging.
 *
 * SHA-256(agentId + "::" + sessionSecret), first 16 hex chars.
 * Deterministic per agent per deployment — not reversible.
 * Safe to log without exposing the agent's actual identifier.
 */
export async function agentIdHash(
    agentId: string | undefined,
    sessionSecret: string
): Promise<string> {
    if (!agentId) return "anon";
    const data = new TextEncoder().encode(agentId + "::" + sessionSecret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 16);
}
