/**
 * @fileoverview NewsletterSection - Homepage email capture section
 *
 * @description
 * A centered homepage section that wraps the standalone NewsletterForm variant.
 * Positioned between FAQ and PromotionalBannerTwo to catch users in a peak
 * trust state after objection handling — the "resolve → capture → close" funnel.
 *
 * @related
 * - components/NewsletterForm.tsx - Underlying form component (standalone variant)
 * - routes/_index.tsx - Inserted between FAQSection (#12) and PromotionalBannerTwo (#13)
 */

import {NavLink} from "react-router";
import {LogIn} from "lucide-react";
import {NewsletterForm} from "~/components/NewsletterForm";

// ============================================================================
// Component
// ============================================================================

/**
 * NewsletterSection - Homepage email capture
 *
 * Renders the standalone NewsletterForm variant centered within a section
 * boundary. All form UI, validation, and success/error states are delegated
 * to the underlying NewsletterForm — this wrapper owns only layout.
 */
export function NewsletterSection() {
    return (
        <section
            className="mx-auto max-w-xl text-center"
            aria-label="Newsletter signup"
        >
            <NewsletterForm variant="standalone" />

            {/* Login CTA - Secondary action */}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground">Already a member?</p>
                <NavLink
                    to="/account"
                    prefetch="viewport"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 hover:no-underline transition-colors"
                >
                    <LogIn className="size-3.5" />
                    <span>Log in to your account</span>
                </NavLink>
            </div>
        </section>
    );
}
