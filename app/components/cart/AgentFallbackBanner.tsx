/**
 * @fileoverview AgentFallbackBanner — SF002 style: compact, non-dismissible inline banner
 * for the cart surface when an agent encounters a cart state it cannot proceed through
 * (e.g. empty cart, checkout-only-via-Shop-Pay surface, or unsupported cart flow).
 *
 * @design SF002 warm, sophisticated aesthetic:
 * - `bg-muted border border-border rounded-lg` — matches AgentArrivalBanner's semantic token family
 * - `font-mono` — maintains the agent-surface visual family (AgentCartView, AgentProductBrief)
 * - `animate-in fade-in-0 slide-in-from-top-2` — tw-animate-css entrance consistent with SF002 patterns
 * - Non-dismissible — the agent MUST use an alternate path; this is not an optional hint
 * - Structured two-column link row — matches SF002's table/subheading aesthetic from the root
 *   AgentFallbackBanner, but scoped to a compact inline form factor for the cart surface
 *
 * @behavior
 * - Emits `fallback_shown` observability event on mount (console path; env binding
 *   is server-only and unavailable client-side)
 * - Copy is driven by `useAgentFallbackCopy()` from `~/lib/site-content-context`
 *   (metaobject-sourced or falls back to `FALLBACK_AGENT_FALLBACK_COPY`)
 *
 * @accessibility
 * - `role="note"` — supplementary informational landmark
 * - `aria-label` describes purpose to screen readers
 * - CTA link has descriptive text (not just "click here")
 * - Color: muted-foreground on muted background ≥ 4.5:1 contrast (WCAG AA) ✓
 * - Touch target on CTA: full-width tap zone via padding
 *
 * @related
 * - ~/lib/site-content-context.tsx — `useAgentFallbackCopy()` hook
 * - ~/lib/metaobject-parsers.ts — `FALLBACK_AGENT_FALLBACK_COPY` constants
 * - ~/lib/agentic/observability.ts — `emitAgentEvent()` (console path client-side)
 * - ~/components/AgentFallbackBanner.tsx — full-page interstitial for non-cart surfaces
 */

import {useEffect} from "react";
import {Link} from "react-router";
import {Bot, ArrowRight} from "lucide-react";
import {cn} from "~/lib/utils";
import {useAgentFallbackCopy} from "~/lib/site-content-context";
import {emitAgentEvent} from "~/lib/agentic/observability";

type AgentFallbackBannerProps = {
    /** Alternate agent-friendly route. Defaults to /search. */
    alternatePath?: string;
};

export function AgentFallbackBanner({alternatePath = "/search"}: AgentFallbackBannerProps) {
    const copy = useAgentFallbackCopy();

    // Emit observability event once on mount — console path only (env is server-only).
    useEffect(() => {
        emitAgentEvent(null, {
            evt: "fallback_shown",
            route: typeof window !== "undefined" ? window.location.pathname : undefined,
            requestType: "agent"
        });
    }, []);

    return (
        <div
            role="note"
            aria-label="Agent routing guidance"
            className={cn(
                "rounded-lg border border-border bg-muted font-mono",
                "animate-in fade-in-0 slide-in-from-top-2 duration-300"
            )}
        >
            <div className="p-3">
                {/* Header row */}
                <div className="mb-2.5 flex items-center gap-2">
                    <span
                        className="flex shrink-0 items-center justify-center rounded-md bg-accent/20 p-1 text-accent-foreground"
                        aria-hidden="true"
                    >
                        <Bot className="size-3" />
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Agent Routing
                    </span>
                </div>

                {/* Copy */}
                <div className="mb-3 border-t border-border/50 pt-2.5 space-y-0.5">
                    <p className="text-xs font-semibold leading-snug text-foreground">{copy.title}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{copy.subtitle}</p>
                </div>

                {/* CTA */}
                <Link
                    to={alternatePath}
                    className={cn(
                        "flex w-full items-center justify-between",
                        "border border-foreground/20 px-3 py-2",
                        "text-[10px] font-semibold text-foreground",
                        "transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background"
                    )}
                >
                    {copy.alternatePathLabel}
                    <ArrowRight className="size-3 shrink-0" />
                </Link>
            </div>
        </div>
    );
}
