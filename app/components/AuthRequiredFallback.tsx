/**
 * @fileoverview Auth Required Fallback Component
 *
 * @description
 * Reusable fallback UI shown on account pages when a user is not authenticated.
 * Displays a centered card with a lock icon, custom message, and a login CTA
 * button that navigates to the Shopify customer account OAuth flow.
 *
 * Used by all account child routes (dashboard, orders, profile, returns) when
 * the user is not logged in. The account navigation tabs remain visible above
 * this component (rendered by the parent account layout).
 *
 * @accessibility
 * - Text contrast: primary on background = 14.68:1 (WCAG AAA) ✓
 * - Muted text: muted-foreground on background ≥ 4.5:1 (WCAG AA) ✓
 * - Button: default variant = 14.68:1 (WCAG AAA) ✓
 * - Touch target: Button meets 44px minimum (WCAG 2.5.5)
 * - Semantic: Uses heading hierarchy and descriptive link text
 *
 * @related
 * - account.tsx - Parent layout that renders navigation tabs
 * - account_.login.tsx - Login route that initiates OAuth flow
 * - Button component - Primary CTA styling
 */

import {Link} from "react-router";
import {LockKeyhole} from "lucide-react";
import {Button} from "~/components/ui/button";

interface AuthRequiredFallbackProps {
    /** Custom message describing what the user will access after logging in */
    message: string;
    /** Custom CTA button text (defaults to "Sign In") */
    ctaText?: string;
}

/**
 * Fallback UI for unauthenticated users on account pages.
 *
 * Renders a centered layout with:
 * - Lock icon (visual indicator of protected content)
 * - Custom message per page context
 * - Primary "Sign In" button linking to /account/login
 *
 * The /account/login route triggers Shopify's OAuth flow via
 * customerAccount.login() in its loader.
 */
export function AuthRequiredFallback({message, ctaText = "Sign In"}: AuthRequiredFallbackProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 px-4">
            {/* Lock icon - muted-foreground on background meets 3:1 for UI components (WCAG 1.4.11) */}
            <div className="flex items-center justify-center size-16 sm:size-20 rounded-full bg-muted mb-6">
                <LockKeyhole className="size-7 sm:size-9 text-muted-foreground" aria-hidden="true" />
            </div>

            {/* Heading - primary on background = 14.68:1 (WCAG AAA) ✓ */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary mb-3">Account Required</h2>

            {/* Message - muted-foreground on background ≥ 4.5:1 (WCAG AA) ✓ */}
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mb-8">{message}</p>

            {/* Login CTA - default Button variant: 14.68:1 contrast (WCAG AAA) ✓
                Uses asChild with Link so it navigates via React Router, not a page refresh.
                /account/login triggers customerAccount.login() OAuth redirect. */}
            <Button asChild size="lg">
                <Link to="/account/login" prefetch="intent">
                    {ctaText}
                </Link>
            </Button>
        </div>
    );
}
