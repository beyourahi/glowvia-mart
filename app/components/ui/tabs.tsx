/**
 * @fileoverview Tabs component - Accessible tab navigation
 *
 * @description
 * Custom tabs component with full keyboard navigation and ARIA compliance.
 * Provides controlled/uncontrolled modes, horizontal/vertical orientations,
 * and automatic focus management. Built from scratch without Radix dependency.
 *
 * @accessibility
 * - Full keyboard navigation (arrows, home, end)
 * - ARIA tablist, tab, and tabpanel roles
 * - Automatic focus management
 * - aria-selected for active state
 * - aria-controls linking tabs to panels
 * - Single tab stop (roving tabindex)
 *
 * @related
 * - Accordion - Collapsible alternative
 * - RadioGroup - Radio button alternative for few options
 * - Select - Dropdown alternative for many options
 */

import * as React from "react";
import {cn} from "~/lib/utils";

// Context for sharing tab state
interface TabsContextValue {
    activeValue: string;
    setActiveValue: (value: string) => void;
    orientation: "horizontal" | "vertical";
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
    const context = React.useContext(TabsContext);
    if (!context) {
        throw new Error("Tabs components must be used within a Tabs provider");
    }
    return context;
}

// Tabs Root Component
interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    orientation?: "horizontal" | "vertical";
    className?: string;
    children: React.ReactNode;
}

/**
 * Tabs root component - provides context for all tab parts
 *
 * @param defaultValue - Initial active tab (uncontrolled mode)
 * @param value - Active tab value (controlled mode)
 * @param onValueChange - Callback when tab changes
 * @param orientation - Tab direction (horizontal or vertical)
 */
function Tabs({
    defaultValue,
    value: controlledValue,
    onValueChange,
    orientation = "horizontal",
    className,
    children
}: TabsProps) {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
    const isControlled = controlledValue !== undefined;
    const activeValue = isControlled ? controlledValue : internalValue;

    const setActiveValue = (newValue: string) => {
        if (!isControlled) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
    };

    const contextValue = {
        activeValue,
        setActiveValue,
        orientation
    };

    return (
        <TabsContext.Provider value={contextValue}>
            <div data-slot="tabs" className={cn("flex flex-col gap-2", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

// TabsList Component
interface TabsListProps {
    className?: string;
    children: React.ReactNode;
}

/**
 * Container for tab triggers with keyboard navigation
 *
 * Handles arrow key navigation, home/end keys, and focus management
 */
function TabsList({className, children}: TabsListProps) {
    const {orientation} = useTabsContext();
    const listRef = React.useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const triggers = Array.from(
            listRef.current?.querySelectorAll('[role="tab"]:not([disabled])') ?? []
        ) as HTMLButtonElement[];

        if (triggers.length === 0) return;

        const currentIndex = triggers.findIndex(trigger => trigger === document.activeElement);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;

        switch (e.key) {
            case "ArrowRight":
            case "ArrowDown":
                e.preventDefault();
                nextIndex = (currentIndex + 1) % triggers.length;
                break;
            case "ArrowLeft":
            case "ArrowUp":
                e.preventDefault();
                nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
                break;
            case "Home":
                e.preventDefault();
                nextIndex = 0;
                break;
            case "End":
                e.preventDefault();
                nextIndex = triggers.length - 1;
                break;
            default:
                return;
        }

        triggers[nextIndex]?.focus();
    };

    return (
        <div
            ref={listRef}
            data-slot="tabs-list"
            role="tablist"
            aria-orientation={orientation}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={cn(
                "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[0.1875rem]",
                className
            )}
        >
            {children}
        </div>
    );
}

// TabsTrigger Component
interface TabsTriggerProps {
    value: string;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

/**
 * Individual tab button with ARIA attributes and states
 *
 * @param value - Unique identifier for this tab
 * @param disabled - Whether tab is disabled
 */
function TabsTrigger({value, disabled = false, className, children}: TabsTriggerProps) {
    const {activeValue, setActiveValue} = useTabsContext();
    const isActive = activeValue === value;
    const baseId = React.useId();
    const triggerId = `${baseId}-trigger`;
    const panelId = `${baseId}-panel`;

    const handleClick = () => {
        if (!disabled) {
            setActiveValue(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) {
                setActiveValue(value);
            }
        }
    };

    return (
        <button
            id={triggerId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            aria-disabled={disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            data-slot="tabs-trigger"
            data-state={isActive ? "active" : "inactive"}
            data-disabled={disabled ? "true" : undefined}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={cn(
                "data-[state=active]:bg-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground inline-flex h-[calc(100%-0.0625rem)] flex-1 select-none items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[0.1875rem] focus-visible:outline-1 cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
        >
            {children}
        </button>
    );
}

// TabsContent Component
interface TabsContentProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

/**
 * Panel containing content for a tab
 *
 * Only renders when tab is active, automatically linked to trigger
 *
 * @param value - Must match a TabsTrigger value
 */
function TabsContent({value, className, children}: TabsContentProps) {
    const {activeValue} = useTabsContext();
    const isActive = activeValue === value;
    const baseId = React.useId();
    const triggerId = `${baseId}-trigger`;
    const panelId = `${baseId}-panel`;

    if (!isActive) return null;

    return (
        <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={triggerId}
            tabIndex={0}
            data-slot="tabs-content"
            data-state={isActive ? "active" : "inactive"}
            className={cn("flex-1 outline-none", className)}
        >
            {children}
        </div>
    );
}

export {Tabs, TabsList, TabsTrigger, TabsContent};
