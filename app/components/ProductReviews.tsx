/**
 * @fileoverview ProductReviews — Customer review display for product detail pages
 *
 * @description
 * Reads `customer_review` metaobjects linked to the product via the
 * `custom.reviews` metafield (list.metaobject_reference). Renders an
 * aggregate summary bar + a responsive grid of individual review cards.
 *
 * Fields expected per review node (from PRODUCT_FRAGMENT):
 *   reviewerName  — single_line_text_field
 *   rating        — rating type (JSON: {"scale_min":"1.0","scale_max":"5.0","value":"4.0"})
 *   reviewTitle   — single_line_text_field
 *   body          — multi_line_text_field
 *   date          — date field (ISO string "YYYY-MM-DD")
 *
 * Design: editorial-warm — brand-accent (gold/yellow) stars, surface tokens for depth,
 * staggered CSS animation matching the rest of the product page.
 */

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
// MAIN COMPONENT
// =============================================================================

export function ProductReviews({reviews}: {reviews: ReviewNode[]}) {
    if (!reviews.length) return null;

    // Compute aggregate stats
    const ratings = reviews.map(r => parseRating(r.rating?.value));
    const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const roundedAvg = Math.round(avg * 10) / 10;

    const distribution: Record<string, number> = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0};
    ratings.forEach(r => {
        const bucket = String(Math.round(r));
        if (bucket in distribution) distribution[bucket]++;
    });

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
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
            </div>

            {/* Summary + grid layout */}
            <div className="flex flex-col gap-12 lg:flex-row lg:gap-16 xl:gap-20">
                {/* Aggregate summary panel */}
                <div className="shrink-0 lg:w-56 xl:w-64 animate-slide-right-fade">
                    <div
                        className="rounded-2xl p-6 flex flex-col gap-5"
                        style={{
                            background: "var(--surface-raised)",
                            border: "1px solid var(--border-subtle)"
                        }}
                    >
                        {/* Big average number */}
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

                        {/* Distribution bars */}
                        <div className="flex flex-col gap-2.5">
                            {["5", "4", "3", "2", "1"].map(star => (
                                <RatingBar
                                    key={star}
                                    label={star}
                                    count={distribution[star] ?? 0}
                                    total={reviews.length}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Review cards grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 content-start">
                    {reviews.map((review, i) => {
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
                        // Composite key: reviewer + date index — no stable ID from Storefront API metaobject fields
                        const reviewKey = `${name}-${review.date?.value ?? ""}-${i}`;

                        return (
                            <article
                                key={reviewKey}
                                className="flex flex-col gap-4 rounded-2xl p-5 animate-fade-in"
                                style={{
                                    background: "var(--surface-raised)",
                                    border: "1px solid var(--border-subtle)",
                                    animationDelay: `${i * 60}ms`,
                                    animationFillMode: "both"
                                }}
                            >
                                {/* Rating row */}
                                <div className="flex items-center justify-between gap-2">
                                    <StarRow rating={rating} size={15} />
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
                                        className="text-sm font-semibold leading-snug"
                                        style={{color: "var(--text-primary)"}}
                                    >
                                        {title}
                                    </p>
                                )}

                                {/* Body */}
                                {body && (
                                    <p
                                        className="text-sm leading-relaxed flex-1"
                                        style={{color: "var(--text-secondary)"}}
                                    >
                                        {body}
                                    </p>
                                )}

                                {/* Reviewer */}
                                <div className="flex items-center gap-2.5 mt-auto pt-2 border-t" style={{borderColor: "var(--border-subtle)"}}>
                                    {/* Avatar initials */}
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
                    })}
                </div>
            </div>
        </section>
    );
}
