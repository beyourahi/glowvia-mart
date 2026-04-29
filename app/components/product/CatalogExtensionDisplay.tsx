import {Link} from "react-router";
import {Layers} from "lucide-react";
import {Badge} from "~/components/ui/badge";
import {cn} from "~/lib/utils";

type SellingPlan = {
    name: string;
    recurringDeliveries?: boolean;
};

type ProductCollection = {
    handle: string;
    title: string;
};

export type CatalogExtensionDisplayProps = {
    isGiftCard?: boolean;
    requiresShipping?: boolean;
    sellingPlans?: SellingPlan[];
    collections?: ProductCollection[];
    className?: string;
};

export const CatalogExtensionDisplay = ({
    isGiftCard,
    requiresShipping,
    sellingPlans,
    collections,
    className
}: CatalogExtensionDisplayProps) => {
    const hasContent =
        isGiftCard ||
        requiresShipping === false ||
        (sellingPlans && sellingPlans.length > 0) ||
        (collections && collections.length > 0);

    if (!hasContent) return null;

    return (
        <ul
            className={cn("flex flex-col gap-1.5 text-xs", className)}
            aria-label="Product details"
        >
            {isGiftCard && (
                <li className="flex items-center gap-2">
                    <span className="inline-block h-1 w-1 rounded-full bg-foreground/40 shrink-0" aria-hidden="true" />
                    <span className="text-foreground/60">
                        <span className="font-medium text-foreground/80">Gift Card</span>
                    </span>
                </li>
            )}
            {requiresShipping === false && (
                <li className="flex items-center gap-2">
                    <span className="inline-block h-1 w-1 rounded-full bg-foreground/40 shrink-0" aria-hidden="true" />
                    <span className="text-foreground/60">
                        <span className="font-medium text-foreground/80">Digital product</span>
                        {" — no shipping required"}
                    </span>
                </li>
            )}
            {sellingPlans && sellingPlans.length > 0 && (
                <li
                    className="flex items-center gap-2"
                    aria-label={`Subscription options: ${sellingPlans.map(p => p.name).join(", ")}`}
                >
                    <span className="inline-block h-1 w-1 rounded-full bg-foreground/40 shrink-0" aria-hidden="true" />
                    <span className="text-foreground/60">
                        <span className="font-medium text-foreground/80">Subscribe &amp; save</span>
                        {sellingPlans.length === 1
                            ? ` — ${sellingPlans[0].name}`
                            : ` — ${sellingPlans.length} plans available`}
                    </span>
                </li>
            )}
            {collections && collections.length > 0 && (
                <li
                    className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
                    aria-label={`Also in: ${collections.map(c => c.title).join(", ")}`}
                >
                    <span className="flex items-center gap-2 shrink-0">
                        <span className="inline-block h-1 w-1 rounded-full bg-foreground/40 shrink-0" aria-hidden="true" />
                        <span className="flex items-center gap-1 text-xs text-foreground/60">
                            <Layers className="h-3 w-3" aria-hidden="true" />
                            <span className="font-medium text-foreground/80">Also in</span>
                        </span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {collections.map(c => (
                            <Badge key={c.handle} asChild variant="outline" className="text-xs font-normal cursor-pointer">
                                <Link to={`/collections/${c.handle}`} prefetch="intent" viewTransition>
                                    {c.title}
                                </Link>
                            </Badge>
                        ))}
                    </div>
                </li>
            )}
        </ul>
    );
};
