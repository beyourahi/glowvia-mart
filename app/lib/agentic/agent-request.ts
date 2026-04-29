/**
 * Determines whether an incoming request originates from an AI agent rather than a human browser.
 *
 * Detection criteria (any one is sufficient):
 * 1. `?agent=true` query parameter — explicit opt-in by agent implementations
 * 2. `Accept: application/x-ucp+json` — UCP-native content negotiation
 *
 * Why heuristic-based: agents that read /llms.txt learn about ?agent=true;
 * agents implementing UCP natively send the Accept header.
 */
export function isAgentRequest(request: Request): boolean {
    const url = new URL(request.url);
    if (url.searchParams.get("agent") === "true") return true;
    const accept = request.headers.get("accept") ?? "";
    if (accept.includes("application/x-ucp+json")) return true;
    return false;
}
