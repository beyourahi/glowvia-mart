/**
 * @fileoverview Accordion component for collapsible content sections
 *
 * @description
 * Provides vertically stacked sections that can be expanded/collapsed to reveal content.
 * Built with Radix UI primitives and styled with Tailwind CSS.
 *
 * @radix-ui
 * - Primitive: @radix-ui/react-accordion
 * - Type support: Single or multiple expanded items
 * - Animation: Smooth expand/collapse transitions
 *
 * @accessibility
 * - ARIA: Proper accordion, header, button, and region roles
 * - Keyboard: Arrow Up/Down navigation, Home/End keys, Space/Enter to toggle
 * - Focus: Visible focus ring on trigger elements
 * - Screen readers: Expanded/collapsed state announced
 *
 * @related
 * - ~/components/ui/collapsible.tsx - Single collapsible section without accordion behavior
 */

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {ChevronDownIcon} from "lucide-react";

import {cn} from "~/lib/utils";

/**
 * Root accordion container
 * @param type - "single" (one item open) or "multiple" (multiple items open)
 * @param collapsible - Allow closing all items in single mode (default: false)
 */
function Accordion({...props}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
    return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

/**
 * Individual accordion item with border separator
 */
function AccordionItem({className, ...props}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            className={cn("border-b last:border-b-0", className)}
            {...props}
        />
    );
}

/**
 * Clickable header that toggles accordion content
 * Includes animated chevron icon that rotates when expanded
 */
function AccordionTrigger({className, children, ...props}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                className={cn(
                    "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 cursor-pointer select-none items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[0.1875rem] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

/**
 * Animated content area with slide down/up transitions
 */
function AccordionContent({className, children, ...props}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
    return (
        <AccordionPrimitive.Content
            data-slot="accordion-content"
            className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
            {...props}
        >
            <div className={cn("pt-0 pb-4", className)}>{children}</div>
        </AccordionPrimitive.Content>
    );
}

export {Accordion, AccordionItem, AccordionTrigger, AccordionContent};
