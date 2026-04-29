import {useState, useEffect, useCallback} from "react";
import {useNavigate} from "react-router";
import {resolveGiftQuery, type GiftFinderAnswers} from "~/lib/agentic/quizzes/gift-finder";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepKey = keyof GiftFinderAnswers;

interface Step {
    key: StepKey;
    question: string;
    options: {value: string; label: string}[];
}

const STEPS: Step[] = [
    {
        key: "recipient",
        question: "Who are you shopping for?",
        options: [
            {value: "him", label: "Him"},
            {value: "her", label: "Her"},
            {value: "them", label: "Them"},
            {value: "kids", label: "Kids"}
        ]
    },
    {
        key: "budget",
        question: "What's your budget?",
        options: [
            {value: "under25", label: "Under $25"},
            {value: "25to75", label: "$25 – $75"},
            {value: "75to150", label: "$75 – $150"},
            {value: "over150", label: "$150+"}
        ]
    },
    {
        key: "occasion",
        question: "What's the occasion?",
        options: [
            {value: "birthday", label: "Birthday"},
            {value: "anniversary", label: "Anniversary"},
            {value: "holiday", label: "Holiday"},
            {value: "justbecause", label: "Just Because"}
        ]
    },
    {
        key: "interest",
        question: "What are their interests?",
        options: [
            {value: "fashion", label: "Fashion"},
            {value: "wellness", label: "Wellness"},
            {value: "tech", label: "Tech"},
            {value: "home", label: "Home"},
            {value: "outdoor", label: "Outdoor"}
        ]
    }
];

const TOTAL_STEPS = STEPS.length;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Self-contained gift finder quiz component.
 * Feature 8 — Gift Finder Quiz.
 * On completion navigates to /search with a resolved query string.
 */
export function GiftFinderQuiz() {
    const navigate = useNavigate();
    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState<GiftFinderAnswers>({});
    const [selected, setSelected] = useState<string | undefined>(undefined);
    const [done, setDone] = useState(false);
    const [visible, setVisible] = useState(true);

    const step = STEPS[stepIndex];

    useEffect(() => {
        const prev = answers[step?.key as StepKey];
        setSelected(prev ?? undefined);
    }, [stepIndex, answers, step?.key]);

    const transition = useCallback((cb: () => void) => {
        setVisible(false);
        const id = setTimeout(() => {
            cb();
            setVisible(true);
        }, 220);
        return () => clearTimeout(id);
    }, []);

    function handleNext() {
        if (!selected) return;
        const updated = {...answers, [step.key]: selected as never};
        setAnswers(updated);
        if (stepIndex < TOTAL_STEPS - 1) {
            transition(() => {
                setStepIndex(i => i + 1);
                setSelected(undefined);
            });
        } else {
            transition(() => setDone(true));
        }
    }

    function handleBack() {
        if (stepIndex === 0) return;
        transition(() => setStepIndex(i => i - 1));
    }

    function handleShop() {
        const result = resolveGiftQuery(answers);
        void navigate(`/search?q=${encodeURIComponent(result.query)}`);
    }

    function handleRestart() {
        transition(() => {
            setStepIndex(0);
            setAnswers({});
            setSelected(undefined);
            setDone(false);
        });
    }

    const progressPct = done ? 100 : (stepIndex / TOTAL_STEPS) * 100;
    const result = done ? resolveGiftQuery(answers) : null;

    return (
        <div className="min-h-dvh bg-background flex flex-col">
            {/* Top progress bar */}
            <div className="fixed top-0 inset-x-0 z-50 h-px bg-border">
                <div
                    className="h-full bg-foreground transition-[width] duration-500 ease-in-out"
                    style={{width: `${progressPct}%`}}
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={done ? "Complete" : `Step ${stepIndex + 1} of ${TOTAL_STEPS}`}
                />
            </div>

            {/* Step counter */}
            {!done && (
                <div className="pt-16 pb-0 px-6 sm:px-12 lg:px-20">
                    <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                        {stepIndex + 1} / {TOTAL_STEPS}
                    </span>
                </div>
            )}

            {/* Content */}
            <div
                className="flex-1 flex flex-col justify-center transition-opacity duration-220 ease-in-out"
                style={{opacity: visible ? 1 : 0}}
            >
                {done && result ? (
                    /* Results screen */
                    <div className="px-6 sm:px-12 lg:px-20 py-16 max-w-2xl mx-auto w-full">
                        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
                            Your picks
                        </p>
                        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight mb-4">
                            {result.headline}
                        </h1>
                        <p className="text-muted-foreground mb-12 text-lg">
                            {"We've curated a selection based on your answers."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleShop}
                                className="inline-flex items-center justify-center h-14 px-10 bg-foreground text-background text-sm font-medium tracking-widest uppercase rounded-none transition-opacity duration-150 can-hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                            >
                                Shop these gifts
                            </button>
                            <button
                                onClick={handleRestart}
                                className="inline-flex items-center justify-center h-14 px-10 border border-border text-foreground text-sm font-medium tracking-widest uppercase rounded-none transition-opacity duration-150 can-hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                            >
                                Start over
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Quiz step */
                    <div className="px-6 sm:px-12 lg:px-20 py-8 sm:py-16 w-full max-w-4xl mx-auto">
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-10 sm:mb-14 leading-tight">
                            {step.question}
                        </h1>

                        <div
                            role="radiogroup"
                            aria-label={step.question}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12"
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
                                            "relative flex items-center justify-center",
                                            "min-h-[72px] sm:min-h-[88px] px-4 py-5",
                                            "border text-sm font-medium tracking-wide",
                                            "rounded-none transition-colors duration-150",
                                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                                            isSelected
                                                ? "border-foreground bg-foreground text-background"
                                                : "border-border bg-background text-foreground can-hover:border-foreground/40"
                                        ].join(" ")}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

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
                                {stepIndex === TOTAL_STEPS - 1 ? "Find gifts" : "Next"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
