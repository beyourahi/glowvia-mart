/**
 * @fileoverview Shopper-facing product tags — unified above-title badge row
 *
 * @description
 * Renders filtered product tags (system tags — pin, premium, preorder, new,
 * clearance — are excluded and surfaced via ProductBadgeStack / preorder button
 * logic instead). Used as a single primitive directly above the product title
 * on the PDP, QuickAddSheet, and QuickAddDialog for consistent placement,
 * styling, spacing, and semantics across every surface.
 *
 * @placement
 * Immediately above the product title in:
 * - PDP mobile + desktop layouts
 * - QuickAddSheet header
 * - QuickAddDialog header
 *
 * @design
 * Outline pill treatment that reads as a category highlight, not metadata:
 * - rounded-full outline pills in text-primary, border on --primary
 * - font-semibold, uppercase, tracking-wide keeps each tag terse and scannable
 * - text-xs fits comfortably above titles at every breakpoint
 * - Tag icon intentionally omitted — above the title, the badges themselves
 *   are the label; a leading icon would read as a metadata footer again
 *
 * @a11y
 * - role="group" + aria-label="Product tags" identifies the region
 * - Tags render as plain Badge spans (non-interactive metadata, not filters)
 * - text-primary on transparent over --background stays within WCAG AA contrast
 */

import {Badge} from "~/components/ui/badge";
import {filterDisplayTags} from "~/lib/product-tags";
import {cn} from "~/lib/utils";

interface ProductTagListProps {
    /** Raw tags array from Shopify (system tags filtered internally) */
    tags: string[] | undefined | null;
    /** Optional classes applied to the wrapper element */
    className?: string;
}

export function ProductTagList({tags, className}: ProductTagListProps) {
    const displayTags = filterDisplayTags(tags);

    if (displayTags.length === 0) return null;

    return (
        <div
            role="group"
            aria-label="Product tags"
            className={cn("flex flex-wrap items-center gap-1.5", className)}
        >
            {displayTags.map(tag => (
                <Badge
                    key={tag}
                    variant="outline"
                    className="border text-primary font-semibold text-xs px-2.5 py-0.5 uppercase tracking-wide"
                >
                    {tag}
                </Badge>
            ))}
        </div>
    );
}
