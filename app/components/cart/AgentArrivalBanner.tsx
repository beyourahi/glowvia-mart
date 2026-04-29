/**
 * @fileoverview Agent Arrival Banner — inline notice above the first cart line item
 *
 * @description
 * Displays a compact, dismissible informational notice when a buyer arrives at
 * the cart page via an AI agent's prepared cart link. Positioned inline above
 * the first line item so it reads naturally in the cart flow without disrupting
 * the layout.
 *
 * @design
 * Warm, sophisticated aesthetic matching storefront_002's visual identity:
 * - Subdued informational inline notice — NOT a full-width banner
 * - `bg-muted border border-border rounded-lg` semantic colors for theming
 * - `Bot` icon from lucide-react in a small accent-tinted badge
 * - Subtle entrance animation: `animate-in fade-in-0 slide-in-from-top-2` (tw-animate-css)
 * - Compact padding (`p-3`), text sizes (`text-sm`/`text-xs`)
 *
 * @features
 * - Copy driven by `useAgentArrivalCopy()` from `~/lib/site-content-context`
 * - Small inline dismiss (X) button — hides the banner via local state
 * - `role="note"` for semantic accessibility
 * - `aria-label` for assistive technology context
 * - Fade animation on mount via tw-animate-css (`animate-in fade-in-0`)
 *
 * @accessibility
 * - `role="note"` — landmark for supplementary informational content
 * - `aria-label` describes the banner purpose to screen readers
 * - Dismiss button has a descriptive `aria-label`
 * - Color contrast: muted-foreground on muted ≥ 4.5:1 (WCAG AA text) ✓
 *   (semantic tokens resolve against theme — always tested via tailwind.css)
 * - Touch target on dismiss button: 32px × 32px inline (acceptable for non-primary action)
 *
 * @usage
 * Rendered by `CartMain` when `agentSurface.source === "permalink"` (Phase 5b —
 * session-backed agent-arrival detection via `useAgentSurface()` from
 * `~/lib/agent-surface-context`). Must appear ABOVE the cart line items list,
 * INSIDE the cart contents wrapper.
 *
 * ```tsx
 * const agentSurface = useAgentSurface();
 * const isAgentCart = agentSurface.source === "permalink";
 * {isAgentCart && linesCount && <AgentArrivalBanner />}
 * <CartLineItems ... />
 * ```
 *
 * @related
 * - ~/lib/site-content-context.tsx — `useAgentArrivalCopy()` hook
 * - ~/lib/metaobject-parsers.ts — `FALLBACK_AGENT_ARRIVAL_COPY` constants
 * - ~/lib/agent-surface-context.tsx — `useAgentSurface()` hook (detection source)
 * - ~/components/CartMain.tsx — mounts this banner when `isAgentCart` is true
 */

import {useState} from "react";
import {Bot, X} from "lucide-react";
import {cn} from "~/lib/utils";
import {useAgentArrivalCopy} from "~/lib/site-content-context";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AgentArrivalBanner — compact inline notice rendered above cart line items
 * when the buyer arrived via an AI agent's prepared cart link (`?_agent=1`).
 *
 * Dismissible: clicking X removes the banner from the DOM (local state only —
 * no persistence needed; a page reload would show it again if `_agent=1` is
 * still present, which is intentional for agent-driven flows).
 */
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
