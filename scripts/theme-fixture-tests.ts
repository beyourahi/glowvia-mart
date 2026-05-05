/**
 * @fileoverview Theme Generation Fixture Tests
 *
 * @description
 * Validates that `resolveTheme()` produces WCAG-compliant, visually distinct
 * color tokens for a representative set of merchant brand inputs.
 *
 * Each fixture defines a `ThemeSeedInputs` bundle (brand primary, secondary,
 * canvas, ink, accent) and declares whether normalization diagnostics are expected.
 * The test suite asserts contrast ratios, surface separation, chroma ceilings, and
 * structural CSS variable output for every fixture.
 *
 * A second pass (`runUsageAssertions`) verifies that specific UI components do not
 * reference raw brand tokens directly (enforces the design token contract).
 *
 * @usage Run via `node --import tsx scripts/theme-fixture-tests.ts` or the
 * project's `npm run test:theme` script.
 *
 * @related
 * - app/lib/theme-utils.ts - resolveTheme, parseOklch, ThemeSeedInputs
 * - app/lib/color/contrast.ts - calculateContrast (WCAG21 / APCA)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {calculateContrast} from "../app/lib/color";
import {parseOklch, resolveTheme, type ThemeSeedInputs} from "../app/lib/theme-utils";

/** A named theme seed bundle with an expectation about normalization diagnostic output. */
type Fixture = {
    name: string;
    seeds: ThemeSeedInputs;
    expectDiagnostics: boolean;
};

const fixtures: Fixture[] = [
    {
        name: "monochrome luxury",
        seeds: {
            brandPrimarySeed: "#111111",
            brandSecondarySeed: "#4b4b4b",
            canvasSeed: "#fbf9f4",
            inkSeed: "#171513",
            brandAccentSeed: "#a7937a"
        },
        expectDiagnostics: false
    },
    {
        name: "muted editorial",
        seeds: {
            brandPrimarySeed: "#5e5248",
            brandSecondarySeed: "#8b7c73",
            canvasSeed: "#f6f2eb",
            inkSeed: "#221f1c",
            brandAccentSeed: "#b88f7d"
        },
        expectDiagnostics: false
    },
    {
        name: "earthy wellness",
        seeds: {
            brandPrimarySeed: "#5c7a5c",
            brandSecondarySeed: "#b2a48f",
            canvasSeed: "#f6f3ea",
            inkSeed: "#223127",
            brandAccentSeed: "#c79b6b"
        },
        expectDiagnostics: false
    },
    {
        name: "bright kids brand",
        seeds: {
            brandPrimarySeed: "#ff5a36",
            brandSecondarySeed: "#2d9cdb",
            canvasSeed: "#fff8ee",
            inkSeed: "#241b14",
            brandAccentSeed: "#ffd447"
        },
        expectDiagnostics: false
    },
    {
        name: "saturated beauty brand",
        seeds: {
            brandPrimarySeed: "#d1267d",
            brandSecondarySeed: "#f07ab4",
            canvasSeed: "#fff6fa",
            inkSeed: "#24101a",
            brandAccentSeed: "#ff8a5b"
        },
        expectDiagnostics: false
    },
    {
        name: "high-chroma tech brand",
        seeds: {
            brandPrimarySeed: "#0066ff",
            brandSecondarySeed: "#00c2ff",
            canvasSeed: "#f7fbff",
            inkSeed: "#0e1a2b",
            brandAccentSeed: "#7d4dff"
        },
        expectDiagnostics: false
    },
    {
        name: "neon edge case",
        seeds: {
            brandPrimarySeed: "color(display-p3 0.15 1 0.35)",
            brandSecondarySeed: "color(display-p3 1 0 1)",
            canvasSeed: "#ffffff",
            inkSeed: "#111111",
            brandAccentSeed: "#39ff14"
        },
        expectDiagnostics: true
    },
    {
        name: "yellow-dominant brand",
        seeds: {
            brandPrimarySeed: "#f7d000",
            brandSecondarySeed: "#c59e00",
            canvasSeed: "#fffdf2",
            inkSeed: "#2d2500",
            brandAccentSeed: "#ffb100"
        },
        expectDiagnostics: true
    },
    {
        name: "near-white input",
        seeds: {
            brandPrimarySeed: "#dfdfdf",
            brandSecondarySeed: "#f3f3f3",
            canvasSeed: "#fffffe",
            inkSeed: "#0d0d0d",
            brandAccentSeed: "#b7b7b7"
        },
        expectDiagnostics: true
    },
    {
        name: "near-black input",
        seeds: {
            brandPrimarySeed: "#090909",
            brandSecondarySeed: "#111111",
            canvasSeed: "#0e0f10",
            inkSeed: "#fafafa",
            brandAccentSeed: "#222222"
        },
        expectDiagnostics: true
    },
    {
        name: "low-contrast merchant inputs",
        seeds: {
            brandPrimarySeed: "#aaaaaa",
            brandSecondarySeed: "#b3b3b3",
            canvasSeed: "#f7f7f7",
            inkSeed: "#d2d2d2",
            brandAccentSeed: "#bdbdbd"
        },
        expectDiagnostics: true
    },
    {
        name: "conflicting secondary accent inputs",
        seeds: {
            brandPrimarySeed: "#7c3aed",
            brandSecondarySeed: "#7d3bfd",
            canvasSeed: "#fbf8ff",
            inkSeed: "#1d1231",
            brandAccentSeed: "#7c3aed"
        },
        expectDiagnostics: true
    }
];

/** Surface color keys that must remain low-chroma (neutral) regardless of brand inputs. */
const structuralColorKeys = ["background", "card", "muted", "border", "input"] as const;

/** Returns the WCAG 2.1 contrast ratio between two OKLCH color strings. Returns 0 on parse failure. */
function getRatio(foreground: string, background: string): number {
    return calculateContrast(foreground, background, "WCAG21")?.ratio ?? 0;
}

/** Asserts that `foreground` on `background` meets the given WCAG contrast minimum. */
function assertContrast(label: string, foreground: string, background: string, minimum: number): void {
    const ratio = getRatio(foreground, background);
    assert(
        ratio >= minimum,
        `${label} expected contrast >= ${minimum}, received ${ratio.toFixed(2)} (${foreground} on ${background})`
    );
}

/** Asserts that the OKLCH chroma of `color` does not exceed `maximum` (keeps surfaces neutral). */
function assertLowChroma(label: string, color: string, maximum: number): void {
    const parsed = parseOklch(color);
    assert(parsed, `${label} could not be parsed as OKLCH`);
    assert(parsed.c <= maximum, `${label} chroma ${parsed.c.toFixed(4)} exceeded ${maximum}`);
}

/**
 * Asserts that `card` and `muted` surfaces are perceptually distinct from `background`.
 * Requires card to differ by at least 0.004 L and muted to differ more than card,
 * ensuring visual hierarchy between the three surface layers.
 */
function assertSurfaceSeparation(label: string, background: string, card: string, muted: string): void {
    const bg = parseOklch(background);
    const cardColor = parseOklch(card);
    const mutedColor = parseOklch(muted);

    assert(bg && cardColor && mutedColor, `${label} surface colors must parse`);

    const cardDelta = Math.abs(cardColor.l - bg.l);
    const mutedDelta = Math.abs(mutedColor.l - bg.l);

    assert(cardDelta >= 0.004, `${label} card must be separated from background`);
    assert(mutedDelta > cardDelta, `${label} muted must be more separated than card`);
}

/**
 * Asserts diagnostic count expectations.
 * When `expected` is true, requires at least one diagnostic (the theme needed
 * normalization). When false, only verifies the count is non-negative.
 */
function assertDiagnostics(label: string, actual: number, expected: boolean): void {
    if (expected) {
        assert(actual > 0, `${label} should emit normalization diagnostics`);
        return;
    }

    assert(actual >= 0, `${label} diagnostics count must be valid`);
}

/**
 * Runs WCAG contrast, chroma, surface separation, and diagnostic assertions against
 * every fixture. Validates that the theme resolver produces structurally correct
 * CSS variable output (`--surface-canvas` and legacy `--background` tokens).
 */
function runFixtureAssertions() {
    for (const fixture of fixtures) {
        const resolved = resolveTheme(fixture.seeds, null);

        assert(resolved, `${fixture.name} should resolve`);
        assert(resolved.cssVariables.includes("--surface-canvas:"), `${fixture.name} should emit canonical surface tokens`);
        assert(resolved.cssVariables.includes("--background:"), `${fixture.name} should emit legacy alias tokens`);

        assertContrast(`${fixture.name} text/background`, resolved.colors.foreground, resolved.colors.background, 4.5);
        assertContrast(`${fixture.name} text/card`, resolved.colors.cardForeground, resolved.colors.card, 4.5);
        assertContrast(`${fixture.name} text/muted`, resolved.colors.mutedForeground, resolved.colors.muted, 4.5);
        assertContrast(`${fixture.name} brand primary`, resolved.colors.primaryForeground, resolved.colors.primary, 4.5);
        assertContrast(`${fixture.name} input border`, resolved.colors.input, resolved.colors.background, 3);
        assertContrast(`${fixture.name} focus ring`, resolved.colors.ring, resolved.colors.background, 3);

        assertSurfaceSeparation(fixture.name, resolved.colors.background, resolved.colors.card, resolved.colors.muted);

        for (const key of structuralColorKeys) {
            assertLowChroma(`${fixture.name} ${key}`, resolved.colors[key], key === "input" ? 0.04 : 0.03);
        }

        assertDiagnostics(fixture.name, resolved.diagnostics.length, fixture.expectDiagnostics);
    }
}

/**
 * Verifies that targeted UI component files do not use raw brand token classes
 * (`bg-primary/10`, `bg-accent/20`, etc.) directly. These classes bypass the
 * design token layer and break contrast guarantees on custom themes.
 */
function runUsageAssertions() {
    const targetedFiles = ["app/components/FullScreenSearch.tsx", "app/components/FullScreenMenu.tsx", "app/routes/search.tsx"];

    const forbiddenPatterns = ["bg-primary/10", "bg-accent/20", "border-primary/30", "border-accent/30"];

    for (const relativePath of targetedFiles) {
        const absolutePath = path.join(process.cwd(), relativePath);
        const content = fs.readFileSync(absolutePath, "utf8");

        for (const pattern of forbiddenPatterns) {
            assert(
                !content.includes(pattern),
                `${relativePath} still contains structural raw brand token usage: ${pattern}`
            );
        }
    }
}

runFixtureAssertions();
runUsageAssertions();
