/**
 * @fileoverview Unified Color Utilities Module
 *
 * @description
 * Single entry point for all color operations in the Hydrogen storefront.
 * Consolidates WCAG contrast, APCA, gamut mapping, and swatch utilities
 * into one cohesive module.
 *
 * @usage
 * ```typescript
 * import {
 *   calculateContrast,
 *   ensureContrastCompliance,
 *   getContrastForeground,
 *   getSwatchBorderColor,
 *   toHex,
 *   toOklch
 * } from "~/lib/color";
 * ```
 *
 * @architecture
 * Module Structure:
 * - core.ts: Color.js wrapper, parsing, conversion, manipulation
 * - contrast.ts: WCAG 2.1 + APCA contrast calculations
 * - swatch.ts: Border color algorithms for UI components
 * - types.ts: Shared type definitions
 *
 * @features
 * - WCAG 2.1 contrast for legal compliance
 * - APCA for better perceptual accuracy
 * - Automatic sRGB gamut mapping for OKLCH colors
 * - Smart swatch border selection
 * - Format-agnostic parsing (OKLCH, HEX, RGB, HSL, P3)
 *
 * @dependencies
 * - colorjs.io (npm package)
 *
 * @related
 * - theme-utils.ts - Uses for theme generation
 * - pwa-parsers.ts - Uses for manifest color conversion
 * - site-content-context.tsx - Uses swatch utilities
 */

// =============================================================================
// CORE COLOR OPERATIONS
// =============================================================================

export {
    // Parsing
    parseColor,
    isValidColor,
    // Format conversion
    toOklch,
    toSrgb,
    toHex,
    toOklchString,
    // Gamut checking
    isInSrgbGamut,
    // OKLCH manipulation
    adjustLightness,
    adjustChroma,
    rotateHue,
    toMuted,
    // Legacy compatibility
    parseOklch,
    hexToRgb,
    rgbToHex,
    parseColorToRgb,
    hexToOklch,
    normalizeToOklch
} from "./core";

// =============================================================================
// CONTRAST CALCULATIONS
// =============================================================================

export {
    // Main contrast function
    calculateContrast,
    calculateContrastWithOpacity,
    meetsContrastRequirement,
    adjustColorForContrast,
    lightenColor,
    darkenColor,
    // Compliance helpers
    ensureContrastCompliance,
    getContrastForeground,
    // Low-level WCAG functions
    relativeLuminance,
    contrastRatio,
    blendWithOpacity,
    // Documentation utilities
    formatContrastComment,
    auditColorPair
} from "./contrast";

// =============================================================================
// SWATCH UTILITIES
// =============================================================================

export {getSwatchBorderColor, getSmartSwatchBorderColor, isLightSwatchColor, validateSwatchVisibility} from "./swatch";

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
    // Color primitives
    RGB,
    OKLCH,
    Oklab,
    // Contrast results
    ContrastResult,
    APCAResult,
    ContrastAlgorithm,
    // Utility options
    SwatchBorderOptions,
    GamutMapOptions,
    SwatchVisibilityResult,
    // Audit types
    ColorPairAudit
} from "./types";
