/**
 * @fileoverview Compact dismissible inline notice rendered above cart line items
 * when the buyer arrived via an AI agent's prepared cart link (`?_agent=1`).
 *
 * Copy driven by `useAgentArrivalCopy()`. Dismissal is local state only — no
 * persistence; the banner re-appears on page reload if `_agent=1` is still present,
 * which is intentional for agent-driven flows.
 *
 * @related
 * - ~/lib/site-content-context.tsx — `useAgentArrivalCopy()` hook
 * - ~/lib/agent-surface-context.tsx — `useAgentSurface()` hook (detection source)
 * - ~/components/CartMain.tsx — mounts this banner when `isAgentCart` is true
 */

import {useState} from "react";
import {Bot, X} from "lucide-react";
import {cn} from "~/lib/utils";
import {useAgentArrivalCopy} from "~/lib/site-content-context";

/** Compact inline agent-arrival notice. Dismissible via local state (no persistence). */
export function AgentArrivalBanner() {
    const [dismissed, setDismissed] = useState(false);
    const copy = useAgentArrivalCopy();

    if (dismissed) return null;

    return (
        <div
            role="note"
            aria-label="Shopping assistant notice"
            className={cn(
                // Layout & spacing
                "flex items-start gap-3 p-3 rounded-lg",
                // Colors — semantic tokens that adapt to theme
                "bg-muted border border-border",
                // Entrance animation (tw-animate-css)
                "animate-in fade-in-0 slide-in-from-top-2 duration-300"
            )}
        >
            {/* Bot icon badge */}
            <span
                className={cn(
                    "mt-0.5 flex shrink-0 items-center justify-center size-7 rounded-md",
                    "bg-accent/20 text-accent-foreground"
                )}
                aria-hidden="true"
            >
                <Bot className="size-4" />
            </span>

            {/* Copy block */}
            <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground leading-snug">
                    {copy.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {copy.subtitle}
                </p>
            </div>

            {/* Dismiss button */}
            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss shopping assistant notice"
                className={cn(
                    "mt-0.5 flex shrink-0 items-center justify-center size-7 rounded-md",
                    "text-muted-foreground hover:text-foreground hover:bg-border",
                    "transition-colors duration-150",
                    // Ensure keyboard focus ring is visible
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                )}
            >
                <X className="size-3.5" aria-hidden="true" />
            </button>
        </div>
    );
}
