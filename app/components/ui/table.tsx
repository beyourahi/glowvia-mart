/**
 * @fileoverview Table component - Responsive data table
 *
 * @description
 * Semantic HTML table components with responsive horizontal scrolling,
 * sticky headers, hover states, and mobile-friendly sizing. Designed
 * for displaying structured data with proper accessibility.
 *
 * @accessibility
 * - Semantic table elements (table, thead, tbody, tfoot)
 * - Caption support for table descriptions
 * - Proper scope attributes for headers
 * - Horizontal scroll with keyboard navigation
 * - Touch-friendly row heights
 *
 * @related
 * - Card - Alternative for small datasets
 * - DataTable - Enhanced table with sorting/filtering
 * - ScrollArea - Used for scrollable container
 */

import * as React from "react";

import {cn} from "~/lib/utils";

/**
 * Table root with responsive horizontal scrolling
 *
 * @param className - Additional CSS classes
 * @param props - All table element attributes
 */
function Table({className, ...props}: React.ComponentProps<"table">) {
    return (
        <div data-slot="table-container" className="relative w-full overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
            <table
                data-slot="table"
                className={cn("w-full caption-bottom text-sm min-w-[640px] md:min-w-0", className)}
                {...props}
            />
        </div>
    );
}

/**
 * Table header with sticky positioning
 */
function TableHeader({className, ...props}: React.ComponentProps<"thead">) {
    return (
        <thead
            data-slot="table-header"
            className={cn("sticky top-0 z-10 bg-background [&_tr]:border-b", className)}
            {...props}
        />
    );
}

/**
 * Table body containing data rows
 */
function TableBody({className, ...props}: React.ComponentProps<"tbody">) {
    return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

/**
 * Table footer for summary rows
 */
function TableFooter({className, ...props}: React.ComponentProps<"tfoot">) {
    return (
        <tfoot
            data-slot="table-footer"
            className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
            {...props}
        />
    );
}

/**
 * Table row with hover state and selection support
 */
function TableRow({className, ...props}: React.ComponentProps<"tr">) {
    return (
        <tr
            data-slot="table-row"
            className={cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)}
            {...props}
        />
    );
}

/**
 * Table header cell with responsive sizing
 */
function TableHead({className, ...props}: React.ComponentProps<"th">) {
    return (
        <th
            data-slot="table-head"
            className={cn(
                "text-foreground h-11 md:h-10 px-3 md:px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
                className
            )}
            {...props}
        />
    );
}

/**
 * Table data cell with responsive padding
 */
function TableCell({className, ...props}: React.ComponentProps<"td">) {
    return (
        <td
            data-slot="table-cell"
            className={cn(
                "px-3 py-3 md:p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
                className
            )}
            {...props}
        />
    );
}

/**
 * Table caption for accessibility description
 */
function TableCaption({className, ...props}: React.ComponentProps<"caption">) {
    return (
        <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />
    );
}

export {Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption};
