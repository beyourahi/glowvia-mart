/**
 * @fileoverview Style & Fit Quiz — Decision Tree
 * Translates style/fit preferences into search query + localStorage profile key.
 */

export type StyleProfile = {
    fit?: "relaxed" | "regular" | "slim" | "oversized";
    style?: "casual" | "formal" | "streetwear" | "minimalist" | "eclectic";
    color?: "neutrals" | "bold" | "pastels" | "earth" | "monochrome";
};

export type StyleResult = {
    query: string;
    tags: string[];
    profileKey: string;
    label: string;
};

const STYLE_TAG_MAP: Record<NonNullable<StyleProfile["style"]>, string[]> = {
    casual: ["casual", "everyday", "relaxed-style"],
    formal: ["formal", "professional", "workwear"],
    streetwear: ["streetwear", "urban", "graphic"],
    minimalist: ["minimalist", "clean", "essentials"],
    eclectic: ["eclectic", "vintage", "pattern"],
};

export function resolveStyleQuery(profile: StyleProfile): StyleResult {
    const styleTags = profile.style ? STYLE_TAG_MAP[profile.style] : [];
    const colorTerm = profile.color ? profile.color.replace("monochrome", "monochromatic") : "";
    const fitTerm = profile.fit ?? "";
    const queryParts = [colorTerm, fitTerm, ...styleTags.slice(0, 2)].filter(Boolean);
    const query = queryParts.join(" ") || "new arrivals";

    const profileKey = [profile.style, profile.fit, profile.color].filter(Boolean).join("-");
    const label = [
        profile.style ? `${profile.style} style` : null,
        profile.fit ? `${profile.fit} fit` : null,
    ]
        .filter(Boolean)
        .join(", ") || "Your style";

    return {query, tags: styleTags, profileKey, label};
}
