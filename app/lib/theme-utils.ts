/**
 * @fileoverview Dynamic Theme Generation System
 *
 * Core theming engine that generates one semantic UI scheme from merchant seed colors.
 * Shopify still stores five color fields, but this resolver treats them as brand hints,
 * normalizes them to safe OKLCH values, derives a complete semantic token contract, and
 * emits legacy aliases so existing Tailwind/shadcn usage keeps working during migration.
 */

import {
    calculateContrast,
    getContrastForeground,
    hexToOklch,
    isInSrgbGamut,
    isValidColor as colorIsValidColor,
    normalizeToOklch,
    rgbToHex,
    toOklch,
    toSrgb
} from "./color";

// =============================================================================
// TYPES
// =============================================================================

export interface OklchColor {
    l: number;
    c: number;
    h: number;
}

export interface ThemeCoreColors {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    accent: string;
}

export interface ThemeSeedInputs {
    brandPrimarySeed: string | null;
    brandSecondarySeed: string | null;
    canvasSeed: string | null;
    inkSeed: string | null;
    brandAccentSeed: string | null;
}

export type ThemeDiagnosticCode =
    | "invalid_seed"
    | "gamut_clamp"
    | "chroma_clamp"
    | "tone_correction"
    | "duplicate_seed_collapse"
    | "ignored_unsafe_input";

export interface ThemeDiagnostic {
    code: ThemeDiagnosticCode;
    token: keyof ThemeSeedInputs | keyof NormalizedThemeSeeds;
    message: string;
    input?: string | null;
    output?: string;
}

export interface NormalizedThemeSeeds {
    brandPrimary: string;
    brandSecondary: string;
    canvas: string;
    ink: string;
    brandAccent: string;
    isDark: boolean;
    neutralHue: number;
}

export interface SemanticScheme {
    surfaceCanvas: string;
    surfaceDefault: string;
    surfaceRaised: string;
    surfaceMuted: string;
    surfaceInteractive: string;
    surfaceOverlay: string;
    textPrimary: string;
    textSecondary: string;
    textSubtle: string;
    textInverse: string;
    borderSubtle: string;
    borderStrong: string;
    inputBorder: string;
    focusRing: string;
    brandPrimary: string;
    brandPrimaryForeground: string;
    brandPrimaryHover: string;
    brandPrimaryActive: string;
    brandPrimarySubtle: string;
    brandPrimarySubtleForeground: string;
    brandSecondary: string;
    brandSecondarySubtle: string;
    brandAccent: string;
    brandAccentSubtle: string;
    success: string;
    successForeground: string;
    successSubtle: string;
    warning: string;
    warningForeground: string;
    warningSubtle: string;
    destructive: string;
    destructiveForeground: string;
    destructiveSubtle: string;
    info: string;
    infoForeground: string;
    infoSubtle: string;
}

export interface DerivedTheme extends SemanticScheme {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
    ring: string;
}

export interface ThemeFonts {
    sans: string;
    serif: string;
    mono: string;
}

export interface ResolvedTheme {
    seeds: NormalizedThemeSeeds;
    diagnostics: ThemeDiagnostic[];
    scheme: SemanticScheme;
    colors: DerivedTheme;
    radius: ThemeRadiusScale;
    fonts: ThemeFonts;
    googleFontsUrl: string;
    cssVariables: string;
}

export type GeneratedTheme = ResolvedTheme;

export interface ThemeRadiusScale {
    base: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    twoXl: number;
    threeXl: number;
    pill: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LIGHT_CANVAS_FALLBACK = "oklch(0.985 0.004 95)";
const LIGHT_INK_FALLBACK = "oklch(0.180 0.010 95)";
const DARK_CANVAS_FALLBACK = "oklch(0.160 0.010 255)";
const DARK_INK_FALLBACK = "oklch(0.940 0.012 255)";
const BRAND_PRIMARY_FALLBACK = "oklch(0.520 0.150 250)";
const BRAND_SECONDARY_FALLBACK = "oklch(0.610 0.100 210)";
const BRAND_ACCENT_FALLBACK = "oklch(0.680 0.120 60)";
const WHITE = "oklch(0.980 0 0)";
const BLACK = "oklch(0.120 0 0)";
export const DEFAULT_BORDER_RADIUS_SEED = 8;
export const MIN_BORDER_RADIUS_SEED = 4;
export const MAX_BORDER_RADIUS_SEED = 28;

const DEFAULT_THEME_COLORS: ThemeCoreColors = {
    primary: "oklch(0 0 0)",
    secondary: "oklch(1 0 0)",
    background: "oklch(1 0 0)",
    foreground: "oklch(0 0 0)",
    accent: "oklch(0 0 0)"
};

const DEFAULT_THEME_FONTS: ThemeFonts = {
    sans: "Inter",
    serif: "Inter",
    mono: "Inter"
};

// =============================================================================
// OKLCH HELPERS
// =============================================================================

export function parseOklch(color: string): OklchColor | null {
    const parsed = toOklch(color);
    if (!parsed) return null;

    return {
        l: parsed.l,
        c: parsed.c,
        h: Number.isNaN(parsed.h) ? 0 : parsed.h
    };
}

export function toOklchString(color: OklchColor): string {
    return `oklch(${color.l.toFixed(4)} ${color.c.toFixed(4)} ${normalizeHue(color.h).toFixed(4)})`;
}

export function adjustLightness(color: string, delta: number): string {
    const parsed = parseOklch(color);
    if (!parsed) return color;

    return toOklchString({
        ...parsed,
        l: clamp(parsed.l + delta, 0, 1)
    });
}

export function adjustChroma(color: string, factor: number): string {
    const parsed = parseOklch(color);
    if (!parsed) return color;

    return toOklchString({
        ...parsed,
        c: clamp(parsed.c * factor, 0, 0.4)
    });
}

export function rotateHue(color: string, degrees: number): string {
    const parsed = parseOklch(color);
    if (!parsed) return color;

    return toOklchString({
        ...parsed,
        h: normalizeHue(parsed.h + degrees)
    });
}

export function toMuted(color: string): string {
    const parsed = parseOklch(color);
    if (!parsed) return color;

    return toOklchString({
        l: parsed.l > 0.5 ? clamp(parsed.l - 0.08, 0, 1) : clamp(parsed.l + 0.08, 0, 1),
        c: Math.min(parsed.c * 0.28, 0.05),
        h: parsed.h
    });
}

export function isValidOklch(color: string): boolean {
    return parseOklch(color) !== null;
}

export {getContrastForeground, hexToOklch, normalizeToOklch, colorIsValidColor as isValidColor};

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function roundRadius(value: number): number {
    return Math.round(value);
}

export function sanitizeBorderRadiusSeed(
    value: unknown,
    fallback = DEFAULT_BORDER_RADIUS_SEED
): number {
    const numeric =
        typeof value === "number"
            ? value
            : typeof value === "string"
              ? Number.parseFloat(value.trim())
              : Number.NaN;

    if (!Number.isFinite(numeric)) {
        return clamp(fallback, MIN_BORDER_RADIUS_SEED, MAX_BORDER_RADIUS_SEED);
    }

    return clamp(roundRadius(numeric), MIN_BORDER_RADIUS_SEED, MAX_BORDER_RADIUS_SEED);
}

export function deriveRadiusScale(seed: number): ThemeRadiusScale {
    const base = sanitizeBorderRadiusSeed(seed);

    return {
        base,
        xs: clamp(roundRadius(base * 0.5), 2, 12),
        sm: clamp(roundRadius(base * 0.75), 4, 16),
        md: base,
        lg: clamp(roundRadius(base * 1.5), 8, 24),
        xl: clamp(roundRadius(base * 2), 12, 32),
        twoXl: clamp(roundRadius(base * 3), 16, 40),
        threeXl: clamp(roundRadius(base * 4), 24, 64),
        pill: clamp(roundRadius(base * 4), 24, 999)
    };
}

function normalizeHue(hue: number): number {
    const normalized = hue % 360;
    return normalized < 0 ? normalized + 360 : normalized;
}

function hueDistance(a: number, b: number): number {
    return Math.abs(((a - b + 540) % 360) - 180);
}

function colorDistance(a: string, b: string): number {
    const colorA = parseOklch(a);
    const colorB = parseOklch(b);
    if (!colorA || !colorB) return Number.POSITIVE_INFINITY;

    return Math.abs(colorA.l - colorB.l) + Math.abs(colorA.c - colorB.c) * 1.4 + hueDistance(colorA.h, colorB.h) / 360;
}

function withLightness(color: string, lightness: number): string {
    const parsed = parseOklch(color);
    if (!parsed) return color;

    return toOklchString({
        ...parsed,
        l: clamp(lightness, 0, 1)
    });
}

function withChroma(color: string, chroma: number): string {
    const parsed = parseOklch(color);
    if (!parsed) return color;

    return toOklchString({
        ...parsed,
        c: clamp(chroma, 0, 0.4)
    });
}

function withValues(color: string, values: Partial<OklchColor>): string {
    const parsed = parseOklch(color);
    if (!parsed) return color;

    return toOklchString({
        l: clamp(values.l ?? parsed.l, 0, 1),
        c: clamp(values.c ?? parsed.c, 0, 0.4),
        h: normalizeHue(values.h ?? parsed.h)
    });
}

function makeOklch(lightness: number, chroma: number, hue: number, alpha?: number): string {
    const base = `oklch(${clamp(lightness, 0, 1).toFixed(4)} ${clamp(chroma, 0, 0.4).toFixed(4)} ${normalizeHue(hue).toFixed(
        4
    )}`;
    return alpha == null ? `${base})` : `${base} / ${clamp(alpha, 0, 1).toFixed(3)})`;
}

function getContrastRatio(foreground: string, background: string): number {
    return calculateContrast(foreground, background, "WCAG21")?.ratio ?? 0;
}

function ensureReadableText(foreground: string, background: string, targetRatio: number = 4.5): string {
    const currentRatio = getContrastRatio(foreground, background);
    if (currentRatio >= targetRatio) return foreground;

    const preferred = getContrastForeground(background, {
        lightForeground: WHITE,
        darkForeground: BLACK
    });

    if (getContrastRatio(preferred, background) >= targetRatio) {
        return preferred;
    }

    return getContrastRatio(BLACK, background) >= getContrastRatio(WHITE, background) ? BLACK : WHITE;
}

function normalizeColorInput(
    input: string | null,
    fallback: string,
    token: keyof ThemeSeedInputs,
    diagnostics: ThemeDiagnostic[],
    options: {
        maxChroma?: number;
        minLightness?: number;
        maxLightness?: number;
    } = {}
): string {
    if (!input || !colorIsValidColor(input)) {
        if (input) {
            diagnostics.push({
                code: "invalid_seed",
                token,
                message: `${token} is invalid and was replaced with a safe fallback.`,
                input,
                output: fallback
            });
        }
        return normalizeToOklch(fallback);
    }

    const gamutMappedRgb = toSrgb(input);
    const gamutMapped = gamutMappedRgb ? hexToOklch(rgbToHex(gamutMappedRgb)) : normalizeToOklch(input);
    if (!isInSrgbGamut(input)) {
        diagnostics.push({
            code: "gamut_clamp",
            token,
            message: `${token} was gamut-mapped to an sRGB-safe value.`,
            input,
            output: gamutMapped
        });
    }

    const parsed = parseOklch(gamutMapped);
    if (!parsed) return normalizeToOklch(fallback);

    let next = parsed;

    if (options.maxChroma != null && next.c > options.maxChroma) {
        next = {...next, c: options.maxChroma};
        diagnostics.push({
            code: "chroma_clamp",
            token,
            message: `${token} exceeded its chroma budget and was reduced.`,
            input,
            output: toOklchString(next)
        });
    }

    const clampedLightness = clamp(next.l, options.minLightness ?? 0, options.maxLightness ?? 1);
    if (clampedLightness !== next.l) {
        next = {...next, l: clampedLightness};
        diagnostics.push({
            code: "tone_correction",
            token,
            message: `${token} lightness was normalized to keep the scheme stable.`,
            input,
            output: toOklchString(next)
        });
    }

    return toOklchString(next);
}

function deriveNeutralHue(...colors: string[]): number {
    for (const color of colors) {
        const parsed = parseOklch(color);
        if (parsed && parsed.c > 0.015) return parsed.h;
    }

    return 250;
}

function deriveDuplicateVariant(source: string, isDark: boolean, shift: "lighter" | "darker"): string {
    const parsed = parseOklch(source);
    if (!parsed) return source;

    const delta = shift === "lighter" ? 0.12 : -0.12;
    return toOklchString({
        l: clamp(parsed.l + (isDark ? -delta : delta), 0, 1),
        c: Math.min(parsed.c * 0.55, 0.12),
        h: parsed.h
    });
}

function normalizeSeeds(inputs: ThemeSeedInputs): {seeds: NormalizedThemeSeeds; diagnostics: ThemeDiagnostic[]} {
    const diagnostics: ThemeDiagnostic[] = [];

    const rawCanvas = normalizeColorInput(inputs.canvasSeed, LIGHT_CANVAS_FALLBACK, "canvasSeed", diagnostics, {
        maxChroma: 0.02
    });

    const rawInk = normalizeColorInput(inputs.inkSeed, LIGHT_INK_FALLBACK, "inkSeed", diagnostics, {
        maxChroma: 0.035
    });

    const rawCanvasParsed = parseOklch(rawCanvas) ?? parseOklch(LIGHT_CANVAS_FALLBACK)!;
    const rawInkParsed = parseOklch(rawInk) ?? parseOklch(LIGHT_INK_FALLBACK)!;
    const isDark = rawCanvasParsed.l < rawInkParsed.l && rawCanvasParsed.l < 0.5;

    const canvasFallback = isDark ? DARK_CANVAS_FALLBACK : LIGHT_CANVAS_FALLBACK;
    const inkFallback = isDark ? DARK_INK_FALLBACK : LIGHT_INK_FALLBACK;

    let canvas = normalizeColorInput(inputs.canvasSeed, canvasFallback, "canvasSeed", diagnostics, {
        maxChroma: 0.018,
        minLightness: isDark ? 0.10 : 0.94,
        maxLightness: isDark ? 0.22 : 0.995
    });

    let ink = normalizeColorInput(inputs.inkSeed, inkFallback, "inkSeed", diagnostics, {
        maxChroma: 0.035,
        minLightness: isDark ? 0.88 : 0.12,
        maxLightness: isDark ? 0.985 : 0.30
    });

    if (getContrastRatio(ink, canvas) < 7) {
        const correctedInk = ensureReadableText(ink, canvas, 7);
        diagnostics.push({
            code: "ignored_unsafe_input",
            token: "inkSeed",
            message: "Foreground seed was replaced because it could not maintain readable hierarchy.",
            input: inputs.inkSeed,
            output: correctedInk
        });
        ink = correctedInk;
    }

    let brandPrimary = normalizeColorInput(inputs.brandPrimarySeed, BRAND_PRIMARY_FALLBACK, "brandPrimarySeed", diagnostics, {
        maxChroma: 0.24
    });
    let brandSecondary = normalizeColorInput(
        inputs.brandSecondarySeed,
        BRAND_SECONDARY_FALLBACK,
        "brandSecondarySeed",
        diagnostics,
        {
            maxChroma: 0.18
        }
    );
    let brandAccent = normalizeColorInput(inputs.brandAccentSeed, BRAND_ACCENT_FALLBACK, "brandAccentSeed", diagnostics, {
        maxChroma: 0.18
    });

    const primaryParsed = parseOklch(brandPrimary);
    if (primaryParsed) {
        const clampedPrimaryLightness = clamp(primaryParsed.l, isDark ? 0.62 : 0.38, isDark ? 0.84 : 0.68);
        if (clampedPrimaryLightness !== primaryParsed.l) {
            brandPrimary = withLightness(brandPrimary, clampedPrimaryLightness);
            diagnostics.push({
                code: "tone_correction",
                token: "brandPrimary",
                message: "Primary seed lightness was stabilized for usable emphasis states.",
                input: inputs.brandPrimarySeed,
                output: brandPrimary
            });
        }
    }

    if (colorDistance(brandPrimary, brandSecondary) < 0.12) {
        brandSecondary = deriveDuplicateVariant(brandPrimary, isDark, "lighter");
        diagnostics.push({
            code: "duplicate_seed_collapse",
            token: "brandSecondary",
            message: "Secondary seed was too close to primary and was replaced with a derived companion.",
            input: inputs.brandSecondarySeed,
            output: brandSecondary
        });
    }

    if (colorDistance(brandPrimary, brandAccent) < 0.12) {
        brandAccent = deriveDuplicateVariant(brandPrimary, isDark, "darker");
        diagnostics.push({
            code: "duplicate_seed_collapse",
            token: "brandAccent",
            message: "Accent seed was too close to primary and was replaced with a derived companion.",
            input: inputs.brandAccentSeed,
            output: brandAccent
        });
    }

    const neutralHue = deriveNeutralHue(brandPrimary, brandSecondary, brandAccent, ink);

    canvas = withValues(canvas, {h: neutralHue});
    ink = withValues(ink, {h: neutralHue});

    return {
        seeds: {
            brandPrimary,
            brandSecondary,
            canvas,
            ink,
            brandAccent,
            isDark,
            neutralHue
        },
        diagnostics
    };
}

function deriveSurfaceScale(seeds: NormalizedThemeSeeds): Pick<
    SemanticScheme,
    "surfaceCanvas" | "surfaceDefault" | "surfaceRaised" | "surfaceMuted" | "surfaceInteractive" | "surfaceOverlay"
> {
    const canvas = parseOklch(seeds.canvas) ?? parseOklch(seeds.isDark ? DARK_CANVAS_FALLBACK : LIGHT_CANVAS_FALLBACK)!;
    const structuralChroma = Math.min(0.018, Math.max(0.004, parseOklch(seeds.brandPrimary)?.c ?? 0.02) * 0.10);

    if (seeds.isDark) {
        return {
            surfaceCanvas: makeOklch(clamp(canvas.l, 0.11, 0.18), structuralChroma, seeds.neutralHue),
            surfaceDefault: makeOklch(clamp(canvas.l + 0.03, 0.19, 0.22), structuralChroma, seeds.neutralHue),
            surfaceRaised: makeOklch(clamp(canvas.l + 0.06, 0.23, 0.27), structuralChroma + 0.002, seeds.neutralHue),
            surfaceMuted: makeOklch(clamp(canvas.l + 0.13, 0.30, 0.36), structuralChroma + 0.004, seeds.neutralHue),
            surfaceInteractive: makeOklch(clamp(canvas.l + 0.19, 0.37, 0.43), structuralChroma + 0.006, seeds.neutralHue),
            surfaceOverlay: makeOklch(0.02, 0, seeds.neutralHue, 0.58)
        };
    }

    return {
        surfaceCanvas: makeOklch(clamp(canvas.l, 0.965, 0.992), structuralChroma, seeds.neutralHue),
        surfaceDefault: makeOklch(clamp(canvas.l + 0.010, 0.975, 0.996), structuralChroma, seeds.neutralHue),
        surfaceRaised: makeOklch(clamp(canvas.l + 0.018, 0.982, 1), structuralChroma + 0.002, seeds.neutralHue),
        surfaceMuted: makeOklch(clamp(canvas.l - 0.055, 0.88, 0.94), structuralChroma + 0.004, seeds.neutralHue),
        surfaceInteractive: makeOklch(clamp(canvas.l - 0.085, 0.82, 0.91), structuralChroma + 0.006, seeds.neutralHue),
        surfaceOverlay: makeOklch(0.18, structuralChroma, seeds.neutralHue, 0.34)
    };
}

function deriveTextScale(
    seeds: NormalizedThemeSeeds,
    surfaces: ReturnType<typeof deriveSurfaceScale>
): Pick<SemanticScheme, "textPrimary" | "textSecondary" | "textSubtle" | "textInverse"> {
    const baseInk = parseOklch(seeds.ink) ?? parseOklch(seeds.isDark ? DARK_INK_FALLBACK : LIGHT_INK_FALLBACK)!;

    if (seeds.isDark) {
        const textPrimary = ensureReadableText(withValues(seeds.ink, {l: clamp(baseInk.l, 0.92, 0.98), c: Math.min(baseInk.c, 0.02)}), surfaces.surfaceCanvas);
        return {
            textPrimary,
            textSecondary: ensureReadableText(makeOklch(0.82, 0.012, seeds.neutralHue), surfaces.surfaceCanvas),
            textSubtle: ensureReadableText(makeOklch(0.68, 0.01, seeds.neutralHue), surfaces.surfaceCanvas, 3),
            textInverse: makeOklch(0.16, 0.01, seeds.neutralHue)
        };
    }

    const textPrimary = ensureReadableText(withValues(seeds.ink, {l: clamp(baseInk.l, 0.14, 0.22), c: Math.min(baseInk.c, 0.02)}), surfaces.surfaceCanvas);
    return {
        textPrimary,
        textSecondary: ensureReadableText(makeOklch(0.34, 0.012, seeds.neutralHue), surfaces.surfaceCanvas),
        textSubtle: ensureReadableText(makeOklch(0.50, 0.010, seeds.neutralHue), surfaces.surfaceCanvas, 3),
        textInverse: makeOklch(0.98, 0, seeds.neutralHue)
    };
}

function ensureRingVisibility(color: string, background: string, isDark: boolean): string {
    if (getContrastRatio(color, background) >= 3) return color;

    const parsed = parseOklch(color);
    if (!parsed) {
        return ensureReadableText(isDark ? WHITE : BLACK, background, 3);
    }

    return withValues(color, {
        l: isDark ? Math.max(parsed.l, 0.78) : Math.min(parsed.l, 0.42),
        c: Math.max(parsed.c, 0.08)
    });
}

function deriveBrandRoles(
    seeds: NormalizedThemeSeeds,
    surfaces: ReturnType<typeof deriveSurfaceScale>,
    text: ReturnType<typeof deriveTextScale>
): Pick<
    SemanticScheme,
    | "brandPrimary"
    | "brandPrimaryForeground"
    | "brandPrimaryHover"
    | "brandPrimaryActive"
    | "brandPrimarySubtle"
    | "brandPrimarySubtleForeground"
    | "brandSecondary"
    | "brandSecondarySubtle"
    | "brandAccent"
    | "brandAccentSubtle"
    | "focusRing"
> {
    const primary = seeds.brandPrimary;
    const primaryParsed = parseOklch(primary) ?? parseOklch(BRAND_PRIMARY_FALLBACK)!;
    const secondary = withValues(seeds.brandSecondary, {
        l: clamp(parseOklch(seeds.brandSecondary)?.l ?? primaryParsed.l, seeds.isDark ? 0.66 : 0.40, seeds.isDark ? 0.84 : 0.72)
    });
    const accent = withValues(seeds.brandAccent, {
        l: clamp(parseOklch(seeds.brandAccent)?.l ?? primaryParsed.l, seeds.isDark ? 0.70 : 0.42, seeds.isDark ? 0.88 : 0.76)
    });

    // Canvas-adaptive subtle backgrounds: derive lightness relative to surfaceCanvas
    // so subtle colors always sit just below the canvas rather than at a fixed value.
    // Chroma caps are intentionally low to produce "barely there" tints, not visible washes.
    const canvasL = parseOklch(surfaces.surfaceCanvas)?.l ?? (seeds.isDark ? 0.15 : 0.98);

    const brandPrimarySubtle = seeds.isDark
        ? makeOklch(clamp(canvasL + 0.08, 0.20, 0.28), Math.min(primaryParsed.c * 0.30, 0.05), primaryParsed.h)
        : makeOklch(clamp(canvasL - 0.015, 0.95, 0.98), Math.min(primaryParsed.c * 0.18, 0.03), primaryParsed.h);

    const brandSecondarySubtle = seeds.isDark
        ? makeOklch(clamp(canvasL + 0.06, 0.18, 0.26), Math.min((parseOklch(secondary)?.c ?? primaryParsed.c) * 0.30, 0.04), parseOklch(secondary)?.h ?? primaryParsed.h)
        : makeOklch(clamp(canvasL - 0.010, 0.96, 0.985), Math.min((parseOklch(secondary)?.c ?? primaryParsed.c) * 0.16, 0.025), parseOklch(secondary)?.h ?? primaryParsed.h);

    const brandAccentSubtle = seeds.isDark
        ? makeOklch(clamp(canvasL + 0.10, 0.22, 0.30), Math.min((parseOklch(accent)?.c ?? primaryParsed.c) * 0.30, 0.06), parseOklch(accent)?.h ?? primaryParsed.h)
        : makeOklch(clamp(canvasL - 0.020, 0.94, 0.975), Math.min((parseOklch(accent)?.c ?? primaryParsed.c) * 0.18, 0.035), parseOklch(accent)?.h ?? primaryParsed.h);

    return {
        brandPrimary: primary,
        // Brand buttons are always large text — WCAG AA large-text threshold (3:1) applies.
        // Prefer white when it qualifies; only fall back to black for very light backgrounds where white fails even that bar.
        brandPrimaryForeground: getContrastRatio(WHITE, primary) >= 3.0 ? WHITE : BLACK,
        brandPrimaryHover: withLightness(primary, clamp(primaryParsed.l + (seeds.isDark ? -0.05 : -0.04), 0, 1)),
        brandPrimaryActive: withLightness(primary, clamp(primaryParsed.l + (seeds.isDark ? -0.09 : -0.08), 0, 1)),
        brandPrimarySubtle,
        brandPrimarySubtleForeground: ensureReadableText(text.textPrimary, brandPrimarySubtle),
        brandSecondary: secondary,
        brandSecondarySubtle,
        brandAccent: accent,
        brandAccentSubtle,
        focusRing: ensureRingVisibility(primary, surfaces.surfaceCanvas, seeds.isDark)
    };
}

function deriveStructureRoles(
    seeds: NormalizedThemeSeeds,
    surfaces: ReturnType<typeof deriveSurfaceScale>
): Pick<SemanticScheme, "borderSubtle" | "borderStrong" | "inputBorder"> {
    const structuralChroma = Math.min(0.025, Math.max(0.006, parseOklch(seeds.brandPrimary)?.c ?? 0.02) * 0.12);

    if (seeds.isDark) {
        return {
            borderSubtle: makeOklch(0.34, structuralChroma, seeds.neutralHue),
            borderStrong: makeOklch(0.46, structuralChroma + 0.002, seeds.neutralHue),
            inputBorder: makeOklch(0.50, structuralChroma + 0.003, seeds.neutralHue)
        };
    }

    return {
        borderSubtle: makeOklch(0.84, structuralChroma, seeds.neutralHue),
        borderStrong: makeOklch(0.68, structuralChroma + 0.002, seeds.neutralHue),
        inputBorder: makeOklch(0.62, structuralChroma + 0.003, seeds.neutralHue)
    };
}

function deriveSystemRoles(seeds: NormalizedThemeSeeds): Pick<
    SemanticScheme,
    | "success"
    | "successForeground"
    | "successSubtle"
    | "warning"
    | "warningForeground"
    | "warningSubtle"
    | "destructive"
    | "destructiveForeground"
    | "destructiveSubtle"
    | "info"
    | "infoForeground"
    | "infoSubtle"
> {
    return {
        success: "oklch(0.72 0.17 142)",
        successForeground: WHITE,
        successSubtle: seeds.isDark ? "oklch(0.28 0.08 142)" : "oklch(0.95 0.03 142)",
        warning: "oklch(0.79 0.17 75)",
        warningForeground: "oklch(0.25 0.02 60)",
        warningSubtle: seeds.isDark ? "oklch(0.32 0.08 75)" : "oklch(0.96 0.03 75)",
        destructive: "oklch(0.55 0.2 25)",
        destructiveForeground: WHITE,
        destructiveSubtle: seeds.isDark ? "oklch(0.28 0.09 25)" : "oklch(0.95 0.03 25)",
        info: "oklch(0.63 0.18 245)",
        infoForeground: WHITE,
        infoSubtle: seeds.isDark ? "oklch(0.28 0.08 245)" : "oklch(0.95 0.03 245)"
    };
}

function buildSemanticScheme(seeds: NormalizedThemeSeeds): SemanticScheme {
    const surfaces = deriveSurfaceScale(seeds);
    const text = deriveTextScale(seeds, surfaces);
    const structure = deriveStructureRoles(seeds, surfaces);
    const brand = deriveBrandRoles(seeds, surfaces, text);
    const system = deriveSystemRoles(seeds);

    return {
        ...surfaces,
        ...text,
        ...structure,
        ...brand,
        ...system
    };
}

function buildDerivedTheme(scheme: SemanticScheme): DerivedTheme {
    return {
        ...scheme,
        background: scheme.surfaceCanvas,
        foreground: scheme.textPrimary,
        card: scheme.surfaceRaised,
        cardForeground: scheme.textPrimary,
        popover: scheme.surfaceDefault,
        popoverForeground: scheme.textPrimary,
        primary: scheme.brandPrimary,
        primaryForeground: scheme.brandPrimaryForeground,
        secondary: scheme.surfaceInteractive,
        secondaryForeground: scheme.textPrimary,
        muted: scheme.surfaceMuted,
        mutedForeground: scheme.textSecondary,
        accent: scheme.brandAccentSubtle,
        accentForeground: scheme.brandPrimarySubtleForeground,
        border: scheme.borderSubtle,
        input: scheme.inputBorder,
        ring: scheme.focusRing
    };
}

export function deriveThemeColors(core: ThemeCoreColors): DerivedTheme {
    return resolveTheme(core, DEFAULT_THEME_FONTS)?.colors ?? buildDerivedTheme(buildSemanticScheme(normalizeSeeds(toThemeSeedInputs(core)).seeds));
}

// =============================================================================
// FONT UTILITIES
// =============================================================================

export function sanitizeFontName(fontName: string): string {
    return fontName.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();
}

export function generateGoogleFontsUrl(fonts: ThemeFonts): string {
    const fontFamilies: string[] = [];

    if (fonts.sans) {
        const sanitized = sanitizeFontName(fonts.sans).replace(/ /g, "+");
        if (sanitized) {
            fontFamilies.push(`family=${sanitized}:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900`);
        }
    }

    if (fonts.serif) {
        const sanitized = sanitizeFontName(fonts.serif).replace(/ /g, "+");
        if (sanitized) {
            fontFamilies.push(`family=${sanitized}:ital,wght@0,400..800;1,400..800`);
        }
    }

    if (fonts.mono) {
        const sanitized = sanitizeFontName(fonts.mono).replace(/ /g, "+");
        if (sanitized) {
            fontFamilies.push(`family=${sanitized}:wght@400;500;600;700`);
        }
    }

    if (fontFamilies.length === 0) return "";

    return `https://fonts.googleapis.com/css2?${fontFamilies.join("&")}&display=swap`;
}

export function generateFontFamily(fontName: string, type: "sans" | "serif" | "mono"): string {
    const fallbacks = {
        sans: "ui-sans-serif, system-ui, sans-serif",
        serif: "ui-serif, Georgia, serif",
        mono: "ui-monospace, SFMono-Regular, monospace"
    };

    if (!fontName) return fallbacks[type];

    const sanitized = sanitizeFontName(fontName);
    if (!sanitized) return fallbacks[type];

    return `"${sanitized}", ${fallbacks[type]}`;
}

// =============================================================================
// CSS GENERATION
// =============================================================================

function deriveThemeShadowColor(colors: DerivedTheme): string {
    const source = parseOklch(colors.brandPrimary) ?? parseOklch(colors.textPrimary);
    if (!source) return "oklch(0 0 0)";

    return toOklchString({
        l: colors.surfaceCanvas === colors.background && parseOklch(colors.background)?.l && (parseOklch(colors.background)?.l ?? 1) < 0.5 ? 0.72 : 0.42,
        c: Math.min(0.05, Math.max(source.c * 0.2, 0.01)),
        h: source.h
    });
}

export function generateThemeCssVariables(
    colors: DerivedTheme,
    fonts: ThemeFonts,
    radius: ThemeRadiusScale
): string {
    return `:root {
  /* Canonical semantic tokens */
  --surface-canvas: ${colors.surfaceCanvas};
  --surface-default: ${colors.surfaceDefault};
  --surface-raised: ${colors.surfaceRaised};
  --surface-muted: ${colors.surfaceMuted};
  --surface-interactive: ${colors.surfaceInteractive};
  --surface-overlay: ${colors.surfaceOverlay};
  --text-primary: ${colors.textPrimary};
  --text-secondary: ${colors.textSecondary};
  --text-subtle: ${colors.textSubtle};
  --text-inverse: ${colors.textInverse};
  --border-subtle: ${colors.borderSubtle};
  --border-strong: ${colors.borderStrong};
  --input-border: ${colors.inputBorder};
  --focus-ring: ${colors.focusRing};
  --brand-primary: ${colors.brandPrimary};
  --brand-primary-foreground: ${colors.brandPrimaryForeground};
  --brand-primary-hover: ${colors.brandPrimaryHover};
  --brand-primary-active: ${colors.brandPrimaryActive};
  --brand-primary-subtle: ${colors.brandPrimarySubtle};
  --brand-primary-subtle-foreground: ${colors.brandPrimarySubtleForeground};
  --brand-secondary: ${colors.brandSecondary};
  --brand-secondary-subtle: ${colors.brandSecondarySubtle};
  --brand-accent: ${colors.brandAccent};
  --brand-accent-subtle: ${colors.brandAccentSubtle};

  /* Legacy compatibility aliases */
  --background: ${colors.background};
  --foreground: ${colors.foreground};
  --card: ${colors.card};
  --card-foreground: ${colors.cardForeground};
  --popover: ${colors.popover};
  --popover-foreground: ${colors.popoverForeground};
  --primary: ${colors.primary};
  --primary-foreground: ${colors.primaryForeground};
  --secondary: ${colors.secondary};
  --secondary-foreground: ${colors.secondaryForeground};
  --muted: ${colors.muted};
  --muted-foreground: ${colors.mutedForeground};
  --accent: ${colors.accent};
  --accent-foreground: ${colors.accentForeground};
  --border: ${colors.border};
  --input: ${colors.input};
  --ring: ${colors.ring};

  /* System semantics */
  --success: ${colors.success};
  --success-foreground: ${colors.successForeground};
  --success-subtle: ${colors.successSubtle};
  --warning: ${colors.warning};
  --warning-foreground: ${colors.warningForeground};
  --warning-subtle: ${colors.warningSubtle};
  --destructive: ${colors.destructive};
  --destructive-foreground: ${colors.destructiveForeground};
  --destructive-subtle: ${colors.destructiveSubtle};
  --info: ${colors.info};
  --info-foreground: ${colors.infoForeground};
  --info-subtle: ${colors.infoSubtle};

  /* Existing bespoke tokens */
  --primary-active: ${colors.brandPrimaryActive};
  --overlay-dark: ${colors.surfaceOverlay};
  --overlay-light: ${colors.brandPrimarySubtle};
  --overlay-light-hover: ${colors.brandAccentSubtle};
  --shadow-color: ${deriveThemeShadowColor(colors)};
  --radius: ${radius.base}px;
  --radius-xs-raw: ${radius.xs}px;
  --radius-sm-raw: ${radius.sm}px;
  --radius-md-raw: ${radius.md}px;
  --radius-lg-raw: ${radius.lg}px;
  --radius-xl-raw: ${radius.xl}px;
  --radius-2xl-raw: ${radius.twoXl}px;
  --radius-3xl-raw: ${radius.threeXl}px;
  --radius-pill-raw: ${radius.pill}px;

  --font-sans: ${generateFontFamily(fonts.sans, "sans")};
  --font-serif: ${generateFontFamily(fonts.serif, "serif")};
  --font-mono: ${generateFontFamily(fonts.mono, "mono")};
}`;
}

// =============================================================================
// PUBLIC API
// =============================================================================

function toThemeSeedInputs(coreColors: ThemeCoreColors | ThemeSeedInputs): ThemeSeedInputs {
    if ("brandPrimarySeed" in coreColors) {
        return coreColors;
    }

    return {
        brandPrimarySeed: coreColors.primary,
        brandSecondarySeed: coreColors.secondary,
        canvasSeed: coreColors.background,
        inkSeed: coreColors.foreground,
        brandAccentSeed: coreColors.accent
    };
}

export function resolveTheme(
    coreColors: ThemeCoreColors | ThemeSeedInputs | null,
    fonts: ThemeFonts | null,
    radiusSeed = DEFAULT_BORDER_RADIUS_SEED
): ResolvedTheme | null {
    if (!coreColors && !fonts) return null;

    const seedInputs = toThemeSeedInputs(coreColors ?? toThemeSeedInputs(DEFAULT_THEME_COLORS));
    const finalFonts = fonts ? {...DEFAULT_THEME_FONTS, ...fonts} : DEFAULT_THEME_FONTS;
    const {seeds, diagnostics} = normalizeSeeds(seedInputs);
    const scheme = buildSemanticScheme(seeds);
    const colors = buildDerivedTheme(scheme);
    const radius = deriveRadiusScale(radiusSeed);
    const googleFontsUrl = generateGoogleFontsUrl(finalFonts);
    const cssVariables = generateThemeCssVariables(colors, finalFonts, radius);

    return {
        seeds,
        diagnostics,
        scheme,
        colors,
        radius,
        fonts: finalFonts,
        googleFontsUrl,
        cssVariables
    };
}

export function generateTheme(
    coreColors: ThemeCoreColors | null,
    fonts: ThemeFonts | null,
    radiusSeed = DEFAULT_BORDER_RADIUS_SEED
): GeneratedTheme | null {
    const finalColors = coreColors ? {...DEFAULT_THEME_COLORS, ...coreColors} : DEFAULT_THEME_COLORS;
    return resolveTheme(finalColors, fonts, radiusSeed);
}
