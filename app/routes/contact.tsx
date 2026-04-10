/**
 * @fileoverview Contact Page
 *
 * @description
 * Displays business contact information, location, hours, and social links.
 * Content is dynamically loaded from site_settings metaobject in Shopify.
 *
 * @route GET /contact
 *
 * @features
 * - Hero section with large typography
 * - Contact cards (email, phone, hours)
 * - Contact form (server-side via /api/contact — validation, rate limiting, honeypot)
 * - Location/address section
 * - Social media links
 * - CMS-driven content with a fixed Bangladesh country label
 *
 * @design
 * Uses alternating background sections:
 * - Background color for hero and social
 * - Primary color for contact methods and location
 * - Animated hover effects on interactive elements
 *
 * @cms-integration
 * All content comes from site_settings metaobject:
 * - contact_email, contact_phone, business_hours
 * - address fields (street, city, state, zip)
 * - country is fixed in code to Bangladesh
 * - Social links array (platform, handle, url)
 *
 * @accessibility
 * - Semantic HTML (address, section, header)
 * - Touch-friendly tap targets (min-h-[60px])
 * - Color contrast compliant
 *
 * @related
 * - lib/site-content-context.tsx - Contact info hooks
 * - faq.tsx - Links from contact section
 * - Footer.tsx - Also displays contact info
 */

import type {Route} from "./+types/contact";
import {getSeoMeta} from "@shopify/hydrogen";
import {Fragment, useCallback, useEffect, useRef, useState} from "react";
import {useFetcher} from "react-router";
import {AlertCircle, ArrowLeft, CheckCircle, Loader2, Send} from "lucide-react";
import {cn} from "~/lib/utils";
import {AnimatedSection} from "~/components/AnimatedSection";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
import {Textarea} from "~/components/ui/textarea";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {useContactInfo, useSocialLinks} from "~/lib/site-content-context";
import {STORE_COUNTRY_NAME} from "~/lib/store-locale";

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    return (
        getSeoMeta({
            title: "Contact Us",
            titleTemplate: `%s | ${brandName}`,
            description: `Get in touch with ${brandName}. Find our contact information, business hours, location, and social media links.`,
            url: buildCanonicalUrl("/contact", siteUrl)
        }) ?? []
    );
};

export default function Contact() {
    const contactInfo = useContactInfo();
    const socialLinks = useSocialLinks();
    const regionLine = [contactInfo.address.city, contactInfo.address.state].filter(Boolean).join(", ");
    const cityStateZipLine = [regionLine, contactInfo.address.zip].filter(Boolean).join(" ");
    const addressLines = [contactInfo.address.street, cityStateZipLine, STORE_COUNTRY_NAME].filter(Boolean);
    return (
        <div className="min-h-dvh  ">
            {/* Hero Section - Cream Background
                 pt-(--page-breathing-room): Breathing room from fixed header (24px → 64px) */}
            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="bg-background pt-(--page-breathing-room) pb-12 sm:pb-16 md:pb-24 lg:pb-32">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div>
                            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-16 items-end">
                            {/* Large Title */}
                                <div>
                                    <h1 className="font-serif text-xl md:text-3xl lg:text-4xl font-medium text-primary leading-tight">
                                        Get in{" "}
                                        <br />
                                        Touch
                                    </h1>
                                </div>

                            {/* Tagline */}
                                <div className="lg:pb-4">
                                    <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-md">
                                        We&apos;d love to hear from you. Whether you have a question about our products,
                                        need assistance, or just want to say hello.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.12}>
                <section className="bg-primary py-12 sm:py-16 md:py-24">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div>
                        {/* Section Label */}
                            <p className="text-sm sm:text-sm uppercase tracking-widest text-primary-foreground/50 mb-8 sm:mb-12">
                                Reach Out
                            </p>

                        {/* Contact Cards Grid */}
                            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                                <ContactCard
                                    label="Email"
                                    value={contactInfo.email}
                                    href={`mailto:${contactInfo.email}`}
                                    delay={0}
                                />
                                <ContactCard
                                    label="Phone"
                                    value={contactInfo.phone}
                                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                                    delay={1}
                                />
                                <ContactCard label="Hours" value={contactInfo.businessHours} delay={2} />
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            {/* Contact Form Section - Background matches hero for visual rhythm */}
            <AnimatedSection animation="slide-up" threshold={0.1}>
                <section className="bg-background py-12 sm:py-16 md:py-24">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-24">
                            {/* Form Heading */}
                            <div>
                                <p className="text-sm sm:text-sm uppercase tracking-widest text-muted-foreground mb-3 sm:mb-4">
                                    Send a Message
                                </p>
                                <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-medium text-primary leading-tight">
                                    Drop Us
                                    <br />
                                    a Line
                                </h2>
                            </div>

                            {/* Contact Form */}
                            <div>
                                <ContactForm />
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.12}>
                <section className="bg-primary py-12 sm:py-16 md:py-24">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div>
                            <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-24">
                                {/* Location Title */}
                                <div>
                                    <p className="text-sm sm:text-sm uppercase tracking-widest text-primary-foreground/50 mb-3 sm:mb-4">
                                        Visit Us
                                    </p>
                                    <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-medium text-primary-foreground leading-tight">
                                        Our
                                        <br />
                                        Location
                                    </h2>
                                </div>

                                {/* Address */}
                                <div className="flex items-end">
                                    <address className="not-italic">
                                        <p className="text-xl sm:text-2xl md:text-3xl text-primary-foreground leading-relaxed">
                                            {addressLines.map((line, index) => (
                                                <Fragment key={line}>
                                                    <span
                                                        className={
                                                            index === addressLines.length - 1
                                                                ? "text-primary-foreground/60"
                                                                : undefined
                                                        }
                                                    >
                                                        {line}
                                                    </span>
                                                    {index < addressLines.length - 1 && <br />}
                                                </Fragment>
                                            ))}
                                        </p>
                                    </address>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="fade" threshold={0.1}>
                <section className="bg-background py-12 sm:py-16 md:py-24">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div>
                            {/* Section Label */}
                            <p className="text-sm sm:text-sm uppercase tracking-widest text-muted-foreground mb-6 sm:mb-8">
                                Follow Along
                            </p>

                            {/* Large Social Title */}
                            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-medium text-primary mb-8 sm:mb-12 leading-tight">
                                Stay Connected
                            </h2>

                            {/* Social Links */}
                            <div className="space-y-3 sm:space-y-4">
                                {socialLinks.map((link, index) => (
                                    <SocialLink
                                        key={link.id}
                                        title={link.platform}
                                        handle={link.handle}
                                        url={link.url}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>
        </div>
    );
}

interface ContactCardProps {
    label: string;
    value: string;
    href?: string;
    delay: number;
}

function ContactCard({label, value, href}: ContactCardProps) {
    const content = (
        <div className="group relative overflow-hidden rounded-2xl bg-overlay-light p-5 sm:p-6 md:p-8 motion-surface motion-interactive hover:bg-overlay-light-hover hover:shadow-md min-h-[100px] sm:min-h-[120px]">
            {/* Arrow indicator for links */}
            {href && (
                <span className="absolute top-4 right-4 sm:top-6 sm:right-6 text-primary-foreground/40 motion-link group-hover:text-primary-foreground group-hover:translate-x-1">
                    &rarr;
                </span>
            )}

            <span className="block text-sm sm:text-sm uppercase tracking-widest text-primary-foreground/50 mb-2 sm:mb-3">
                {label}
            </span>
            <span className="block font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl text-primary-foreground leading-tight wrap-break-word">
                {value}
            </span>
        </div>
    );

    if (href) {
        return (
            <a href={href} className="block animate-product-fade-in hover:no-underline">
                {content}
            </a>
        );
    }

    return <div className="animate-product-fade-in">{content}</div>;
}

interface SocialLinkProps {
    title: string;
    handle: string;
    url: string;
    index: number;
}

function SocialLink({title, handle, url}: SocialLinkProps) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between border-b border-border py-4 sm:py-6 motion-interactive hover:border-primary hover:no-underline animate-product-fade-in min-h-[60px] sm:min-h-[72px]"
        >
            <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-muted-foreground motion-link group-hover:text-primary group-hover:translate-x-2">
                    &rarr;
                </span>
                <span className="font-serif text-lg sm:text-xl md:text-2xl text-primary motion-link group-hover:text-primary/80">
                    {title}
                </span>
            </div>
            <span className="text-sm sm:text-base md:text-lg text-muted-foreground motion-link group-hover:text-primary/80 hidden sm:block">
                {handle}
            </span>
        </a>
    );
}

// =============================================================================
// CONTACT FORM
// =============================================================================

type FieldError = {field: string; message: string};
type ContactFormResult = {success?: boolean; message?: string; errors?: FieldError[]};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Server-side contact form with client + server validation, rate limiting,
 * and honeypot spam protection.
 *
 * Submits to /api/contact via useFetcher (no full-page navigation).
 * Uses uncontrolled inputs with FormData serialization — the idiomatic
 * React Router pattern for progressive enhancement.
 *
 * @accessibility
 * - All inputs have associated <Label> elements (WCAG 1.3.1)
 * - Required fields use aria-required (WCAG 3.3.2)
 * - Error messages use role="alert" for screen reader announcement (WCAG 4.1.3)
 * - aria-invalid marks fields with errors (WCAG 3.3.1)
 * - Touch targets meet 44px minimum via shadcn Input/Textarea defaults (WCAG 2.5.5)
 * - Focus-visible rings on all controls (WCAG 2.4.7)
 * - Honeypot field is aria-hidden so screen readers skip it
 */
function ContactForm() {
    const fetcher = useFetcher<ContactFormResult>();
    const formRef = useRef<HTMLFormElement>(null);
    const [clientErrors, setClientErrors] = useState<FieldError[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    const isSubmitting = fetcher.state !== "idle";

    // Show success state when server returns success
    useEffect(() => {
        if (fetcher.data?.success) {
            setShowSuccess(true);
            setClientErrors([]);
        }
    }, [fetcher.data]);

    /** Client-side validation before submit — fast feedback, no round-trip */
    const validateClient = useCallback((): boolean => {
        if (!formRef.current) return false;
        const fd = new FormData(formRef.current);
        const errors: FieldError[] = [];

        const name = (fd.get("name") as string | null)?.trim() ?? "";
        const email = (fd.get("email") as string | null)?.trim() ?? "";
        const message = (fd.get("message") as string | null)?.trim() ?? "";

        if (!name) errors.push({field: "name", message: "Name is required"});
        if (!email) errors.push({field: "email", message: "Email is required"});
        else if (!EMAIL_REGEX.test(email)) errors.push({field: "email", message: "Please enter a valid email address"});
        if (!message) errors.push({field: "message", message: "Message is required"});

        setClientErrors(errors);
        return errors.length === 0;
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            if (!validateClient()) {
                e.preventDefault();
            }
            // If valid, useFetcher handles the submit naturally
        },
        [validateClient]
    );

    const handleReset = useCallback(() => {
        setShowSuccess(false);
        setClientErrors([]);
        formRef.current?.reset();
    }, []);

    // Merge errors: client-side take priority, fall back to server errors
    const errors = clientErrors.length > 0 ? clientErrors : (fetcher.data?.errors ?? []);
    const formError = errors.find(e => e.field === "form");

    const getFieldError = (field: string) => errors.find(e => e.field === field)?.message;

    // ── Success State ──────────────────────────────────────────────────
    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-8 sm:py-12 space-y-4 sm:space-y-6">
                <div className="rounded-full bg-primary/10 p-4">
                    <CheckCircle className="size-8 sm:size-10 text-primary" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-serif text-xl sm:text-2xl font-medium text-primary">Message Sent</h3>
                    <p className="text-muted-foreground text-sm sm:text-base max-w-sm">
                        {fetcher.data?.message ?? "Thank you for your message! We'll get back to you soon."}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={handleReset}
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Send Another Message
                </Button>
            </div>
        );
    }

    // ── Form State ─────────────────────────────────────────────────────
    return (
        <fetcher.Form
            ref={formRef}
            method="post"
            action="/api/contact"
            noValidate
            onSubmit={handleSubmit}
            className="relative space-y-5 sm:space-y-6"
        >
            {/* Honeypot — invisible to humans, catches bots that auto-fill all fields */}
            <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input type="text" id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            {/* Form-level error alert (server errors, network failures) */}
            {formError && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:p-4" role="alert">
                    <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-destructive">{formError.message}</p>
                </div>
            )}

            {/* Name + Email — side by side on desktop, stacked on mobile */}
            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
                <FormField
                    id="contact-name"
                    name="name"
                    label="Name"
                    type="text"
                    placeholder="Your name"
                    required
                    error={getFieldError("name")}
                    disabled={isSubmitting}
                />
                <FormField
                    id="contact-email"
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    error={getFieldError("email")}
                    disabled={isSubmitting}
                />
            </div>

            {/* Subject — full width, optional */}
            <FormField
                id="contact-subject"
                name="subject"
                label="Subject"
                type="text"
                placeholder="What is this about?"
                error={getFieldError("subject")}
                disabled={isSubmitting}
            />

            {/* Message — textarea with adequate height */}
            <FormField
                id="contact-message"
                name="message"
                label="Message"
                type="textarea"
                placeholder="Tell us more..."
                required
                error={getFieldError("message")}
                disabled={isSubmitting}
            />

            {/* Submit button */}
            <div>
                <Button type="submit" size="lg" className="gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Send className="size-4" aria-hidden="true" />
                    )}
                    {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
            </div>
        </fetcher.Form>
    );
}

// =============================================================================
// FORM FIELD HELPER
// =============================================================================

interface FormFieldProps {
    id: string;
    name: string;
    label: string;
    type: "text" | "email" | "textarea";
    placeholder: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
}

/** Renders a label + input/textarea + error message with consistent a11y attributes */
function FormField({id, name, label, type, placeholder, required, error, disabled}: FormFieldProps) {
    const errorId = `${id}-error`;
    const hasError = !!error;

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label}
                {!required && <span className="text-muted-foreground ml-1 text-xs font-normal">(optional)</span>}
            </Label>
            {type === "textarea" ? (
                <Textarea
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    required={required}
                    aria-required={required ? "true" : undefined}
                    aria-invalid={hasError ? "true" : undefined}
                    aria-describedby={hasError ? errorId : undefined}
                    disabled={disabled}
                    className={cn("min-h-[160px] sm:min-h-[140px]", hasError && "border-destructive")}
                />
            ) : (
                <Input
                    id={id}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    required={required}
                    aria-required={required ? "true" : undefined}
                    aria-invalid={hasError ? "true" : undefined}
                    aria-describedby={hasError ? errorId : undefined}
                    disabled={disabled}
                    className={cn(hasError && "border-destructive")}
                />
            )}
            {hasError && (
                <p id={errorId} className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            )}
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
