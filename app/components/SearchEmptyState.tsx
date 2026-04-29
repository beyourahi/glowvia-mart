import * as React from "react";
import {Link, useFetcher} from "react-router";
import {SearchX} from "lucide-react";

/**
 * Empty state shown when a search yields no results.
 * Fetches predictive suggestions via useFetcher to offer alternative queries
 * without blocking the main render. Suggestions render as pill links once loaded.
 */
export function SearchEmptyState({term}: {term: string}) {
    // Non-blocking fetch for alternative query suggestions when no results are found
    const fetcher = useFetcher<{queries?: {text: string; styledText: string}[]}>();

    React.useEffect(() => {
        if (term) {
            void fetcher.load(`/search?predictive=true&q=${encodeURIComponent(term)}`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [term]);

    // Up to 3 suggestions; graceful no-op if fetch is pending, errored, or returns nothing
    const suggestions = fetcher.data?.queries?.slice(0, 3) ?? [];

    return (
        <div className="py-10 sm:py-16 text-center px-4">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted/50 mb-4 sm:mb-6">
                <SearchX className="size-6 sm:size-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-primary mb-2 sm:mb-3">No results found</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-sm sm:max-w-md mx-auto leading-relaxed">
                We couldn&rsquo;t find anything for &ldquo;{term}&rdquo;.
            </p>
            <p className="text-sm text-muted-foreground/80 mt-2">
                Try a different search term or browse our collections.
            </p>
            {suggestions.length > 0 && (
                <div className="mt-6">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60 mb-3">
                        Try searching for
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {suggestions.map(suggestion => (
                            <Link
                                key={suggestion.text}
                                to={`/search?q=${encodeURIComponent(suggestion.text)}`}
                                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {suggestion.text}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
