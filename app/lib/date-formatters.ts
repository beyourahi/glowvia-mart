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
 * Compares UTC calendar dates (midnight → midnight) rather than raw milliseconds,
 * so the result is stable regardless of what time of day it currently is.
 */
export function formatRelativeDayLabel(isoDate: string): string {
    const now = new Date();
    // Anchor both sides to UTC midnight to avoid time-of-day drift
    const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
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
