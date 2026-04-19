/**
 * @fileoverview NewsletterForm - Email subscription form with success animations
 *
 * @description
 * Newsletter signup form component that handles email subscriptions via Shopify Customer API.
 * Supports two visual variants (footer and standalone) with different color schemes.
 * Includes loading states, success animations, and error handling.
 *
 * @features
 * - **Variant Support**: Footer (light-on-dark) and standalone (dark-on-light) themes
 * - **Form Validation**: Email input with required validation
 * - **Loading States**: Spinner animation during submission
 * - **Success Animation**: Checkmark reveal with auto-hide after 5s
 * - **Error Handling**: Inline error messages from API
 * - **Accessibility**: WCAG-compliant contrast, proper ARIA labels, 44px touch targets
 *
 * @props
 * - variant: 'footer' | 'standalone' - Visual theme variant (default: 'footer')
 * - className: Optional container className
 *
 * @related
 * - routes/api.newsletter.ts - API endpoint for newsletter subscription
 * - Footer.tsx - Uses NewsletterForm with variant="footer"
 */

import {useState, useEffect} from "react";
import {useFetcher} from "react-router";
import {Input} from "~/components/ui/input";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {ArrowRight, Check} from "lucide-react";
import {Spinner} from "~/components/ui/spinner";

// ============================================================================
// Types
// ============================================================================

interface NewsletterResponse {
    success: boolean;
    message?: string;
    error?: string;
}

interface NewsletterFormProps {
    /** Variant for different contexts */
    variant?: "footer" | "standalone";
    /** Optional className for the container */
    className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * NewsletterForm - Email subscription form with success animations
 *
 * Form flow:
 * 1. User enters email → Submit button enabled
 * 2. Form submits to /api/newsletter → Loading state with spinner
 * 3. Success → Show checkmark animation, clear input, auto-hide after 5s
 * 4. Error → Show inline error message
 *
 * Visual variants:
 * - **footer**: Light text on dark background (primary color scheme)
 * - **standalone**: Dark text on light background (default color scheme)
 */
export function NewsletterForm({variant = "footer", className}: NewsletterFormProps) {
    const fetcher = useFetcher<NewsletterResponse>();
    const [email, setEmail] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const isSubmitting = fetcher.state === "submitting";
    const isSuccess = fetcher.data?.success === true;
    const errorMessage = fetcher.data?.error;

    // Handle success state with animation timing
    useEffect(() => {
        if (isSuccess) {
            setShowSuccess(true);
            setEmail("");
            // Reset success message after 5 seconds
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess]);

    const isFooter = variant === "footer";

    return (
        <div className={cn("space-y-4", className)}>
            {/* Heading */}
            <div className="space-y-2">
                <h3
                    className={cn(
                        "font-serif",
                        isFooter ? "text-3xl lg:text-4xl text-primary-foreground" : "text-2xl lg:text-3xl text-primary"
                    )}
                >
                    Stay in the Loop
                </h3>
                <p className={cn("text-base", isFooter ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    Be the first to know about new arrivals, exclusive offers, and behind-the-scenes stories.
                </p>
            </div>

            {/* Success State */}
            {showSuccess ? (
                <div
                    className={cn(
                        "flex items-center gap-3 rounded-full px-6 py-3",
                        isFooter ? "bg-primary-foreground/10 text-primary-foreground" : "bg-primary/10 text-primary"
                    )}
                >
                    <div
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full",
                            isFooter ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
                        )}
                    >
                        <Check className="size-4" />
                    </div>
                    <span className="font-medium">{fetcher.data?.message || "Welcome to the family!"}</span>
                </div>
            ) : (
                /* Form */
                <fetcher.Form method="post" action="/api/newsletter" className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:gap-3 sm:items-center">
                        {/* Email Input */}
                        <div className="flex-1 relative">
                            <Input
                                type="email"
                                name="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                disabled={isSubmitting}
                                aria-label="Email address for newsletter"
                                aria-describedby={errorMessage ? "newsletter-error" : undefined}
                                className={cn(
                                    "h-12 sm:h-12 md:h-12 rounded-xl px-5 text-base md:text-base",
                                    isFooter
                                        ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/30"
                                        : "bg-background border-input"
                                )}
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting || !email}
                            className={cn(
                                "relative h-12 min-w-[140px] rounded-xl font-medium motion-interactive motion-press sleek",
                                isFooter
                                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                                !email && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <span className={cn("flex items-center gap-2", isSubmitting && "invisible")}>
                                <span>Subscribe</span>
                                <ArrowRight className="size-4" />
                            </span>
                            {isSubmitting && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <Spinner aria-hidden="true" />
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <p id="newsletter-error" className="text-sm px-2 text-destructive" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    {/* Privacy Note */}
                    <p
                        className={cn(
                            "text-sm px-1",
                            isFooter ? "text-primary-foreground/50" : "text-muted-foreground"
                        )}
                    >
                        By subscribing, you agree to our{" "}
                        <a
                            href="/policies/privacy-policy"
                            className={cn(
                                "underline underline-offset-2",
                                isFooter
                                    ? "text-primary-foreground/60 hover:text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Privacy Policy
                        </a>
                        . Unsubscribe anytime.
                    </p>
                </fetcher.Form>
            )}
        </div>
    );
}
