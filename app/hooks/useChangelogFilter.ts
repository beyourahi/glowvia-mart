/**
 * @fileoverview Changelog filter hook
 *
 * @description
 * Client-side filtering and search for changelog entries.
 * Uses a 200ms debounce on the search input to avoid filtering on every keystroke.
 */

import {useState, useMemo, useRef} from "react";
import type {ChangelogEntry} from "~/lib/types/changelog";

export function useChangelogFilter(entries: ChangelogEntry[]) {
    const [rawSearch, setRawSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setSearch = (q: string) => {
        setRawSearch(q);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setDebouncedSearch(q), 200);
    };

    const filteredEntries = useMemo(() => {
        let result = entries;

        if (activeCategory) {
            result = result.filter(e => e.category === activeCategory);
        }

        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase();
            result = result.filter(
                e => e.headline.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q)
            );
        }

        return result;
    }, [entries, activeCategory, debouncedSearch]);

    return {
        filteredEntries,
        setSearch,
        setCategory: setActiveCategory,
        activeCategory,
        searchQuery: rawSearch,
        isEmpty: filteredEntries.length === 0
    };
}
