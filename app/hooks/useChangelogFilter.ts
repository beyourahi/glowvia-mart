/**
 * @fileoverview Changelog filter hook
 *
 * @description
 * Client-side category filtering for changelog entries.
 */

import {useState, useMemo} from "react";
import type {ChangelogEntry} from "~/lib/types/changelog";

export function useChangelogFilter(entries: ChangelogEntry[]) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filteredEntries = useMemo(() => {
        if (!activeCategory) return entries;
        return entries.filter(e => e.category === activeCategory);
    }, [entries, activeCategory]);

    return {
        filteredEntries,
        setCategory: setActiveCategory,
        activeCategory,
        isEmpty: filteredEntries.length === 0
    };
}
