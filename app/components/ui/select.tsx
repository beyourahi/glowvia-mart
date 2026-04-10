/**
 * @fileoverview Select component - Accessible dropdown select
 *
 * @description
 * Fully accessible dropdown select component built on Radix UI Select primitive.
 * Provides keyboard navigation, type-ahead search, and responsive sizing.
 * Supports grouped options, custom styling, and two size variants.
 *
 * @radix-ui
 * Built on @radix-ui/react-select with full primitive composition
 *
 * @variants
 * - default: Standard height (44px mobile, 36px desktop)
 * - sm: Compact height (40px mobile, 32px desktop)
 *
 * @accessibility
 * - Full keyboard navigation (arrows, home, end, type-ahead)
 * - ARIA combobox role with proper attributes
 * - Touch-friendly sizing (44px minimum on mobile)
 * - Focus-visible ring for keyboard users
 * - Error state with aria-invalid support
 *
 * @related
 * - Input - Text input alternative
 * - Combobox - Searchable select alternative
 * - RadioGroup - Radio button alternative for few options
 */

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {CheckIcon, ChevronDownIcon, ChevronUpIcon} from "lucide-react";

import {cn} from "~/lib/utils";

/**
 * Select root component - provides context for all select parts
 */
function Select({...props}: React.ComponentProps<typeof SelectPrimitive.Root>) {
    return <SelectPrimitive.Root data-slot="select" {...props} />;
}

/**
 * Select group container for organizing related options
 */
function SelectGroup({...props}: React.ComponentProps<typeof SelectPrimitive.Group>) {
    return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

/**
 * Displays the currently selected value or placeholder
 */
function SelectValue({...props}: React.ComponentProps<typeof SelectPrimitive.Value>) {
    return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

/**
 * Trigger button that opens the select dropdown
 *
 * @param size - Visual size variant (default or sm)
 */
function SelectTrigger({
    className,
    size = "default",
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "default";
}) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                // Base styles
                "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground flex w-fit select-none items-center justify-between gap-2 rounded-md border bg-transparent whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                // Responsive sizing: touch-friendly on mobile (44px), smaller on desktop
                "px-3 py-2 text-base sm:text-sm",
                // Height: h-11 (44px) mobile, h-10 tablet, h-9/h-8 desktop based on size
                "data-[size=default]:h-11 data-[size=sm]:h-10 sm:data-[size=default]:h-10 sm:data-[size=sm]:h-9 md:data-[size=default]:h-9 md:data-[size=sm]:h-8",
                // Focus states
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.1875rem]",
                // Error states
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                // Value styling
                "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className="size-4 opacity-50" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

/**
 * Dropdown content container with portal rendering and animations
 *
 * @param position - Positioning strategy (popper or item-aligned)
 * @param align - Alignment relative to trigger (start, center, end)
 */
function SelectContent({
    className,
    children,
    position = "popper",
    align = "center",
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                data-slot="select-content"
                className={cn(
                    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
                    position === "popper" &&
                        "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
                    className
                )}
                position={position}
                align={align}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport
                    className={cn(
                        "p-1",
                        position === "popper" &&
                            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
                    )}
                >
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

/**
 * Label for option groups within the select
 */
function SelectLabel({className, ...props}: React.ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label
            data-slot="select-label"
            className={cn("text-muted-foreground px-2 py-1.5 text-sm", className)}
            {...props}
        />
    );
}

/**
 * Individual selectable option with check indicator
 */
function SelectItem({className, children, ...props}: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                // Base styles
                "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm outline-hidden select-none",
                // Responsive padding: larger on mobile for touch targets (min 44px height)
                "py-3 pr-10 pl-3 text-base sm:py-2 sm:pr-8 sm:pl-2 sm:text-sm",
                // Disabled states
                "data-disabled:pointer-events-none data-disabled:opacity-50",
                // SVG styling
                "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
                className
            )}
            {...props}
        >
            <span className="absolute right-3 flex size-4 items-center justify-center sm:right-2 sm:size-3.5">
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="size-4" />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

/**
 * Visual separator between option groups
 */
function SelectSeparator({className, ...props}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
            {...props}
        />
    );
}

/**
 * Scroll up button for long option lists
 */
function SelectScrollUpButton({className, ...props}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton
            data-slot="select-scroll-up-button"
            className={cn("flex cursor-pointer select-none items-center justify-center py-1", className)}
            {...props}
        >
            <ChevronUpIcon className="size-4" />
        </SelectPrimitive.ScrollUpButton>
    );
}

/**
 * Scroll down button for long option lists
 */
function SelectScrollDownButton({className, ...props}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton
            data-slot="select-scroll-down-button"
            className={cn("flex cursor-pointer select-none items-center justify-center py-1", className)}
            {...props}
        >
            <ChevronDownIcon className="size-4" />
        </SelectPrimitive.ScrollDownButton>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue
};
