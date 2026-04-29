import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {type SortOption} from "~/components/CollectionPageLayout";

export type {SortOption};

interface CollectionSortProps {
    sortOption: SortOption;
    onSortChange: (sort: SortOption) => void;
    /** Class name applied to the wrapper element */
    className?: string;
}

const SORT_PILLS: {label: string; value: SortOption}[] = [
    {label: "Newest", value: "newest"},
    {label: "Best Selling", value: "best-selling"},
    {label: "A-Z", value: "title-asc"},
    {label: "Z-A", value: "title-desc"},
    {label: "Price ↑", value: "price-asc"},
    {label: "Price ↓", value: "price-desc"}
];

/**
 * Standalone sort pill selector for collection pages (feature 13 — smart sorting).
 * Renders as a horizontal scrollable carousel on mobile and a flex-wrap row on desktop.
 * Sort state is managed externally via useSortOption() from CollectionPageLayout.
 */
export function CollectionSort({sortOption, onSortChange, className}: CollectionSortProps) {
    return (
        <>
            {/* Mobile: horizontal scrollable carousel */}
            <div className={cn("md:hidden overflow-x-auto scrollbar-hide", className)}>
                <div className="flex items-center gap-1.5 sm:gap-2 snap-x snap-mandatory">
                    {SORT_PILLS.map(pill => (
                        <div key={pill.value} className="snap-start">
                            <Button
                                type="button"
                                variant={sortOption === pill.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => onSortChange(pill.value)}
                                className="whitespace-nowrap font-sans text-sm transition-all duration-300 ease-out"
                            >
                                {pill.label}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop: flex-wrap */}
            <div className={cn("hidden md:flex flex-wrap items-center gap-2", className)}>
                {SORT_PILLS.map(pill => (
                    <Button
                        key={pill.value}
                        type="button"
                        variant={sortOption === pill.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSortChange(pill.value)}
                        className="whitespace-nowrap font-sans text-sm sm:text-sm md:text-base transition-all duration-300 ease-out"
                    >
                        {pill.label}
                    </Button>
                ))}
            </div>
        </>
    );
}
