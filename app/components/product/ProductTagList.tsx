/**
 * @fileoverview Shopper-facing product tag badges for the PDP, QuickAddSheet, and QuickAddDialog.
 *
 * System tags (pin, premium, preorder, new, clearance) are filtered out by
 * `filterDisplayTags` and surfaced elsewhere via `ProductBadgeStack`. The tag icon is
 * intentionally omitted above the title — it would read as a metadata footer.
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
                    className="border text-primary font-semibold text-xs px-2 py-0.5 uppercase tracking-wide"
                >
                    {tag}
                </Badge>
            ))}
        </div>
    );
}
