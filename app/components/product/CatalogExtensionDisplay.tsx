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
        (collections && collections.length > 1);

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
            {collections && collections.length > 1 && (
                <li
                    className="flex items-center gap-2"
                    aria-label={`Collections: ${collections.map(c => c.title).join(", ")}`}
                >
                    <span className="inline-block h-1 w-1 rounded-full bg-foreground/40 shrink-0" aria-hidden="true" />
                    <span className="text-foreground/60">
                        <span className="font-medium text-foreground/80">
                            In {collections.length} collections
                        </span>
                    </span>
                </li>
            )}
        </ul>
    );
};
