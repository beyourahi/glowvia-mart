/**
 * @fileoverview Dual-Algorithm Contrast Calculation (WCAG 2.1 + APCA)
 *
 * @description
 * Provides both WCAG 2.1 and APCA contrast calculations for comprehensive
 * accessibility compliance. WCAG 2.1 remains the legal standard; APCA
 * provides better perceptual accuracy for real-world usability.
 *
 * @architecture
 * Contrast Strategy:
 * 1. WCAG 2.1 for legal compliance (4.5:1 text, 3:1 UI)
 * 2. APCA for design guidance (considers font size/weight)
 * 3. Both reported for transparency
 *
 * Why both algorithms?
 * - Studies show WCAG 2.1 has 23% false fails and 47% false passes
 * - APCA is more perceptually accurate but not yet legally required
 * - Reporting both gives designers the best of both worlds
 *
 * APCA Lightness Contrast (Lc) Thresholds:
 * - Lc >= 90: Preferred for body text
 * - Lc >= 75: Minimum for body text
 * - Lc >= 60: Large text (24px+)
 * - Lc >= 45: Headlines, non-body text
 * - Lc >= 30: UI elements, icons
 * - Lc >= 15: Placeholder text, disabled states
 *
 * @dependencies
 * - colorjs.io (for contrast calculations)
 * - ./core.ts (for color parsing)
 *
 * @related
 * - types.ts - ContrastResult, APCAResult types
 * - core.ts - parseColor, toSrgb
 * - swatch.ts - Uses contrast for border selection
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 * @see https://git.apcacontrast.com/
 */

import Color from "colorjs.io";

import {parseColor, toSrgb} from "./core";
import type {ContrastResult, ContrastAlgorithm, RGB, APCAResult} from "./types";

type AdjustContrastOptions = {
    minRatio?: number;
    maxIterations?: number;
    lightnessStep?: number;
    preserveHue?: boolean;
    preserveChroma?: boolean;
};

type ContrastSize = "normal" | "large" | "ui";
type ContrastLevel = "AA" | "AAA";

const DEFAULT_MIN_CONTRAST = 3;
const DEFAULT_TARGET_CONTRAST = 4.5;

const WHITE_FALLBACK = "oklch(0.98 0 0)";
const BLACK_FALLBACK = "oklch(0.05 0 0)";

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
    return clamp(value, 0, 1);
}

function normalizeHue(hue: number): number {
    const normalized = hue % 360;
    return normalized < 0 ? normalized + 360 : normalized;
}

function formatOklch(l: number, c: number, h: number): string {
    return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(4)})`;
}

function getPerceptualDistance(base: {l: number; c: number; h: number}, target: {l: number; c: number; h: number}): number {
    const hueDelta = Math.abs(((target.h - base.h + 540) % 360) - 180) / 180;
    return Math.abs(target.l - base.l) + Math.abs(target.c - base.c) * 0.8 + hueDelta * 0.1;
}

function getWcagRatio(foreground: string, background: string): number | null {
    const result = calculateContrast(foreground, background, "WCAG21");
    if (!result) return null;
    return result.ratio;
}

// =============================================================================
// WCAG 2.1 CONTRAST
// =============================================================================

/**
 * Calculate relative luminance for a color (WCAG 2.1 formula)
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Where R, G, B are linearized sRGB values
 *
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function relativeLuminance(rgb: RGB): number {
    // Convert sRGB to linear RGB
    const linearize = (value: number): number => {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    const r = linearize(rgb.r);
    const g = linearize(rgb.g);
    const b = linearize(rgb.b);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate WCAG 2.1 contrast ratio between two RGB colors
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color
 *
 * @see https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function contrastRatio(color1: RGB, color2: RGB): number {
    const l1 = relativeLuminance(color1);
    const l2 = relativeLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastRequirement(ratio: number, level: ContrastLevel, size: ContrastSize): boolean {
    if (level === "AAA") {
        if (size === "normal") return ratio >= 7;
        return ratio >= 4.5;
    }

    if (size === "normal") return ratio >= 4.5;
    return ratio >= 3;
}

// =============================================================================
// APCA HELPERS
// =============================================================================

/**
 * Get minimum recommended font size for APCA contrast value
 * Based on APCA lookup tables
 */
function getMinFontSizeForApca(Lc: number): number {
    if (Lc >= 90) return 12;
    if (Lc >= 75) return 14;
    if (Lc >= 60) return 16;
    if (Lc >= 45) return 24;
    if (Lc >= 30) return 36;
    return 48; // Very low contrast
}

/**
 * Get minimum recommended font weight for APCA contrast value
 */
function getMinFontWeightForApca(Lc: number): number {
    if (Lc >= 90) return 300;
    if (Lc >= 75) return 400;
    if (Lc >= 60) return 500;
    if (Lc >= 45) return 600;
    return 700;
}

// =============================================================================
// MAIN CONTRAST CALCULATION
// =============================================================================

/**
 * Calculate contrast between two colors using specified algorithm(s)
 *
 * @param foreground - Text/foreground color (any supported format)
 * @param background - Background color (any supported format)
 * @param algorithm - "WCAG21", "APCA", or "both" (default)
 * @returns ContrastResult with WCAG and/or APCA metrics, or null if invalid
 *
 * @example
 * ```typescript
 * // Check both algorithms (recommended)
 * const result = calculateContrast("#000000", "#ffffff");
 * console.log(result.ratio);        // 21.0
 * console.log(result.apca?.Lc);     // ~106
 *
 * // WCAG only (for compliance checks)
 * const wcag = calculateContrast("#333", "#fff", "WCAG21");
 *
 * // APCA only (for design decisions)
 * const apca = calculateContrast("#333", "#fff", "APCA");
 * ```
 */
export function calculateContrast(
    foreground: string,
    background: string,
    algorithm: ContrastAlgorithm = "both"
): ContrastResult | null {
    const fgColor = parseColor(foreground);
    const bgColor = parseColor(background);

    if (!fgColor || !bgColor) return null;

    const result: ContrastResult = {
        ratio: 0,
        ratioString: "0:1",
        passesAA: false,
        passesAALarge: false,
        passesAAA: false,
        passesAAALarge: false,
        wcagLevel: "Fail"
    };

    // WCAG 2.1 calculation
    if (algorithm === "WCAG21" || algorithm === "both") {
        try {
            // Use Color.js built-in WCAG contrast
            const wcagRatio = bgColor.contrast(fgColor, "WCAG21");

            result.ratio = wcagRatio;
            result.ratioString = `${wcagRatio.toFixed(2)}:1`;
            result.passesAA = wcagRatio >= 4.5;
            result.passesAALarge = wcagRatio >= 3;
            result.passesAAA = wcagRatio >= 7;
            result.passesAAALarge = wcagRatio >= 4.5;

            if (wcagRatio >= 7) {
                result.wcagLevel = "AAA";
            } else if (wcagRatio >= 4.5) {
                result.wcagLevel = "AA";
            } else if (wcagRatio >= 3) {
                result.wcagLevel = "AA Large";
            }
        } catch {
            // Fallback to manual calculation if Color.js fails
            const fgRgb = toSrgb(foreground);
            const bgRgb = toSrgb(background);

            if (fgRgb && bgRgb) {
                const ratio = contrastRatio(fgRgb, bgRgb);
                result.ratio = ratio;
                result.ratioString = `${ratio.toFixed(2)}:1`;
                result.passesAA = ratio >= 4.5;
                result.passesAALarge = ratio >= 3;
                result.passesAAA = ratio >= 7;
                result.passesAAALarge = ratio >= 4.5;

                if (ratio >= 7) {
                    result.wcagLevel = "AAA";
                } else if (ratio >= 4.5) {
                    result.wcagLevel = "AA";
                } else if (ratio >= 3) {
                    result.wcagLevel = "AA Large";
                }
            }
        }
    }

    // APCA calculation
    if (algorithm === "APCA" || algorithm === "both") {
        try {
            // APCA requires correct polarity: background.contrast(text)
            // The sign indicates polarity (dark-on-light vs light-on-dark)
            const apcaRaw = bgColor.contrast(fgColor, "APCA");
            const Lc = Math.abs(apcaRaw);

            const apca: APCAResult = {
                Lc,
                minFontSize: getMinFontSizeForApca(Lc),
                minFontWeight: getMinFontWeightForApca(Lc),
                passesBody: Lc >= 60,
                passesLarge: Lc >= 45,
                passesUI: Lc >= 30
            };

            result.apca = apca;
        } catch {
            // APCA not available or failed - continue without it
        }
    }

    return result;
}

// =============================================================================
// OPACITY CONTRAST
// =============================================================================

/**
 * Calculate effective color when opacity is applied over a background
 * Uses alpha compositing formula
 */
export function blendWithOpacity(foreground: RGB, background: RGB, opacity: number): RGB {
    const alpha = Math.max(0, Math.min(1, opacity));
    return {
        r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
        g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
        b: Math.round(foreground.b * alpha + background.b * (1 - alpha))
    };
}

/**
 * Calculate contrast with opacity applied to foreground
 * Blends foreground with background before calculating contrast
 *
 * @param foreground - Foreground color string
 * @param background - Background color string
 * @param opacity - Opacity value (0-1)
 * @param algorithm - Contrast algorithm to use
 *
 * @example
 * ```typescript
 * // Check text-foreground/85 on white background
 * const result = calculateContrastWithOpacity(
 *   "oklch(0.15 0 0)",  // foreground
 *   "#ffffff",          // background
 *   0.85                // 85% opacity
 * );
 * ```
 */
export function calculateContrastWithOpacity(
    foreground: string,
    background: string,
    opacity: number,
    algorithm: ContrastAlgorithm = "both"
): ContrastResult | null {
    const fgRgb = toSrgb(foreground);
    const bgRgb = toSrgb(background);

    if (!fgRgb || !bgRgb) return null;

    // Alpha compositing
    const blended = blendWithOpacity(fgRgb, bgRgb, opacity);

    // Convert blended color to hex for calculation
    const toHexPart = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    const blendedHex = `#${toHexPart(blended.r)}${toHexPart(blended.g)}${toHexPart(blended.b)}`;

    return calculateContrast(blendedHex, background, algorithm);
}

// =============================================================================
// COLOR ADJUSTMENT UTILITIES
// =============================================================================

export function lightenColor(color: string, amount: number): string {
    const parsedColor = parseColor(color);
    if (!parsedColor) return color;

    try {
        const oklchColor = parsedColor.to("oklch");
        const lightness = oklchColor.coords[0] ?? 0.5;
        oklchColor.coords[0] = clamp01(lightness + Math.abs(amount));
        return oklchColor.toString({format: "oklch"});
    } catch {
        return color;
    }
}

export function darkenColor(color: string, amount: number): string {
    const parsedColor = parseColor(color);
    if (!parsedColor) return color;

    try {
        const oklchColor = parsedColor.to("oklch");
        const lightness = oklchColor.coords[0] ?? 0.5;
        oklchColor.coords[0] = clamp01(lightness - Math.abs(amount));
        return oklchColor.toString({format: "oklch"});
    } catch {
        return color;
    }
}

export function adjustColorForContrast(
    foreground: string,
    background: string,
    targetRatio: number = DEFAULT_TARGET_CONTRAST,
    options: AdjustContrastOptions = {}
): string {
    const {
        minRatio = DEFAULT_MIN_CONTRAST,
        maxIterations = 24,
        lightnessStep = 0.02,
        preserveHue = true,
        preserveChroma = true
    } = options;

    const initialRatio = getWcagRatio(foreground, background);
    if (initialRatio == null || initialRatio >= targetRatio) {
        return foreground;
    }

    const fgRgb = toSrgb(foreground);
    const bgRgb = toSrgb(background);
    const fgColor = parseColor(foreground);
    if (!fgRgb || !bgRgb || !fgColor) return foreground;

    let baseL = 0.5;
    let baseC = 0;
    let baseH = 0;

    try {
        const oklch = fgColor.to("oklch");
        baseL = clamp01(oklch.coords[0] ?? 0.5);
        baseC = clamp(oklch.coords[1] ?? 0, 0, 0.4);
        baseH = normalizeHue(oklch.coords[2] ?? 0);
    } catch {
        return foreground;
    }

    const fgLuminance = relativeLuminance(fgRgb);
    const bgLuminance = relativeLuminance(bgRgb);
    const primaryDirection: "lighten" | "darken" = fgLuminance >= bgLuminance ? "lighten" : "darken";
    const directions: Array<"lighten" | "darken"> =
        primaryDirection === "lighten" ? ["lighten", "darken"] : ["darken", "lighten"];

    const chromaScales = preserveChroma ? [1, 0.92, 0.84, 0.76, 0.68] : [1, 0.85, 0.7, 0.55];
    const hueShifts = preserveHue ? [0] : [0, 8, -8];

    let bestTarget: {color: string; ratio: number; distance: number} | null = null;
    let bestMinimum: {color: string; ratio: number; distance: number} | null = null;
    let bestOverall: {color: string; ratio: number; distance: number} = {
        color: foreground,
        ratio: initialRatio,
        distance: 0
    };

    for (const direction of directions) {
        for (const chromaScale of chromaScales) {
            for (const hueShift of hueShifts) {
                for (let step = 1; step <= Math.max(1, Math.floor(maxIterations)); step++) {
                    const delta = step * Math.max(0.001, lightnessStep);
                    const nextLightness = clamp01(direction === "lighten" ? baseL + delta : baseL - delta);
                    const nextChroma = clamp(baseC * chromaScale, 0, 0.4);
                    const nextHue = normalizeHue(baseH + hueShift);

                    const candidate = formatOklch(nextLightness, nextChroma, nextHue);
                    const ratio = getWcagRatio(candidate, background);
                    if (ratio == null) continue;

                    const distance = getPerceptualDistance(
                        {l: baseL, c: baseC, h: baseH},
                        {l: nextLightness, c: nextChroma, h: nextHue}
                    );

                    if (ratio > bestOverall.ratio || (ratio === bestOverall.ratio && distance < bestOverall.distance)) {
                        bestOverall = {color: candidate, ratio, distance};
                    }

                    if (ratio >= targetRatio) {
                        if (!bestTarget || distance < bestTarget.distance) {
                            bestTarget = {color: candidate, ratio, distance};
                        }
                    } else if (ratio >= minRatio) {
                        if (
                            !bestMinimum ||
                            ratio > bestMinimum.ratio ||
                            (ratio === bestMinimum.ratio && distance < bestMinimum.distance)
                        ) {
                            bestMinimum = {color: candidate, ratio, distance};
                        }
                    }
                }
            }
        }
    }

    if (bestTarget) return bestTarget.color;
    if (bestMinimum) return bestMinimum.color;

    const fallbackCandidates = [WHITE_FALLBACK, BLACK_FALLBACK]
        .map(color => {
            const ratio = getWcagRatio(color, background);
            if (ratio == null) return null;

            const rgb = toSrgb(color);
            if (!rgb) return null;

            const fallbackLuminance = relativeLuminance(rgb);
            const distance = Math.abs(fallbackLuminance - baseL);
            return {color, ratio, distance};
        })
        .filter((candidate): candidate is {color: string; ratio: number; distance: number} => candidate !== null)
        .sort((a, b) => {
            if (b.ratio !== a.ratio) return b.ratio - a.ratio;
            return a.distance - b.distance;
        });

    if (fallbackCandidates.length > 0) {
        return fallbackCandidates[0].color;
    }

    return bestOverall.color;
}

// =============================================================================
// CONTRAST COMPLIANCE HELPERS
// =============================================================================

/**
 * Ensure a color meets contrast requirements, with fallback
 *
 * This is the pattern for validating merchant-supplied colors from Shopify
 * that may not meet WCAG requirements.
 *
 * @param merchantColor - Color to validate
 * @param background - Background color
 * @param fallbackColor - WCAG-compliant fallback
 * @param minContrast - Minimum WCAG ratio (default 4.5 for text)
 * @returns merchantColor if compliant, fallbackColor otherwise
 *
 * @example
 * ```typescript
 * const safeColor = ensureContrastCompliance(
 *   merchantPrimary, // Color from Shopify brand API
 *   '#ffffff',       // Background
 *   '#1f1f1f',       // Fallback if fails
 *   4.5              // Minimum ratio for text
 * );
 * ```
 */
export function ensureContrastCompliance(
    merchantColor: string,
    background: string,
    fallbackColor: string,
    minContrast: number = 4.5
): string {
    const result = calculateContrast(merchantColor, background, "WCAG21");

    if (!result || result.ratio < minContrast) {
        if (process.env.NODE_ENV === "development") {
            console.warn(
                `[WCAG] Color fails contrast check (${result?.ratioString ?? "invalid"} < ${minContrast}:1). Using fallback.`,
                {merchantColor, background, fallbackColor}
            );
        }
        return fallbackColor;
    }

    return merchantColor;
}

// =============================================================================
// FOREGROUND COLOR SELECTION
// =============================================================================

// Foreground color options
const WHITE_FOREGROUND = "oklch(1 0 0)"; // Pure white
const DARK_FOREGROUND = "oklch(0.25 0.02 45)"; // Dark brown

/**
 * Get optimal foreground color (white or dark) for a background
 *
 * Uses APCA when available for better perceptual accuracy,
 * falls back to WCAG 2.1 contrast comparison.
 *
 * @param backgroundColor - Background color (any format)
 * @param options - Custom light/dark foreground colors
 * @returns Optimal foreground color string
 *
 * @example
 * ```typescript
 * // For a coral background, get the best text color
 * const textColor = getContrastForeground("oklch(0.7 0.15 25)");
 * // Returns white or dark based on which has better contrast
 * ```
 */
export function getContrastForeground(
    backgroundColor: string,
    options: {
        lightForeground?: string;
        darkForeground?: string;
    } = {}
): string {
    const {lightForeground = WHITE_FOREGROUND, darkForeground = DARK_FOREGROUND} = options;

    const bgColor = parseColor(backgroundColor);
    if (!bgColor) return darkForeground;

    const lightColor = parseColor(lightForeground);
    const darkColor = parseColor(darkForeground);

    if (!lightColor || !darkColor) return darkForeground;

    try {
        // Try APCA first (more accurate for foreground selection)
        const lightContrast = Math.abs(bgColor.contrast(lightColor, "APCA"));
        const darkContrast = Math.abs(bgColor.contrast(darkColor, "APCA"));

        const useLight = lightContrast >= darkContrast;
        const foreground = useLight ? lightForeground : darkForeground;

        return foreground;
    } catch {
        // Fallback to WCAG 2.1 comparison
        try {
            const lightRatio = bgColor.contrast(lightColor, "WCAG21");
            const darkRatio = bgColor.contrast(darkColor, "WCAG21");

            return lightRatio >= darkRatio ? lightForeground : darkForeground;
        } catch {
            // Final fallback based on background lightness
            const bgRgb = toSrgb(backgroundColor);
            if (bgRgb) {
                const luminance = relativeLuminance(bgRgb);
                return luminance > 0.5 ? darkForeground : lightForeground;
            }
            return darkForeground;
        }
    }
}

// =============================================================================
// DOCUMENTATION UTILITIES
// =============================================================================

/**
 * Format contrast result as inline CSS comment
 * Format: [foreground] on [background] = X.XX:1 (WCAG AA/AAA) [checkmark/x]
 */
export function formatContrastComment(foregroundName: string, backgroundName: string, result: ContrastResult): string {
    const symbol = result.passesAA ? "\u2713" : "\u2717";
    return `/* ${foregroundName} on ${backgroundName} = ${result.ratioString} (WCAG ${result.wcagLevel}) ${symbol} */`;
}

/**
 * Generate a full audit report for a color pair
 */
export function auditColorPair(
    foreground: string,
    background: string,
    foregroundName: string = "foreground",
    backgroundName: string = "background"
): string {
    const result = calculateContrast(foreground, background);

    if (!result) {
        return `/* ERROR: Could not calculate contrast for ${foregroundName} on ${backgroundName} */`;
    }

    const fgHex = toSrgb(foreground);
    const bgHex = toSrgb(background);

    const lines = [
        `/* ─────────────────────────────────────────────────────────────────────`,
        ` * Color Pair: ${foregroundName} on ${backgroundName}`,
        ` * Foreground: ${foreground}${fgHex ? ` → #${fgHex.r.toString(16).padStart(2, "0")}${fgHex.g.toString(16).padStart(2, "0")}${fgHex.b.toString(16).padStart(2, "0")}` : ""}`,
        ` * Background: ${background}${bgHex ? ` → #${bgHex.r.toString(16).padStart(2, "0")}${bgHex.g.toString(16).padStart(2, "0")}${bgHex.b.toString(16).padStart(2, "0")}` : ""}`,
        ` * WCAG Contrast: ${result.ratioString}`,
        ` * WCAG AA (4.5:1): ${result.passesAA ? "PASS \u2713" : "FAIL \u2717"}`,
        ` * WCAG AA Large (3:1): ${result.passesAALarge ? "PASS \u2713" : "FAIL \u2717"}`,
        ` * WCAG AAA (7:1): ${result.passesAAA ? "PASS \u2713" : "FAIL \u2717"}`
    ];

    if (result.apca) {
        lines.push(
            ` * APCA Lc: ${result.apca.Lc.toFixed(1)}`,
            ` * APCA Body Text (Lc≥60): ${result.apca.passesBody ? "PASS \u2713" : "FAIL \u2717"}`,
            ` * APCA UI (Lc≥30): ${result.apca.passesUI ? "PASS \u2713" : "FAIL \u2717"}`
        );
    }

    lines.push(` * ───────────────────────────────────────────────────────────────────── */`);

    return lines.join("\n");
}
