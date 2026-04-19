import {cn} from "~/lib/utils";
import {BADGE_CONFIG, type BadgeType} from "~/lib/product-tags";

interface ProductBadgeProps {
    type: BadgeType;
    className?: string;
}

export function ProductBadge({type, className}: ProductBadgeProps) {
    const config = BADGE_CONFIG[type];

    if (!config) return null;

    const {label, className: badgeClassName} = config;

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center px-2 py-1 text-xs font-semibold uppercase tracking-wide rounded-md",
                badgeClassName,
                className
            )}
            aria-label={config.ariaLabel}
        >
            {label}
        </span>
    );
}

interface ProductBadgeStackProps {
    types: BadgeType[];
    className?: string;
}

export function ProductBadgeStack({types, className}: ProductBadgeStackProps) {
    if (!types || types.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
            {types.map(type => (
                <ProductBadge key={type} type={type} />
            ))}
        </div>
    );
}
