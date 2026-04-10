/**
 * @fileoverview FAQSection - Homepage FAQ accordion with sticky layout
 *
 * @description
 * Condensed FAQ section for homepage with two-column desktop layout (sticky heading + scrollable Q&A).
 * Uses shadcn accordion component with smooth animations and keyboard navigation.
 *
 * @features
 * - **Two-Column Layout**: Sticky heading/description (left) + scrollable accordion (right) on desktop
 * - **Responsive Stacking**: Single column on mobile/tablet with stacked layout
 * - **Accordion Component**: shadcn accordion with multiple open items, smooth transitions
 * - **Scroll Area**: Fixed-height scrollable list (500px-600px) on desktop
 * - **Staggered Animations**: 50ms delays for sequential item reveals
 * - **CMS Integration**: FAQ items from faq metaobject, configurable title
 *
 * @props
 * - faqItems: FAQItem[] - FAQ questions and answers
 * - maxItems: Maximum items to display (default: 10)
 * - title: Section title (default: "Frequently Asked Questions")
 *
 * @related
 * - types/index.ts - FAQItem type definition
 * - components/ui/accordion.tsx - shadcn accordion implementation
 * - routes/faq.tsx - Full FAQ page with complete list
 */

import {Link} from "react-router";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {ScrollArea} from "~/components/ui/scroll-area";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import type {FAQItem} from "types";

// ============================================================================
// Types
// ============================================================================

interface FAQSectionProps {
    /** FAQ items to display */
    faqItems: FAQItem[];
    /** Maximum number of items to show (default: 10) */
    maxItems?: number;
    /** Section title (default: "Frequently Asked Questions") */
    title?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * FAQ Section for Homepage
 *
 * Layout structure:
 * - **Desktop (lg+)**: Two-column grid with sticky heading (left) and scrollable accordion (right)
 * - **Mobile/Tablet**: Stacked layout with heading above accordion
 *
 * Displays a condensed FAQ accordion with a link to the full FAQ page.
 * Design matches the luxury, minimalistic aesthetic of other homepage sections.
 *
 * Features:
 * - Responsive two-column layout (desktop) / stacked (mobile)
 * - Sticky heading on desktop with scrollable FAQ list
 * - shadcn accordion with smooth animations
 * - "View All" link to full FAQ page
 * - Respects reduced motion preferences
 */
export function FAQSection({faqItems, maxItems = 10, title = "Frequently Asked Questions"}: FAQSectionProps) {
    // Return null if no FAQ items
    if (!faqItems || faqItems.length === 0) {
        return null;
    }

    // Limit displayed items
    const displayedItems = faqItems.slice(0, maxItems);
    const hasMoreItems = faqItems.length > maxItems;

    return (
        <section className="py-10 sm:py-12 md:py-16">
            {/* Mobile header - shown above grid on mobile/tablet */}
            <div className="lg:hidden flex items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-primary mb-0">
                    {title}
                </h2>
                <Link
                    to="/faq"
                    prefetch="viewport"
                    className="hidden md:inline-flex shrink-0 rounded-full border-2 border-primary px-3 sm:px-4 py-1.5 font-sans text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground no-underline"
                >
                    View All
                </Link>
            </div>

            {/* Two-column layout on desktop, stacked on mobile */}
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-[2fr_3fr] lg:gap-12 xl:gap-16">
                {/* Left: Sticky heading, description & CTA */}
                <div className="lg:sticky lg:top-32 lg:self-start">
                    {/* Desktop heading - inside sticky container */}
                    <h2 className="hidden lg:block font-serif text-2xl md:text-3xl font-medium text-primary mb-4 xl:mb-6">
                        {title}
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
                        Find quick answers to common questions about orders, shipping, returns, and more.
                    </p>

                    {/* Desktop CTA */}
                    {hasMoreItems && (
                        <Link
                            to="/faq"
                            prefetch="viewport"
                            className="hidden lg:inline-flex mt-6 rounded-full border-2 border-primary px-3 sm:px-4 py-2 font-sans text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground no-underline"
                        >
                            View All FAQ
                        </Link>
                    )}
                </div>

                {/* Right: Scrollable FAQ Accordion */}
                <ScrollArea className="lg:h-[500px] xl:h-[550px] 2xl:h-[600px] pr-4">
                    <div className="animate-product-fade-in">
                        <Accordion type="multiple" className="w-full" defaultValue={["faq-0"]}>
                            {displayedItems.map((item, index) => (
                                <AccordionItem
                                    key={item.id}
                                    value={`faq-${index}`}
                                    className={cn("border-border/40", "animate-product-fade-in")}
                                    style={{animationDelay: `${index * 50}ms`}}
                                >
                                    <AccordionTrigger
                                        className={cn(
                                            "min-h-14 sm:min-h-16 py-4 sm:py-5",
                                            "gap-3 sm:gap-4 text-left",
                                            "text-base font-medium",
                                            "text-foreground hover:text-primary",
                                            "hover:no-underline hover:bg-muted/50 sleek",
                                            "[&>svg]:text-primary/60 [&>svg]:size-4 sm:[&>svg]:size-5"
                                        )}
                                    >
                                        <span className="flex items-start gap-3">
                                            <span className="shrink-0 mt-2 size-1.5 sm:size-2 rounded-full bg-primary/40" />
                                            {item.question}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent
                                        className={cn(
                                            "text-sm sm:text-base leading-relaxed",
                                            "text-muted-foreground",
                                            "pb-5 sm:pb-6 pl-5 sm:pl-6"
                                        )}
                                    >
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </ScrollArea>
            </div>

            {/* Mobile View All Button */}
            {hasMoreItems && (
                <div className="mt-6 sm:mt-8 flex justify-center lg:hidden">
                    <Button
                        variant="outline"
                        size="default"
                        asChild
                        className="min-h-10 sm:min-h-12 px-6 sm:px-8 text-sm sm:text-base"
                    >
                        <Link to="/faq" prefetch="viewport">
                            View All FAQ
                        </Link>
                    </Button>
                </div>
            )}
        </section>
    );
}
