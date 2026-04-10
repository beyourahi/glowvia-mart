/**
 * Parses product titles that use " + " as a semantic separator.
 * e.g. "Rose + Oud" -> { primary: "Rose", secondary: "Oud", full: "Rose + Oud" }
 *
 * Splits on first " + " (space-plus-space) only. Titles with multiple separators
 * (e.g. "A + B + C") yield primary="A", secondary="B + C".
 */
export function parseProductTitle(title: string): {
    primary: string;
    secondary: string | null;
    full: string;
} {
    const trimmed = title.trim();
    const idx = trimmed.indexOf(" + ");
    if (idx === -1) {
        return {primary: trimmed, secondary: null, full: trimmed};
    }
    const primary = trimmed.substring(0, idx).trim();
    const secondary = trimmed.substring(idx + 3).trim() || null;
    return {primary, secondary, full: trimmed};
}

/**
 * Formats a product title for plaintext contexts (document title, meta tags).
 * Replaces " + " with " | " for cleaner browser tab display.
 * e.g. "Rose + Oud" -> "Rose | Oud"
 */
export function formatProductTitleForMeta(title: string): string {
    const {primary, secondary} = parseProductTitle(title);
    if (!secondary) return primary;
    return `${primary} | ${secondary}`;
}
