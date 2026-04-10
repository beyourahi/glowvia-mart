/**
 * @fileoverview Store Policy Page (Privacy, Shipping, Returns, Terms)
 *
 * @description
 * Displays store policies configured in Shopify admin. Supports privacy policy,
 * shipping policy, refund policy, and terms of service. Features a two-column
 * sticky layout with sidebar navigation between policies.
 *
 * @route GET /policies/:handle
 *
 * @supported-policies
 * - privacy-policy → Privacy & Data
 * - shipping-policy → Shipping & Delivery
 * - terms-of-service → Terms & Conditions
 * - refund-policy → Returns & Refunds
 *
 * @layout
 * 1. Two-column layout on desktop (sticky heading + scrolling content)
 * 2. Policy title with decorative line break
 * 3. Other policies navigation sidebar
 * 4. Policy content (HTML from Shopify)
 * 5. Contact CTA section
 *
 * @design
 * - Primary background throughout
 * - Serif typography for headings
 * - Prose styling for policy content
 * - Animated navigation arrows on hover
 *
 * @data-source
 * Policies are fetched from Shopify's ShopPolicy objects:
 * - shop.privacyPolicy
 * - shop.shippingPolicy
 * - shop.termsOfService
 * - shop.refundPolicy
 *
 * @seo
 * - Dynamic meta based on policy type
 * - Canonical URL for each policy
 * - Brand-specific descriptions
 *
 * @related
 * - Footer.tsx - Links to policy pages
 * - contact.tsx - CTA links to contact
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/ShopPolicy
 */

import {Link, useLoaderData} from "react-router";
import type {Route} from "./+types/policies.$handle";
import {getSeoMeta} from "@shopify/hydrogen";
import {type Shop} from "@shopify/hydrogen/storefront-api-types";
import {AnimatedSection} from "~/components/AnimatedSection";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {useSiteSettings} from "~/lib/site-content-context";

type SelectedPolicies = keyof Pick<Shop, "privacyPolicy" | "shippingPolicy" | "termsOfService" | "refundPolicy">;

const POLICY_LABELS: Record<string, string> = {
    "privacy-policy": "Privacy & Data",
    "shipping-policy": "Shipping & Delivery",
    "terms-of-service": "Terms & Conditions",
    "refund-policy": "Returns & Refunds",
    "subscription-policy": "Subscriptions"
};

/**
 * Generate policy description with dynamic brand name
 */
function getPolicyDescription(handle: string, brandName: string): string {
    const descriptions: Record<string, string> = {
        "privacy-policy": `Learn how ${brandName} collects, uses, and protects your personal information.`,
        "shipping-policy": "Find out about our shipping methods, delivery times, and shipping costs.",
        "terms-of-service": `Read our terms and conditions for using the ${brandName} website and services.`,
        "refund-policy": `Understand our return and refund policies for purchases made at ${brandName}.`
    };
    return descriptions[handle] || `Read our policy at ${brandName}.`;
}

const SIDEBAR_LINKS = [
    {handle: "privacy-policy", title: "Privacy Policy"},
    {handle: "shipping-policy", title: "Shipping Policy"},
    {handle: "terms-of-service", title: "Terms of Service"},
    {handle: "refund-policy", title: "Refund Policy"}
];

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const policy = data?.policy;
    if (!policy) return [{title: `Policy | ${brandName}`}];

    const description = getPolicyDescription(policy.handle, brandName);

    return (
        getSeoMeta({
            title: policy.title,
            titleTemplate: `%s | ${brandName}`,
            description,
            url: buildCanonicalUrl(`/policies/${policy.handle}`, siteUrl)
        }) ?? []
    );
};

export async function loader({params, context}: Route.LoaderArgs) {
    if (!params.handle) {
        throw new Response("No handle was passed in", {status: 404});
    }

    const policyName = params.handle.replace(/-([a-z])/g, (_: unknown, m1: string) =>
        m1.toUpperCase()
    ) as SelectedPolicies;

    const data = await context.dataAdapter.query(POLICY_CONTENT_QUERY, {
        variables: {
            privacyPolicy: false,
            shippingPolicy: false,
            termsOfService: false,
            refundPolicy: false,
            [policyName]: true,
            language: context.storefront.i18n?.language
        }
    });

    const policy = data.shop?.[policyName];

    if (!policy) {
        throw new Response("Could not find the policy", {status: 404});
    }

    return {policy};
}

export default function Policy() {
    const {policy} = useLoaderData<typeof loader>();
    const {brandName} = useSiteSettings();

    return (
        <div className="min-h-dvh bg-primary  ">
            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-12 sm:pb-16 md:pb-24 lg:pb-32">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div>
                            <div className="grid gap-8 sm:gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
                                {/* Sticky Policy Heading */}
                                <div className="lg:sticky lg:top-24 lg:self-start">
                                    <h1 className="font-serif text-xl md:text-3xl lg:text-4xl font-medium text-primary-foreground leading-tight">
                                        {policy.title.split(" ").slice(0, -1).join(" ")}
                                        <br />
                                        {policy.title.split(" ").slice(-1)[0]}
                                    </h1>
                                    <p className="mt-4 sm:mt-6 text-base sm:text-lg text-primary-foreground/70 leading-relaxed max-w-sm">
                                        {getPolicyDescription(policy.handle, brandName) ||
                                            `Read our ${policy.title.toLowerCase()} to understand your rights and our commitments.`}
                                    </p>

                                    {/* Other Policies Navigation */}
                                    <div className="mt-8 pt-8 border-t border-primary-foreground/20">
                                        <p className="text-sm text-primary-foreground/50 mb-4">Other Policies</p>
                                        <nav className="space-y-2">
                                            {SIDEBAR_LINKS.filter(link => link.handle !== policy.handle).map(link => (
                                                <Link
                                                    key={link.handle}
                                                    to={`/policies/${link.handle}`}
                                                    prefetch="viewport"
                                                    className="group flex items-center gap-2 py-1 text-primary-foreground/70 hover:text-primary-foreground hover:no-underline"
                                                >
                                                    <span className="text-primary-foreground/40 sleek group-hover:text-primary-foreground group-hover:translate-x-1">
                                                        &rarr;
                                                    </span>
                                                    {link.title}
                                                </Link>
                                            ))}
                                        </nav>
                                    </div>
                                </div>

                                {/* Policy Content */}
                                <div>
                                    <article
                                        className="policy-content policy-content-dark"
                                        dangerouslySetInnerHTML={{__html: policy.body}}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <section className="bg-primary-foreground/10 py-12 sm:py-16 md:py-20">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium text-primary-foreground mb-3 sm:mb-4">
                                Questions about this policy?
                            </h2>
                            <p className="text-base sm:text-lg text-primary-foreground/70 mb-6 sm:mb-8 max-w-lg mx-auto">
                                Our team is here to help clarify any details. Reach out and we&apos;ll respond within 24
                                hours.
                            </p>
                            <a
                                href="/contact"
                                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-primary-foreground text-primary text-base sm:text-lg font-medium hover:bg-primary-foreground/90 min-h-12 sm:min-h-14"
                            >
                                Contact Us
                                <span className="ml-2">&rarr;</span>
                            </a>
                        </div>
                    </div>
                </section>
            </AnimatedSection>
        </div>
    );
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

/**
 * Fetches a single policy using conditional includes.
 *
 * Uses @include directives to fetch only the requested policy,
 * avoiding unnecessary data transfer. All policy types share
 * the same Policy fragment structure.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/ShopPolicy
 */
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
