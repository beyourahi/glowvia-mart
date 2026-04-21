/**
 * @fileoverview Regular product tag badges for the product detail page
 *
 * @description
 * Displays all shopper-facing product tags (categorization metadata) as compact
 * pill badges at the bottom of the product info section. Special system tags
 * (pin, premium, preorder, new, clearance) are filtered out — those are surfaced
 * via ProductBadgeStack and the preorder button logic.
 *
 * @design
 * Intentionally subdued so it reads as metadata, not promotion:
 * - Rounded-full pills (distinct from rounded-md uppercase special badges)
 * - Muted background + muted-foreground text (~5.32:1 contrast, WCAG AA ✓)
 * - text-xs, normal casing (preserves merchant-entered capitalization)
 * - Lucide Tag icon as a semantic leading label, not decorative filler
 *
 * @placement
 * - Desktop: after ProductDescription, as the final info-panel element
 * - Mobile: after ProductDescription, before the coral ProductHeroMobile hero
 *
 * @a11y
 * - Leading icon is aria-hidden; the region uses aria-label="Product tags"
 * - Tags render as plain spans (non-interactive) to signal metadata, not filters
 */

import {Tag} from "lucide-react";
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
            <Tag
                className="size-3.5 shrink-0 text-muted-foreground/70"
                aria-hidden="true"
                strokeWidth={1.75}
            />
            {displayTags.map(tag => (
                <Badge
                    key={tag}
                    variant="secondary"
                    // bg-muted on muted-foreground = 5.32:1 (WCAG AA) ✓
                    // font-normal + text-xs keeps it as metadata, not a CTA
                    className="bg-muted text-muted-foreground font-normal text-xs px-2.5 py-0.5 border-transparent hover:bg-muted/80"
                >
                    {tag}
                </Badge>
            ))}
        </div>
    );
}
