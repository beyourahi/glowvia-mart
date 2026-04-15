/**
 * @fileoverview ShopLocation — Google Maps embed section
 *
 * @description
 * Renders an editorial dark-panel section with one or more Google Maps iframes
 * driven by `site_settings.google_maps_embed` (embed src URLs) and
 * `site_settings.google_maps_link` (share links) — both `list.url` fields.
 *
 * Behaviour:
 *  - 0 locations → returns null (section absent, zero DOM)
 *  - 1 location  → full-width embed + CTA, no tab switcher
 *  - 2+ locations → tab pill switcher + embed + CTA
 *
 * The iframe itself receives only `src` and `title`; all layout is handled by
 * the fluid wrapper div.  This preserves the embed's own intrinsic dimensions
 * and avoids dimension conflicts with the Google Maps markup.
 *
 * @dependencies
 * - useShopLocations() from ~/lib/site-content-context
 */

import {useState} from "react";
import {useShopLocations} from "~/lib/site-content-context";

// =============================================================================
// TYPES
// =============================================================================

interface LocationPair {
    embedUrl: string;
    shareLink: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Zip two parallel arrays into index-paired objects, skipping any position
 * where either value is missing or empty.
 */
function zipLocationPairs(embedUrls: string[], shareLinks: string[]): LocationPair[] {
    const count = Math.min(embedUrls.length, shareLinks.length);
    const pairs: LocationPair[] = [];
    for (let i = 0; i < count; i++) {
        const embedUrl = embedUrls[i]?.trim();
        const shareLink = shareLinks[i]?.trim();
        if (embedUrl && shareLink) {
            pairs.push({embedUrl, shareLink});
        }
    }
    return pairs;
}

/**
 * Derive a short display label for a location tab.
 * Falls back to "Store A", "Store B", … when no meaningful label can be extracted.
 */
function locationLabel(index: number): string {
    const letters = ["A", "B", "C", "D", "E", "F"];
    return `Store ${letters[index] ?? index + 1}`;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ShopLocation renders an editorial dark-panel section with embedded Google Maps.
 * The section is completely absent from the DOM when no locations are configured.
 */
export function ShopLocation() {
    const {embedUrls, shareLinks} = useShopLocations();
    const pairs = zipLocationPairs(embedUrls, shareLinks);
    const [activeIndex, setActiveIndex] = useState(0);

    if (pairs.length === 0) return null;

    const activePair = pairs[Math.min(activeIndex, pairs.length - 1)];
    const isMulti = pairs.length > 1;

    return (
        <section
            aria-label="Shop locations"
            className="w-full bg-[--text-primary] py-16 md:py-20 lg:py-24"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* ── Desktop layout ─────────────────────────────────────────
                    Single location: heading left / map right (side-by-side)
                    Multiple locations: centred stacked with tab switcher
                    ─────────────────────────────────────────────────────── */}
                {!isMulti ? (
                    <SingleLocationLayout pair={activePair} />
                ) : (
                    <MultiLocationLayout
                        pairs={pairs}
                        activeIndex={activeIndex}
                        onSelect={setActiveIndex}
                        activePair={activePair}
                    />
                )}
            </div>
        </section>
    );
}

// =============================================================================
// SINGLE LOCATION LAYOUT
// =============================================================================

function SingleLocationLayout({pair}: {pair: LocationPair}) {
    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Left: editorial copy */}
            <div className="flex flex-col gap-5">
                <LocationOverline />
                <h2 className="font-serif text-4xl leading-tight tracking-tight text-[--text-inverse] sm:text-5xl lg:text-6xl">
                    Find Us
                </h2>
                <p className="max-w-xs text-sm leading-relaxed text-[--text-subtle]">
                    Come experience our products in person. We&apos;d love to meet you.
                </p>
                <LocationCta href={pair.shareLink} />
            </div>

            {/* Right: map embed */}
            <MapEmbed embedUrl={pair.embedUrl} />
        </div>
    );
}

// =============================================================================
// MULTI LOCATION LAYOUT
// =============================================================================

function MultiLocationLayout({
    pairs,
    activeIndex,
    onSelect,
    activePair
}: {
    pairs: LocationPair[];
    activeIndex: number;
    onSelect: (i: number) => void;
    activePair: LocationPair;
}) {
    return (
        <div className="flex flex-col items-center gap-10">
            {/* Header row: overline + heading + tab switcher */}
            <div className="flex w-full flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-3">
                    <LocationOverline />
                    <h2 className="font-serif text-4xl leading-tight tracking-tight text-[--text-inverse] sm:text-5xl">
                        Find Us
                    </h2>
                </div>

                {/* Tab pills */}
                <nav aria-label="Location tabs" className="flex flex-wrap gap-2">
                    {pairs.map((pair, i) => (
                        <button
                            key={pair.embedUrl}
                            type="button"
                            onClick={() => onSelect(i)}
                            aria-pressed={i === activeIndex}
                            className={[
                                "min-h-[44px] min-w-[44px] rounded-full border px-5 py-2 text-sm font-medium",
                                "transition-colors duration-200",
                                i === activeIndex
                                    ? "border-transparent bg-[--brand-primary] text-[--brand-primary-foreground]"
                                    : "border-[oklch(0.38_0.008_95)] text-[--text-subtle] hover:border-[--text-subtle] hover:text-[--text-inverse]"
                            ].join(" ")}
                        >
                            {locationLabel(i)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Map */}
            <div className="w-full">
                <MapEmbed embedUrl={activePair.embedUrl} />
            </div>

            {/* CTA */}
            <div className="w-full">
                <LocationCta href={activePair.shareLink} />
            </div>
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Small-caps overline label */
function LocationOverline() {
    return (
        <span
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[--text-subtle]"
            aria-hidden="true"
        >
            Our Locations
        </span>
    );
}

/**
 * Google Maps iframe wrapper.
 * The iframe receives only `src` and `title` — layout is handled by the wrapper.
 * No className/style/width/height on the iframe itself.
 */
function MapEmbed({embedUrl}: {embedUrl: string}) {
    return (
        <div
            className={[
                "w-full overflow-hidden rounded-lg",
                "ring-1 ring-[oklch(0.32_0.008_95)]",
                /* Aspect ratio on the wrapper — constrains the embed's natural height */
                "aspect-[4/3] md:aspect-[16/9]"
            ].join(" ")}
        >
            <iframe
                src={embedUrl}
                title="Store location map"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
            />
        </div>
    );
}

/** "Visit our store →" CTA link */
function LocationCta({href}: {href: string}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={[
                "group inline-flex items-center gap-2 text-sm font-medium",
                "text-[--brand-primary-subtle] underline-offset-4",
                "transition-colors duration-200 hover:text-[--text-inverse] hover:underline"
            ].join(" ")}
        >
            Visit our store
            <span
                aria-hidden="true"
                className="translate-x-0 transition-transform duration-200 group-hover:translate-x-1"
            >
                →
            </span>
        </a>
    );
}
