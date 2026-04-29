import {Link} from "react-router";
import {Layers, ArrowRight} from "lucide-react";
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
                <li aria-label={`Also found in: ${collections.map(c => c.title).join(", ")}`}>
                    <div className="rounded-lg border border-primary/20 bg-primary/6 px-3.5 py-2.5">
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/70 select-none">
                            <Layers className="h-3 w-3" aria-hidden="true" />
                            Also found in
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {collections.map(c => (
                                <Badge
                                    key={c.handle}
                                    asChild
                                    variant="outline"
                                    className="border-primary/30 bg-primary/10 text-primary text-xs font-medium transition-all duration-150 can-hover:scale-[1.03] can-hover:bg-primary/15 can-hover:border-primary/50 can-hover:shadow-sm"
                                >
                                    <Link to={`/collections/${c.handle}`} prefetch="intent" viewTransition>
                                        {c.title}
                                        <ArrowRight className="opacity-50" />
                                    </Link>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </li>
            )}
        </ul>
    );
};
