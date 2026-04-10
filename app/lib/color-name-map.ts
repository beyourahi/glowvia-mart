/**
 * @fileoverview Color Name to Hex Mapping Utility
 *
 * @description
 * Provides a comprehensive mapping of common color names to their HEX values
 * for use in product variant color swatches. This utility enables color swatch
 * rendering when Shopify swatch data isn't available in the product fragment.
 *
 * @usage
 * ```typescript
 * import { getColorHex, isColorOption } from '~/lib/color-name-map';
 *
 * // Check if an option is a color type
 * if (isColorOption(optionName)) {
 *   const hex = getColorHex(optionValue);
 *   // hex will be the color or undefined if not found
 * }
 * ```
 *
 * @architecture
 * - Primary color map covers ~150 common color names
 * - Supports case-insensitive matching
 * - Handles common variations (Gray/Grey, etc.)
 * - Includes brand-specific colors if needed
 *
 * @related
 * - QuickAddDialog.tsx - Uses this for variant swatch display
 * - QuickAddSheet.tsx - Uses this for variant swatch display
 * - ColorSwatch.tsx - Unified swatch component
 *
 * @maintenance
 * Add new color mappings as needed when new products are added.
 * Color values should be in standard HEX format (#RRGGBB).
 */

// =============================================================================
// COLOR NAME TO HEX MAPPING
// =============================================================================

/**
 * Comprehensive mapping of color names to HEX values
 *
 * Organized by color family for easier maintenance.
 * All keys are lowercase for case-insensitive matching.
 * Uses standard web colors plus common fashion/retail color names.
 */
const COLOR_MAP: Record<string, string> = {
    // -------------------------------------------------------------------------
    // Neutrals
    // -------------------------------------------------------------------------
    white: "#FFFFFF",
    "off-white": "#FAF9F6",
    "off white": "#FAF9F6",
    offwhite: "#FAF9F6",
    ivory: "#FFFFF0",
    cream: "#FFFDD0",
    beige: "#F5F5DC",
    tan: "#D2B48C",
    khaki: "#C3B091",
    taupe: "#483C32",
    sand: "#C2B280",
    oatmeal: "#D3C7A6",
    bone: "#E3DAC9",

    // -------------------------------------------------------------------------
    // Blacks & Grays
    // -------------------------------------------------------------------------
    black: "#000000",
    charcoal: "#36454F",
    graphite: "#383838",
    slate: "#708090",
    gray: "#808080",
    grey: "#808080",
    "dark gray": "#404040",
    "dark grey": "#404040",
    darkgray: "#404040",
    darkgrey: "#404040",
    "light gray": "#D3D3D3",
    "light grey": "#D3D3D3",
    lightgray: "#D3D3D3",
    lightgrey: "#D3D3D3",
    silver: "#C0C0C0",
    ash: "#B2BEB5",
    pewter: "#8A8D8F",
    gunmetal: "#2A3439",
    heather: "#9EAEB0",
    "heather gray": "#9EAEB0",
    "heather grey": "#9EAEB0",

    // -------------------------------------------------------------------------
    // Blues
    // -------------------------------------------------------------------------
    blue: "#0000FF",
    navy: "#000080",
    "navy blue": "#000080",
    "dark blue": "#00008B",
    darkblue: "#00008B",
    "light blue": "#ADD8E6",
    lightblue: "#ADD8E6",
    "sky blue": "#87CEEB",
    skyblue: "#87CEEB",
    "baby blue": "#89CFF0",
    babyblue: "#89CFF0",
    royal: "#4169E1",
    "royal blue": "#4169E1",
    royalblue: "#4169E1",
    cobalt: "#0047AB",
    azure: "#007FFF",
    cerulean: "#007BA7",
    sapphire: "#0F52BA",
    indigo: "#4B0082",
    teal: "#008080",
    turquoise: "#40E0D0",
    aqua: "#00FFFF",
    cyan: "#00FFFF",
    "powder blue": "#B0E0E6",
    powderblue: "#B0E0E6",
    steel: "#4682B4",
    "steel blue": "#4682B4",
    steelblue: "#4682B4",
    denim: "#1560BD",
    ocean: "#006994",
    midnight: "#191970",
    "midnight blue": "#191970",
    periwinkle: "#CCCCFF",
    cadet: "#5F9EA0",

    // -------------------------------------------------------------------------
    // Greens
    // -------------------------------------------------------------------------
    green: "#008000",
    "dark green": "#006400",
    darkgreen: "#006400",
    "light green": "#90EE90",
    lightgreen: "#90EE90",
    "forest green": "#228B22",
    forestgreen: "#228B22",
    olive: "#808000",
    "olive green": "#6B8E23",
    olivegreen: "#6B8E23",
    sage: "#BCB88A",
    mint: "#98FB98",
    "mint green": "#98FF98",
    mintgreen: "#98FF98",
    lime: "#00FF00",
    "lime green": "#32CD32",
    limegreen: "#32CD32",
    emerald: "#50C878",
    jade: "#00A86B",
    hunter: "#355E3B",
    "hunter green": "#355E3B",
    huntergreen: "#355E3B",
    moss: "#8A9A5B",
    army: "#4B5320",
    "army green": "#4B5320",
    armygreen: "#4B5320",
    seafoam: "#71EEB8",
    "sea foam": "#71EEB8",
    // teal is already defined in Blues section
    chartreuse: "#7FFF00",
    avocado: "#568203",
    pistachio: "#93C572",
    kelly: "#4CBB17",
    "kelly green": "#4CBB17",
    kellygreen: "#4CBB17",

    // -------------------------------------------------------------------------
    // Reds
    // -------------------------------------------------------------------------
    red: "#FF0000",
    "dark red": "#8B0000",
    darkred: "#8B0000",
    crimson: "#DC143C",
    maroon: "#800000",
    burgundy: "#800020",
    wine: "#722F37",
    cherry: "#DE3163",
    scarlet: "#FF2400",
    ruby: "#E0115F",
    brick: "#CB4154",
    "brick red": "#CB4154",
    brickred: "#CB4154",
    cardinal: "#C41E3A",
    vermillion: "#E34234",
    vermilion: "#E34234",
    raspberry: "#E30B5C",
    cranberry: "#9E003A",
    blood: "#8A0303",
    "blood red": "#8A0303",
    oxblood: "#4A0000",
    rust: "#B7410E",
    mahogany: "#C04000",
    garnet: "#733635",
    merlot: "#730039",

    // -------------------------------------------------------------------------
    // Pinks
    // -------------------------------------------------------------------------
    pink: "#FFC0CB",
    "light pink": "#FFB6C1",
    lightpink: "#FFB6C1",
    "hot pink": "#FF69B4",
    hotpink: "#FF69B4",
    "deep pink": "#FF1493",
    deeppink: "#FF1493",
    fuchsia: "#FF00FF",
    magenta: "#FF00FF",
    rose: "#FF007F",
    blush: "#DE5D83",
    coral: "#FF7F50",
    salmon: "#FA8072",
    peach: "#FFCBA4",
    dusty: "#D58E96",
    "dusty pink": "#D58E96",
    dustypink: "#D58E96",
    "dusty rose": "#DCAE96",
    dustyrose: "#DCAE96",
    mauve: "#E0B0FF",
    bubblegum: "#FFC1CC",
    carnation: "#FFA6C9",
    flamingo: "#FC8EAC",
    watermelon: "#FD4659",

    // -------------------------------------------------------------------------
    // Oranges
    // -------------------------------------------------------------------------
    orange: "#FFA500",
    "dark orange": "#FF8C00",
    darkorange: "#FF8C00",
    "burnt orange": "#CC5500",
    burntorange: "#CC5500",
    tangerine: "#FF9966",
    apricot: "#FBCEB1",
    persimmon: "#EC5800",
    pumpkin: "#FF7518",
    copper: "#B87333",
    amber: "#FFBF00",
    terracotta: "#E2725B",
    terra: "#E2725B",
    "terra cotta": "#E2725B",
    papaya: "#FFEFD5",
    mango: "#FF8243",
    carrot: "#ED9121",
    ginger: "#B06500",

    // -------------------------------------------------------------------------
    // Yellows
    // -------------------------------------------------------------------------
    yellow: "#FFFF00",
    gold: "#FFD700",
    golden: "#DAA520",
    mustard: "#FFDB58",
    lemon: "#FFF44F",
    canary: "#FFEF00",
    butter: "#FFFACD",
    honey: "#EB9605",
    maize: "#FBEC5D",
    champagne: "#F7E7CE",
    saffron: "#F4C430",
    flax: "#EEDC82",
    banana: "#FFE135",
    dandelion: "#F0E130",
    corn: "#FBEC5D",
    wheat: "#F5DEB3",
    blonde: "#FAF0BE",
    sunshine: "#FFFD37",

    // -------------------------------------------------------------------------
    // Purples & Violets
    // -------------------------------------------------------------------------
    purple: "#800080",
    violet: "#EE82EE",
    lavender: "#E6E6FA",
    lilac: "#C8A2C8",
    plum: "#DDA0DD",
    orchid: "#DA70D6",
    grape: "#6F2DA8",
    eggplant: "#614051",
    aubergine: "#614051",
    amethyst: "#9966CC",
    wisteria: "#C9A0DC",
    // wine is already defined in Reds section
    mulberry: "#C54B8C",
    heliotrope: "#DF73FF",
    iris: "#5A4FCF",
    thistle: "#D8BFD8",
    // mauve is already defined in Pinks section
    byzantium: "#702963",
    // royal is already defined in Blues section (royal blue)
    "royal purple": "#7851A9",
    royalpurple: "#7851A9",

    // -------------------------------------------------------------------------
    // Browns
    // -------------------------------------------------------------------------
    brown: "#A52A2A",
    "dark brown": "#5C4033",
    darkbrown: "#5C4033",
    "light brown": "#B5651D",
    lightbrown: "#B5651D",
    chocolate: "#7B3F00",
    coffee: "#6F4E37",
    mocha: "#967969",
    espresso: "#3C2415",
    caramel: "#FFD59A",
    chestnut: "#954535",
    cinnamon: "#D2691E",
    cocoa: "#D2691E",
    cognac: "#9F381D",
    sienna: "#A0522D",
    sepia: "#704214",
    umber: "#635147",
    walnut: "#773F1A",
    hazel: "#8E7618",
    toffee: "#755139",
    fawn: "#E5AA70",
    camel: "#C19A6B",
    tobacco: "#715E50",
    nutmeg: "#7E5D3B",
    saddle: "#8B4513",

    // -------------------------------------------------------------------------
    // Metallics
    // -------------------------------------------------------------------------
    "rose gold": "#B76E79",
    rosegold: "#B76E79",
    bronze: "#CD7F32",
    brass: "#B5A642",
    chrome: "#DBE4EB",
    platinum: "#E5E4E2",
    titanium: "#878681",
    nickel: "#727472",

    // -------------------------------------------------------------------------
    // Multi/Special
    // -------------------------------------------------------------------------
    rainbow: "#FF0000",
    multi: "#888888",
    multicolor: "#888888",
    "multi-color": "#888888",
    multicolour: "#888888",
    "multi-colour": "#888888",
    print: "#888888",
    pattern: "#888888",
    camo: "#78866B",
    camouflage: "#78866B",
    tie: "#888888",
    "tie-dye": "#888888",
    tiedye: "#888888",
    ombre: "#888888",
    gradient: "#888888",
    clear: "#F5F5F5",
    transparent: "#F5F5F5",
    natural: "#F5F5DC",
    nude: "#E3BC9A"
};

// =============================================================================
// OPTION NAME DETECTION
// =============================================================================

/**
 * Common option names that indicate a color-type option
 * Case-insensitive matching will be applied
 */
const COLOR_OPTION_NAMES = [
    "color",
    "colour",
    "shade",
    "finish",
    "hue",
    "tone"
    // Add localized versions if needed
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the HEX color value for a color name
 *
 * @param colorName - The color name to look up (case-insensitive)
 * @returns HEX color string or undefined if not found
 *
 * @example
 * ```typescript
 * getColorHex("Navy Blue") // Returns "#000080"
 * getColorHex("Unknown Color") // Returns undefined
 * ```
 */
export function getColorHex(colorName: string | undefined | null): string | undefined {
    if (!colorName) return undefined;

    // Normalize the color name: lowercase, trim whitespace
    const normalized = colorName.toLowerCase().trim();

    return COLOR_MAP[normalized];
}

/**
 * Check if an option name indicates a color-type option
 *
 * @param optionName - The option name to check
 * @returns true if this is likely a color option
 *
 * @example
 * ```typescript
 * isColorOption("Color") // Returns true
 * isColorOption("Size") // Returns false
 * isColorOption("Colour") // Returns true
 * ```
 */
export function isColorOption(optionName: string | undefined | null): boolean {
    if (!optionName) return false;

    const normalized = optionName.toLowerCase().trim();
    return COLOR_OPTION_NAMES.some(name => normalized.includes(name));
}

/**
 * Get a swatch-compatible color object from a color name
 *
 * Returns an object that matches the Shopify swatch structure,
 * allowing it to be used with the ColorSwatch component.
 *
 * @param colorName - The color name to convert
 * @returns Object with color property, or undefined if not found
 *
 * @example
 * ```typescript
 * getSwatchFromColorName("Navy")
 * // Returns: { color: "#000080" }
 * ```
 */
export function getSwatchFromColorName(colorName: string | undefined | null): {color: string} | undefined {
    const hex = getColorHex(colorName);
    if (!hex) return undefined;

    return {color: hex};
}

/**
 * Check if a color name has a known mapping
 *
 * @param colorName - The color name to check
 * @returns true if the color has a known HEX mapping
 */
export function hasColorMapping(colorName: string | undefined | null): boolean {
    return getColorHex(colorName) !== undefined;
}
