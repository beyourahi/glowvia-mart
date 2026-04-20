/**
 * @fileoverview ProductReviews — Customer review display for product detail pages
 *
 * @description
 * Reads `customer_review` metaobjects linked to the product via the
 * `custom.reviews` metafield (list.metaobject_reference). Renders an
 * aggregate summary panel + layout-switched review display.
 *
 * Fields expected per review node (from PRODUCT_FRAGMENT):
 *   reviewerName  — single_line_text_field
 *   rating        — rating type (JSON: {"scale_min":"1.0","scale_max":"5.0","value":"4.0"})
 *   reviewTitle   — single_line_text_field
 *   body          — multi_line_text_field
 *   date          — date field (ISO string "YYYY-MM-DD")
 *
 * Layout variants (single source of truth — getLayoutVariant()):
 *   "single"   (1 review)  — Featured single card with quote decoration + summary panel
 *   "pair"     (2 reviews) — Balanced two-column grid, no orphans
 *   "trio"     (3 reviews) — Three-column grid at md+, no orphans at any breakpoint
 *   "carousel" (4+ reviews)— Embla carousel (1/2/3 visible at mobile/tablet/desktop),
 *                            horizontal summary bar, dot nav (≤10 snaps) or counter (>10)
 */

import {useState, useEffect} from "react";
import {ArrowLeft, ArrowRight} from "lucide-react";

import {cn} from "~/lib/utils";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {
    type CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
} from "~/components/ui/carousel";

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse Shopify's rating field value. The Storefront API returns it as either:
 *  - JSON string: {"scale_min":"1.0","scale_max":"5.0","value":"4.0"}
 *  - Plain number string: "4" (fallback)
 */
function parseRating(raw: string | null | undefined): number {
    if (!raw) return 0;
    try {
        const parsed = JSON.parse(raw) as {value?: string};
        return parseFloat(parsed.value ?? "0");
    } catch {
        return parseFloat(raw) || 0;
    }
}

function formatReviewDate(iso: string | null | undefined): string {
    if (!iso) return "";
    try {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        }).format(new Date(iso + "T00:00:00")); // force local midnight to avoid TZ-off-by-one
    } catch {
        return iso;
    }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StarRow({rating, max = 5, size = 14}: {rating: number; max?: number; size?: number}) {
    const filled = Math.round(rating);
    return (
        <div
            className="flex items-center gap-0.5"
            role="img"
            aria-label={`${filled} out of ${max} stars`}
        >
            {Array.from({length: max}, (_, i) => (
                <svg
                    key={i}
                    width={size}
                    height={size}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        d="M10 1.5L12.245 6.5L17.5 7.3L13.75 11L14.745 16.5L10 13.75L5.255 16.5L6.25 11L2.5 7.3L7.755 6.5L10 1.5Z"
                        fill={i < filled ? "var(--brand-accent)" : "none"}
                        stroke={i < filled ? "var(--brand-accent)" : "var(--border-strong)"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ))}
        </div>
    );
}

function RatingBar({label, count, total}: {label: string; count: number; total: number}) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-4 shrink-0 text-right text-[var(--text-subtle)]">{label}</span>
            <StarRow rating={parseInt(label, 10)} max={1} size={12} />
            <div
                className="h-1.5 flex-1 overflow-hidden rounded-full"
                style={{background: "var(--surface-interactive)"}}
            >
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${pct}%`,
                        background: "var(--brand-accent)"
                    }}
                />
            </div>
            <span className="w-5 shrink-0 text-right text-[var(--text-subtle)]">{count}</span>
        </div>
    );
}

// =============================================================================
// TYPES
// =============================================================================

export type ReviewNode = {
    reviewerName: {value: string} | null;
    rating: {value: string} | null;
    reviewTitle: {value: string} | null;
    body: {value: string} | null;
    date: {value: string} | null;
};

// =============================================================================
// LAYOUT VARIANT — single source of truth
// =============================================================================

type LayoutVariant = "single" | "pair" | "trio" | "carousel";

function getLayoutVariant(count: number): LayoutVariant {
    if (count === 1) return "single";
    if (count === 2) return "pair";
    if (count === 3) return "trio";
    return "carousel";
}

// =============================================================================
// REVIEW CARD — shared across all layout variants
// =============================================================================

function ReviewCard({
    review,
    featured = false,
    animationDelay = 0
}: {
    review: ReviewNode;
    featured?: boolean;
    animationDelay?: number;
}) {
    const rating = parseRating(review.rating?.value);
    const name = review.reviewerName?.value ?? "Anonymous";
    const title = review.reviewTitle?.value;
    const body = review.body?.value;
    const date = formatReviewDate(review.date?.value);
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map(s => s[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <article
            className={cn(
                "flex flex-col gap-4 rounded-2xl animate-fade-in h-full",
                featured ? "p-8 lg:p-10" : "p-5"
            )}
            style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
                animationDelay: `${animationDelay}ms`,
                animationFillMode: "both"
            }}
        >
            {/* Decorative opening quote — single featured card only */}
            {featured && (
                <svg
                    aria-hidden="true"
                    width="24"
                    height="20"
                    viewBox="0 0 24 20"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-1 opacity-25"
                    style={{color: "var(--brand-accent)"}}
                >
                    <path d="M0 20V12.4C0 10.16 0.44 8.2 1.32 6.52C2.2 4.8 3.4 3.36 4.92 2.2C6.48 1 8.28 0.24 10.32 0L11.16 2.36C9.64 2.76 8.32 3.4 7.2 4.28C6.08 5.16 5.2 6.12 4.56 7.16C3.92 8.2 3.6 9.2 3.6 10.16H7.2V20H0ZM13.2 20V12.4C13.2 10.16 13.64 8.2 14.52 6.52C15.4 4.8 16.6 3.36 18.12 2.2C19.68 1 21.48 0.24 23.52 0L24.36 2.36C22.84 2.76 21.52 3.4 20.4 4.28C19.28 5.16 18.4 6.12 17.76 7.16C17.12 8.2 16.8 9.2 16.8 10.16H20.4V20H13.2Z" />
                </svg>
            )}

            {/* Rating + date row */}
            <div className="flex items-center justify-between gap-2">
                <StarRow rating={rating} size={featured ? 18 : 15} />
                {date && (
                    <time
                        dateTime={review.date?.value ?? ""}
                        className="text-xs shrink-0"
                        style={{color: "var(--text-subtle)"}}
                    >
                        {date}
                    </time>
                )}
            </div>

            {/* Title */}
            {title && (
                <p
                    className={cn("font-semibold leading-snug", featured ? "text-base" : "text-sm")}
                    style={{color: "var(--text-primary)"}}
                >
                    {title}
                </p>
            )}

            {/* Body */}
            {body && (
                <p
                    className={cn("leading-relaxed flex-1", featured ? "text-base" : "text-sm")}
                    style={{color: "var(--text-secondary)"}}
                >
                    {body}
                </p>
            )}

            {/* Reviewer footer */}
            <div
                className="flex items-center gap-2.5 mt-auto pt-2 border-t"
                style={{borderColor: "var(--border-subtle)"}}
            >
                <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                        background: "var(--brand-primary-subtle)",
                        color: "var(--brand-primary-subtle-foreground)"
                    }}
                    aria-hidden="true"
                >
                    {initials || "?"}
                </div>
                <span
                    className="text-xs font-medium truncate"
                    style={{color: "var(--text-primary)"}}
                >
                    {name}
                </span>
            </div>
        </article>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProductReviews({reviews}: {reviews: ReviewNode[]}) {
    // Carousel state — always declared (React hook rules), only active in "carousel" variant.
    // Initial values (false / []) produce a safe SSR render; Embla hydrates on the client
    // and fires "reInit" + "select" to sync state without layout shift.
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    useEffect(() => {
        if (!carouselApi) return;
        const syncState = () => {
            setScrollSnaps(carouselApi.scrollSnapList());
            setSelectedIndex(carouselApi.selectedScrollSnap());
            setCanScrollPrev(carouselApi.canScrollPrev());
            setCanScrollNext(carouselApi.canScrollNext());
        };
        carouselApi.on("select", syncState);
        carouselApi.on("reInit", syncState);
        syncState();
        return () => {
            carouselApi.off("select", syncState);
            carouselApi.off("reInit", syncState);
        };
    }, [carouselApi]);

    if (!reviews.length) return null;

    const count = reviews.length;
    // Single computed value drives all layout decisions
    const variant = getLayoutVariant(count);

    // Aggregate stats
    const ratings = reviews.map(r => parseRating(r.rating?.value));
    const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const roundedAvg = Math.round(avg * 10) / 10;

    const distribution: Record<string, number> = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0};
    ratings.forEach(r => {
        const bucket = String(Math.round(r));
        if (bucket in distribution) distribution[bucket]++;
    });

    // Grid class for 1–3 card variants — no grid needed for single
    const gridClass =
        variant === "pair"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-5 content-start"
            : variant === "trio"
              ? "grid grid-cols-1 md:grid-cols-3 gap-5 content-start"
              : "";

    // Composite key: no stable ID from Storefront API metaobject fields
    const reviewKey = (r: ReviewNode, i: number) =>
        `${r.reviewerName?.value ?? ""}-${r.date?.value ?? ""}-${i}`;

    return (
        <section
            className="mx-4 lg:mx-6 xl:mx-8 2xl:mx-12 3xl:mx-auto 3xl:max-w-400 3xl:px-12 py-16 lg:py-20"
            aria-labelledby="reviews-heading"
        >
            {/* Divider */}
            <div
                className="mb-12 lg:mb-16 h-px w-full"
                style={{background: "var(--border-subtle)"}}
                aria-hidden="true"
            />

            {/* Section header */}
            <div className="mb-10 lg:mb-14 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2
                    id="reviews-heading"
                    className="text-2xl lg:text-3xl font-semibold tracking-tight"
                    style={{color: "var(--text-primary)"}}
                >
                    Customer Reviews
                </h2>
                <p className="text-sm" style={{color: "var(--text-subtle)"}}>
                    {count} {count === 1 ? "review" : "reviews"}
                </p>
            </div>

            {variant === "carousel" ? (
                /* ── CAROUSEL LAYOUT (4+ reviews) ─────────────────────────── */
                <div>
                    {/* Horizontal summary bar — full width above the carousel */}
                    <div
                        className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 p-6 rounded-2xl mb-10 animate-slide-right-fade"
                        style={{
                            background: "var(--surface-raised)",
                            border: "1px solid var(--border-subtle)"
                        }}
                    >
                        {/* Average score + stars */}
                        <div className="flex items-center gap-4 shrink-0">
                            <span
                                className="text-5xl font-bold leading-none tracking-tight"
                                style={{color: "var(--text-primary)"}}
                            >
                                {roundedAvg.toFixed(1)}
                            </span>
                            <div className="flex flex-col gap-1">
                                <StarRow rating={roundedAvg} size={18} />
                                <span className="text-xs" style={{color: "var(--text-subtle)"}}>
                                    out of 5 · {count} reviews
                                </span>
                            </div>
                        </div>

                        {/* Vertical rule (desktop only) */}
                        <div
                            className="hidden sm:block w-px self-stretch shrink-0"
                            style={{background: "var(--border-subtle)"}}
                            aria-hidden="true"
                        />

                        {/* Distribution bars */}
                        <div className="flex-1 flex flex-col gap-2">
                            {["5", "4", "3", "2", "1"].map(star => (
                                <RatingBar
                                    key={star}
                                    label={star}
                                    count={distribution[star] ?? 0}
                                    total={count}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Embla carousel — 1 / 2 / 3 cards visible at mobile / tablet / desktop */}
                    <Carousel
                        setApi={setCarouselApi}
                        opts={{align: "start", containScroll: "keepSnaps"}}
                        plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]}
                        aria-label="Customer reviews"
                    >
                        <CarouselContent>
                            {reviews.map((review, i) => (
                                <CarouselItem
                                    key={reviewKey(review, i)}
                                    className="basis-full sm:basis-1/2 lg:basis-1/3"
                                >
                                    <ReviewCard review={review} animationDelay={i * 60} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>

                    {/* Navigation: prev button | dot indicators or counter | next button */}
                    <div className="flex items-center justify-between gap-4 mt-6 px-1">
                        {/* Previous */}
                        <button
                            onClick={() => canScrollPrev && carouselApi?.scrollPrev()}
                            aria-disabled={!canScrollPrev}
                            aria-label="Previous reviews"
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                                "transition-all duration-[var(--motion-duration-fast)]",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]",
                                !canScrollPrev
                                    ? "cursor-default opacity-30 border-[var(--border-subtle)] text-[var(--text-subtle)]"
                                    : "cursor-pointer border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--surface-interactive)]"
                            )}
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                        </button>

                        {/* Dots (≤10 snap positions) or fraction counter (>10) */}
                        {scrollSnaps.length > 0 &&
                            (scrollSnaps.length <= 10 ? (
                                <div
                                    className="flex items-center gap-1.5"
                                    role="tablist"
                                    aria-label="Review slide navigation"
                                >
                                    {scrollSnaps.map((snap, i) => (
                                        <button
                                            key={snap}
                                            role="tab"
                                            aria-selected={i === selectedIndex}
                                            aria-label={`Go to slide ${i + 1}`}
                                            onClick={() => carouselApi?.scrollTo(i)}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all duration-300",
                                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]",
                                                i === selectedIndex
                                                    ? "w-5 cursor-default"
                                                    : "w-1.5 cursor-pointer hover:opacity-70"
                                            )}
                                            style={{
                                                background:
                                                    i === selectedIndex
                                                        ? "var(--brand-accent)"
                                                        : "var(--border-strong)"
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <span className="text-sm tabular-nums" style={{color: "var(--text-subtle)"}}>
                                    {selectedIndex + 1} / {scrollSnaps.length}
                                </span>
                            ))}

                        {/* Next */}
                        <button
                            onClick={() => canScrollNext && carouselApi?.scrollNext()}
                            aria-disabled={!canScrollNext}
                            aria-label="Next reviews"
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                                "transition-all duration-[var(--motion-duration-fast)]",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]",
                                !canScrollNext
                                    ? "cursor-default opacity-30 border-[var(--border-subtle)] text-[var(--text-subtle)]"
                                    : "cursor-pointer border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--surface-interactive)]"
                            )}
                        >
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            ) : (
                /* ── GRID LAYOUTS (1–3 reviews) ────────────────────────────── */
                <div className="flex flex-col gap-12 lg:flex-row lg:gap-16 xl:gap-20">
                    {/* Aggregate summary panel — left column on desktop */}
                    <div className="shrink-0 lg:w-56 xl:w-64 animate-slide-right-fade">
                        <div
                            className="rounded-2xl p-6 flex flex-col gap-5"
                            style={{
                                background: "var(--surface-raised)",
                                border: "1px solid var(--border-subtle)"
                            }}
                        >
                            <div className="flex flex-col items-start gap-2">
                                <span
                                    className="text-5xl font-bold leading-none tracking-tight"
                                    style={{color: "var(--text-primary)"}}
                                >
                                    {roundedAvg.toFixed(1)}
                                </span>
                                <StarRow rating={roundedAvg} size={18} />
                                <span className="text-xs mt-0.5" style={{color: "var(--text-subtle)"}}>
                                    out of 5
                                </span>
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {["5", "4", "3", "2", "1"].map(star => (
                                    <RatingBar
                                        key={star}
                                        label={star}
                                        count={distribution[star] ?? 0}
                                        total={count}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Review cards — layout determined by variant */}
                    <div className={cn("flex-1", gridClass)}>
                        {reviews.map((review, i) => (
                            <ReviewCard
                                key={reviewKey(review, i)}
                                review={review}
                                featured={variant === "single"}
                                animationDelay={i * 60}
                            />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
