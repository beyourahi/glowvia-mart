/**
 * @fileoverview Gift Finder Quiz — Decision Tree
 * Pure function that maps quiz answers to a Storefront API search query string.
 * No UI or routing logic — consumed by both the /gift-finder route and the
 * gift_finder agent tool (Phase 3).
 */

export type GiftFinderAnswers = {
    recipient?: "him" | "her" | "them" | "kids";
    budget?: "under25" | "25to75" | "75to150" | "over150";
    occasion?: "birthday" | "anniversary" | "holiday" | "justbecause";
    interest?: "fashion" | "wellness" | "tech" | "home" | "outdoor";
};

export type GiftFinderResult = {
    query: string;
    filters: Record<string, string>;
    headline: string;
};

const INTEREST_TAGS: Record<NonNullable<GiftFinderAnswers["interest"]>, string[]> = {
    fashion: ["apparel", "accessories", "jewelry"],
    wellness: ["wellness", "skincare", "beauty"],
    tech: ["tech", "gadgets", "electronics"],
    home: ["home", "decor", "kitchen"],
    outdoor: ["outdoor", "sports", "adventure"],
};

const BUDGET_RANGES: Record<NonNullable<GiftFinderAnswers["budget"]>, {min?: number; max?: number}> = {
    under25: {max: 25},
    "25to75": {min: 25, max: 75},
    "75to150": {min: 75, max: 150},
    over150: {min: 150},
};

export function resolveGiftQuery(answers: GiftFinderAnswers): GiftFinderResult {
    const tags = answers.interest ? INTEREST_TAGS[answers.interest] : [];
    const query = tags.length > 0 ? tags.join(" OR ") : "gift";
    const budget = answers.budget ? BUDGET_RANGES[answers.budget] : {};
    const filters: Record<string, string> = {};
    if (budget.min != null) filters.price_min = String(budget.min);
    if (budget.max != null) filters.price_max = String(budget.max);

    const headlines: string[] = [];
    if (answers.recipient) headlines.push(`Gifts for ${answers.recipient === "them" ? "everyone" : answers.recipient}`);
    if (answers.occasion) headlines.push(`perfect for ${answers.occasion.replace("justbecause", "any occasion")}`);
    const headline = headlines.join(", ") || "Curated gift picks";

    return {query, filters, headline};
}
