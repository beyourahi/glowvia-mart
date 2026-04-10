/**
 * @fileoverview Shared Type Definitions for Color Utilities
 *
 * @description
 * Central type definitions for the color module. Provides interfaces for
 * color spaces (RGB, OKLCH), contrast results (WCAG 2.1 + APCA), and
 * utility options.
 *
 * @architecture
 * Type Hierarchy:
 * - Color primitives: RGB, OKLCH, Oklab
 * - Contrast results: ContrastResult (includes both WCAG and APCA)
 * - Utility options: SwatchBorderOptions, GamutMapOptions
 *
 * @related
 * - core.ts - Color parsing and conversion
 * - contrast.ts - Contrast calculation
 * - swatch.ts - Border color utilities
 */

// =============================================================================
// COLOR SPACE TYPES
// =============================================================================

/**
 * RGB color with 8-bit channels (0-255)
 */
export interface RGB {
    r: number; // 0-255
    g: number; // 0-255
    b: number; // 0-255
}

/**
 * OKLCH color space
 * Perceptually uniform color space ideal for manipulation
 *
 * @see https://oklch.com/
 */
export interface OKLCH {
    l: number; // Lightness: 0-1
    c: number; // Chroma: 0-~0.4 (saturation)
    h: number; // Hue: 0-360 degrees
}

/**
 * Oklab color space (cartesian form of OKLCH)
 */
export interface Oklab {
    L: number; // Lightness: 0-1
    a: number; // Green-red axis: typically -0.4 to 0.4
    b: number; // Blue-yellow axis: typically -0.4 to 0.4
}

// =============================================================================
// CONTRAST TYPES
// =============================================================================

/**
 * APCA (Advanced Perceptual Contrast Algorithm) result
 *
 * APCA provides more accurate perceptual contrast than WCAG 2.1.
 * It considers font size and weight in its recommendations.
 *
 * Lc (Lightness Contrast) Thresholds:
 * - Lc >= 90: Preferred for body text
 * - Lc >= 75: Minimum for body text
 * - Lc >= 60: Large text (24px+)
 * - Lc >= 45: Headlines, non-body text
 * - Lc >= 30: UI elements, icons
 * - Lc >= 15: Placeholder text, disabled states
 *
 * @see https://git.apcacontrast.com/
 */
export interface APCAResult {
    /** Lightness contrast value (absolute value, 0-108+) */
    Lc: number;
    /** Minimum recommended font size in pixels */
    minFontSize: number;
    /** Minimum recommended font weight (100-900) */
    minFontWeight: number;
    /** Suitable for body text (Lc >= 60) */
    passesBody: boolean;
    /** Suitable for large text/headlines (Lc >= 45) */
    passesLarge: boolean;
    /** Suitable for UI elements/icons (Lc >= 30) */
    passesUI: boolean;
}

/**
 * Combined contrast result with WCAG 2.1 and APCA metrics
 *
 * WCAG 2.1 Level AA Requirements:
 * - Normal text: 4.5:1 minimum
 * - Large text (≥18pt or ≥14pt bold): 3:1 minimum
 * - UI components and graphical objects: 3:1 minimum
 */
export interface ContrastResult {
    // WCAG 2.1 metrics
    /** Contrast ratio (1.0 to 21.0) */
    ratio: number;
    /** Formatted ratio string (e.g., "4.50:1") */
    ratioString: string;
    /** Passes WCAG AA for normal text (≥4.5:1) */
    passesAA: boolean;
    /** Passes WCAG AA for large text (≥3:1) */
    passesAALarge: boolean;
    /** Passes WCAG AAA for normal text (≥7:1) */
    passesAAA: boolean;
    /** Passes WCAG AAA for large text (≥4.5:1) */
    passesAAALarge: boolean;
    /** Highest WCAG level achieved */
    wcagLevel: "AAA" | "AA" | "AA Large" | "Fail";

    // APCA metrics (optional, included when algorithm="both" or "APCA")
    /** APCA-specific contrast metrics */
    apca?: APCAResult;
}

/**
 * Contrast algorithm selection
 * - "WCAG21": WCAG 2.1 luminance-based (legal compliance)
 * - "APCA": Advanced Perceptual Contrast Algorithm (better accuracy)
 * - "both": Calculate both (recommended for comprehensive analysis)
 */
export type ContrastAlgorithm = "WCAG21" | "APCA" | "both";

// =============================================================================
// UTILITY OPTIONS
// =============================================================================

/**
 * Options for swatch border color calculation
 */
export interface SwatchBorderOptions {
    /** The swatch color (HEX or OKLCH) */
    swatchColor: string | null | undefined;
    /** The parent background color */
    backgroundColor: string;
    /** Whether the parent element is in selected state */
    isSelected?: boolean;
    /** Whether swatch is on a primary-colored background (e.g., hero section) */
    onPrimaryBackground?: boolean;
    /** Theme colors for context-aware calculations */
    themeColors?: {
        primary: string;
        background: string;
        foreground: string;
    };
}

/**
 * Options for gamut mapping
 *
 * OKLCH can represent colors outside the sRGB gamut.
 * These options control how out-of-gamut colors are handled.
 */
export interface GamutMapOptions {
    /**
     * Gamut mapping method:
     * - "css": CSS Color 4 algorithm (recommended, preserves hue)
     * - "clip": Simple clipping (fastest, may shift hue)
     * - "oklch.c": Reduce chroma until in gamut (preserves lightness and hue)
     */
    method?: "css" | "clip" | "oklch.c";
    /**
     * Target color space:
     * - "srgb": Standard sRGB (default, widest support)
     * - "p3": Display P3 (wider gamut, newer displays)
     */
    targetSpace?: "srgb" | "p3";
}

/**
 * Result of swatch visibility validation
 */
export interface SwatchVisibilityResult {
    /** Whether the swatch meets minimum visibility requirements */
    isValid: boolean;
    /** Contrast ratio between swatch and background */
    contrastRatio: number;
    /** Recommendation if invalid, null if valid */
    recommendation: string | null;
}

// =============================================================================
// AUDIT TYPES
// =============================================================================

/**
 * Color pair audit result for batch validation
 */
export interface ColorPairAudit {
    foregroundName: string;
    backgroundName: string;
    foregroundValue: string;
    backgroundValue: string;
    result: ContrastResult | null;
    comment: string;
}
