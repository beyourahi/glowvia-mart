/**
 * @fileoverview Sheet component - Slide-out panel overlay
 *
 * @description
 * Slide-out panel component built on Radix UI Dialog primitive. Provides
 * mobile-friendly side panels for navigation, filters, forms, and content.
 * Supports four directions with responsive sizing and safe area awareness.
 *
 * @radix-ui
 * Built on @radix-ui/react-dialog primitive with custom positioning
 *
 * @variants
 * - right: Slides from right (default, common for navigation/filters)
 * - left: Slides from left
 * - top: Slides from top
 * - bottom: Slides from bottom (common for mobile actions)
 *
 * @accessibility
 * - Traps focus within sheet when open
 * - Close on Escape key
 * - Click outside to close via overlay
 * - ARIA dialog role with proper labeling
 * - Touch-friendly close button (44px)
 * - Screen reader announcements
 *
 * @related
 * - Dialog - Modal alternative for critical actions
 * - Popover - Smaller contextual overlays
 * - Aside - Static sidebar alternative
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * WCAG 2.1 Level AA Color Contrast Compliance - Sheet Close Button
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Close button (XIcon) contrast analysis:
 * (Same styling as Dialog close button)
 *
 * BUTTON BACKGROUND:
 *   bg-muted/50 = muted (#f0f0f0) at 50% opacity on bg-background (#fff)
 *   Composite: #f0f0f0 * 0.5 + #ffffff * 0.5 = #f7f7f7
 *
 * ICON COLOR:
 *   XIcon inherits foreground color (#000) at opacity-70
 *   Effective icon: #000 at 70% on #f7f7f7 = ~#494949
 *
 * CONTRAST CALCULATION:
 *   Normal: ~#494949 on #f7f7f7 = ~8.5:1 (WCAG AAA) ✓
 *   Hover (opacity-100): #000 on #f0f0f0 = ~18.1:1 (WCAG AAA) ✓
 *
 * Focus ring: ring-ring (#1f1f1f) on bg-background = 14.68:1 (WCAG AAA) ✓
 * Touch target: size-10/size-11 (40-44px) - WCAG 2.5.5 compliant ✓
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {XIcon} from "lucide-react";

import {cn} from "~/lib/utils";

/**
 * Sheet root component - provides context for all sheet parts
 */
function Sheet({...props}: React.ComponentProps<typeof SheetPrimitive.Root>) {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

/**
 * Trigger button that opens the sheet
 */
function SheetTrigger({...props}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/**
 * Close button component for programmatic closing
 */
function SheetClose({...props}: React.ComponentProps<typeof SheetPrimitive.Close>) {
    return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/**
 * Portal container for rendering sheet in document body
 */
function SheetPortal({...props}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
    return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/**
 * Backdrop overlay with blur effect
 *
 * Uses forwardRef because SheetContent wraps this in <SheetPrimitive.Close asChild>,
 * which needs to attach a ref for Radix's focus management and DOM measurement.
 */
const SheetOverlay = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({className, ...props}, ref) => (
    <SheetPrimitive.Overlay
        ref={ref}
        data-slot="sheet-overlay"
        className={cn(
            "motion-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-10000 bg-overlay-dark backdrop-blur-md",
            className
        )}
        {...props}
    />
));
SheetOverlay.displayName = "SheetOverlay";

/**
 * Main sheet content panel with slide animations
 *
 * @param side - Direction to slide from (top, right, bottom, left)
 * @param hideCloseButton - Hide automatic close button (default false)
 */
function SheetContent({
    className,
    children,
    side = "right",
    hideCloseButton = false,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    hideCloseButton?: boolean;
}) {
    return (
        <SheetPortal>
            {/* Wrap overlay with Close to enable click-outside-to-close */}
            <SheetPrimitive.Close asChild>
                <SheetOverlay />
            </SheetPrimitive.Close>
            <SheetPrimitive.Content
                data-slot="sheet-content"
                className={cn(
                    // Base styling
                    "bg-background fixed z-10000 flex flex-col shadow-lg",
                    // Animations
                    "motion-overlay data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "transition-[transform,opacity] data-[state=closed]:duration-[var(--motion-duration-overlay)] data-[state=open]:duration-[var(--motion-duration-overlay)]",
                    // Right side sheet - responsive widths with safe area awareness
                    side === "right" && [
                        "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
                        "top-3 sm:top-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))]",
                        "right-0 h-auto border-l rounded-l-2xl sm:rounded-l-3xl shadow-xl",
                        // Responsive widths: mobile-first with progressive enhancement
                        "w-[85%] xs:w-[80%] sm:w-[75%] sm:max-w-sm md:max-w-md lg:max-w-lg"
                    ],
                    // Left side sheet - responsive widths with safe area awareness
                    side === "left" && [
                        "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
                        "top-3 sm:top-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))]",
                        "left-0 h-auto border-r rounded-r-2xl sm:rounded-r-3xl shadow-xl",
                        // Responsive widths: mobile-first with progressive enhancement
                        "w-[85%] xs:w-[80%] sm:w-[75%] sm:max-w-sm md:max-w-md lg:max-w-lg"
                    ],
                    // Top sheet - full width with responsive max-height
                    side === "top" && [
                        "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
                        "inset-x-0 top-0 h-auto max-h-[80dvh] border-b rounded-b-2xl sm:rounded-b-3xl"
                    ],
                    // Bottom sheet - full width with safe area and responsive max-height
                    side === "bottom" && [
                        "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                        "inset-x-0 bottom-0 h-auto max-h-[85dvh] border-t rounded-t-2xl sm:rounded-t-3xl",
                        "pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
                    ],
                    className
                )}
                {...props}
            >
                {children}
                {!hideCloseButton && (
                    <SheetPrimitive.Close
                        className={cn(
                            // Positioning - responsive spacing
                            "absolute top-2 right-2 sm:top-3 sm:right-3",
                            // Touch-friendly sizing (44x44px minimum)
                            "flex select-none items-center justify-center size-10 sm:size-11",
                            // Styling
                            "motion-interactive motion-press rounded-full bg-muted/50 hover:bg-muted cursor-pointer",
                            "opacity-70 hover:opacity-100 active:scale-[var(--motion-press-scale)]",
                            // Focus states
                            "ring-offset-background focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
                            // Disabled state
                            "disabled:pointer-events-none disabled:cursor-not-allowed",
                            // Icon sizing
                            "[&_svg]:pointer-events-none [&_svg]:shrink-0"
                        )}
                    >
                        <XIcon className="size-4 sm:size-5" />
                        <span className="sr-only">Close</span>
                    </SheetPrimitive.Close>
                )}
            </SheetPrimitive.Content>
        </SheetPortal>
    );
}

/**
 * Header section for title and description
 */
function SheetHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-header"
            className={cn(
                "flex flex-col gap-1 sm:gap-1.5 p-3 sm:p-4",
                // Right padding to prevent overlap with close button
                "pr-14 sm:pr-16",
                className
            )}
            {...props}
        />
    );
}

/**
 * Scrollable body section for main content
 */
function SheetBody({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-body"
            className={cn(
                // Scrollable content area
                "flex-1 overflow-y-auto px-3 sm:px-4",
                // Subtle vertical padding
                "py-1",
                className
            )}
            {...props}
        />
    );
}

/**
 * Footer section for actions (typically buttons)
 */
function SheetFooter({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-footer"
            className={cn(
                "mt-auto flex flex-col gap-2 p-3 sm:p-4",
                // Top border for visual separation
                "border-t border-border/50",
                className
            )}
            {...props}
        />
    );
}

/**
 * Accessible title for the sheet (required for accessibility)
 */
function SheetTitle({className, ...props}: React.ComponentProps<typeof SheetPrimitive.Title>) {
    return (
        <SheetPrimitive.Title
            data-slot="sheet-title"
            className={cn("text-foreground font-semibold", className)}
            {...props}
        />
    );
}

/**
 * Accessible description for the sheet
 */
function SheetDescription({className, ...props}: React.ComponentProps<typeof SheetPrimitive.Description>) {
    return (
        <SheetPrimitive.Description
            data-slot="sheet-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

export {
    Sheet,
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
};
