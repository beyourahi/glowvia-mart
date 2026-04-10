/**
 * @fileoverview Collapsible component for expandable/collapsible content sections
 *
 * @description
 * Single section that can be expanded or collapsed with smooth transitions.
 * For multiple related sections, use Accordion instead.
 *
 * @radix-ui
 * - Primitive: @radix-ui/react-collapsible
 * - Animation: Supports CSS animations/transitions on content
 * - Controlled/Uncontrolled: Supports both usage patterns
 *
 * @accessibility
 * - ARIA: Proper button role on trigger, expanded state communicated
 * - Keyboard: Space/Enter to toggle expansion
 * - Screen readers: Expanded/collapsed state announced
 *
 * @related
 * - ~/components/ui/accordion.tsx - Multiple collapsible sections with accordion behavior
 */

"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

/**
 * Root collapsible container
 * @param open - Controlled open state
 * @param onOpenChange - Callback when open state changes
 */
function Collapsible({...props}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
    return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

/**
 * Button that toggles collapsible content
 */
function CollapsibleTrigger({...props}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
    return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

/**
 * Content area that expands/collapses
 * Add CSS transitions/animations via className
 */
function CollapsibleContent({...props}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
    return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />;
}

export {Collapsible, CollapsibleTrigger, CollapsibleContent};
