/**
 * @fileoverview FAQ (Frequently Asked Questions) Page
 *
 * @description
 * Displays FAQ items in an accordion format with structured data
 * for search engine rich results. Content is CMS-driven with fallbacks.
 *
 * @route GET /faq
 *
 * @features
 * - Accordion-based FAQ display (all open by default)
 * - Two-column sticky layout (heading + questions)
 * - FAQPage JSON-LD structured data for SEO
 * - CMS-driven content from site_settings
 * - Returns 404 when no FAQ data exists in CMS
 * - Contact CTA section at bottom
 *
 * @design
 * - Primary background throughout
 * - Sticky heading column on desktop
 * - Minimal accordion styling (no chevrons)
 * - Bullet point indicators for each question
 *
 * @seo
 * Uses FAQPage schema for search engine rich results:
 * - Questions appear directly in search results
 * - Improves click-through rates
 * - Requires proper question/answer format
 *
 * @cms-integration
 * FAQ items from site_settings metaobject faq_items field.
 * Throws 404 if no FAQ data exists in CMS.
 *
 * @accessibility
 * - Accordion semantics with proper ARIA
 * - Touch-friendly tap targets
 * - Readable font sizes
 *
 * @related
 * - lib/seo.ts - generateFAQPageSchema function
 * - lib/site-content-context.tsx - useFaqItems hook
 * - root.tsx - Provides siteContent via context (includes faqItems)
 * - contact.tsx - Linked from CTA section
 */

import type {Route} from "./+types/faq";
import {getSeoMeta} from "@shopify/hydrogen";
import {AnimatedSection} from "~/components/AnimatedSection";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches, generateFAQPageSchema} from "~/lib/seo";
import {useFaqItems} from "~/lib/site-content-context";

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);

    // Extract FAQ items from root loader data for JSON-LD structured data
    const rootData = (
        matches.find(m => m?.id === "root") as
            | {data?: {siteContent?: {siteSettings?: {faqItems?: Array<{question: string; answer: string}>}}}}
            | undefined
    )?.data;
    const faqItems = rootData?.siteContent?.siteSettings?.faqItems;
    const faqSchema = faqItems?.length ? generateFAQPageSchema(faqItems) : undefined;

    return (
        getSeoMeta({
            title: "Frequently Asked Questions",
            titleTemplate: `%s | ${brandName}`,
            description: `Find answers to frequently asked questions about orders, shipping, returns, products, and more at ${brandName}.`,
            url: buildCanonicalUrl("/faq", siteUrl),
            jsonLd: faqSchema as any
        }) ?? []
    );
};

export default function FAQ() {
    const faqItems = useFaqItems();

    if (!faqItems || faqItems.length === 0) {
        throw new Response("Not found", {status: 404});
    }

    return (
        <div className="min-h-dvh bg-primary">
            <AnimatedSection animation="fade" threshold={0.08}>
            <section className="pt-32 sm:pt-36 md:pt-44 lg:pt-52 xl:pt-64 pb-12 sm:pb-16 md:pb-24 lg:pb-32">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div>
                        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
                            {/* Sticky FAQ Heading */}
                            <div className="lg:sticky lg:top-32 lg:self-start">
                                <h1 className="font-serif text-xl md:text-3xl lg:text-4xl font-medium text-primary-foreground leading-tight">
                                    Frequently Asked{" "}
                                    <br />
                                    Questions
                                </h1>
                                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-primary-foreground/70 leading-relaxed max-w-sm">
                                    Find answers to common questions about orders, shipping, returns, and more.
                                </p>
                                <p className="mt-4 text-sm text-primary-foreground/50">{faqItems.length} questions</p>
                            </div>

                            {/* FAQ Items - All Open by Default */}
                            <div>
                                <Accordion
                                    type="multiple"
                                    defaultValue={faqItems.map((_, index) => `faq-${index}`)}
                                    className="w-full"
                                >
                                    {faqItems.map((item, index) => {
                                        const itemId = `faq-${index}`;
                                        return (
                                            <AccordionItem
                                                key={itemId}
                                                value={itemId}
                                                className="border-primary-foreground/20"
                                            >
                                                <AccordionTrigger className="min-h-14 sm:min-h-16 py-4 sm:py-5 gap-3 sm:gap-4 text-left text-base sm:text-lg font-medium text-primary-foreground hover:text-primary-foreground/80 hover:no-underline [&>svg]:hidden">
                                                    <span className="flex items-start gap-3">
                                                        <span className="shrink-0 mt-2 size-2 rounded-full bg-primary-foreground/60" />
                                                        {item.question}
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-base sm:text-lg leading-relaxed text-primary-foreground! pb-5 sm:pb-6">
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
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
                            Still have questions?
                        </h2>
                        <p className="text-base sm:text-lg text-primary-foreground/70 mb-6 sm:mb-8 max-w-lg mx-auto">
                            Our team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
                        </p>
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-primary-foreground text-primary text-sm sm:text-base font-medium hover:bg-primary-foreground/90 min-h-12 sm:min-h-14"
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

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
