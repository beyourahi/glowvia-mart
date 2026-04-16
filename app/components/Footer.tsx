/**
 * @fileoverview Site footer component with logo, mission, newsletter, and navigation
 *
 * @description
 * Full-height footer with brand identity, mission statement, newsletter signup,
 * navigation links, and social media connections. Uses metaobjects for dynamic
 * content (brand name, mission, social links).
 *
 * @features
 * - Full viewport height (min-h-dvh) with centered content
 * - Large brand logo with serif typography
 * - Mission statement display
 * - Newsletter form integration
 * - Multi-column navigation (Shop, Support, Account, Connect)
 * - Dynamic social links from metaobjects
 * - Copyright notice with current year
 * - Designer attribution
 * - Responsive grid layouts
 * - Dark background with light text
 *
 * @props
 * - footer: Deferred footer data promise (legacy - not currently used)
 * - header: Header data containing shop name for copyright
 *
 * @layout
 * Three sections:
 * 1. Top: Logo (left) + Mission (right)
 * 2. Middle: Newsletter (left) + Links (right)
 * 3. Bottom: Copyright + Attribution
 *
 * @navigation-structure
 * - Shop: Collections, Gallery, Search
 * - Support: FAQ, Contact, Policies
 * - Account: Orders, Addresses, Profile
 * - Connect: Social links + Blog (dynamic from metaobjects)
 *
 * @dependencies
 * - useSiteSettings: Brand name and mission from metaobjects
 * - useSocialLinks: Social media links from metaobjects
 * - NewsletterForm: Email signup component
 *
 * @styling
 * - Background: bg-primary
 * - Text: text-primary-foreground
 * - Responsive padding and spacing
 * - Safe area insets for mobile
 *
 * @related
 * - NewsletterForm.tsx - Email signup
 * - ~/lib/site-content-context.tsx - Metaobject data
 * - Header.tsx - Top navigation
 */

import {Suspense} from "react";
import {Await, NavLink, useRouteLoaderData} from "react-router";
import {Copyright as CopyrightIcon} from "lucide-react";
import type {FooterProps} from "types";
import {NewsletterForm} from "~/components/NewsletterForm";
import {useSiteSettings, useSocialLinks, useFaqItems, useContactInfo} from "~/lib/site-content-context";
import type {RootLoader} from "~/root";

// =============================================================================
// MAIN FOOTER COMPONENT
// =============================================================================

export function Footer({footer: footerPromise, header: _header}: FooterProps) {
    const {brandName} = useSiteSettings();
    return (
        <Suspense>
            <Await resolve={footerPromise}>
                {footer => (
                    <footer className="bg-primary text-primary-foreground mt-auto min-h-dvh flex flex-col">
                        {/* Main content area - grows to fill space
                             Responsive padding matches Container and all homepage sections
                             px-container uses --container-padding: clamp(0.5rem, 0.75vw, 0.75rem) */}
                        <div className="flex-1 flex flex-col justify-center px-container">
                            {/* Top Section: Logo + Mission */}
                            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-32">
                                <FooterLogo />
                                <MissionStatement />
                            </div>

                            {/* Middle Section: Newsletter + Links */}
                            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 pb-10 sm:pb-12 lg:pb-16">
                                <NewsletterSection />
                                <FooterLinks />
                            </div>
                        </div>

                        {/* Contact Strip: Email + Phone — rendered only when at least one is configured */}
                        <FooterContactStrip />

                        {/* Bottom Section: Copyright - stays at bottom.
                             id="footer-bottom-bar" is the IntersectionObserver target used by
                             useFooterClearance (app/hooks/useFooterClearance.ts) to lift the
                             floating button stack when this block enters the viewport. */}
                        <div id="footer-bottom-bar" className="mt-auto border-t border-primary-foreground/10">
                            {/* Responsive padding matching Container and all homepage sections
                                 px-container uses --container-padding: clamp(0.5rem, 0.75vw, 0.75rem)
                                 This ensures footer padding matches homepage sections exactly.
                                 Bottom padding on mobile is enlarged to clear the StickyMobileGetNow button
                                 (min-h-14 = 3.5rem, plus device safe-area-inset-bottom, plus 0.75rem buffer).
                                 At md+ the button is hidden (md:hidden) so normal pb-6 is restored. */}
                            <div className="pt-4 sm:pt-6 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] md:pb-6 px-container flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                                <Copyright shopName={brandName || "Store"} />
                                {/* Developer credit — Slash Cut badge.
                                     Contrast rationale (bg-primary runtime ≈ L 84%):
                                     text-primary-foreground/90 → ~11.2:1 ✓ (label)
                                     text-primary-foreground/75 → ~5.8:1  ✓ (slash separator)
                                     text-primary-foreground    → ~12.4:1 ✓ (name)
                                     Visual hierarchy via size (10px vs 14px) + weight + case,
                                     not opacity — avoids contrast collapse on the light surface.
                                     brand-accent removed: runtime theme neutralizes it to gray. */}
                                <a
                                    href="https://beyourahi.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group motion-link flex w-full justify-center items-center rounded-[var(--radius-xs-raw)] border border-primary-foreground/30 bg-primary-foreground/[0.03] text-sm transition-[border-color,background-color] duration-[220ms] ease-[var(--motion-ease-standard)] hover:border-primary-foreground/55 hover:bg-primary-foreground/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50 focus-visible:ring-offset-1 focus-visible:ring-offset-primary sm:inline-flex sm:w-auto sm:self-start"
                                >
                                    <span className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-primary-foreground/90 transition-colors duration-[220ms] ease-[var(--motion-ease-standard)] group-hover:text-primary-foreground">
                                        Designed by
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="select-none text-sm font-light text-primary-foreground/75 transition-colors duration-[220ms] ease-[var(--motion-ease-standard)] group-hover:text-primary-foreground"
                                    >
                                        /
                                    </span>
                                    <span className="px-2.5 py-1.5 font-semibold text-primary-foreground transition-colors duration-[220ms] ease-[var(--motion-ease-standard)] group-hover:text-primary-foreground">
                                        Rahi Khan
                                    </span>
                                </a>
                            </div>
                        </div>
                    </footer>
                )}
            </Await>
        </Suspense>
    );
}

// =============================================================================
// FOOTER SECTIONS
// =============================================================================

/**
 * Large brand logo with serif typography from site settings.
 */
function FooterLogo() {
    const {brandName} = useSiteSettings();
    return (
        <NavLink to="/" prefetch="viewport" className="block motion-link hover:opacity-80 hover:no-underline cursor-pointer">
            {/* Fluid display sizing via text-fluid-display — scales continuously using clamp(),
                 defined in app/styles/tailwind.css */}
            <span className="font-serif text-fluid-display font-normal tracking-wide uppercase">
                {brandName}
            </span>
        </NavLink>
    );
}

/**
 * Mission statement text from site settings metaobject.
 * Responsive typography scales from text-lg to text-4xl on ultrawide.
 */
function MissionStatement() {
    const {missionStatement} = useSiteSettings();
    return (
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl leading-relaxed max-w-xl lg:max-w-2xl 2xl:max-w-3xl">
            {missionStatement}
        </p>
    );
}

// =============================================================================
// SOCIAL LINK FILTERING
// =============================================================================

/**
 * Generic platform homepage URLs that indicate an unconfigured social link.
 * When a store owner hasn't set their actual profile URL, Shopify or the
 * metaobject defaults leave the bare platform root. These should not be
 * displayed to customers.
 *
 * Comparison is done after stripping trailing slashes and lowercasing.
 */
const GENERIC_SOCIAL_URLS = new Set([
    "https://www.instagram.com",
    "https://instagram.com",
    "https://www.facebook.com",
    "https://facebook.com",
    "https://www.threads.net",
    "https://threads.net",
    "https://www.threads.com",
    "https://threads.com",
    "https://www.twitter.com",
    "https://twitter.com",
    "https://www.x.com",
    "https://x.com",
    "https://www.tiktok.com",
    "https://tiktok.com",
    "https://www.youtube.com",
    "https://youtube.com",
    "https://www.pinterest.com",
    "https://pinterest.com"
]);

/**
 * Returns true when the social link points to an actual brand profile,
 * not just a bare platform homepage.
 */
function isConfiguredSocialLink(url: string): boolean {
    const normalized = url.trim().replace(/\/+$/, "").toLowerCase();
    return !GENERIC_SOCIAL_URLS.has(normalized);
}

// =============================================================================
// FOOTER NAVIGATION
// =============================================================================

// Footer link type
interface FooterLink {
    title: string;
    url: string;
    external?: boolean;
}

interface FooterColumn {
    heading: string;
    links: FooterLink[];
}

// Shop column links (always visible)
const SHOP_LINKS: FooterLink[] = [
    {title: "All Products", url: "/collections/all-products"},
    {title: "Collections", url: "/collections"},
    {title: "Gallery", url: "/gallery"},
    {title: "Search", url: "/search"}
];

// Support column links (FAQ conditionally included based on CMS data)
const SUPPORT_LINKS: FooterLink[] = [
    {title: "Shipping", url: "/policies/shipping-policy"},
    {title: "Returns", url: "/policies/refund-policy"},
    {title: "Privacy Policy", url: "/policies/privacy-policy"},
    {title: "Terms of Service", url: "/policies/terms-of-service"}
];

// Account column links (always visible)
const ACCOUNT_LINKS: FooterLink[] = [
    {title: "My Account", url: "/account"},
    {title: "Order History", url: "/account/orders"},
    {title: "Addresses", url: "/account/addresses"},
    {title: "Profile", url: "/account/profile"}
];

/**
 * Multi-column footer navigation with conditional links.
 * Blog link only shown if hasBlog is true (from root loader).
 * FAQ link only shown if FAQ items exist in CMS (from site settings context).
 */
function FooterLinks() {
    const socialLinks = useSocialLinks();
    const faqItems = useFaqItems();
    const rootData = useRouteLoaderData<RootLoader>("root");
    const hasBlog = rootData?.hasBlog ?? false;
    const hasFaq = faqItems && faqItems.length > 0;

    // Build Support column with conditional FAQ link
    const supportLinks: FooterLink[] = [...(hasFaq ? [{title: "FAQ", url: "/faq"}] : []), ...SUPPORT_LINKS];

    // Build Connect column — filter out unconfigured social links (bare platform homepages)
    const connectLinks: FooterLink[] = [
        ...socialLinks
            .filter(link => isConfiguredSocialLink(link.url))
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(link => ({
                title: link.platform,
                url: link.url,
                external: true
            })),
        ...(hasBlog ? [{title: "Blog", url: "/blogs"}] : []),
        {title: "Changelog", url: "/changelog"}
    ];

    // Only show columns that have at least one link; hides Connect entirely
    // when all social links are unconfigured and there's no blog
    const allColumns: FooterColumn[] = [
        {heading: "Shop", links: SHOP_LINKS},
        {heading: "Support", links: supportLinks},
        {heading: "Account", links: ACCOUNT_LINKS},
        ...(connectLinks.length > 0 ? [{heading: "Connect", links: connectLinks}] : [])
    ];

    return (
        <nav className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 md:gap-x-8" role="navigation">
            {allColumns.map((column, colIndex) => (
                // eslint-disable-next-line react/no-array-index-key -- Static column structure
                <div key={`footer-col-${colIndex}`} className="space-y-3 sm:space-y-4">
                    <h3 className="font-sans text-sm sm:text-sm font-semibold uppercase tracking-wider text-primary-foreground/60">
                        {column.heading}
                    </h3>
                    {/* Reduced vertical spacing on mobile to fit more links */}
                    <ul className="space-y-0 sm:space-y-1">
                        {column.links.map(link => (
                            <li key={link.url}>
                                {/* min-h-11 ensures 44px touch target on mobile (WCAG 2.5.5)
                                     Removed on sm+ where links are not primary touch targets */}
                                {link.external ? (
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center min-h-11 sm:min-h-0 py-1 sm:py-0.5 text-sm text-primary-foreground/80 hover:text-primary-foreground hover:no-underline cursor-pointer"
                                    >
                                        {link.title}
                                    </a>
                                ) : (
                                    <NavLink
                                        to={link.url}
                                        prefetch="viewport"
                                        className="inline-flex items-center min-h-11 sm:min-h-0 py-1 sm:py-0.5 text-sm text-primary-foreground/80 hover:text-primary-foreground hover:no-underline cursor-pointer"
                                    >
                                        {link.title}
                                    </NavLink>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

// =============================================================================
// NEWSLETTER SECTION
// =============================================================================

/**
 * Newsletter signup with login CTA.
 */
function NewsletterSection() {
    return (
        <div className="space-y-4 sm:space-y-6 w-full lg:max-w-lg">
            {/* Newsletter Form */}
            <NewsletterForm variant="footer" />

            {/* Login CTA - Secondary action */}
            <div className="pt-4 border-t border-primary-foreground/10 flex items-center gap-2">
                <p className="text-sm text-primary-foreground/60">Already a member?</p>
                <NavLink
                    to="/account"
                    prefetch="viewport"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-medium hover:bg-primary-foreground/90 hover:no-underline transition-colors"
                >
                    <span>Log in to your account</span>
                </NavLink>
            </div>
        </div>
    );
}

// =============================================================================
// FOOTER CONTACT STRIP
// =============================================================================

/**
 * Renders a thin contact row (email + phone) above the copyright bar.
 * Only mounts when at least one of the two fields is non-empty.
 */
function FooterContactStrip() {
    const {email, phone} = useContactInfo();
    const hasEmail = Boolean(email?.trim());
    const hasPhone = Boolean(phone?.trim());

    if (!hasEmail && !hasPhone) return null;

    return (
        <div className="border-t border-primary-foreground/10 px-container py-4 flex flex-wrap items-center gap-x-6 gap-y-1">
            {hasEmail && (
                <a
                    href={`mailto:${email}`}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground hover:no-underline"
                >
                    {email}
                </a>
            )}
            {hasPhone && (
                <a
                    href={`tel:${phone}`}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground hover:no-underline"
                >
                    {phone}
                </a>
            )}
        </div>
    );
}

// =============================================================================
// COPYRIGHT
// =============================================================================

/**
 * Copyright notice with shop name and current year.
 */
function Copyright({shopName}: {shopName: string}) {
    const currentYear = new Date().getFullYear();

    return (
        <div className="inline-flex items-center gap-1 text-sm font-medium text-primary-foreground/60">
            <CopyrightIcon size={16} className="shrink-0" />
            <span>
                {currentYear} {shopName}. All rights reserved.
            </span>
        </div>
    );
}
