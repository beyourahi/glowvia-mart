import {useEffect} from "react";
import {Link} from "react-router";
import {Bot, ArrowRight} from "lucide-react";
import {useAgentFallbackCopy} from "~/lib/site-content-context";
import {emitAgentEvent} from "~/lib/agentic/observability";

type AgentFallbackBannerProps = {
    /** URL to the primary alternate agent-friendly endpoint (defaults to /search). */
    alternatePath?: string;
    /** Optional additional structured links rendered as a list below the primary CTA. */
    structuredLinks?: Array<{label: string; path: string; description: string}>;
};

const DEFAULT_STRUCTURED_LINKS: NonNullable<AgentFallbackBannerProps["structuredLinks"]> = [
    {label: "/search", path: "/search", description: "Full-text product search with filters"},
    {label: "/api/mcp", path: "/api/mcp", description: "Public MCP endpoint — policies and FAQ"},
    {label: "/api/ucp/mcp", path: "/api/ucp/mcp", description: "Authenticated MCP endpoint — catalog, cart, checkout"}
];

/**
 * Full-page interstitial shown when an agent lands on an interactive route
 * (quiz, editorial experience) that cannot be navigated programmatically.
 *
 * Design — SF002 structured subheadings: font-mono, divide-y vertical list,
 * max-w-2xl centered. Full-page rather than a strip so the agent gets clear
 * routing guidance without attempting to parse the inaccessible UI beneath.
 *
 * Emits `fallback_shown` observability event on mount (console.log path only;
 * AGENT_ANALYTICS binding is server-only and unavailable here).
 */
export function AgentFallbackBanner({
    alternatePath = "/search",
    structuredLinks = DEFAULT_STRUCTURED_LINKS
}: AgentFallbackBannerProps) {
    const copy = useAgentFallbackCopy();

    useEffect(() => {
        emitAgentEvent(null, {
            evt: "fallback_shown",
            route: typeof window !== "undefined" ? window.location.pathname : undefined,
            requestType: "agent"
        });
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-2xl px-6 py-12 font-mono">
                {/* Header */}
                <div className="mb-10">
                    <div className="mb-1 flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                            Agent Routing
                        </span>
                    </div>
                    <div className="mt-3 border-t border-border pt-3">
                        <h1 className="text-base font-semibold leading-snug">{copy.title}</h1>
                    </div>
                </div>

                {/* Description */}
                <section className="mb-8">
                    <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Guidance
                    </h3>
                    <p className="border-y border-border py-3 text-xs leading-relaxed text-muted-foreground">
                        {copy.subtitle}
                    </p>
                </section>

                {/* Primary CTA */}
                <section className="mb-8">
                    <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Recommended Path
                    </h3>
                    <Link
                        to={alternatePath}
                        className="flex w-full items-center justify-between border border-foreground px-4 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
                    >
                        {copy.alternatePathLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </section>

                {/* Structured links */}
                {structuredLinks.length > 0 && (
                    <section>
                        <h3 className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Agent Endpoints
                        </h3>
                        <div className="divide-y divide-border/50 border-y border-border">
                            {structuredLinks.map(link => (
                                <div key={link.path} className="grid grid-cols-3 py-2.5">
                                    <Link
                                        to={link.path}
                                        className="text-[10px] font-medium text-foreground underline underline-offset-2 hover:no-underline"
                                    >
                                        {link.label}
                                    </Link>
                                    <span className="col-span-2 text-[10px] text-muted-foreground">
                                        {link.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
