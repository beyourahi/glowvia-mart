/**
 * @fileoverview Policy corpus builder and BM25-lite ranker
 * Phase 3: Builds a unified search corpus from Shopify shop policies,
 * metaobject FAQ items, and policy extensions. Uses BM25-lite scoring
 * for keyword-matched retrieval suitable for Workers edge runtime.
 */

import type {AgentContext} from "../../types";
import {stripHtml} from "~/lib/seo";
import {parsePolicySections} from "~/lib/policy";
import {POLICIES_CORPUS_QUERY} from "~/lib/queries/policy-corpus";

export type PolicyResultSource = {
    kind: "shop_policy" | "metaobject_faq" | "metaobject_policy_extension";
    handle?: string;
    url?: string;
};

export type PolicyCorpusEntry = {
    id: string;
    title: string;
    content: string;
    type: "policy" | "faq";
    source: PolicyResultSource;
};

export type RankedResult = {
    type: "policy" | "faq";
    id: string;
    title: string;
    content: string;
    score: number;
    source: PolicyResultSource;
};

// Generic FAQ questions to filter out (Shopify template placeholders)
const GENERIC_FAQ_QUESTIONS = new Set([
    "can i get a refund",
    "how do i track my order",
    "what payment methods do you accept",
    "how can i contact you",
    "do you ship internationally",
    "how long does shipping take",
    "what is your return policy",
    "do you offer discounts",
    "can i change or cancel my order",
    "how do i care for my product"
]);

function isGenericFaq(question: string): boolean {
    return GENERIC_FAQ_QUESTIONS.has(question.toLowerCase().trim());
}

/** Build a unified corpus from shop policies + metaobject FAQ + policy extension */
export async function buildPolicyCorpus(ctx: NonNullable<AgentContext>): Promise<PolicyCorpusEntry[]> {
    const entries: PolicyCorpusEntry[] = [];

    // Fetch shop policies
    try {
        const data = await ctx.dataAdapter.query(POLICIES_CORPUS_QUERY, {
            cache: (ctx.dataAdapter as any).CacheLong?.() ?? undefined
        });

        const policies = [
            {key: "privacyPolicy", label: "Privacy Policy"},
            {key: "shippingPolicy", label: "Shipping Policy"},
            {key: "refundPolicy", label: "Return & Refund Policy"},
            {key: "termsOfService", label: "Terms of Service"}
        ] as const;

        for (const {key, label} of policies) {
            const policy = (data as any)?.shop?.[key];
            if (!policy?.body) continue;

            const plainText = stripHtml(policy.body);
            const sections = parsePolicySections(policy.body);

            if (sections.length > 0) {
                for (const section of sections) {
                    const sectionText = stripHtml(section.content);
                    if (!sectionText.trim()) continue;
                    entries.push({
                        id: `${key}-section-${section.index}`,
                        title: section.title || label,
                        content: sectionText,
                        type: "policy",
                        source: {kind: "shop_policy", handle: policy.handle, url: policy.url}
                    });
                }
            } else {
                entries.push({
                    id: key,
                    title: label,
                    content: plainText,
                    type: "policy",
                    source: {kind: "shop_policy", handle: policy.handle, url: policy.url}
                });
            }
        }
    } catch {
        // Policy fetch failed — proceed with empty policy corpus
    }

    // Fetch metaobject site content for FAQs
    try {
        const {SITE_CONTENT_QUERY} = await import("~/lib/metaobject-queries").catch(() => ({SITE_CONTENT_QUERY: null}));
        if (SITE_CONTENT_QUERY) {
            const siteData = await ctx.dataAdapter.query(SITE_CONTENT_QUERY, {
                cache: (ctx.dataAdapter as any).CacheLong?.() ?? undefined
            });

            const {parseSiteContent} = await import("~/lib/metaobject-parsers").catch(() => ({parseSiteContent: null}));
            if (parseSiteContent) {
                const siteContent = parseSiteContent(siteData as any, null);
                const faqItems = siteContent?.siteSettings?.faqItems ?? [];

                for (const [index, item] of faqItems.entries()) {
                    if (isGenericFaq(item.question)) continue;
                    entries.push({
                        id: `faq-${index}`,
                        title: item.question,
                        content: item.answer,
                        type: "faq",
                        source: {kind: "metaobject_faq"}
                    });
                }

                // Policy extension Q&A
                const policyExt = siteContent?.siteSettings?.policyExtension ?? [];
                for (const [index, ext] of policyExt.entries()) {
                    entries.push({
                        id: `policy-ext-${index}`,
                        title: ext.key,
                        content: ext.value,
                        type: "policy",
                        source: {kind: "metaobject_policy_extension", handle: ext.context}
                    });
                }
            }
        }
    } catch {
        // FAQ fetch failed — proceed without FAQ corpus
    }

    return entries;
}

// BM25-lite tokenizer
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(t => t.length > 1);
}

// Extract ~280-char snippet centered on the first match of any query token
function extractSnippet(content: string, queryTokens: string[]): string {
    const lower = content.toLowerCase();
    let bestPos = -1;
    for (const token of queryTokens) {
        const pos = lower.indexOf(token);
        if (pos !== -1 && (bestPos === -1 || pos < bestPos)) {
            bestPos = pos;
        }
    }
    if (bestPos === -1) {
        return content.length > 280 ? content.substring(0, 277) + "..." : content;
    }
    const start = Math.max(0, bestPos - 100);
    const end = Math.min(content.length, bestPos + 180);
    const snippet = content.substring(start, end).trim();
    return (start > 0 ? "..." : "") + snippet + (end < content.length ? "..." : "");
}

/** Rank corpus entries against query using BM25-lite. Returns top `limit` results. */
export function rankCorpus(
    corpus: PolicyCorpusEntry[],
    query: string,
    limit: number
): RankedResult[] {
    if (!query.trim() || corpus.length === 0) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Compute document frequencies
    const df: Record<string, number> = {};
    for (const entry of corpus) {
        const tokens = new Set(tokenize(entry.content + " " + entry.title));
        for (const token of tokens) {
            df[token] = (df[token] ?? 0) + 1;
        }
    }

    const N = corpus.length;
    const k1 = 1.5;
    const b = 0.75;
    const avgDocLen = corpus.reduce((sum, e) => sum + tokenize(e.content).length, 0) / N;

    const scored: Array<{entry: PolicyCorpusEntry; score: number}> = [];

    for (const entry of corpus) {
        const docTokens = tokenize(entry.content + " " + entry.title);
        const docLen = docTokens.length;
        const tf: Record<string, number> = {};
        for (const token of docTokens) {
            tf[token] = (tf[token] ?? 0) + 1;
        }

        let score = 0;
        for (const qToken of queryTokens) {
            const termFreq = tf[qToken] ?? 0;
            if (termFreq === 0) continue;
            const docFreq = df[qToken] ?? 0;
            const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);
            const tfNorm = (termFreq * (k1 + 1)) / (termFreq + k1 * (1 - b + b * (docLen / avgDocLen)));
            score += idf * tfNorm;
        }

        if (score > 0) {
            scored.push({entry, score});
        }
    }

    scored.sort((a, b) => b.score - a.score);

    const maxScore = scored[0]?.score ?? 1;

    return scored.slice(0, limit).map(({entry, score}) => ({
        type: entry.type,
        id: entry.id,
        title: entry.title,
        content: extractSnippet(entry.content, queryTokens),
        score: Math.round((score / maxScore) * 1000) / 1000,
        source: entry.source
    }));
}
