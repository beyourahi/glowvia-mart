// Known AI surface referrer domains — mapped to their utm_source values
const AI_REFERRER_MAP: Record<string, string> = {
    "chatgpt.com": "chatgpt",
    "chat.openai.com": "chatgpt",
    "perplexity.ai": "perplexity",
    "gemini.google.com": "gemini",
    "bard.google.com": "gemini",
    "copilot.microsoft.com": "copilot",
    "bing.com": "bing_chat",
    "you.com": "you",
    "claude.ai": "claude",
};

export interface AiAttribution {
    isAiReferrer: boolean;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
}

const EMPTY: AiAttribution = {
    isAiReferrer: false,
    utmSource: "",
    utmMedium: "",
    utmCampaign: ""
};

/**
 * Detect AI-originated traffic from request headers and URL params.
 * Server-side only — never called on the client.
 */
export function detectAiAttribution(
    headers: Headers,
    searchParams?: URLSearchParams
): AiAttribution {
    const utmSource = searchParams?.get("utm_source") ?? "";
    const utmMedium = searchParams?.get("utm_medium") ?? "";
    if (utmSource && utmMedium === "ai") {
        return {isAiReferrer: true, utmSource, utmMedium: "ai", utmCampaign: searchParams?.get("utm_campaign") ?? "ai_referral"};
    }

    const referer = headers.get("referer") ?? headers.get("referrer") ?? "";
    if (!referer) return EMPTY;

    try {
        const refUrl = new URL(referer);
        const hostname = refUrl.hostname.replace(/^www\./, "");
        const source = AI_REFERRER_MAP[hostname];
        if (source) {
            return {isAiReferrer: true, utmSource: source, utmMedium: "ai", utmCampaign: "ai_referral"};
        }
    } catch {
        // Invalid referer URL — not AI
    }

    return EMPTY;
}

/**
 * Build a URL with AI attribution UTM params appended.
 * Returns the original URL unchanged if attribution is not from AI.
 */
export function appendAiAttribution(url: string, attribution: AiAttribution): string {
    if (!attribution.isAiReferrer) return url;
    try {
        const u = new URL(url, "https://placeholder.invalid");
        u.searchParams.set("utm_source", attribution.utmSource);
        u.searchParams.set("utm_medium", attribution.utmMedium);
        u.searchParams.set("utm_campaign", attribution.utmCampaign);
        return url.startsWith("http") ? u.toString() : `${u.pathname}${u.search}`;
    } catch {
        return url;
    }
}
