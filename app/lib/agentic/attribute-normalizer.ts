/**
 * @fileoverview Product attribute normalizer
 * Phase 3: Maps Shopify variant selectedOptions and product metafields to
 * Schema.org-aligned canonical vocabulary. Reusable by Phase 4 cart tools.
 */

export type NormalizedAttribute = {
    propertyID: string;
    name: string;
    value: string;
    normalizedValue?: string;
};

type SelectedOption = {name: string; value: string};
type MetafieldEntry = {namespace: string; key: string; value: string; type?: string};

// Canonical option name → propertyID mapping
const OPTION_PROPERTY_ID_MAP: Record<string, string> = {
    color: "color",
    colour: "color",
    size: "size",
    sizes: "size",
    material: "material",
    fabric: "material",
    fit: "fit",
    pattern: "pattern",
    style: "style",
    length: "length",
    weight: "weight"
};

// Standard size normalization (display → canonical)
const SIZE_NORMALIZATION: Record<string, string> = {
    "extra small": "XS",
    "small": "S",
    "medium": "M",
    "large": "L",
    "extra large": "XL",
    "xx-large": "XXL",
    "2xl": "XXL",
    "3xl": "3XL",
    "4xl": "4XL",
    "xxl": "XXL",
    "xxxl": "3XL"
};

function normalizeOptionName(raw: string): string {
    return raw.toLowerCase().trim();
}

function slugify(str: string): string {
    return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalizeSize(value: string): string | undefined {
    const lower = value.toLowerCase().trim();
    // Already canonical (XS, S, M, L, XL, XXL, etc.)
    if (/^(xs|s|m|l|xl|xxl|[0-9]xl)$/i.test(lower)) {
        return value.toUpperCase();
    }
    return SIZE_NORMALIZATION[lower];
}

/**
 * Normalize product variant options and metafields to Schema.org-aligned attributes.
 * Returns an array ready to be spread into generateProductSchema's 6th arg.
 */
export function normalizeProductAttributes(
    selectedOptions: SelectedOption[],
    metafields?: MetafieldEntry[]
): NormalizedAttribute[] {
    const attrs: NormalizedAttribute[] = [];
    const seen = new Set<string>();

    for (const opt of selectedOptions) {
        const normalizedName = normalizeOptionName(opt.name);
        const propertyID = OPTION_PROPERTY_ID_MAP[normalizedName] ?? slugify(opt.name);

        if (seen.has(propertyID)) continue;
        seen.add(propertyID);

        let normalizedValue: string | undefined;
        if (propertyID === "size") {
            normalizedValue = normalizeSize(opt.value);
        }

        attrs.push({
            propertyID,
            name: opt.name,
            value: opt.value,
            ...(normalizedValue != null && {normalizedValue})
        });
    }

    // Process metafields that aren't already covered by selectedOptions
    if (metafields) {
        for (const mf of metafields) {
            const key = mf.key.toLowerCase();
            const propertyID = OPTION_PROPERTY_ID_MAP[key] ?? slugify(mf.key);
            if (seen.has(propertyID)) continue;
            seen.add(propertyID);
            attrs.push({propertyID, name: mf.key, value: mf.value});
        }
    }

    return attrs;
}
