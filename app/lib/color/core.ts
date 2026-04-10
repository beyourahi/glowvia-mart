/**
 * @fileoverview Color.js Wrapper with OKLCH-First Design
 *
 * @description
 * Thin wrapper around Color.js providing consistent color handling with:
 * - OKLCH-first color manipulation (perceptually uniform)
 * - Automatic gamut mapping to sRGB for display
 * - Format-agnostic parsing (OKLCH, HEX, RGB, HSL, P3)
 * - Tree-shakeable imports for bundle optimization
 *
 * @architecture
 * Color Pipeline:
 * 1. Parse any format → Color.js object
 * 2. Manipulate in OKLCH (perceptually uniform)
 * 3. Convert to sRGB with gamut mapping for output
 *
 * Why Color.js?
 * - Created by CSS Color spec editors (Lea Verou, Chris Lilley)
 * - Used by Sass, axe accessibility engine, Open Props
 * - Full CSS Color 4 compliance with proper gamut mapping
 * - Both WCAG 2.1 and APCA algorithms built-in
 *
 * @dependencies
 * - colorjs.io (npm package)
 *
 * @related
 * - types.ts - Type definitions
 * - contrast.ts - Contrast calculations using these utilities
 * - swatch.ts - Border color utilities
 *
 * @see https://colorjs.io/
 */

import Color from "colorjs.io";

import type {RGB, OKLCH, GamutMapOptions} from "./types";

// =============================================================================
// COLOR PARSING
// =============================================================================

/**
 * Parse any supported color format to Color.js object
 *
 * Supports:
 * - OKLCH: "oklch(0.6 0.1 45)", "oklch(0.6 0.1 45 / 0.5)"
 * - HEX: "#fff", "#ffffff", "#ffffffaa"
 * - RGB: "rgb(255, 255, 255)", "rgb(100% 50% 0%)"
 * - HSL: "hsl(180, 50%, 50%)"
 * - Display P3: "color(display-p3 1 0 0)"
 * - Named colors: "red", "blue", "transparent"
 *
 * @param colorString - Color string in any supported format
 * @returns Color.js Color object or null if parsing fails
 */
export function parseColor(colorString: string): Color | null {
    if (!colorString) return null;

    try {
        return new Color(colorString.trim());
    } catch {
        return null;
    }
}

/**
 * Check if a color string is valid and parseable
 */
export function isValidColor(colorString: string | null | undefined): boolean {
    if (!colorString) return false;
    return parseColor(colorString) !== null;
}

// =============================================================================
// COLOR SPACE CONVERSION
// =============================================================================

/**
 * Convert color to OKLCH coordinates
 *
 * @param colorString - Color in any supported format
 * @returns OKLCH object or null if parsing fails
 */
export function toOklch(colorString: string): OKLCH | null {
    const color = parseColor(colorString);
    if (!color) return null;

    try {
        const oklch = color.to("oklch");
        const l = oklch.coords[0] ?? 0;
        const c = oklch.coords[1] ?? 0;
        const h = oklch.coords[2];
        return {
            l,
            c,
            // Handle achromatic colors (NaN hue)
            h: h == null || Number.isNaN(h) ? 0 : h
        };
    } catch {
        return null;
    }
}

/**
 * Convert color to sRGB with automatic gamut mapping
 *
 * CRITICAL: OKLCH can represent colors outside the sRGB gamut.
 * This function ensures all output colors are displayable on standard screens.
 *
 * @param colorString - Color in any supported format
 * @param options - Gamut mapping options
 * @returns RGB object (0-255) or null if parsing fails
 */
export function toSrgb(colorString: string, options: GamutMapOptions = {}): RGB | null {
    const color = parseColor(colorString);
    if (!color) return null;

    const {method = "css"} = options;

    try {
        // Convert to sRGB
        let srgbColor = color.to("srgb");

        // Check if gamut mapping is needed
        if (!srgbColor.inGamut()) {
            // Apply gamut mapping using CSS Color 4 algorithm
            srgbColor = srgbColor.toGamut({method});
        }

        // Get coordinates with null safety
        const r = srgbColor.coords[0] ?? 0;
        const g = srgbColor.coords[1] ?? 0;
        const b = srgbColor.coords[2] ?? 0;

        // Convert to 0-255 range with clamping
        return {
            r: Math.round(Math.max(0, Math.min(1, r)) * 255),
            g: Math.round(Math.max(0, Math.min(1, g)) * 255),
            b: Math.round(Math.max(0, Math.min(1, b)) * 255)
        };
    } catch {
        return null;
    }
}

/**
 * Convert color to HEX string with gamut mapping
 *
 * @param colorString - Color in any supported format
 * @returns HEX string (e.g., "#ffffff") or null if parsing fails
 */
export function toHex(colorString: string): string | null {
    const rgb = toSrgb(colorString);
    if (!rgb) return null;

    const toHexPart = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");

    return `#${toHexPart(rgb.r)}${toHexPart(rgb.g)}${toHexPart(rgb.b)}`;
}

/**
 * Convert to CSS OKLCH string
 *
 * @param colorString - Color in any supported format
 * @returns OKLCH CSS string or null if parsing fails
 */
export function toOklchString(colorString: string): string | null {
    const oklch = toOklch(colorString);
    if (!oklch) return null;

    return `oklch(${oklch.l.toFixed(4)} ${oklch.c.toFixed(4)} ${oklch.h.toFixed(4)})`;
}

/**
 * Check if color is within sRGB gamut
 *
 * Useful for warning users about colors that will be gamut-mapped
 *
 * @param colorString - Color in any supported format
 * @returns true if color is in sRGB gamut
 */
export function isInSrgbGamut(colorString: string): boolean {
    const color = parseColor(colorString);
    if (!color) return false;

    try {
        const srgbColor = color.to("srgb");
        return srgbColor.inGamut();
    } catch {
        return false;
    }
}

// =============================================================================
// OKLCH COLOR MANIPULATION
// =============================================================================

/**
 * Adjust OKLCH lightness
 *
 * @param colorString - Color in any supported format
 * @param delta - Positive to lighten, negative to darken (-1 to 1)
 * @returns Adjusted color as OKLCH string
 */
export function adjustLightness(colorString: string, delta: number): string {
    const color = parseColor(colorString);
    if (!color) return colorString;

    try {
        const oklch = color.to("oklch");
        const currentL = oklch.coords[0] ?? 0;
        const newL = Math.max(0, Math.min(1, currentL + delta));
        oklch.coords[0] = newL;
        return oklch.toString({format: "oklch"});
    } catch {
        return colorString;
    }
}

/**
 * Adjust OKLCH chroma (saturation)
 *
 * @param colorString - Color in any supported format
 * @param factor - Multiply chroma by this factor (0.5 = half saturation)
 * @returns Adjusted color as OKLCH string
 */
export function adjustChroma(colorString: string, factor: number): string {
    const color = parseColor(colorString);
    if (!color) return colorString;

    try {
        const oklch = color.to("oklch");
        const currentC = oklch.coords[1] ?? 0;
        const newC = Math.max(0, Math.min(0.4, currentC * factor));
        oklch.coords[1] = newC;
        return oklch.toString({format: "oklch"});
    } catch {
        return colorString;
    }
}

/**
 * Rotate OKLCH hue
 *
 * @param colorString - Color in any supported format
 * @param degrees - Degrees to rotate (positive = clockwise)
 * @returns Adjusted color as OKLCH string
 */
export function rotateHue(colorString: string, degrees: number): string {
    const color = parseColor(colorString);
    if (!color) return colorString;

    try {
        const oklch = color.to("oklch");
        const currentH = oklch.coords[2] ?? 0;
        let newH = (currentH + degrees) % 360;
        if (newH < 0) newH += 360;
        oklch.coords[2] = newH;
        return oklch.toString({format: "oklch"});
    } catch {
        return colorString;
    }
}

/**
 * Create a muted version of a color
 * Reduces chroma and adjusts lightness toward middle
 *
 * @param colorString - Color in any supported format
 * @returns Muted color as OKLCH string
 */
export function toMuted(colorString: string): string {
    const color = parseColor(colorString);
    if (!color) return colorString;

    try {
        const oklch = color.to("oklch");
        const currentL = oklch.coords[0] ?? 0.5;
        const currentC = oklch.coords[1] ?? 0;
        // Push lightness toward 0.85-0.92 range
        oklch.coords[0] = Math.min(0.92, currentL * 0.95 + 0.1);
        // Reduce saturation
        oklch.coords[1] = currentC * 0.6;
        return oklch.toString({format: "oklch"});
    } catch {
        return colorString;
    }
}

// =============================================================================
// FORMAT CONVERSION UTILITIES (for backward compatibility)
// =============================================================================

/**
 * Parse OKLCH color string to OKLCH object
 * Handles format: oklch(L C H) or oklch(L C H / alpha)
 *
 * @deprecated Use toOklch() instead - handles all formats
 */
export function parseOklch(colorString: string): OKLCH | null {
    const match = colorString.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+)?\s*\)/i);
    if (!match) return null;

    return {
        l: parseFloat(match[1]),
        c: parseFloat(match[2]),
        h: parseFloat(match[3])
    };
}

/**
 * Parse HEX color string to RGB
 * Supports #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 *
 * @deprecated Use toSrgb() instead - handles all formats with gamut mapping
 */
export function hexToRgb(hex: string): RGB | null {
    const cleanHex = hex.replace("#", "");

    let r: number, g: number, b: number;

    if (cleanHex.length === 3 || cleanHex.length === 4) {
        // Short format #RGB or #RGBA
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6 || cleanHex.length === 8) {
        // Long format #RRGGBB or #RRGGBBAA
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
    } else {
        return null;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return null;
    }

    return {r, g, b};
}

/**
 * Convert RGB to HEX string
 */
export function rgbToHex(rgb: RGB): string {
    const toHexPart = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHexPart(rgb.r)}${toHexPart(rgb.g)}${toHexPart(rgb.b)}`;
}

/**
 * Parse any supported color format to RGB
 *
 * @deprecated Use toSrgb() instead - handles gamut mapping
 */
export function parseColorToRgb(colorString: string): RGB | null {
    return toSrgb(colorString);
}

/**
 * Convert HEX color to OKLCH string
 */
export function hexToOklch(hex: string): string {
    const oklchStr = toOklchString(hex);
    return oklchStr ?? hex;
}

/**
 * Normalize color input to OKLCH
 * Supports both OKLCH and HEX formats
 */
export function normalizeToOklch(color: string): string {
    if (!color) return color;

    const trimmed = color.trim();

    // Already OKLCH
    if (trimmed.startsWith("oklch")) {
        return trimmed;
    }

    // Convert to OKLCH
    const oklchStr = toOklchString(trimmed);
    return oklchStr ?? trimmed;
}
