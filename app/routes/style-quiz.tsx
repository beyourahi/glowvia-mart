/**
 * @fileoverview Style & Fit Quiz — /style-quiz
 *
 * @description
 * A 3-step guided quiz that maps personal style and fit preferences into a
 * Storefront search query. Saves the resolved profileKey to localStorage
 * (key: "style_profile") and shows a welcome-back banner if a saved profile
 * is detected on mount.
 *
 * @route GET /style-quiz
 *
 * @features
 * - 3 steps: fit → style → color
 * - Full-width row options with left-accent selected state
 * - Dot step indicator (filled / hollow)
 * - localStorage persistence (key: "style_profile")
 * - Welcome-back banner when saved profile detected
 * - Navigates to /search?q=<query> on completion
 *
 * @design
 * - Monochromatic: black / white / gray only — no color accents
 * - Full-width list rows, not card tiles
 * - Left border accent for selected state, no fill except bg-muted/30
 * - Clean dot step indicator
 * - Compact dense layout, generous inter-row breathing
 *
 * @accessibility
 * - role="radiogroup" / role="radio" for option rows
 * - Touch targets ≥ 44×44px
 * - Focus rings on all interactive elements
 * - SSR-safe localStorage access via useEffect
 */

import type {Route} from "./+types/style-quiz";
import {useState, useEffect, useCallback} from "react";
import {useNavigate} from "react-router";
import {useAgentSurface} from "~/lib/agent-surface-context";
import {AgentFallbackBanner} from "~/components/AgentFallbackBanner";
import {getSeoMeta} from "@shopify/hydrogen";
import {buildCanonicalUrl, getBrandNameFromMatches, getSiteUrlFromMatches} from "~/lib/seo";
import {resolveStyleQuery, type StyleProfile} from "~/lib/agentic/quizzes/style-fit";

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    return (
        getSeoMeta({
            title: "Style Quiz",
            titleTemplate: `%s | ${brandName}`,
            description: `Discover your personal style in three steps. We'll match your fit, aesthetic, and color preferences to a curated selection.`,
            url: buildCanonicalUrl("/style-quiz", siteUrl)
        }) ?? []
    );
};

const PROFILE_STORAGE_KEY = "style_profile";

/* ─────────────────────────────────────────────────────────────────────
 * Step definitions
 * ───────────────────────────────────────────────────────────────────── */
type StepKey = keyof StyleProfile;

interface StepOption {
    value: string;
    label: string;
    descriptor: string;
}

interface Step {
    key: StepKey;
    question: string;
    options: StepOption[];
}

const STEPS: Step[] = [
    {
        key: "fit",
        question: "How do you like your clothes to fit?",
        options: [
            {value: "relaxed", label: "Relaxed", descriptor: "Easy, laid-back silhouette"},
            {value: "regular", label: "Regular", descriptor: "Classic, true-to-size cut"},
            {value: "slim", label: "Slim", descriptor: "Tailored, close to the body"},
            {value: "oversized", label: "Oversized", descriptor: "Intentionally loose and draped"}
        ]
    },
    {
        key: "style",
        question: "Which aesthetic speaks to you?",
        options: [
            {value: "casual", label: "Casual", descriptor: "Everyday comfort, effortless ease"},
            {value: "formal", label: "Formal", descriptor: "Polished, professional, refined"},
            {value: "streetwear", label: "Streetwear", descriptor: "Urban edge, graphic-driven"},
            {value: "minimalist", label: "Minimalist", descriptor: "Clean lines, considered basics"},
            {value: "eclectic", label: "Eclectic", descriptor: "Vintage, pattern-mixing, expressive"}
        ]
    },
    {
        key: "color",
        question: "What's your color palette?",
        options: [
            {value: "neutrals", label: "Neutrals", descriptor: "White, black, grey, beige"},
            {value: "bold", label: "Bold", descriptor: "Saturated, high-impact colour"},
            {value: "pastels", label: "Pastels", descriptor: "Soft, desaturated, gentle tones"},
            {value: "earth", label: "Earth tones", descriptor: "Terracotta, olive, warm browns"},
            {value: "monochrome", label: "Monochrome", descriptor: "Head-to-toe single colour dressing"}
        ]
    }
];

const TOTAL_STEPS = STEPS.length;

/* ─────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────── */
export default function StyleQuiz() {
    const navigate = useNavigate();

    const [stepIndex, setStepIndex] = useState(0);
    const [profile, setProfile] = useState<StyleProfile>({});
    const [selected, setSelected] = useState<string | undefined>(undefined);
    const [done, setDone] = useState(false);
    const [visible, setVisible] = useState(true);

    /** SSR-safe: populated only after mount */
    const [savedProfileKey, setSavedProfileKey] = useState<string | null>(null);

    /* Read saved profile from localStorage after mount (SSR-safe) */
    useEffect(() => {
        try {
            const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (stored) setSavedProfileKey(stored);
        } catch {
            /* localStorage unavailable — silently ignore */
        }
    }, []);

    const step = STEPS[stepIndex];

    /* Pre-populate selected if user navigated back */
    useEffect(() => {
        const prev = profile[step?.key as StepKey];
        setSelected(prev ?? undefined);
    }, [stepIndex, profile, step?.key]);

    /** Crossfade helper */
    const transition = useCallback((cb: () => void) => {
        setVisible(false);
        const id = setTimeout(() => {
            cb();
            setVisible(true);
        }, 220);
        return () => clearTimeout(id);
    }, []);

    const agentSurface = useAgentSurface();
    // Agent path: quiz UI requires interactive browser input — redirect agents to catalog.
    if (agentSurface.isAgent) return <AgentFallbackBanner />;

    function handleNext() {
        if (!selected) return;

        const updated = {...profile, [step.key]: selected as never};
        setProfile(updated);

        if (stepIndex < TOTAL_STEPS - 1) {
            transition(() => {
                setStepIndex(i => i + 1);
                setSelected(undefined);
            });
        } else {
            /* Final step — resolve, persist, and show results */
            const result = resolveStyleQuery(updated);
            try {
                localStorage.setItem(PROFILE_STORAGE_KEY, result.profileKey);
            } catch {
                /* localStorage unavailable */
            }
            transition(() => setDone(true));
        }
    }

    function handleBack() {
        if (stepIndex === 0) return;
        transition(() => setStepIndex(i => i - 1));
    }

    function handleShop() {
        const result = resolveStyleQuery(profile);
        void navigate(`/search?q=${encodeURIComponent(result.query)}`);
    }

    function handleRestart() {
        transition(() => {
            setStepIndex(0);
            setProfile({});
            setSelected(undefined);
            setDone(false);
        });
    }

    const result = done ? resolveStyleQuery(profile) : null;

    return (
        <div className="min-h-dvh bg-background flex flex-col">

            {/* ── Welcome-back banner (SSR-safe — only renders after mount) ── */}
            {savedProfileKey && !done && (
                <div className="border-b border-border px-6 sm:px-12 lg:px-20 py-4 pt-16">
                    <p className="text-sm text-muted-foreground">
                        Welcome back — your saved style:{" "}
                        <span className="text-foreground font-medium">
                            {savedProfileKey.replace(/-/g, " · ")}
                        </span>
                    </p>
                </div>
            )}

            {/* ── Dot step indicator ─────────────────────────────────────── */}
            {!done && (
                <div className={["flex items-center gap-2 px-6 sm:px-12 lg:px-20", savedProfileKey ? "pt-6" : "pt-16"].join(" ")}>
                    {STEPS.map((step, i) => (
                        <span
                            key={step.key}
                            aria-label={i < stepIndex ? "Completed" : i === stepIndex ? "Current step" : "Upcoming"}
                            className={[
                                "size-2 rounded-full transition-colors duration-300",
                                i <= stepIndex ? "bg-foreground" : "bg-border"
                            ].join(" ")}
                        />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground tracking-[0.15em] uppercase">
                        {stepIndex + 1} / {TOTAL_STEPS}
                    </span>
                </div>
            )}

            {/* ── Main content (crossfade wrapper) ───────────────────────── */}
            <div
                className="flex-1 flex flex-col justify-center transition-opacity duration-220 ease-in-out"
                style={{opacity: visible ? 1 : 0}}
            >
                {done && result ? (
                    /* ── Results screen ────────────────────────────────────── */
                    <div className="px-6 sm:px-12 lg:px-20 py-16 max-w-2xl mx-auto w-full">
                        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
                            Your style profile
                        </p>
                        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight mb-4 capitalize">
                            {result.label}
                        </h1>
                        <p className="text-muted-foreground mb-12 text-lg">
                            Curated for your aesthetic — profile saved to your device.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleShop}
                                className="inline-flex items-center justify-center h-14 px-10 bg-foreground text-background text-sm font-medium tracking-widest uppercase rounded-none transition-opacity duration-150 can-hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                            >
                                Shop your style
                            </button>
                            <button
                                onClick={handleRestart}
                                className="inline-flex items-center justify-center h-14 px-10 border border-border text-foreground text-sm font-medium tracking-widest uppercase rounded-none transition-opacity duration-150 can-hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                            >
                                Retake quiz
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Quiz step ──────────────────────────────────────────── */
                    <div className="px-6 sm:px-12 lg:px-20 py-8 sm:py-16 w-full max-w-3xl mx-auto">

                        {/* Question */}
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-8 sm:mb-12 leading-tight">
                            {step.question}
                        </h1>

                        {/* Option rows */}
                        <div
                            role="radiogroup"
                            aria-label={step.question}
                            className="w-full mb-12 divide-y divide-border/50 border-t border-border/50"
                        >
                            {step.options.map(opt => {
                                const isSelected = selected === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => setSelected(opt.value)}
                                        className={[
                                            "group w-full flex items-center gap-4 px-4 py-5 text-left",
                                            "transition-colors duration-150",
                                            "border-l-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                                            isSelected
                                                ? "border-l-foreground bg-muted/30"
                                                : "border-l-transparent can-hover:bg-muted/10"
                                        ].join(" ")}
                                    >
                                        {/* Label + descriptor */}
                                        <div className="flex-1 min-w-0">
                                            <span className={[
                                                "block text-sm font-semibold tracking-wide transition-colors duration-150",
                                                isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                                            ].join(" ")}>
                                                {opt.label}
                                            </span>
                                            <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                {opt.descriptor}
                                            </span>
                                        </div>

                                        {/* Selection indicator */}
                                        <span
                                            aria-hidden="true"
                                            className={[
                                                "shrink-0 size-4 rounded-full border transition-colors duration-150",
                                                isSelected
                                                    ? "border-foreground bg-foreground"
                                                    : "border-border"
                                            ].join(" ")}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Navigation row */}
                        <div className="flex items-center gap-4">
                            {stepIndex > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="h-14 px-6 border border-border text-foreground text-sm font-medium tracking-widest uppercase rounded-none transition-opacity duration-150 can-hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                disabled={!selected}
                                className="h-14 px-10 bg-foreground text-background text-sm font-medium tracking-widest uppercase rounded-none transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed can-hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                            >
                                {stepIndex === TOTAL_STEPS - 1 ? "Done" : "Next"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
