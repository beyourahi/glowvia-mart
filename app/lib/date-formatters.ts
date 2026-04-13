/**
 * @fileoverview Date formatting utilities for the changelog
 *
 * @description
 * SSR-safe date formatters using the Intl API.
 * Cloudflare Workers supports Intl natively; no polyfills needed.
 */

const relativeFormatter = new Intl.RelativeTimeFormat("en", {numeric: "auto"});

const absoluteFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC" // ISO date-only strings parse as UTC midnight — format in UTC to match
});

/**
 * Returns a human-readable relative date string.
 * e.g. "just now", "3 days ago", "2 months ago"
 */
export function formatRelativeDate(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = then - now;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);
    const diffMon = Math.round(diffDay / 30);
    const diffYr = Math.round(diffDay / 365);

    if (Math.abs(diffSec) < 60) return "just now";
    if (Math.abs(diffMin) < 60) return relativeFormatter.format(diffMin, "minute");
    if (Math.abs(diffHr) < 24) return relativeFormatter.format(diffHr, "hour");
    if (Math.abs(diffDay) < 30) return relativeFormatter.format(diffDay, "day");
    if (Math.abs(diffMon) < 12) return relativeFormatter.format(diffMon, "month");
    return relativeFormatter.format(diffYr, "year");
}

/**
 * Returns a formatted absolute date string.
 * e.g. "Apr 7, 2026"
 */
export function formatAbsoluteDate(isoDate: string): string {
    return absoluteFormatter.format(new Date(isoDate));
}

/**
 * Returns a human-readable relative day label for a changelog date group header.
 * e.g. "Today", "Yesterday", "3 days ago", "2 weeks ago", "4 months ago"
 *
 * Compares calendar dates (midnight → midnight) rather than raw milliseconds,
 * so the result is stable regardless of what time of day it currently is.
 *
 * Uses LOCAL date components (not UTC) for "today" because entry dates like
 * "2026-04-13" are local calendar days — authored and read in local time. If
 * UTC has already rolled over to the next day while the local calendar is still
 * on the previous day (or vice-versa), using getUTCDate() would produce the
 * wrong relative label (e.g. "Yesterday" for today's entries).
 */
export function formatRelativeDayLabel(isoDate: string): string {
    const now = new Date();
    // Anchor "today" to the LOCAL calendar date, then express it as UTC midnight
    // so it can be compared directly with entry timestamps (date-only ISO strings
    // parse as UTC midnight). This keeps both sides in the same unit (ms) without
    // introducing a timezone offset error in the day-difference calculation.
    const todayUtcMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const entryUtcMs = new Date(isoDate).getTime(); // date-only ISO strings parse as UTC midnight
    const diffDays = Math.round((entryUtcMs - todayUtcMs) / 86_400_000);

    let raw: string;
    if (Math.abs(diffDays) < 7) raw = relativeFormatter.format(diffDays, "day");
    else if (Math.abs(diffDays) < 30) raw = relativeFormatter.format(Math.round(diffDays / 7), "week");
    else if (Math.abs(diffDays) < 365) raw = relativeFormatter.format(Math.round(diffDays / 30), "month");
    else raw = relativeFormatter.format(Math.round(diffDays / 365), "year");

    // Capitalize the first character ("today" → "Today", "3 days ago" → "3 days ago")
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}
