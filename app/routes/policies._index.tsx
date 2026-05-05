/**
 * @fileoverview Policies Index Page
 *
 * @description
 * Lists all store policies with links to their individual pages.
 * Queries each policy individually to confirm existence before rendering its
 * card — some stores may not have all four standard policies configured.
 * Always includes a link to the FAQ page regardless of policy availability.
 *
 * @route GET /policies
 *
 * @data-loading
 * Fetches each of the four policy types (privacy, shipping, refund, terms) in
 * sequence. Each is queried independently to handle partial policy configurations.
 * Uses long-cache since policy content rarely changes.
 *
 * @seo
 * Emits BreadcrumbList JSON-LD and, when `policyExtension` CMS fields are
 * populated, a FAQPage JSON-LD schema built from those key/value pairs.
 *
 * @related
 * - policies.$handle.tsx - Individual policy detail page
 * - lib/queries/policy.ts - POLICY_CONTENT_QUERY
 * - lib/agentic/structured-data.ts - generateFAQPageSchema
 */

import {Link, useLoaderData} from "react-router";
import type {Route} from "./+types/policies._index";
import {getSeoMeta} from "@shopify/hydrogen";
import {generateBreadcrumbListSchema, getBrandNameFromMatches, getRequiredSocialMeta, buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {generateFAQPageSchema} from "~/lib/agentic/structured-data";
import {AnimatedSection} from "~/components/AnimatedSection";
import {PageHeading} from "~/components/PageHeading";
import {POLICY_CONTENT_QUERY} from "~/lib/queries/policy";

const POLICY_ITEMS = [
    {handle: "privacy-policy", label: "Privacy Policy", description: "How we collect and use your information"},
    {handle: "shipping-policy", label: "Shipping Policy", description: "Delivery methods, timeframes, and costs"},
    {handle: "refund-policy", label: "Return & Refund Policy", description: "How to return items and get a refund"},
    {handle: "terms-of-service", label: "Terms of Service", description: "Rules and guidelines for using our services"}
] as const;

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const breadcrumbSchema = generateBreadcrumbListSchema([
        {name: "Home", url: "/"},
        {name: "Policies", url: "/policies"}
    ], siteUrl);

    const rootData = (matches.find(m => m?.id === "root") as any)?.data;
    const policyExtensions: Array<{key: string; value: string}> =
        rootData?.siteContent?.siteSettings?.policyExtension ?? [];
    const faqSchema = policyExtensions.length > 0
        ? generateFAQPageSchema(policyExtensions.map(ext => ({question: ext.key, answer: ext.value})))
        : null;

    return [
        ...(getSeoMeta({
            title: `Policies | ${brandName}`,
            description: `Review our store policies including shipping, returns, privacy, and terms of service.`,
            url: buildCanonicalUrl("/policies", siteUrl)
        }) ?? []),
        {"script:ld+json": breadcrumbSchema as any},
        ...(faqSchema ? [{"script:ld+json": faqSchema as any}] : []),
        ...getRequiredSocialMeta("website", brandName)
    ];
};

/**
 * Probes each policy type and returns a list indicating which are configured.
 * Policies that throw (e.g. network error) are treated as non-existent rather
 * than surfacing an error to the user.
 */
export async function loader({context}: Route.LoaderArgs) {
    // Fetch all four policies to confirm they exist (some stores may not have all)
    const policies: Array<{handle: string; label: string; description: string; exists: boolean}> = [];

    for (const item of POLICY_ITEMS) {
        try {
            const policyKey = item.handle.replace(/-([a-z])/g, (_: string, m: string) => m.toUpperCase()) as "privacyPolicy" | "shippingPolicy" | "refundPolicy" | "termsOfService";
            const data = await context.dataAdapter.query(POLICY_CONTENT_QUERY, {
                variables: {
                    privacyPolicy: false,
                    shippingPolicy: false,
                    termsOfService: false,
                    refundPolicy: false,
                    [policyKey]: true
                },
                cache: context.dataAdapter.CacheLong()
            });
            const exists = !!(data?.shop?.[policyKey]);
            policies.push({...item, exists});
        } catch {
            policies.push({...item, exists: false});
        }
    }

    return {policies};
}

export default function PoliciesIndex() {
    const {policies} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-dvh bg-primary">
            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-12 sm:pb-16 md:pb-24">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <PageHeading
                            variant="dark"
                            title="Policies"
                            description="Everything you need to know about shopping with us."
                        />
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <section className="pb-16 sm:pb-24 lg:pb-32">
                    <div className="px-4 sm:px-6 lg:px-8 max-w-2xl">
                        <div className="flex flex-col gap-3">
                            {policies.filter(p => p.exists).map((policy) => (
                                <Link
                                    key={policy.handle}
                                    to={`/policies/${policy.handle}`}
                                    prefetch="viewport"
                                    className="group flex flex-col gap-1 rounded-xl border border-primary-foreground/20 p-6 transition-colors hover:border-primary-foreground/40 hover:bg-primary-foreground/5"
                                >
                                    <span className="font-serif text-lg font-semibold text-primary-foreground group-hover:text-primary-foreground transition-colors">
                                        {policy.label}
                                    </span>
                                    <span className="text-sm text-primary-foreground/60">
                                        {policy.description}
                                    </span>
                                </Link>
                            ))}
                            <Link
                                to="/faq"
                                prefetch="viewport"
                                className="group flex flex-col gap-1 rounded-xl border border-primary-foreground/20 p-6 transition-colors hover:border-primary-foreground/40 hover:bg-primary-foreground/5"
                            >
                                <span className="font-serif text-lg font-semibold text-primary-foreground group-hover:text-primary-foreground transition-colors">
                                    Frequently Asked Questions
                                </span>
                                <span className="text-sm text-primary-foreground/60">
                                    Answers to common questions about our products and services
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>
            </AnimatedSection>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
